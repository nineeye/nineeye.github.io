import yfinance as yf
import pandas as pd
import requests
from bs4 import BeautifulSoup
import urllib.parse
import sqlite3

DB_PATH = "krx_stocks.db"

def get_free_news_brief(stock_name):
    try:
        encoded_name = urllib.parse.quote(stock_name)
        url = f"https://search.naver.com/search.naver?where=news&query={encoded_name}&sm=tab_pge&sort=0"
        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(url, headers=headers, timeout=3)
        soup = BeautifulSoup(res.text, 'html.parser')
        news_items = soup.select("a.news_tit, div.news_info + a")
        results = []
        for item in news_items:
            title = item.get_text().strip()
            link = item.get('href')
            if title and link and link.startswith("http"):
                results.append({"title": title, "link": link})
            if len(results) >= 3: break
        return results
    except: return []

def get_trending_stocks():
    try:
        url = "https://finance.naver.com/sise/sise_quant.naver"
        res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=2)
        soup = BeautifulSoup(res.text, 'html.parser')
        tags = soup.select("a.tltle")[:5]
        return [t.get_text().strip() for t in tags]
    except: return ["삼성전자", "SK하이닉스", "현대차", "카카오", "NAVER"]

def get_foreign_top_stocks():
    return ["삼성전자", "현대차", "기아", "셀트리온", "삼성바이오로직스"]

def get_surging_stocks():
    return ["한화오션", "두산에너빌리티", "HD현대중공업", "삼성중공업", "에코프로머티"]

def get_stock_ticker(stock_name):
    """
    종목명을 기반으로 야후파이낸스 티커를 찾는 핵심 함수.
    크롤링에 실패하더라도 화면에 정의된 주요 종목은 100% 프리패스로 매칭되도록 보강했습니다.
    """
    # [프리패스 매핑 보강] 급등주 및 대형주 리스트 삑사리 방지용 하드코딩 추가
    DEFAULT_CODES = {
        "삼성전자": "005930.KS", 
        "현대차": "005380.KS", 
        "sk하이닉스": "000660.KS", 
        "SK하이닉스": "000660.KS",
        "기아": "000270.KS",
        "셀트리온": "068270.KS",
        "삼성바이오로직스": "207940.KS",
        "한화오션": "042660.KS",
        "두산에너빌리티": "034020.KS",
        "HD현대중공업": "329180.KS",
        "삼성중공업": "010140.KS",
        "에코프로머티": "450080.KS",
        "카카오": "035720.KS",
        "NAVER": "035420.KS",
        "네이버": "035420.KS"
    }
    if stock_name in DEFAULT_CODES:
        return DEFAULT_CODES[stock_name]

    SYMBOL_MAP = {
        "sox": "^SOX", "nasdaq": "^IXIC", "sp500": "^GSPC", "kospi": "^KS11",
        "비트코인": "BTC-USD", "이더리움": "ETH-USD"
    }
    if stock_name.lower() in SYMBOL_MAP:
        return SYMBOL_MAP[stock_name.lower()]

    try:
        # 1단계: 네이버 금융 통합검색을 활용하여 종목 및 코드 후보군을 크롤링
        encoded_name = urllib.parse.quote(stock_name)
        url = f"https://search.naver.com/search.naver?where=nexearch&query={encoded_name}+주가"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        res = requests.get(url, headers=headers, timeout=3)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        candidates = []
        items = soup.select("div.lst_relate a, ul.lst_relate a, table.lst_type a")
        
        for item in items:
            href = item.get('href', '')
            text = item.get_text().strip()
            if "code=" in href:
                parsed = urllib.parse.urlparse(href)
                code = urllib.parse.parse_qs(parsed.query).get('code', [None])[0]
                if code and text:
                    candidates.append({"name": text, "code": code})

        # 2단계: 완전 일치 검증
        for cand in candidates:
            if cand["name"] == stock_name:
                suffix = ".KQ" if cand["code"].startswith("2") or cand["code"].startswith("3") else ".KS"
                return f"{cand['code']}{suffix}"

        # 3단계: 완전 일치 항목이 없는 경우, 네이버 증권 단독 시세 검색 UI 크롤링으로 보완
        url_finance = f"https://finance.naver.com/search/searchList.naver?query={encoded_name}"
        res_f = requests.get(url_finance, headers=headers, timeout=3)
        soup_f = BeautifulSoup(res_f.text, 'html.parser')
        
        rows = soup_f.select("table.type_1 td.tit a")
        
        finance_candidates = []
        for r in rows:
            href = r.get('href', '')
            text = r.get_text().strip()
            if "code=" in href:
                code = href.split("code=")[-1].split("&")[0]
                finance_candidates.append({"name": text, "code": code})

        # 네이버 금융 검색결과에서도 완전 일치 먼저 찾기
        for cand in finance_candidates:
            if cand["name"] == stock_name:
                suffix = ".KQ" if len(cand["code"]) == 6 and (cand["code"].startswith("2") or cand["code"].startswith("3")) else ".KS"
                return f"{cand['code']}{suffix}"

        # 4단계: 여전히 완벽 매칭이 안 되었다면 검색 최상단 항목을 사용하되 접미사 보정
        final_list = candidates + finance_candidates
        if final_list:
            top_code = final_list[0]["code"]
            suffix = ".KQ" if top_code.startswith("2") or top_code.startswith("3") else ".KS"
            return f"{top_code}{suffix}"

    except Exception as e:
        print(f"티커 검색 크롤링 예외 발생: {e}")
        
    return stock_name

def get_etf_ranking():
    return {
        "1y": [("반도체 레버리지 (SOXL)", "142.5"), ("테슬라 2배 (TSLL)", "89.2"), ("S&P500 고배당 (SPYD)", "18.4"), ("나스닥100 (QQQ)", "28.5"), ("미국 장기채 (TLT)", "-4.2")],
        "3y": [("반도체 레버리지 (SOXL)", "210.8"), ("나스닥100 (QQQ)", "54.1"), ("S&P500 (SPY)", "38.6"), ("골드 스팟 (GOLD)", "45.2"), ("미국 장기채 (TLT)", "-18.5")],
        "5y": [("빅테크 3배 (FNGU)", "345.1"), ("반도체 레버리지 (SOXL)", "298.4"), ("나스닥100 (QQQ)", "98.2"), ("S&P500 (SPY)", "72.4"), ("비트코인 (BTC)", "185.0")],
        "10y": [("나스닥100 (QQQ)", "412.5"), ("S&P500 (SPY)", "230.1"), ("테크 3배 (TECL)", "1250.4"), ("반도체 3배 (SOXL)", "1840.2"), ("배당성장 (SCHD)", "145.8")]
    }

def get_ai_cloned_portfolios():
    return {
        "buffett": [("애플 (AAPL)", "41.5"), ("아메리칸 익스프레스 (AXP)", "12.8"), ("뱅크오브아메리카 (BAC)", "10.2")],
        "dalio": [("프록터앤갬블 (PG)", "4.2"), ("코카콜라 (KO)", "3.9"), ("코스트코 (COST)", "3.5")]
    }

def get_macro_indicators():
    indicators = {
        "^IXIC": "나스닥", "^GSPC": "S&P500", "BTC-USD": "비트코인",
        "GC=F": "금선물", "CL=F": "WTI유가"
    }
    res_data = {}
    for ticker, name in indicators.items():
        try:
            t = yf.Ticker(urllib.parse.unquote(ticker))
            hist = t.history(period="2d")
            if not hist.empty:
                val = hist['Close'].iloc[-1]
                diff = val - hist['Close'].iloc[0]
                res_data[name] = f"{val:.2f} ({'+' if diff>=0 else ''}{(diff/hist['Close'].iloc[0])*100:.2f}%)"
            else: res_data[name] = "지연"
        except: res_data[name] = "N/A"
    return res_data

def calculate_rsi(prices, period=14):
    if len(prices) < period + 1: return 50.0
    df = pd.DataFrame(prices, columns=['Close'])
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    return round((100 - (100 / (1 + (gain / (loss + 1e-9))))).iloc[-1], 2)

def init_stock_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS stocks (shcode TEXT PRIMARY KEY, name TEXT, market TEXT)")
    conn.commit()
    conn.close()