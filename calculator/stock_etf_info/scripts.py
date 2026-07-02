# scripts.py - 이스케이프 오타 레이아웃을 완벽히 수정한 자바스크립트 로직 파일
JS_SCRIPTS = """
    <script>
        let chartInstance = null;
        let realtimeTimer = null; // 5초 주기 실시간 업데이트 타이머 핸들러

        // 기간 설정 버튼 액티브 및 글로벌 변수 저장
        function setPeriod(period, btn) {
            document.querySelectorAll('.btn-period').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            btn.setAttribute('data-period', period);
        }

        // 주도 섹터 및 ETF 랭킹 탭 전환 처리 (이스케이프 오타 완전 수정)
        function changeRankTab(tabName) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            
            // 오타가 났던 선택자 쿼리를 가장 안전한 형태인 속성 선택자로 단순화 교정했습니다.
            const tabs = document.querySelectorAll('.tab-btn');
            tabs.forEach(btn => {
                if(btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabName)) {
                    btn.classList.add('active');
                }
            });

            const container = document.getElementById('rank-list-container');
            if(!container) return;
            container.innerHTML = '';

            const data = JSON.parse(document.getElementById('etf-rank-data').textContent || '{}');
            const list = data[tabName] || [];

            if(list.length === 0) {
                container.innerHTML = '<div style="padding:10px; color:#aaa;">데이터가 없습니다.</div>';
                return;
            }

            list.forEach(item => {
                const row = document.createElement('div');
                row.className = 'rank-item';
                
                const rateStr = (item.rate && typeof item.rate === 'string') ? item.rate : String(item.rate || '0.0%');
                const cls = rateStr.startsWith('-') ? 'text-down' : 'text-up';
                
                row.innerHTML = `
                    <span class="item-name">${item.name || '알 수 없는 종목'}</span>
                    <span class="item-val ${cls}">${rateStr}</span>
                `;
                container.appendChild(row);
            });
        }

        // 헤지펀드 대가 복제 포트폴리오 출력
        function renderHedgeFunds() {
            const data = JSON.parse(document.getElementById('ai-ports-data').textContent || '{}');
            
            const bContainer = document.getElementById('buffett-container');
            if(bContainer && data.buffett) {
                bContainer.innerHTML = '';
                data.buffett.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'port-item';
                    div.innerHTML = `<span class="item-name">${item[0]}</span><span class="item-val" style="color:#f0f6fc">${item[1]}%</span>`;
                    bContainer.appendChild(div);
                });
            }

            const dContainer = document.getElementById('dalio-container');
            if(dContainer && data.dalio) {
                dContainer.innerHTML = '';
                data.dalio.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'port-item';
                    div.innerHTML = `<span class="item-name">${item[0]}</span><span class="item-val" style="color:#f0f6fc">${item[1]}%</span>`;
                    dContainer.appendChild(div);
                });
            }
        }

        // 상단 실시간 추천 배너 클릭 시 검색창 자동 추가 기입 함수
        function addTicker(ticker) {
            const input = document.getElementById('ticker-input');
            if(!input) return;
            let current = input.value.trim();
            if(current) {
                let tokens = current.split(',').map(s => s.trim()).filter(Boolean);
                if(!tokens.includes(ticker)) {
                    tokens.push(ticker);
                    input.value = tokens.join(', ');
                }
            } else {
                input.value = ticker;
            }
        }

        // [실시간 자동 갱신 5초 타이머 제어 엔진]
        function startRealtimePolling(tickerListStr) {
            if (realtimeTimer) clearInterval(realtimeTimer);

            realtimeTimer = setInterval(() => {
                fetch(`/api/realtime_price?tickers=${encodeURIComponent(tickerListStr)}`)
                    .then(res => res.json())
                    .then(data => {
                        Object.keys(data).forEach(ticker => {
                            const stockInfo = data[ticker];
                            const card = document.querySelector(`.premium-addon[data-ticker="${ticker}"]`);
                            if (card) {
                                const priceEl = card.querySelector('.price-val');
                                const changeEl = card.querySelector('.change-val');
                                
                                if (priceEl && stockInfo.price) {
                                    priceEl.innerText = stockInfo.price;
                                }
                                if (changeEl && stockInfo.change_pct !== undefined) {
                                    const sign = stockInfo.change_pct >= 0 ? '+' : '';
                                    changeEl.innerText = `${sign}${stockInfo.change_pct}%`;
                                    changeEl.className = `sub-box-val change-val ${stockInfo.change_pct >= 0 ? 'text-up' : 'text-down'}`;
                                }
                            }
                        });
                    })
                    .catch(err => console.error("실시간 가격 동기화 실패:", err));
            }, 5000);
        }

        // 통합 멀티 자산 분석 코어 연산 엔진
        function calculateMultiReturn() {
            const inputVal = document.getElementById('ticker-input').value.trim();
            if(!inputVal) {
                alert('종목코드를 입력하세요.');
                return;
            }

            if (realtimeTimer) {
                clearInterval(realtimeTimer);
                realtimeTimer = null;
            }

            const activePeriodBtn = document.querySelector('.btn-period.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '5y';

            const resultContainer = document.getElementById('result-container');
            const summaryContainer = document.getElementById('portfolio-summary-container');
            
            resultContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#58a6ff; font-weight:bold;">🚀 실시간 퀀트 알고리즘 작동 중... 잠시만 기다려주십시오.</div>';
            summaryContainer.innerHTML = '';

            fetch(`/api/calc_ultimate?tickers=${encodeURIComponent(inputVal)}&period=${period}`)
                .then(res => res.json())
                .then(resData => {
                    if(resData.error) {
                        resultContainer.innerHTML = `<div style="padding:20px; color:#ff7b72;">${resData.error}</div>`;
                        return;
                    }

                    const pData = resData.portfolio_data;
                    summaryContainer.innerHTML = `
                        <div class="panel-box" style="margin-bottom:20px; border-color:#ff007f; background: linear-gradient(145deg, #20111e, #161b22);">
                            <div class="panel-title" style="color:#ff007f; border-bottom-color:#ff007f;">📊 균등 가중 종합 포트폴리오 성과 요약</div>
                            <div style="display:flex; justify-content:space-around; align-items:center; padding:10px 0;">
                                <div style="text-align:center;">
                                    <div style="font-size:0.8rem; color:#8b949e;">종합 누적 수익률</div>
                                    <div style="font-size:1.6rem; font-weight:bold; color:#ff5555; margin-top:5px;">${pData.total_rate}%</div>
                                </div>
                                <div style="width:2px; height:40px; background:#30363d;"></div>
                                <div style="text-align:center;">
                                    <div style="font-size:0.8rem; color:#8b949e;">포트폴리오 최대 낙폭 (MDD)</div>
                                    <div style="font-size:1.6rem; font-weight:bold; color:#5555ff; margin-top:5px;">${pData.combined_mdd}%</div>
                                </div>
                            </div>
                        </div>
                    `;

                    resultContainer.innerHTML = '';
                    resData.results.forEach(stock => {
                        const card = document.createElement('div');
                        card.className = 'premium-addon';
                        card.setAttribute('data-ticker', stock.ticker);

                        let newsHtml = '';
                        if(stock.news && stock.news.length > 0) {
                            stock.news.forEach(n => {
                                newsHtml += `<a href="${n.link}" target="_blank" class="news-link" title="${n.title}">📰 ${n.title}</a>`;
                            });
                        } else {
                            newsHtml = '<div style="color:#8b949e; font-size:0.8rem; padding-top:5px;">관련 실시간 뉴스가 없습니다.</div>';
                        }

                        card.innerHTML = `
                            <div>
                                <div style="font-size:1.1rem; font-weight:bold; color:#f0f6fc; margin-bottom:12px;">
                                    📌 ${stock.name} (${stock.ticker}) <span style="font-size:0.8rem; color:#8b949e; margin-left:8px;">${stock.sector}</span>
                                </div>
                                <div class="grid-5">
                                    <div class="sub-box">
                                        <div class="sub-box-title">현재가(실시간)</div>
                                        <div class="sub-box-val price-val">${stock.current_price}</div>
                                    </div>
                                    <div class="sub-box">
                                        <div class="sub-box-title">전일 대비(%)</div>
                                        <div class="sub-box-val change-val ${stock.day_change.startsWith('-') ? 'text-down' : 'text-up'}">${stock.day_change}</div>
                                    </div>
                                    <div class="sub-box">
                                        <div class="sub-box-title">누적 수익률</div>
                                        <div class="sub-box-val ${stock.total_return.startsWith('-') ? 'text-down' : 'text-up'}">${stock.total_return}</div>
                                    </div>
                                    <div class="sub-box">
                                        <div class="sub-box-title">최대 낙폭(MDD)</div>
                                        <div class="sub-box-val" style="color:#58a6ff;">${stock.mdd}%</div>
                                    </div>
                                    <div class="sub-box">
                                        <div class="sub-box-title">RSI (14)</div>
                                        <div class="sub-box-val" style="color:#d4bbff;">${stock.rsi}</div>
                                    </div>
                                    <div class="sub-box">
                                        <div class="sub-box-title">외인/기관 지분율</div>
                                        <div class="sub-box-val" style="color:#ffb86c;">${stock.foreign_ownership}</div>
                                    </div>
                                    <div class="sub-box">
                                        <div class="sub-box-title">PER / PBR</div>
                                        <div class="sub-box-val" style="color:#a1ffc5; font-size:0.85rem;">${stock.per}배 / ${stock.pbr}배</div>
                                    </div>
                                </div>
                            </div>
                            <div style="border-left: 1px solid #30363d; padding-left:15px; display:flex; flex-direction:column; justify-content:center;">
                                <div style="font-size:0.8rem; font-weight:bold; color:#58a6ff; margin-bottom:8px;">최신 주요 인텔리전스 뉴스</div>
                                ${newsHtml}
                            </div>
                        `;
                        resultContainer.appendChild(card);
                    });

                    // 대망의 그래프 그리기 함수 정상 호출
                    renderMultiChart(pData.dates, resData.results, pData.combined_pct);
                    startRealtimePolling(inputVal);
                })
                .catch(err => {
                    console.error(err);
                    resultContainer.innerHTML = '<div style="padding:20px; color:#ff7b72;">분석 연산 중 치명적 오류가 발생했습니다. 종목명을 다시 확인하세요.</div>';
                });
        }

        // Chart.js 수익률 추이 시각화 핸들러
        function renderMultiChart(dates, stockResults, combinedPct) {
            const ctx = document.getElementById('multiChart').getContext('2d');
            if(chartInstance) {
                chartInstance.destroy();
            }

            const datasets = [];
            const colors = ['#58a6ff', '#34d058', '#ffb86c', '#ff7b72', '#ff79c6', '#bd93f9', '#8be9fd'];
            
            stockResults.forEach((stock, idx) => {
                datasets.push({
                    label: stock.name,
                    data: stock.pct_array,
                    borderColor: colors[idx % colors.length],
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                });
            });

            if(combinedPct && combinedPct.length > 0) {
                datasets.push({
                    label: '종합 포트폴리오 평균',
                    data: combinedPct,
                    borderColor: '#ff007f',
                    borderWidth: 4,
                    pointRadius: 0,
                    borderDash: [5, 5]
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
                            grid: { color: '#21262d' },
                            ticks: { color: '#8b949e', maxTicksLimit: 12 }
                        },
                        y: {
                            grid: { color: '#21262d' },
                            ticks: { color: '#8b949e' },
                            title: { display: true, text: '누적 수익률 (%)', color: '#8b949e' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#c9d1d9' } }
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
"""