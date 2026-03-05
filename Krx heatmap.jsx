import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";

// ═══════ WICS DATA - FLATTENED TO 3 LEVELS ═══════
// 대분류(sector) → 중분류(industry group) → 종목(stock)
// 소분류(industry)는 종목의 메타데이터로만 보존
function makeData() {
  const raw = [
    // 에너지
    ["에너지","에너지","석유와가스","S-Oil","010950",8200000,-1.22],
    ["에너지","에너지","석유와가스","GS","078930",4800000,0.55],
    ["에너지","에너지","석유와가스","SK이노베이션","096770",7200000,-0.88],
    ["에너지","에너지","석유와가스","HD현대오일뱅크","145720",3500000,0.33],
    ["에너지","에너지","석유와가스","E1","017940",1200000,-0.15],
    // 소재 - 화학
    ["소재","화학","화학","LG화학","051910",25000000,-2.88],
    ["소재","화학","화학","롯데케미칼","011170",5200000,-11.44],
    ["소재","화학","화학","금호석유화학","011780",3500000,0.15],
    ["소재","화학","화학","SKC","011790",2800000,-0.72],
    ["소재","화학","화학","한화솔루션","009830",4500000,-1.55],
    ["소재","화학","화학","OCI홀딩스","010060",2200000,-3.22],
    ["소재","화학","화학","효성첨단소재","298050",1800000,0.88],
    ["소재","화학","화학","솔브레인","357780",2500000,1.45],
    ["소재","화학","화학","동진쎄미켐","005290",1500000,2.33],
    ["소재","화학","화학","후성","093370",1200000,-0.55],
    // 소재 - 소재
    ["소재","소재","2차전지소재","포스코퓨처엠","003670",9800000,-5.10],
    ["소재","소재","2차전지소재","에코프로","086520",7500000,-14.55],
    ["소재","소재","2차전지소재","에코프로비엠","247540",12000000,-12.88],
    ["소재","소재","2차전지소재","엘앤에프","066970",3900000,-7.88],
    ["소재","소재","2차전지소재","코스모신소재","005070",1800000,-3.22],
    ["소재","소재","2차전지소재","천보","278280",1500000,-4.55],
    ["소재","소재","2차전지소재","나노신소재","121600",1100000,-6.11],
    ["소재","소재","2차전지소재","대주전자재료","078600",900000,-2.77],
    ["소재","소재","철강","POSCO홀딩스","005490",22000000,0.42],
    ["소재","소재","철강","현대제철","004020",4800000,-0.55],
    ["소재","소재","철강","고려아연","010130",6500000,1.22],
    ["소재","소재","철강","세아베스틸지주","001430",1500000,0.33],
    ["소재","소재","철강","풍산","103140",1800000,2.15],
    ["소재","소재","비철금속","영풍","000670",1200000,0.88],
    ["소재","소재","비철금속","일진머티리얼즈","020150",2800000,-3.44],
    ["소재","소재","건설자재","KCC","002380",2200000,0.67],
    ["소재","소재","건설자재","아이에스동서","010780",700000,1.11],
    // 산업재 - 자본재
    ["산업재","자본재","우주항공과국방","한화에어로스페이스","012450",32000000,11.77],
    ["산업재","자본재","우주항공과국방","한화시스템","272210",5500000,6.44],
    ["산업재","자본재","우주항공과국방","LIG넥스원","079550",4200000,4.88],
    ["산업재","자본재","우주항공과국방","현대로템","064350",5800000,8.33],
    ["산업재","자본재","우주항공과국방","한국항공우주","047810",6200000,5.22],
    ["산업재","자본재","조선","HD한국조선해양","009540",12000000,4.95],
    ["산업재","자본재","조선","한화오션","042660",10500000,8.22],
    ["산업재","자본재","조선","삼성중공업","010140",7800000,3.77],
    ["산업재","자본재","조선","HD현대미포","010620",4500000,5.11],
    ["산업재","자본재","건설","현대건설","000720",4500000,-0.33],
    ["산업재","자본재","건설","삼성엔지니어링","028050",5800000,0.67],
    ["산업재","자본재","건설","대우건설","047040",2200000,-1.22],
    ["산업재","자본재","건설","GS건설","006360",1800000,-0.88],
    ["산업재","자본재","건설","DL이앤씨","375500",2500000,0.44],
    ["산업재","자본재","기계","두산밥캣","241560",3200000,-1.33],
    ["산업재","자본재","기계","두산에너빌리티","034020",9000000,3.88],
    ["산업재","자본재","기계","HD현대인프라코어","042670",2800000,-0.77],
    ["산업재","자본재","전기장비","HD현대일렉트릭","267260",8500000,9.55],
    ["산업재","자본재","전기장비","LS ELECTRIC","010120",4200000,5.33],
    ["산업재","자본재","전기장비","효성중공업","298040",3500000,4.22],
    ["산업재","자본재","전기장비","LS","006260",3800000,3.11],
    ["산업재","자본재","전기장비","일진전기","103590",2200000,7.88],
    // 산업재 - 운송
    ["산업재","운송","항공","대한항공","003490",5500000,1.22],
    ["산업재","운송","항공","진에어","272450",1200000,0.88],
    ["산업재","운송","해운","HMM","011200",8200000,-0.44],
    ["산업재","운송","해운","팬오션","028670",2500000,0.33],
    ["산업재","운송","육운","CJ대한통운","000120",3800000,0.55],
    ["산업재","운송","육운","한진칼","180640",2200000,-0.22],
    ["산업재","상업서비스","상업서비스","에스원","012750",2000000,0.33],
    // 경기관련소비재
    ["경기관련소비재","자동차와부품","자동차","현대차","005380",48000000,-0.95],
    ["경기관련소비재","자동차와부품","자동차","기아","000270",38000000,-6.23],
    ["경기관련소비재","자동차와부품","자동차부품","현대모비스","012330",19000000,0.34],
    ["경기관련소비재","자동차와부품","자동차부품","한온시스템","018880",3500000,-2.88],
    ["경기관련소비재","자동차와부품","자동차부품","현대위아","011210",2800000,3.55],
    ["경기관련소비재","자동차와부품","자동차부품","HL만도","204320",2500000,-0.44],
    ["경기관련소비재","자동차와부품","자동차부품","에스엘","005765",1500000,1.33],
    ["경기관련소비재","내구소비재와의류","의류","F&F","383220",3200000,-1.55],
    ["경기관련소비재","내구소비재와의류","의류","한세실업","105630",1200000,0.77],
    ["경기관련소비재","내구소비재와의류","호텔과레저","강원랜드","035250",2800000,0.44],
    ["경기관련소비재","내구소비재와의류","호텔과레저","호텔신라","008770",2000000,-2.88],
    ["경기관련소비재","내구소비재와의류","호텔과레저","하나투어","039130",1500000,-0.55],
    ["경기관련소비재","소매유통","백화점과일반상점","이마트","139480",2800000,-0.77],
    ["경기관련소비재","소매유통","백화점과일반상점","BGF리테일","282330",2200000,0.44],
    ["경기관련소비재","소매유통","백화점과일반상점","GS리테일","007070",1800000,-0.33],
    ["경기관련소비재","소매유통","백화점과일반상점","현대백화점","069960",1500000,0.22],
    ["경기관련소비재","소매유통","인터넷소매","쿠팡","377300",32000000,2.15],
    ["경기관련소비재","미디어와엔터테인먼트","게임","크래프톤","259960",15000000,1.33],
    ["경기관련소비재","미디어와엔터테인먼트","게임","엔씨소프트","036570",5200000,-16.21],
    ["경기관련소비재","미디어와엔터테인먼트","게임","시프트업","462870",4800000,9.22],
    ["경기관련소비재","미디어와엔터테인먼트","게임","넷마블","251270",3800000,-1.05],
    ["경기관련소비재","미디어와엔터테인먼트","게임","펄어비스","263750",2500000,-2.44],
    ["경기관련소비재","미디어와엔터테인먼트","게임","카카오게임즈","293490",2100000,0.88],
    ["경기관련소비재","미디어와엔터테인먼트","게임","위메이드","112040",1500000,18.55],
    ["경기관련소비재","미디어와엔터테인먼트","게임","컴투스","078340",1100000,-0.88],
    ["경기관련소비재","미디어와엔터테인먼트","엔터테인먼트","HYBE","352820",8200000,-9.33],
    ["경기관련소비재","미디어와엔터테인먼트","엔터테인먼트","JYP Ent.","035900",2800000,1.88],
    ["경기관련소비재","미디어와엔터테인먼트","엔터테인먼트","CJ ENM","035760",2600000,-4.12],
    ["경기관련소비재","미디어와엔터테인먼트","엔터테인먼트","SM","041510",2200000,-0.55],
    ["경기관련소비재","미디어와엔터테인먼트","엔터테인먼트","스튜디오드래곤","253450",1500000,0.67],
    ["경기관련소비재","미디어와엔터테인먼트","광고","제일기획","030000",1800000,0.22],
    ["경기관련소비재","미디어와엔터테인먼트","광고","이노션","214320",1200000,-0.33],
    // 필수소비재
    ["필수소비재","식품과음료","식품","CJ제일제당","097950",5800000,0.38],
    ["필수소비재","식품과음료","식품","오리온","271560",4500000,1.12],
    ["필수소비재","식품과음료","식품","삼양식품","003230",3200000,5.77],
    ["필수소비재","식품과음료","식품","농심","004370",2200000,0.88],
    ["필수소비재","식품과음료","식품","대상","001680",1200000,-0.22],
    ["필수소비재","식품과음료","음료","하이트진로","000080",1800000,-0.55],
    ["필수소비재","식품과음료","음료","롯데칠성음료","005300",1500000,0.33],
    ["필수소비재","생활용품","화장품","LG생활건강","051900",8500000,-0.92],
    ["필수소비재","생활용품","화장품","아모레퍼시픽","090430",6200000,-1.55],
    ["필수소비재","생활용품","화장품","코스맥스","192820",2800000,3.44],
    ["필수소비재","생활용품","화장품","아모레G","002790",2500000,-1.22],
    ["필수소비재","생활용품","화장품","한국콜마","161890",1800000,2.15],
    ["필수소비재","담배","담배","KT&G","033780",12000000,0.88],
    // 건강관리
    ["건강관리","제약과바이오","제약","유한양행","000100",8800000,-0.22],
    ["건강관리","제약과바이오","제약","한미약품","128940",6200000,1.44],
    ["건강관리","제약과바이오","제약","종근당","185750",2500000,0.88],
    ["건강관리","제약과바이오","제약","대웅제약","069620",2200000,-0.55],
    ["건강관리","제약과바이오","제약","녹십자","006280",1800000,0.33],
    ["건강관리","제약과바이오","제약","HK이노엔","195940",1500000,2.22],
    ["건강관리","제약과바이오","바이오","삼성바이오로직스","207940",55000000,0.35],
    ["건강관리","제약과바이오","바이오","셀트리온","068270",28000000,-0.82],
    ["건강관리","제약과바이오","바이오","알테오젠","196170",14000000,22.88],
    ["건강관리","제약과바이오","바이오","SK바이오팜","326030",9500000,2.15],
    ["건강관리","제약과바이오","바이오","리가켐바이오","141080",5500000,-7.33],
    ["건강관리","제약과바이오","바이오","삼천당제약","000250",3600000,29.88],
    ["건강관리","제약과바이오","바이오","에이비엘바이오","298380",3200000,0.67],
    ["건강관리","제약과바이오","바이오","메디톡스","086900",2400000,-3.15],
    ["건강관리","제약과바이오","바이오","펩트론","087010",1800000,5.44],
    ["건강관리","제약과바이오","바이오","바이넥스","053030",1500000,3.22],
    ["건강관리","제약과바이오","바이오","오스코텍","039200",1200000,-2.88],
    ["건강관리","건강관리장비","의료기기","오스템임플란트","048260",2200000,1.88],
    ["건강관리","건강관리장비","의료기기","인바디","041830",1500000,-0.33],
    ["건강관리","건강관리장비","의료기기","디오","039840",1100000,2.33],
    // 금융
    ["금융","은행","은행","KB금융","105560",28000000,2.88],
    ["금융","은행","은행","신한지주","055550",22000000,0.45],
    ["금융","은행","은행","하나금융지주","086790",16000000,4.12],
    ["금융","은행","은행","우리금융지주","316140",10000000,0.22],
    ["금융","은행","은행","기업은행","024110",5500000,1.33],
    ["금융","은행","은행","BNK금융지주","138930",2500000,0.88],
    ["금융","은행","은행","JB금융지주","175330",1800000,1.22],
    ["금융","은행","은행","DGB금융지주","139130",1500000,0.55],
    ["금융","보험","보험","삼성화재","000810",12000000,0.77],
    ["금융","보험","보험","삼성생명","032830",11000000,1.33],
    ["금융","보험","보험","DB손해보험","005830",5500000,2.11],
    ["금융","보험","보험","메리츠화재","000060",4200000,1.88],
    ["금융","보험","보험","현대해상","001450",3200000,0.44],
    ["금융","보험","보험","한화생명","088350",2500000,-0.22],
    ["금융","증권","증권","메리츠금융지주","138040",14000000,6.95],
    ["금융","증권","증권","미래에셋증권","006800",5500000,-0.38],
    ["금융","증권","증권","한국금융지주","071050",3800000,0.15],
    ["금융","증권","증권","키움증권","039490",3200000,1.55],
    ["금융","증권","증권","NH투자증권","005940",2800000,0.22],
    ["금융","증권","증권","삼성증권","016360",2500000,0.88],
    ["금융","다각화된금융","카드와소비자금융","카카오뱅크","323410",9500000,-1.67],
    ["금융","다각화된금융","카드와소비자금융","카카오페이","377301",4500000,-2.44],
    ["금융","다각화된금융","카드와소비자금융","삼성카드","029780",2200000,0.33],
    // IT
    ["IT","반도체와반도체장비","반도체","삼성전자","005930",358000000,1.82],
    ["IT","반도체와반도체장비","반도체","SK하이닉스","000660",142000000,5.45],
    ["IT","반도체와반도체장비","반도체","삼성전자우","005935",52000000,1.65],
    ["IT","반도체와반도체장비","반도체","DB하이텍","000990",3200000,-4.15],
    ["IT","반도체와반도체장비","반도체장비","한미반도체","042700",8200000,12.10],
    ["IT","반도체와반도체장비","반도체장비","주성엔지니어링","036930",5500000,7.33],
    ["IT","반도체와반도체장비","반도체장비","리노공업","058470",4800000,0.55],
    ["IT","반도체와반도체장비","반도체장비","HPSP","403870",4200000,-2.88],
    ["IT","반도체와반도체장비","반도체장비","파크시스템스","140860",2800000,-0.77],
    ["IT","반도체와반도체장비","반도체장비","피에스케이","319660",2500000,3.88],
    ["IT","반도체와반도체장비","반도체장비","원익IPS","240810",2200000,4.22],
    ["IT","반도체와반도체장비","반도체장비","ISC","095340",2100000,-0.33],
    ["IT","반도체와반도체장비","반도체장비","테크윙","089030",1800000,-1.55],
    ["IT","반도체와반도체장비","반도체장비","테스","095610",1500000,1.22],
    ["IT","반도체와반도체장비","반도체장비","유진테크","084370",1200000,2.88],
    ["IT","소프트웨어","시스템소프트웨어","삼성SDS","018260",12000000,0.92],
    ["IT","소프트웨어","시스템소프트웨어","더존비즈온","012510",3500000,1.55],
    ["IT","소프트웨어","시스템소프트웨어","카페24","042000",1500000,-2.11],
    ["IT","소프트웨어","IT서비스","포스코DX","022100",3200000,-3.44],
    ["IT","소프트웨어","IT서비스","현대오토에버","307950",2200000,0.55],
    ["IT","하드웨어","전자장비와기기","삼성SDI","006400",28000000,-0.72],
    ["IT","하드웨어","전자장비와기기","LG전자","066570",12000000,0.55],
    ["IT","하드웨어","전자장비와기기","삼성전기","009150",8200000,-1.88],
    ["IT","하드웨어","전자장비와기기","LG이노텍","011070",5500000,2.33],
    ["IT","하드웨어","전자장비와기기","대덕전자","353200",1800000,1.77],
    ["IT","하드웨어","전자장비와기기","서울반도체","046890",1500000,-0.44],
    ["IT","하드웨어","전자장비와기기","심텍","222800",1200000,-2.55],
    ["IT","하드웨어","디스플레이","LG디스플레이","034220",4200000,-3.22],
    ["IT","하드웨어","디스플레이","덕산네오룩스","213420",1500000,1.88],
    ["IT","하드웨어","디스플레이","AP시스템","265520",1200000,-0.55],
    // 커뮤니케이션서비스
    ["커뮤니케이션서비스","통신서비스","유무선통신","SK텔레콤","017670",12000000,0.55],
    ["커뮤니케이션서비스","통신서비스","유무선통신","KT","030200",8500000,0.33],
    ["커뮤니케이션서비스","통신서비스","유무선통신","LG유플러스","032640",4200000,-0.18],
    ["커뮤니케이션서비스","인터넷서비스","인터넷","네이버","035420",38000000,-3.55],
    ["커뮤니케이션서비스","인터넷서비스","인터넷","카카오","035720",18000000,-8.10],
    ["커뮤니케이션서비스","인터넷서비스","인터넷","SK스퀘어","402340",7800000,3.22],
    // 유틸리티
    ["유틸리티","유틸리티","전기유틸리티","한국전력","015760",12000000,-2.15],
    ["유틸리티","유틸리티","전기유틸리티","한국가스공사","036460",3500000,-0.88],
    ["유틸리티","유틸리티","전기유틸리티","한전KPS","051600",1800000,0.55],
    ["유틸리티","유틸리티","전기유틸리티","한전기술","052690",1500000,1.33],
    ["유틸리티","유틸리티","가스유틸리티","SK가스","018670",1500000,0.22],
    // 부동산
    ["부동산","부동산","리츠","삼성물산","028260",18000000,0.22],
    ["부동산","부동산","리츠","맥쿼리인프라","088980",3200000,0.88],
    ["부동산","부동산","리츠","SK리츠","395400",1500000,-0.44],
    ["부동산","부동산","리츠","ESR켄달스퀘어리츠","365550",1200000,0.33],
  ];

  // Build: sector → midGroup → stocks (3 levels only)
  const sectorMap = {};
  raw.forEach(([sec, mid, sub, name, ticker, cap, change]) => {
    if (!sectorMap[sec]) sectorMap[sec] = {};
    if (!sectorMap[sec][mid]) sectorMap[sec][mid] = [];
    sectorMap[sec][mid].push({ name, ticker, cap, change, industry: sub });
  });

  return {
    name: "KRX",
    children: Object.entries(sectorMap).map(([sec, mids]) => ({
      name: sec,
      children: Object.entries(mids).map(([mid, stocks]) => ({
        name: mid,
        children: stocks,
      })),
    })),
  };
}

const D = makeData();

// ═══════ COLOR ═══════
const UP=[{at:.3,r:80,g:38,b:38},{at:1,r:145,g:28,b:25},{at:3,r:205,g:22,b:18},{at:5,r:245,g:42,b:32},{at:10,r:255,g:65,b:55},{at:15,r:255,g:90,b:105},{at:29,r:255,g:115,b:185}];
const DN=[{at:.3,r:38,g:40,b:80},{at:1,r:28,g:42,b:140},{at:3,r:22,g:58,b:195},{at:5,r:32,g:85,b:240},{at:10,r:55,g:125,b:255},{at:15,r:75,g:175,b:255},{at:29,r:85,g:225,b:255}];
const NE={r:38,g:38,b:44};
const lrp=(a,b,t)=>{const T=Math.max(0,Math.min(1,t));return{r:Math.round(a.r+(b.r-a.r)*T),g:Math.round(a.g+(b.g-a.g)*T),b:Math.round(a.b+(b.b-a.b)*T)};};
const cfs=(abs,st)=>{if(abs<=st[0].at)return lrp(NE,st[0],abs/st[0].at);for(let i=1;i<st.length;i++)if(abs<=st[i].at)return lrp(st[i-1],st[i],(abs-st[i-1].at)/(st[i].at-st[i-1].at));return st[st.length-1];};
const gc=ch=>{const a=Math.abs(ch);if(a<.15)return`rgb(${NE.r},${NE.g},${NE.b})`;const c=cfs(a,ch>0?UP:DN);return`rgb(${c.r},${c.g},${c.b})`;};
const gcD=(ch,d)=>{const a=Math.abs(ch);if(a<.15){const v=Math.round(NE.r*d);return`rgb(${v},${v},${Math.round(NE.b*d)})`;}const c=cfs(a,ch>0?UP:DN);return`rgb(${Math.round(c.r*d)},${Math.round(c.g*d)},${Math.round(c.b*d)})`;};
const glw=ch=>{const a=Math.abs(ch);if(a<3)return"none";const i=Math.min(10,(a-3)/2.5);return`drop-shadow(0 0 ${i}px ${ch>0?`rgba(255,80,100,${(.06*i).toFixed(2)})`:`rgba(80,180,255,${(.06*i).toFixed(2)})`})`;};
const txt=(ch,m=1)=>{const a=Math.abs(ch);return`rgba(255,255,255,${(a<.5?.5:a<3?.78:a<10?.9:1)*m})`;};
function avg(n){const l=n.leaves?n.leaves():[];if(!l.length)return 0;const t=l.reduce((s,x)=>s+(x.data.cap||0),0);return t?l.reduce((s,x)=>s+(x.data.change||0)*(x.data.cap||0),0)/t:0;}

const SH=15, MH=12;

// ═══════ DROPDOWN ═══════
const DD=({node,x,y,cR})=>{
  if(!node)return null;
  const lvs=(node.leaves?node.leaves():[]).sort((a,b)=>b.data.cap-a.data.cap).slice(0,8);
  const av=avg(node);let l=x,t=y+2;const w=260,h=30+lvs.length*22+4;
  if(cR){if(l+w>cR.w)l=cR.w-w-4;if(t+h>cR.h)t=y-h-2;if(l<2)l=2;}
  return(<div style={{position:"absolute",left:l,top:t,width:w,background:"rgba(12,12,18,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,pointerEvents:"none",zIndex:2000,boxShadow:"0 8px 32px rgba(0,0,0,0.7)",backdropFilter:"blur(12px)",overflow:"hidden"}}>
    <div style={{padding:"5px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",background:gcD(av,0.35)}}>
      <span style={{color:"#fff",fontSize:11,fontWeight:800}}>{node.data.name}</span>
      <span style={{color:av>0?"#ff6b6b":av<0?"#70aaff":"#888",fontSize:11,fontWeight:800,fontFamily:"monospace"}}>{av>0?"▲":av<0?"▼":"−"} {Math.abs(av).toFixed(2)}%</span>
    </div>
    {lvs.map((l,i)=>{const ch=l.data.change;return(
      <div key={i} style={{padding:"2px 10px",display:"flex",alignItems:"center",borderBottom:i<lvs.length-1?"1px solid rgba(255,255,255,0.03)":"none"}}>
        <span style={{color:"rgba(255,255,255,0.7)",fontSize:10,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.data.name}</span>
        <span style={{color:"rgba(255,255,255,0.3)",fontSize:9,fontFamily:"monospace",marginRight:8}}>{l.data.cap>=1e6?`${(l.data.cap/1e6).toFixed(1)}조`:`${(l.data.cap/1e3).toFixed(0)}억`}</span>
        <span style={{color:ch>0?"#ff6b6b":ch<0?"#70aaff":"#888",fontSize:10,fontWeight:700,fontFamily:"monospace",width:52,textAlign:"right"}}>{ch>0?"+":""}{ch.toFixed(2)}%</span>
      </div>);})}
  </div>);
};

// ═══════ TOOLTIP ═══════
const Tip=({d,x,y,cR})=>{
  if(!d)return null;let l=x+14,t=y+14;
  if(cR){if(l+240>cR.w)l=x-250;if(t+150>cR.h)t=y-155;if(l<2)l=2;if(t<2)t=2;}
  const ch=d.data.change,a=Math.abs(ch);
  const cap=d.data.cap>=1e6?`${(d.data.cap/1e6).toFixed(1)}조`:`${(d.data.cap/1e3).toFixed(0)}억`;
  const mid=d.parent?.data?.name||"",sec=d.parent?.parent?.data?.name||"",ind=d.data.industry||"";
  return(<div style={{position:"absolute",left:l,top:t,background:"rgba(6,6,12,0.97)",border:`1px solid ${ch>0?"rgba(255,70,70,0.25)":ch<0?"rgba(70,130,255,0.25)":"rgba(255,255,255,0.06)"}`,borderRadius:8,padding:"10px 14px",pointerEvents:"none",zIndex:3000,minWidth:220,backdropFilter:"blur(14px)",boxShadow:"0 12px 40px rgba(0,0,0,0.7)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
      <div><div style={{color:"#fff",fontWeight:800,fontSize:14}}>{d.data.name}</div><div style={{color:"rgba(255,255,255,0.3)",fontSize:10,marginTop:2,fontFamily:"monospace"}}>{d.data.ticker}</div></div>
      <div style={{padding:"3px 8px",borderRadius:5,background:ch>0?"rgba(255,40,60,0.15)":ch<0?"rgba(40,80,255,0.15)":"rgba(255,255,255,0.06)",color:ch>0?(a>10?"#ff6eaa":"#ff5555"):(a>10?"#60ddff":"#5090ff"),fontSize:14,fontWeight:900,fontFamily:"monospace"}}>{ch>0?"▲":ch<0?"▼":"−"} {a.toFixed(2)}%</div>
    </div>
    <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:7,display:"flex",flexDirection:"column",gap:3,fontSize:10.5}}>
      {[["시가총액",cap,true],["대분류",sec],["중분류",mid],["소분류",ind]].map(([k,v,mono])=>(
        <div key={k} style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{color:"rgba(255,255,255,0.3)"}}>{k}</span>
          <span style={{color:mono?"#fff":"rgba(255,255,255,0.6)",fontWeight:mono?700:600,fontFamily:mono?"monospace":"inherit"}}>{v}</span>
        </div>))}
    </div>
  </div>);
};

const Legend=()=>{
  const v=[-29,-15,-10,-5,-3,-1,0,1,3,5,10,15,29];
  return(<div style={{display:"flex",alignItems:"center",flexShrink:0}}>
    <span style={{fontSize:8,color:"#60ddff",marginRight:5,fontWeight:800}}>하락</span>
    {v.map((val,i)=>(<div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{width:22,height:11,background:gc(val),borderRadius:i===0?"4px 0 0 4px":i===v.length-1?"0 4px 4px 0":0,borderRight:i<v.length-1?"1px solid rgba(0,0,0,0.5)":"none",boxShadow:Math.abs(val)>=10?`inset 0 0 6px ${val>0?"rgba(255,110,170,0.3)":"rgba(80,200,255,0.3)"}`:"none"}}/>
      <span style={{fontSize:6.5,color:"rgba(255,255,255,0.25)",marginTop:2,fontFamily:"monospace"}}>{val>0?"+":""}{val}%</span>
    </div>))}
    <span style={{fontSize:8,color:"#ff6eaa",marginLeft:5,fontWeight:800}}>상승</span>
  </div>);
};

// ═══════ MAIN ═══════
export default function App(){
  const ref=useRef(null);
  const[dims,setDims]=useState({w:1100,h:650});
  const[tip,setTip]=useState(null);
  const[mouse,setMouse]=useState({x:0,y:0});
  const[hov,setHov]=useState(null);
  const[sec,setSec]=useState(null);
  const[dd,setDd]=useState(null);
  const[ddP,setDdP]=useState({x:0,y:0});

  useEffect(()=>{const fn=()=>{if(ref.current){const r=ref.current.getBoundingClientRect();setDims({w:r.width,h:Math.max(380,r.height)});}};fn();window.addEventListener("resize",fn);return()=>window.removeEventListener("resize",fn);},[]);

  const{leaves,secN,midN}=useMemo(()=>{
    const data=sec?{name:"KRX",children:D.children.filter(s=>s.name===sec)}:D;
    const h=d3.hierarchy(data).sum(d=>d.cap||0).sort((a,b)=>b.value-a.value);
    // Depth: 0=root, 1=sector, 2=midGroup, 3=stock (ONLY 3 levels now!)
    // Sector gets SH paddingTop, midGroup gets MH paddingTop
    // Custom padding per depth using a workaround:
    // We set paddingTop to SH for depth-1 nodes manually after layout
    d3.treemap().size([dims.w,dims.h]).paddingOuter(1).paddingTop(SH).paddingInner(1).round(true).tile(d3.treemapSquarify.ratio(1.1))(h);

    // Now shrink mid-groups: they got SH of paddingTop but only need MH
    // So we expand the stocks inside each mid-group upward by (SH - MH) pixels
    const secN=[],midN=[];
    h.children?.forEach(s=>{
      secN.push(s);
      s.children?.forEach(m=>{
        midN.push(m);
        const diff=SH-MH;
        if(diff<=0||!m.children)return;
        // m.y0 is top of mid box. Stocks start at m.y0+SH. We want them at m.y0+MH.
        // So shift all stock coords up by diff, and stretch them
        const stockTop=m.y0+SH;
        const stockBot=m.y1;
        const oldH=stockBot-stockTop;
        const newTop=m.y0+MH;
        const newH=stockBot-newTop;
        if(oldH<=0||newH<=0)return;
        const scale=newH/oldH;
        m.children.forEach(stock=>{
          const relY0=stock.y0-stockTop;
          const relY1=stock.y1-stockTop;
          stock.y0=newTop+relY0*scale;
          stock.y1=newTop+relY1*scale;
        });
      });
    });
    return{leaves:h.leaves(),secN,midN};
  },[dims,sec]);

  const onM=useCallback(e=>{if(!ref.current)return;const r=ref.current.getBoundingClientRect();setMouse({x:e.clientX-r.left,y:e.clientY-r.top});},[]);

  return(
    <div style={{width:"100%",height:"100vh",background:"#0a0a0e",display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif",overflow:"hidden"}}>
      <div style={{padding:"6px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.04)",flexShrink:0,flexWrap:"wrap",gap:4}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:4}}>
            <span style={{fontSize:15,fontWeight:900,color:"#fff"}}>KRX</span>
            <span style={{fontSize:9,fontWeight:600,color:"rgba(255,255,255,0.18)",letterSpacing:"1.5px"}}>WICS MAP</span>
          </div>
          <div style={{display:"flex",gap:1,flexWrap:"wrap"}}>
            {[null,...D.children.map(c=>c.name)].map(s=>(
              <button key={s||"a"} onClick={()=>setSec(sec===s?null:s)} style={{
                padding:"2px 7px",fontSize:9,fontWeight:700,borderRadius:3,cursor:"pointer",fontFamily:"inherit",
                background:(s===null?!sec:sec===s)?"rgba(255,255,255,0.1)":"transparent",
                color:(s===null?!sec:sec===s)?"#fff":"rgba(255,255,255,0.25)",
                border:(s===null?!sec:sec===s)?"1px solid rgba(255,255,255,0.12)":"1px solid transparent",
              }}>{s||"전체"}</button>
            ))}
          </div>
        </div>
        <Legend/>
      </div>

      <div ref={ref} onMouseMove={onM} onMouseLeave={()=>{setTip(null);setHov(null);setDd(null);}} style={{flex:1,position:"relative",margin:2,overflow:"hidden"}}>
        <svg width={dims.w} height={dims.h} style={{display:"block"}}>
          {/* Sectors (대분류) */}
          {secN.map((s,i)=>{const av=avg(s),w=s.x1-s.x0,h=s.y1-s.y0,sp=w>80;
            const mc=Math.floor((w-(sp?55:6))/5.5);
            const lb=s.data.name.length>mc&&mc>2?s.data.name.substring(0,mc)+"…":s.data.name;
            return(<g key={`s${i}`} onMouseEnter={()=>{setDd(s);setDdP({x:s.x0,y:s.y0+SH});}} onMouseLeave={()=>setDd(null)}>
              <rect x={s.x0} y={s.y0} width={w} height={h} fill={gcD(av,0.15)} stroke={gcD(av,0.4)} strokeWidth={1} rx={2}/>
              <rect x={s.x0} y={s.y0} width={w} height={SH} fill={gcD(av,0.45)} rx={2}/>
              <text x={s.x0+5} y={s.y0+SH-3.5} fill="rgba(255,255,255,0.92)" fontSize={10} fontWeight={800} style={{textShadow:"0 1px 2px rgba(0,0,0,0.6)"}}>{lb}</text>
              {sp&&<text x={s.x1-5} y={s.y0+SH-3.5} fill={av>0?"rgba(255,140,140,0.95)":av<0?"rgba(140,175,255,0.95)":"rgba(255,255,255,0.4)"} fontSize={9} fontWeight={700} textAnchor="end" fontFamily="monospace">{av>0?"+":""}{av.toFixed(2)}%</text>}
            </g>);
          })}

          {/* Mid groups (중분류) */}
          {midN.map((m,i)=>{const w=m.x1-m.x0,h=m.y1-m.y0;if(w<20||h<MH+4)return null;
            const av=avg(m),sp=w>60;
            const mc=Math.floor((w-(sp?45:6))/4.8);
            const lb=m.data.name.length>mc&&mc>2?m.data.name.substring(0,mc)+"…":m.data.name;
            return(<g key={`m${i}`} onMouseEnter={()=>{setDd(m);setDdP({x:m.x0,y:m.y0+MH});}} onMouseLeave={()=>setDd(null)}>
              <rect x={m.x0} y={m.y0} width={w} height={h} fill="transparent" stroke={gcD(av,0.3)} strokeWidth={0.5} rx={1}/>
              <rect x={m.x0} y={m.y0} width={w} height={MH} fill={gcD(av,0.3)} rx={1}/>
              <text x={m.x0+3} y={m.y0+MH-2.5} fill="rgba(255,255,255,0.52)" fontSize={8} fontWeight={700}>{lb}</text>
              {sp&&<text x={m.x1-3} y={m.y0+MH-2.5} fill={av>0?"rgba(255,140,140,0.5)":av<0?"rgba(140,175,255,0.5)":"rgba(255,255,255,0.2)"} fontSize={7.5} fontWeight={600} textAnchor="end" fontFamily="monospace">{av>0?"+":""}{av.toFixed(2)}%</text>}
            </g>);
          })}

          {/* Stocks */}
          {leaves.map((leaf,i)=>{const w=leaf.x1-leaf.x0,h=leaf.y1-leaf.y0;if(w<1||h<1)return null;
            const ch=leaf.data.change,isH=hov===i,show=w>24&&h>14,showC=w>32&&h>26;
            const fs=Math.max(6.5,Math.min(14,Math.sqrt(w*h)/6.5));
            const nFs=Math.min(fs,w/(leaf.data.name.length*0.68));
            const cFs=Math.max(6,fs-1.5);
            return(<g key={`t${i}`} onMouseEnter={()=>{setHov(i);setTip(leaf);setDd(null);}} onMouseLeave={()=>{setHov(null);setTip(null);}} style={{cursor:"pointer"}}>
              <rect x={leaf.x0} y={leaf.y0} width={w} height={h} fill={gc(ch)} stroke={isH?"rgba(255,255,255,0.9)":"rgba(0,0,0,0.25)"} strokeWidth={isH?1.5:0.3} rx={1}
                style={{transition:"stroke 0.05s",filter:isH?`brightness(1.35) saturate(1.3) ${glw(ch)}`:glw(ch)}}/>
              {show&&<text x={leaf.x0+w/2} y={leaf.y0+h/2+(showC?-0.5:2)} textAnchor="middle" fill={txt(ch)} fontSize={nFs} fontWeight={800}
                style={{pointerEvents:"none",textShadow:"0 1px 3px rgba(0,0,0,0.8)"}}>
                {leaf.data.name.length>w/nFs*1.5?leaf.data.name.substring(0,Math.floor(w/nFs*1.3))+"…":leaf.data.name}</text>}
              {showC&&<text x={leaf.x0+w/2} y={leaf.y0+h/2+cFs+1} textAnchor="middle" fill={txt(ch,0.6)} fontSize={cFs} fontWeight={600} fontFamily="monospace" style={{pointerEvents:"none"}}>
                {ch>0?"+":""}{ch.toFixed(2)}%</text>}
            </g>);
          })}
        </svg>
        {dd&&!tip&&<DD node={dd} x={ddP.x} y={ddP.y} cR={dims}/>}
        <Tip d={tip} x={mouse.x} y={mouse.y} cR={dims}/>
      </div>

      <div style={{padding:"4px 12px 6px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid rgba(255,255,255,0.03)",flexShrink:0,flexWrap:"wrap",gap:4}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          {(()=>{const up=leaves.filter(l=>l.data.change>0.3).length,dn=leaves.filter(l=>l.data.change<-0.3).length,fl=leaves.length-up-dn,av=leaves.reduce((s,l)=>s+l.data.change,0)/leaves.length;
            return(<>{[["상승",up,"#ff5050","#ff6b6b"],["하락",dn,"#4488ff","#70aaff"],["보합",fl,"#555","#888"]].map(([lb,n,dot,col])=>(
              <div key={lb} style={{display:"flex",gap:3,alignItems:"center"}}><div style={{width:5,height:5,borderRadius:"50%",background:dot}}/><span style={{fontSize:10,color:"rgba(255,255,255,0.35)"}}>{lb} <span style={{color:col,fontWeight:700}}>{n}</span></span></div>
            ))}<span style={{fontSize:9,color:"rgba(255,255,255,0.12)",borderLeft:"1px solid rgba(255,255,255,0.05)",paddingLeft:8,fontFamily:"monospace"}}>가중평균 <span style={{color:av>=0?"#ff6b6b":"#70aaff",fontWeight:700}}>{av>=0?"+":""}{av.toFixed(2)}%</span></span></>);
          })()}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:8.5,color:"rgba(255,255,255,0.13)",fontFamily:"monospace"}}>{leaves.length}종목</span>
          <span style={{fontSize:8.5,color:"rgba(255,255,255,0.1)"}}>WICS 3단계 • 시가총액 비례</span>
          <span style={{fontSize:8.5,color:"rgba(255,255,255,0.1)",fontFamily:"monospace"}}>2026.03.04 (샘플)</span>
        </div>
      </div>
    </div>
  );
}