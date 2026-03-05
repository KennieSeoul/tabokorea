"""
KIS Open API 연동 테스트
- 삼성전자(005930) 현재가 조회
- Firebase Studio 터미널에서 실행: python kis_test.py

사전 준비:
  pip install requests

사용법:
  1. 아래 YOUR_APP_KEY, YOUR_APP_SECRET, YOUR_ACCOUNT_NO를 실제 값으로 변경
  2. python kis_test.py 실행
"""

import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# ═══════════════════════════════════════════
# ⚠️ 여기에 본인의 KIS API 정보를 입력하세요
# ═══════════════════════════════════════════
APP_KEY    = os.environ.get("KIS_APP_KEY")        # KIS Developers에서 발급받은 앱 키 (36자리)
APP_SECRET = os.environ.get("KIS_APP_SECRET")     # KIS Developers에서 발급받은 앱 시크릿 (180자리)
ACCOUNT_NO = os.environ.get("KIS_ACCOUNT_NO")            # 계좌번호 앞 8자리
ACCOUNT_CD = os.environ.get("KIS_ACCOUNT_CD")            # 계좌번호 뒤 2자리

# 실전투자 URL (모의투자는 "https://openapivts.koreainvestment.com:29443")
BASE_URL = "https://openapi.koreainvestment.com:9443"

# ═══════════════════════════════════════════
# Step 1: 접근 토큰 발급
# ═══════════════════════════════════════════
def get_access_token():
    """OAuth 접근 토큰을 발급받습니다."""
    url = f"{BASE_URL}/oauth2/tokenP"
    headers = {"content-type": "application/json"}
    body = {
        "grant_type": "client_credentials",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
    }

    print("🔑 접근 토큰 발급 중...")
    res = requests.post(url, headers=headers, json=body)

    if res.status_code != 200:
        print(f"❌ 토큰 발급 실패: {res.status_code}")
        print(res.text)
        return None

    token = res.json().get("access_token")
    print(f"✅ 토큰 발급 성공! (앞 20자: {token[:20]}...)")
    return token


# ═══════════════════════════════════════════
# Step 2: 주식 현재가 조회
# ═══════════════════════════════════════════
def get_stock_price(token, stock_code, stock_name=""):
    """종목 코드로 현재가를 조회합니다."""
    url = f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price"
    headers = {
        "content-type": "application/json; charset=utf-8",
        "authorization": f"Bearer {token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHKST01010100",  # 주식 현재가 시세 조회
    }
    params = {
        "FID_COND_MRKT_DIV_CODE": "J",  # J: 주식
        "FID_INPUT_ISCD": stock_code,
    }

    res = requests.get(url, headers=headers, params=params)

    if res.status_code != 200:
        print(f"❌ 조회 실패 [{stock_code}]: {res.status_code}")
        return None

    data = res.json()

    if data.get("rt_cd") != "0":
        print(f"❌ API 에러: {data.get('msg1', 'Unknown error')}")
        return None

    output = data.get("output", {})
    return {
        "종목코드": stock_code,
        "종목명": stock_name or output.get("rprs_mrkt_kor_name", ""),
        "현재가": int(output.get("stck_prpr", 0)),
        "전일대비": int(output.get("prdy_vrss", 0)),
        "등락률": float(output.get("prdy_ctrt", 0)),
        "거래량": int(output.get("acml_vol", 0)),
        "시가총액(억)": int(output.get("hts_avls", 0)),
        "시가": int(output.get("stck_oprc", 0)),
        "고가": int(output.get("stck_hgpr", 0)),
        "저가": int(output.get("stck_lwpr", 0)),
    }


# ═══════════════════════════════════════════
# Step 3: 여러 종목 한번에 조회 테스트
# ═══════════════════════════════════════════
TEST_STOCKS = [
    ("005930", "삼성전자"),
    ("000660", "SK하이닉스"),
    ("005380", "현대차"),
    ("035420", "NAVER"),
    ("105560", "KB금융"),
]


def main():
    print("=" * 60)
    print(f"  KIS Open API 연동 테스트")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()

    # 입력값 검증
    if APP_KEY == "YOUR_APP_KEY":
        print("⚠️  APP_KEY를 실제 값으로 변경해주세요!")
        print("   KIS Developers 신청정보에서 확인 가능합니다.")
        print()
        print("   스크립트 상단의 다음 부분을 수정하세요:")
        print('   APP_KEY    = "Pa0knAM6JL..."  # 실제 앱 키')
        print('   APP_SECRET = "V9J3YGPE5q..."  # 실제 앱 시크릿')
        print('   ACCOUNT_NO = "12345678"        # 계좌번호 앞 8자리')
        return

    # 1. 토큰 발급
    token = get_access_token()
    if not token:
        return

    print()

    # 2. 종목 조회
    print("📊 주요 종목 현재가 조회 중...")
    print("-" * 60)

    results = []
    for code, name in TEST_STOCKS:
        result = get_stock_price(token, code, name)
        if result:
            results.append(result)
            price = f"{result['현재가']:,}원"
            change = result['등락률']
            arrow = "▲" if change > 0 else "▼" if change < 0 else "−"
            color_sign = "+" if change > 0 else ""
            cap = f"{result['시가총액(억)']:,}억"

            print(f"  {result['종목명']:12s} {price:>12s}  "
                  f"{arrow} {color_sign}{change:.2f}%  "
                  f"시총 {cap:>12s}")

    print("-" * 60)
    print()

    # 3. JSON 출력 (히트맵 연동용 데이터 형식 확인)
    print("📋 히트맵 연동용 JSON 샘플:")
    print("-" * 60)

    heatmap_data = []
    for r in results:
        heatmap_data.append({
            "name": r["종목명"],
            "ticker": r["종목코드"],
            "cap": r["시가총액(억)"] * 100000000,  # 억 → 원 단위
            "change": r["등락률"],
        })

    print(json.dumps(heatmap_data, ensure_ascii=False, indent=2))

    print()
    print("✅ 테스트 완료!")
    print()
    print("📌 다음 단계:")
    print("   1. 위 결과가 정상이면 → 300종목 전체 조회 스크립트로 확장")
    print("   2. WICS 분류 매핑 테이블 적용")
    print("   3. 히트맵에 실시간 데이터 연동")


if __name__ == "__main__":
    main()