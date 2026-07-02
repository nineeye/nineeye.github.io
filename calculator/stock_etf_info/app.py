import os

print(os.getcwd())
print(os.listdir())

from flask import Flask, request, jsonify, render_template_string
import yfinance as yf
from data_utils import *
from templates import HTML_TEMPLATE

app = Flask(__name__)
init_stock_database()

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE, 
        trending=get_trending_stocks(), 
        foreign=get_foreign_top_stocks(), 
        surging=get_surging_stocks(),
        macro=get_macro_indicators(), 
        rank_data=get_etf_ranking(), 
        ai_ports=get_ai_cloned_portfolios())

@app.route('/api/calc_ultimate')
def calculate_ultimate():
    user_tickers_raw = request.args.get('tickers', '').split(',')
    user_tickers = [t.strip() for t in user_tickers_raw if t.strip()]
    period = request.args.get('period', '5y')
    if not user_tickers: 
        return jsonify({"error": "종목이 없습니다."})
    
    SYMBOL_MAP = {"sox": "^SOX", "nasdaq": "^IXIC", "sp500": "^GSPC", "kospi": "^KS11"}
    user_results, all_pct_arrays, all_mdd_values, global_dates = [], [], [], []

    for t_input in user_tickers:
        display_name = t_input
        
        # 특수 지수 기호 매핑 변경
        mapping_ticker = SYMBOL_MAP.get(t_input.lower(), t_input)
        
        # 한국 코스피/코스닥 종목코드 예외처리
        if mapping_ticker.isdigit() and len(mapping_ticker) == 6:
            mapping_ticker += ".KS"
            display_name = get_stock_name_from_db(t_input) or t_input

        try:
            t = yf.Ticker(mapping_ticker)
            info = t.info
            
            # 메인 분석용 히스토리 데이터 추출
            df = t.history(period=period)
            if df.empty:
                continue

            # 등락률 계산을 위한 당일 시세 추출
            day_df = t.history(period="1d")
            current_price = day_df['Close'].iloc[-1] if not day_df.empty else df['Close'].iloc[-1]
            
            # 전일 종가 대비 당일 변동률 연산
            hist_2d = t.history(period="2d")
            prev_close = hist_2d['Close'].iloc[0] if len(hist_2d) > 1 else current_price
            day_change_pct = ((current_price - prev_close) / prev_close) * 100
            
            # 누적 수익률 연산
            first_close = df['Close'].iloc[0]
            total_return_pct = ((current_price - first_close) / first_close) * 100
            
            # 누적 수익률 배열 트래킹 (차트 연동용)
            pct_array = (((df['Close'] - first_close) / first_close) * 100).round(2).tolist()
            all_pct_arrays.append(pct_array)
            
            if not global_dates or len(df.index) > len(global_dates):
                global_dates = [d.strftime('%Y-%m-%d') for d in df.index]

            # MDD 연산
            cum_max = df['Close'].cummax()
            drawdown = (df['Close'] - cum_max) / cum_max * 100
            mdd_val = drawdown.min()
            all_mdd_values.append(mdd_val)

            # RSI 산출
            rsi_val = calculate_rsi(df['Close'])

            user_results.append({
                "ticker": t_input,
                "name": display_name,
                "current_price": f"{current_price:,.2f}" if not mapping_ticker.endswith(".KS") else f"{int(current_price):,}",
                "day_change": f"{'+' if day_change_pct >= 0 else ''}{day_change_pct:.2f}%",
                "total_return": f"{'+' if total_return_pct >= 0 else ''}{total_return_pct:.2f}%",
                "pct_array": pct_array,
                "mdd": f"{mdd_val:.2f}",
                "rsi": f"{rsi_val:.1f}" if rsi_val else "N/A",
                "foreign_ownership": f"{(max(0.05, 1.0 - (info.get('heldPercentInstitutions') or 0.15) - (info.get('heldPercentInsiders') or 0.10)))*100:.1f}%",
                "sector": info.get('sector') or "기타", 
                "per": f"{info.get('trailingPE') or 0:.1f}", 
                "pbr": f"{info.get('priceToBook') or 0:.1f}",
                "news": get_free_news_brief(display_name)
            })
        except Exception as e:
            print(f"{display_name} 데이터 처리 중 일시적 지연 예외 발생: {e}")
            continue

    p_data = {"total_rate": "0.0", "combined_mdd": "0.0", "dates": global_dates, "combined_pct": []}
    
    if all_pct_arrays and user_results:
        try:
            import numpy as np
            min_len = min(len(arr) for arr in all_pct_arrays)
            truncated_arrays = [arr[:min_len] for arr in all_pct_arrays]
            
            # [🔥 핵심 고정 패치]: float32 에러 차단을 위해 원래 데이터 타입인 파이썬 기본 float 리스트로 강제 치환
            mean_array = np.mean(truncated_arrays, axis=0).round(2)
            p_data["combined_pct"] = [float(x) for x in mean_array.tolist()]
            
            if p_data["combined_pct"]:
                p_data["total_rate"] = str(round(float(p_data["combined_pct"][-1]), 2))
            p_data["combined_mdd"] = f"{float(min(all_mdd_values)):.2f}"
        except Exception as e:
            print(f"포트폴리오 통계 병합 에러: {e}")

    return jsonify({"results": user_results, "portfolio_data": p_data})

@app.route('/api/realtime_price')
def realtime_price():
    tickers_raw = request.args.get('tickers', '').split(',')
    tickers = [t.strip() for t in tickers_raw if t.strip()]
    if not tickers:
        return jsonify({})

    SYMBOL_MAP = {"sox": "^SOX", "nasdaq": "^IXIC", "sp500": "^GSPC", "kospi": "^KS11"}
    results = {}

    for t_input in tickers:
        try:
            mapping_ticker = SYMBOL_MAP.get(t_input.lower(), t_input)
            if mapping_ticker.isdigit() and len(mapping_ticker) == 6:
                mapping_ticker += ".KS"

            t = yf.Ticker(mapping_ticker)
            df = t.history(period="1d", interval="1m")
            
            if not df.empty:
                current_price = df['Close'].iloc[-1]
                
                hist_2d = t.history(period="2d")
                prev_close = hist_2d['Close'].iloc[0] if len(hist_2d) > 1 else current_price
                change_pct = ((current_price - prev_close) / prev_close) * 100
                
                is_krx = mapping_ticker.endswith(".KS")
                results[t_input] = {
                    "price": f"{int(current_price):,}" if is_krx else f"{current_price:,.2f}",
                    "change_pct": round(float(change_pct), 2)
                }
        except Exception as e:
            print(f"실시간 시세 폴링 업데이트 실패 ({t_input}): {e}")
            continue

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)