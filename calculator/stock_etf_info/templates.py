HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>퀀트 인텔리전스 얼티밋 터미널 v13</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
    <style>
        /* UI 리스트 스타일 보정 */
        .rank-item, .port-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 8px;
            border-bottom: 1px solid #333;
            font-size: 0.85rem;
        }
        .rank-item:last-child, .port-item:last-child { border-bottom: none; }
        .item-name { color: #fff; font-weight: 500; }
        .item-val { font-weight: bold; }
        .text-up { color: #ff5555; }
        .text-down { color: #5555ff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="main-panel">
            <h1>📊 퀀트 인텔리전스 얼티밋 터미널 v13</h1>
            <div class="macro-banner">
                {% for name, val in macro.items() %}
                    <div class="macro-item">🌐 {{name}}: <span>{{val}}</span></div>
                {% endfor %}
            </div>
            
            <div class="grid-premium-panel">
                <div class="panel-box">
                    <div class="panel-title">🏆 주도 섹터/ETF 기간수익률 (Top 5)</div>
                    <div class="rank-tabs">
                        <button class="tab-btn active" onclick="changeRankTab('1y', this)">1년</button>
                        <button class="tab-btn" onclick="changeRankTab('3y', this)">3년</button>
                        <button class="tab-btn" onclick="changeRankTab('5y', this)">5년</button>
                        <button class="tab-btn" onclick="changeRankTab('10y', this)">10년</button>
                    </div>
                    <div id="rank-list-container"></div>
                </div>
                <div class="panel-box">
                    <div class="panel-title">🤖 월가 헤지펀드 실시간 복제 펀드 비중</div>
                    <div style="font-size:0.8rem; color:#ffb86c; font-weight:bold; margin-bottom:3px;">👴 버크셔 (워런 버핏 TOP 3)</div>
                    <div id="buffett-port"></div>
                    <div style="font-size:0.8rem; color:#50fa7b; font-weight:bold; margin-top:6px; margin-bottom:3px;">🌊 브리지워터 (레이 달리오 TOP 3)</div>
                    <div id="dalio-port"></div>
                </div>
            </div>

            <input type="text" id="tickers" class="input-box" placeholder="종목들을 콤마로 구분하여 입력" value="삼성전자">
            
            <div style="margin-bottom: 15px; text-align: left;">
                <span style="color:#66fcf1; font-size:0.85rem; font-weight:bold;">🔥 거래량 인기주:</span>
                {% for name in trending %}<span class="trend-badge" onclick="addTicker('{{name}}')">{{name}}</span>{% endfor %}
                <br>
                <span style="color:#50fa7b; font-size:0.85rem; font-weight:bold; margin-top:5px; display:inline-block;">✈️ 외국인 순매수:</span>
                {% for name in foreign %}<span class="foreign-badge" onclick="addTicker('{{name}}')">{{name}}</span>{% endfor %}
                <br>
                <span style="color:#ffb86c; font-size:0.85rem; font-weight:bold; margin-top:5px; display:inline-block;">🚀 오늘의 급등주:</span>
                {% for name in surging %}<span class="surge-badge" onclick="addTicker('{{name}}')">{{name}}</span>{% endfor %}
            </div>

            <div class="period-group">
                <button class="btn-period" onclick="setPeriod('5d', this)">5일</button>
                <button class="btn-period" onclick="setPeriod('1mo', this)">1개월</button>
                <button class="btn-period" onclick="setPeriod('3mo', this)">3개월</button>
		<button class="btn-period" onclick="setPeriod('6mo', this)">6개월</button>
                <button class="btn-period" onclick="setPeriod('1y', this)">1년</button>
                <button class="btn-period" onclick="setPeriod('3y', this)">3년</button>
                <button class="btn-period active" onclick="setPeriod('5y', this)">5년</button>
                <button class="btn-period" onclick="setPeriod('8y', this)">8년</button>
                <button class="btn-period" onclick="setPeriod('15y', this)">15년</button>
                <button class="btn-period" onclick="setPeriod('max', this)">상장이후(Max)</button>
            </div>
            <button id="btn-calc" onclick="calculateMultiReturn()">🚀 실시간 인텔리전스 빅데이터 스캔 가동</button>
            
            <div id="portfolio-summary-container"></div>
            <div id="result-container"></div>
            <div class="chart-container"><canvas id="multiChart"></canvas></div>
        </div>
        
        <div class="side-panel">
            <iframe src="https://sslecal.investing.com?ecoTimezone=8&columns=eco_importance,eco_descriptor&category=centralBanks,inflation,employment,economicActivity&importance=2,3&features=datepicker,timezone&countries=5,43" width="100%" height="550" frameborder="0" allowtransparency="true" style="border-radius:6px; background:#fff;"></iframe>
        </div>
    </div>
    
    <script>
        // 백엔드 주입 데이터 바인딩
        const etfRankData = {{ rank_data | tojson }};
        const aiPortData = {{ ai_ports | tojson }};
        
        let currentPeriod = '5y'; // 기본 분석 기간
        let chartInstance = null; // ChartJS 객체 보관용 변수

        // 인기주 배지 클릭 시 인풋창에 추가하는 기능
        function addTicker(name) {
            const input = document.getElementById('tickers');
            let currentValues = input.value.split(',').map(v => v.strip ? v.strip() : v.trim()).filter(v => v !== "");
            if (!currentValues.includes(name)) {
                currentValues.push(name);
            }
            input.value = currentValues.join(', ');
        }

        // 분석 기간 변경 함수
        function setPeriod(period, element) {
            currentPeriod = period;
            const buttons = document.querySelectorAll('.period-group .btn-period');
            buttons.forEach(btn => btn.classList.remove('active'));
            if(element) element.classList.add('active');
        }

        // 기간수익률 탭 전환 함수
        function changeRankTab(period, element) {
            const tabs = document.querySelectorAll('.rank-tabs .tab-btn');
            tabs.forEach(tab => tab.classList.remove('active'));
            if(element) element.classList.add('active');

            const container = document.getElementById('rank-list-container');
            container.innerHTML = '';

            const data = etfRankData[period] || [];
            data.forEach((item, index) => {
                const row = document.createElement('div');
                row.className = 'rank-item';
                // 데이터가 튜플 형태이므로 [0]=이름, [1]=수익률값
                row.innerHTML = `
                    <span class="item-name">${index + 1}. ${item[0]}</span>
                    <span class="item-val text-up">${item[1]}</span>
                `;
                container.appendChild(row);
            });
        }

        // 헤지펀드 비중 리스트 출력 함수
        function renderHedgeFunds() {
            const buffettContainer = document.getElementById('buffett-port');
            const dalioContainer = document.getElementById('dalio-port');

            buffettContainer.innerHTML = '';
            (aiPortData.buffett || []).forEach(item => {
                const row = document.createElement('div');
                row.className = 'port-item';
                row.innerHTML = `<span class="item-name">${item[0]}</span><span class="item-val" style="color:#ffb86c">${item[1]}</span>`;
                buffettContainer.appendChild(row);
            });

            dalioContainer.innerHTML = '';
            (aiPortData.dalio || []).forEach(item => {
                const row = document.createElement('div');
                row.className = 'port-item';
                row.innerHTML = `<span class="item-name">${item[0]}</span><span class="item-val" style="color:#50fa7b">${item[1]}</span>`;
                dalioContainer.appendChild(row);
            });
        }

        // 🚀 실시간 인텔리전스 빅데이터 스캔 핵심 연동 비동기 함수
        async function calculateMultiReturn() {
            const tickersInput = document.getElementById('tickers').value;
            const btn = document.getElementById('btn-calc');
            const resultContainer = document.getElementById('result-container');
            const summaryContainer = document.getElementById('portfolio-summary-container');
            
            if (!tickersInput.trim()) {
                alert("종목을 입력해 주세요.");
                return;
            }

            // 버튼 로딩 상태 표시
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner"></span> 데이터 가동 및 연산 분석 중...`;

            try {
                // 백엔드 API 호출 (/api/calc_ultimate)
                const url = `/api/calc_ultimate?tickers=${encodeURIComponent(tickersInput)}&period=${currentPeriod}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.error) {
                    alert(data.error);
                    btn.disabled = false;
                    btn.innerHTML = `🚀 실시간 인텔리전스 빅데이터 스캔 가동`;
                    return;
                }

                // 1. 포트폴리오 요약 바 출력
                summaryContainer.innerHTML = `
                    <div style="background:#1a1c23; border: 2px solid #ff007f; padding:15px; border-radius:8px; margin-bottom:20px;">
                        <h3 style="color:#66fcf1; margin-top:0;">📊 선택 자산 종합 포트폴리오 결과</h3>
                        <div style="display:flex; gap:20px; font-size:1.05rem;">
                            <div>평균 누적 수익률: <span style="color:#ff5555; font-weight:bold;">${data.portfolio.total_rate}%</span></div>
                            <div>평균 최대낙폭(MDD): <span style="color:#5555ff; font-weight:bold;">${data.portfolio.combined_mdd}%</span></div>
                        </div>
                    </div>
                `;

                // 2. 종목별 카드 목록(결과창) 생성
                resultContainer.innerHTML = '';
                data.results.forEach(stock => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    // 수익률 색상 분기
                    const lColor = stock.lump_sum_rate >= 0 ? '#ff5555' : '#5555ff';
                    const dColor = stock.dca_rate >= 0 ? '#ff5555' : '#5555ff';
                    
                    // 네이버 뉴스 항목 생성
                    let newsHtml = '';
                    if (stock.news && stock.news.length > 0) {
                        stock.news.forEach(n => {
                            newsHtml += `<a href="${n.link}" target="_blank" class="news-link">📰 ${n.title}</a>`;
                        });
                    } else {
                        newsHtml = '<p style="color:#aaa; font-size:0.8rem; margin:0;">관련 실시간 뉴스가 없습니다.</p>';
                    }

                    card.style.borderLeftColor = lColor;
                    card.innerHTML = `
                        <div class="card-ticker">
                            <span style="color:#66fcf1; font-size:1.3rem;">${stock.display_name} (${stock.ticker})</span>
                            <span style="font-size:1.2rem; color:#fff;">현재가: ${stock.current_price} (${stock.daily_change_rate}%)</span>
                        </div>
                        <div class="grid-5">
                            <div class="sub-box">
                                <div class="sub-box-title">거치식 수익률</div>
                                <div class="sub-box-val" style="color:${lColor}">${stock.lump_sum_rate}%</div>
                            </div>
                            <div class="sub-box">
                                <div class="sub-box-title">적립식(DCA) 수익률</div>
                                <div class="sub-box-val" style="color:${dColor}">${stock.dca_rate}%</div>
                            </div>
                            <div class="sub-box">
                                <div class="sub-box-title">최대 낙폭 (MDD)</div>
                                <div class="sub-box-val" style="color:#5555ff">${stock.mdd}%</div>
                            </div>
                            <div class="sub-box">
                                <div class="sub-box-title">RSI (14)</div>
                                <div class="sub-box-val" style="color:#ffb86c">${stock.rsi} (${stock.rsi_text})</div>
                            </div>
                            <div class="sub-box">
                                <div class="sub-box-title">기관 / 외인 비중</div>
                                <div class="sub-box-val" style="color:#50fa7b">${stock.institution_ownership} / ${stock.foreign_ownership}</div>
                            </div>
                        </div>
                        <div class="premium-addon">
                            <div>
                                <div style="font-size:0.8rem; font-weight:bold; color:#45f3ff; margin-bottom:5px;">섹터 정보</div>
                                <div style="font-size:0.9rem; color:#fff;">${stock.sector} (PER: ${stock.per} / PBR: ${stock.pbr})</div>
                            </div>
                            <div>
                                <div style="font-size:0.8rem; font-weight:bold; color:#ffb86c; margin-bottom:5px;">실시간 AI 핵심 뉴스 링크</div>
                                ${newsHtml}
                            </div>
                        </div>
                    `;
                    resultContainer.appendChild(card);
                });

                // 3. 밑에 차트(그래프) dynamic 렌더링 (Chart.js)
                renderMultiChart(data.portfolio.dates, data.results, data.portfolio.combined_pct);

            } catch (error) {
                console.error(error);
                alert("데이터 분석 중 오류가 발생했습니다.");
            } finally {
                // 버튼 복구
                btn.disabled = false;
                btn.innerHTML = `🚀 실시간 인텔리전스 빅데이터 스캔 가동`;
            }
        }

        // Chart.js를 사용한 멀티 라인 그래프 생성 함수
        function renderMultiChart(dates, results, combinedPct) {
            const ctx = document.getElementById('multiChart').getContext('2d');
            
            // 기존에 그려진 차트 인스턴스가 있다면 파괴 후 새로 그려야 밀림 현상이 없습니다.
            if (chartInstance) {
                chartInstance.destroy();
            }

            // 개별 종목 데이터셋 구성
            const datasets = results.map((stock, idx) => {
                const colors = ['#66fcf1', '#ffb86c', '#50fa7b', '#ff79c6', '#bd93f9'];
                const color = colors[idx % colors.length];
                return {
                    label: stock.display_name,
                    data: stock.pct_changes,
                    borderColor: color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0
                };
            });

            // 포트폴리오 평균(종합) 데이터셋 추가
            if (combinedPct && combinedPct.length > 0) {
                datasets.push({
                    label: '종합 포트폴리오 평균',
                    data: combinedPct,
                    borderColor: '#ff007f',
                    borderWidth: 4,
                    pointRadius: 0,
                    borderDash: [5, 5] // 점선 표시
                });
            }

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: { color: '#222' },
                            ticks: { color: '#aaa', maxTicksLimit: 12 }
                        },
                        y: {
                            grid: { color: '#222' },
                            ticks: { color: '#aaa' },
                            title: { display: true, text: '누적 수익률 (%)', color: '#aaa' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#fff' } }
                    }
                }
            });
        }

        // 초기 화면 설정
        window.addEventListener('DOMContentLoaded', () => {
            changeRankTab('1y');
            renderHedgeFunds();
        });
    </script>
</body>
</html>
"""