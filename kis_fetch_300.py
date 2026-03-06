"""
KRX 시총 상위 300종목 조회 + WICS 분류 매핑 + 히트맵 JSON 생성

수정사항: 종목명이 'KOSPI 200' 등으로 나오는 문제 해결을 위해 WICS_MAP에 한글명을 포함하고 로직 보강
"""

import requests
import json
import time
import os
from datetime import datetime
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# ═══════════════════════════════════════════
# ⚠️ KIS API 정보
# ═══════════════════════════════════════════
APP_KEY    = os.environ.get("KIS_APP_KEY")
APP_SECRET = os.environ.get("KIS_APP_SECRET")
BASE_URL   = "https://openapi.koreainvestment.com:9443"

# ═══════════════════════════════════════════
# WICS 분류 매핑 테이블 (종목명 보정용 한글명 포함)
# 종목코드 → (대분류, 중분류, 소분류, 한글명)
# ═══════════════════════════════════════════
WICS_MAP = {
    "005930": ("IT", "반도체와반도체장비", "반도체", "삼성전자"),
    "005935": ("IT", "반도체와반도체장비", "반도체", "삼성전자우"),
    "000660": ("IT", "반도체와반도체장비", "반도체", "SK하이닉스"),
    "373220": ("IT", "하드웨어", "전자장비와기기", "LG에너지솔루션"),
    "207940": ("건강관리", "제약과바이오", "바이오", "삼성바이오로직스"),
    "005380": ("경기관련소비재", "자동차와부품", "자동차", "현대차"),
    "000270": ("경기관련소비재", "자동차와부품", "자동차", "기아"),
    "068270": ("건강관리", "제약과바이오", "바이오", "셀트리온"),
    "005490": ("소재", "소재", "철강", "POSCO홀딩스"),
    "105560": ("금융", "은행", "은행", "KB금융"),
    "055550": ("금융", "은행", "은행", "신한지주"),
    "035420": ("커뮤니케이션서비스", "인터넷서비스", "인터넷", "NAVER"),
    "000670": ("소재", "소재", "비철금속", "영풍"),
    "012330": ("경기관련소비재", "자동차와부품", "자동차부품", "현대모비스"),
    "032830": ("금융", "보험", "보험", "삼성생명"),
    "086790": ("금융", "은행", "은행", "하나금융지주"),
    "066570": ("IT", "하드웨어", "전자장비와기기", "LG전자"),
    "017670": ("커뮤니케이션서비스", "통신서비스", "유무선통신", "SK텔레콤"),
    "035720": ("커뮤니케이션서비스", "인터넷서비스", "인터넷", "카카오"),
    "000810": ("금융", "보험", "보험", "삼성화재"),
    "015760": ("유틸리티", "유틸리티", "전기유틸리티", "한국전력"),
    "003550": ("IT", "하드웨어", "전자장비와기기", "LG"),
    "028260": ("부동산", "부동산", "리츠", "삼성물산"),
    "011780": ("소재", "화학", "화학", "금호석유"),
    "096770": ("에너지", "에너지", "석유와가스", "SK이노베이션"),
    "009150": ("IT", "하드웨어", "전자장비와기기", "삼성전기"),
    "033780": ("필수소비재", "담배", "담배", "KT&G"),
    "010130": ("소재", "소재", "철강", "고려아연"),
    "138040": ("금융", "증권", "증권", "메리츠증권"),
    "000100": ("건강관리", "제약과바이오", "제약", "유한양행"),
    "010950": ("에너지", "에너지", "석유와가스", "S-Oil"),
    "004020": ("소재", "소재", "철강", "현대제철"),
    "000720": ("산업재", "자본재", "건설", "현대건설"),
    "006400": ("IT", "하드웨어", "전자장비와기기", "삼성SDI"),
    "005940": ("금융", "증권", "증권", "NH투자증권"),
    "051910": ("소재", "화학", "화학", "LG화학"),
    "051900": ("필수소비재", "생활용품", "화장품", "LG생활건강"),
    "090430": ("필수소비재", "생활용품", "화장품", "아모레퍼시픽"),
    "030200": ("커뮤니케이션서비스", "통신서비스", "유무선통신", "KT"),
    "042700": ("IT", "반도체와반도체장비", "반도체장비", "한미반도체"),
    "000060": ("금융", "보험", "보험", "메리츠금융지주"),
    "316140": ("금융", "은행", "은행", "우리금융지주"),
    "006800": ("금융", "증권", "증권", "미래에셋증권"),
    "071050": ("금융", "증권", "증권", "한국금융지주"),
    "039490": ("금융", "증권", "증권", "키움증권"),
    "011070": ("IT", "하드웨어", "전자장비와기기", "LG이노텍"),
    "011170": ("소재", "화학", "화학", "롯데케미칼"),
    "018260": ("IT", "소프트웨어", "시스템소프트웨어", "삼성에스디에스"),
    "010120": ("산업재", "자본재", "전기장비", "LS ELECTRIC"),
    "034020": ("산업재", "자본재", "기계", "두산에너빌리티"),
    "241560": ("산업재", "자본재", "기계", "두산밥캣"),
    "012450": ("산업재", "자본재", "우주항공과국방", "한화에어로스페이스"),
}

TOP_STOCK_CODES = list(WICS_MAP.keys())

def get_token():
    url = f"{BASE_URL}/oauth2/tokenP"
    body = {"grant_type": "client_credentials", "appkey": APP_KEY, "appsecret": APP_SECRET}
    res = requests.post(url, json=body, headers={"content-type": "application/json"})
    if res.status_code == 200:
        return res.json().get("access_token")
    return None

def get_price(token, code):
    url = f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price"
    headers = {
        "authorization": f"Bearer {token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHKST01010100",
        "content-type": "application/json; charset=utf-8",
    }
    params = {"FID_COND_MRKT_DIV_CODE": "J", "FID_INPUT_ISCD": code}
    try:
        res = requests.get(url, headers=headers, params=params, timeout=5)
        if res.status_code != 200: return None
        data = res.json()
        if data.get("rt_cd") != "0": return None
        o = data["output"]
        
        # 종목명 추출 (우선순위: hts_kor_isnm -> bstp_kor_isnm)
        # 만약 'KOSPI 200' 같은 값이 오면 빈 값 처리하여 WICS_MAP 이름을 쓰게 함
        raw_name = o.get("hts_kor_isnm", "").strip()
        if "KOSPI" in raw_name or "KOSDAQ" in raw_name:
            raw_name = o.get("bstp_kor_isnm", "").strip()

        return {
            "name": raw_name,
            "ticker": code,
            "price": int(o.get("stck_prpr", 0)),
            "change": float(o.get("prdy_ctrt", 0)),
            "cap": int(o.get("hts_avls", 0)),
        }
    except: return None

def build_heatmap_json(stocks):
    tree = {}
    for s in stocks:
        wics = WICS_MAP.get(s["ticker"])
        if wics:
            sec, mid, ind, map_name = wics
            final_name = map_name # 코드에 정의된 한글명 사용
        else:
            sec, mid, ind = "기타", "기타", "기타"
            final_name = s["name"]

        if sec not in tree: tree[sec] = {}
        if mid not in tree[sec]: tree[sec][mid] = []
        tree[sec][mid].append({"name": final_name, "ticker": s["ticker"], "cap": s["cap"], "change": s["change"], "industry": ind})

    result = {"name": "KRX", "updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "children": []}
    for sec_name, mid_groups in tree.items():
        sector = {"name": sec_name, "children": []}
        for mid_name, stock_list in mid_groups.items():
            mid = {"name": mid_name, "children": sorted(stock_list, key=lambda x: x["cap"], reverse=True)}
            sector["children"].append(mid)
        result["children"].append(sector)
    return result

def main():
    token = get_token()
    if not token: return
    stocks = []
    for code in TOP_STOCK_CODES:
        res = get_price(token, code)
        if res: stocks.append(res)
        time.sleep(0.06)
    
    heatmap = build_heatmap_json(stocks)
    with open("public/krx_heatmap_data.json", "w", encoding="utf-8") as f:
        json.dump(heatmap, f, ensure_ascii=False, indent=2)
    print(f"✅ 완료: {len(stocks)}개 종목 업데이트")

if __name__ == "__main__":
    main()
