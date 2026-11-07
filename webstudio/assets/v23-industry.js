/* ALLFILEONE WEB STUDIO — V24 extension on V23, 2026-11-07
   Original, offline, no dependencies or tracking. Uses fictional sample data only.
   Every v13 demo shares demo.js, which loads this progressive enhancement. */
'use strict';
(() => {
  const industry = document.body?.dataset.industry;
  const style = document.body?.dataset.v13Style || 'modern';
  const main = document.querySelector('main');
  const hero = main?.querySelector('.hero');
  if (!main || !hero || document.getElementById('v23-workflow')) return;
  const samples = {
    manufacturing: {tag:'B2B ENGINEERING',head:'규격에서 시작하는\n기술 파트너십.',sub:'제품 사양과 최소주문수량을 확인하고 가상 견적 구성을 직접 체험해 보세요.',cta:'제품·수량 선택하기',detail:'SPEC / MOQ / PROCUREMENT',stat:'Ø12–40',kind:'blueprint',
      scene:`<div class="v23-blueprint"><div class="v23-bp-top"><span>01 / PRODUCT SPECIFICATION</span><span>REV · 01</span></div><div class="v23-bp-drawing"><div class="v23-bp-core"><i></i><i></i><i></i></div><span class="v23-bp-measure x">↔ 240 mm</span><span class="v23-bp-measure y">Ø 40 mm</span></div><div class="v23-bp-bottom"><b>PRECISION COMPONENT</b><span>STEEL · CNC · CUSTOM</span></div></div>`},
    corporate:{tag:'CAPABILITY & IMPACT',head:'회사의 강점은\n증거로 말합니다.',sub:'서비스·프로젝트·진행 단계가 연결되는 기업 소개 방식을 확인해 보세요.',cta:'사업 분야 선택하기',detail:'SOLUTIONS / CASES / TRUST',stat:'03 / SERVICE LINES',kind:'corporate',
      scene:`<div class="v23-corp"><div class="v23-corp-header">STRATEGY / OPERATIONS / DIGITAL</div><div class="v23-corp-type">Ideas to<br><em>impact.</em></div><div class="v23-corp-steps"><span>DISCOVER / 01</span><span>DESIGN / 02</span><span>DELIVER / 03</span></div></div>`},
    clinic:{tag:'PATIENT FIRST',head:'진료 안내는\n명확하고 편안하게.',sub:'진료 분야별 안내와 방문 준비 정보를 한눈에 확인하도록 설계했습니다.',cta:'진료과·내원 안내 확인',detail:'SPECIALTIES / HOURS / VISIT',stat:'CARE GUIDE',kind:'clinic',
      scene:`<div class="v23-clinic"><div class="v23-clinic-orbit"><span>+</span></div><h3>오늘의 진료 안내</h3><div class="v23-clinic-row"><b>내과</b><span>월·수·금</span><strong>09–17</strong></div><div class="v23-clinic-row"><b>건강상담</b><span>화·목</span><strong>10–16</strong></div><div class="v23-clinic-foot">예약이 아닌 예시 일정입니다</div></div>`},
    academy:{tag:'LEARN WITH PURPOSE',head:'강좌와 시간표가\n한눈에 보이도록.',sub:'학년·수업 요일을 기준으로 관심 강좌를 찾는 경험을 직접 체험해 보세요.',cta:'강좌·시간표 탐색하기',detail:'COURSES / LEVEL / SCHEDULE',stat:'4 SAMPLE CLASSES',kind:'academy',
      scene:`<div class="v23-academy"><span class="v23-academy-ed">STUDY NOTES / 2026</span><h3>배움에<br><em>리듬을.</em></h3><div class="v23-academy-slots"><span>MON<br><b>16:00</b></span><span>TUE<br><b>18:00</b></span><span>SAT<br><b>10:00</b></span></div></div>`},
    interior:{tag:'SPACES & STORIES',head:'공간이 달라지는\n과정을 기록합니다.',sub:'시공 목적·공간 면적을 선택하고 나에게 맞는 준비 목록을 확인해 보세요.',cta:'공간 설계 브리프 만들기',detail:'PROJECT / SCOPE / MATERIAL',stat:'SPACE STUDY',kind:'interior',
      scene:`<div class="v23-interior"><div class="v23-interior-pane pane-one"><span>01<br>FORM</span></div><div class="v23-interior-pane pane-two"><span>02<br>LIGHT</span></div><div class="v23-interior-caption"><b>SPACE STUDIES</b><small>공간이 주는 감각의 재발견</small></div></div>`},
    commerce:{tag:'A CURATED SELECTION',head:'상품의 매력을\n구매 경험으로.',sub:'상품 탐색과 수량별 가상 장바구니 합계를 직접 확인할 수 있습니다.',cta:'상품 장바구니 체험',detail:'COLLECTION / CART / TOTAL',stat:'SHOP CONCEPT',kind:'commerce',
      scene:`<div class="v23-commerce"><div class="v23-commerce-feature"><span>EVERYDAY OBJECTS</span><div class="v23-commerce-object"></div><b>SOIL / 01</b></div><div class="v23-commerce-price">2026 COLLECTION<span>₩ 28,000</span></div></div>`},
    professional:{tag:'CLEAR THINKING',head:'복잡한 상담도\n준비부터 명확하게.',sub:'상담 분야를 선택하면 준비해야 할 기본 항목을 정리해 드립니다. 전문 자문은 제공하지 않습니다.',cta:'상담 준비 안내 보기',detail:'SERVICE / PROCESS / DOCUMENT',stat:'ADVISORY',kind:'professional',
      scene:`<div class="v23-pro"><span>JEONGDAM / ADVISORY</span><div class="v23-pro-bars"><i></i><i></i><i></i><i></i></div><h3>원칙과<br>명확한 기준.</h3><small>신뢰를 위한 첫 단계 · 가상 시연</small></div>`},
    association:{tag:'COMMUNITY & IDEAS',head:'공지와 자료를\n더 쉽게 찾도록.',sub:'행사·소식·자료를 검색하고 분야별로 분류하는 커뮤니티 웹사이트를 보여드립니다.',cta:'공지·자료 검색하기',detail:'NEWS / RESOURCES / EVENTS',stat:'OPEN COMMUNITY',kind:'association',
      scene:`<div class="v23-community"><div class="v23-community-label">TOMORROW FORUM / BULLETIN</div><div class="v23-community-issue"><span>01 / RESEARCH</span><b>함께 나누는 지식</b></div><div class="v23-community-issue"><span>02 / EVENTS</span><b>연결로 만드는 기회</b></div><div class="v23-community-issue"><span>03 / NEWS</span><b>커뮤니티 새로운 소식</b></div></div>`},
    franchise:{tag:'BRAND EXPANSION',head:'창업 검토에 필요한\n정보를 한곳에.',sub:'가맹 절차와 확인 항목을 비교하는 가상 안내 페이지입니다. 실제 가맹 조건이 아닙니다.',cta:'창업 준비 체크하기',detail:'BRAND / PROCESS / CHECKLIST',stat:'BRAND ROADMAP',kind:'franchise',
      scene:`<div class="v23-franchise"><div class="v23-franchise-cup">M<span>•</span></div><div class="v23-franchise-main">MORNING<br>BREW</div><div class="v23-franchise-strip">A BRAND MADE FOR EVERYDAY</div></div>`},
    stay:{tag:'RETREAT & REST',head:'휴식은\n예약 전부터 시작됩니다.',sub:'객실 정원·숙박 일수에 따른 가상 요금을 계산해 보세요. 실제 예약은 접수되지 않습니다.',cta:'객실 요금 계산하기',detail:'ROOMS / DATES / GUESTS',stat:'SOOM STAY',kind:'stay',
      scene:`<div class="v23-stay"><div class="v23-stay-sun"></div><div class="v23-stay-hill a"></div><div class="v23-stay-hill b"></div><div class="v23-stay-note">SLOW DOWN <span>IN NATURE</span></div><div class="v23-stay-bottom">ROOM 01 · FOREST VIEW</div></div>`},
    realestate:{tag:'FIND YOUR SPACE',head:'입지와 예산을\n함께 비교하세요.',sub:'지역·유형·예산별 가상 매물 검색으로 탐색 중심 홈페이지를 체험해 보세요.',cta:'매물 조건 검색하기',detail:'LOCATION / TYPE / BUDGET',stat:'PROPERTY FINDER',kind:'realestate',
      scene:`<div class="v23-realestate"><div class="v23-map-roads"></div><div class="v23-map-marker one">A</div><div class="v23-map-marker two">B</div><div class="v23-map-marker three">C</div><div class="v23-map-key">JARI SPACE<br><small>위치·가격 비교 콘셉트</small></div></div>`},
    event:{tag:'PEOPLE & MOMENTS',head:'프로그램의 흐름을\n선명하게.',sub:'시간별 세션을 고르고 일정 중복을 확인하는 가상 행사 체험입니다.',cta:'내 행사 일정 만들기',detail:'SESSIONS / SPEAKERS / AGENDA',stat:'LIVE EVENT PLAN',kind:'event',
      scene:`<div class="v23-event"><span class="v23-event-up">CREATE DAY / OPEN STAGE</span><strong>MAKE<br>IT<br><em>MATTER.</em></strong><div class="v23-event-ribbon">IDEAS · PEOPLE · IMPACT / 2026</div></div>`}
  };
  const info=samples[industry];
  if (!info) return;
  const escapeHTML = (v) => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Preserve the HTML document, original links, FAQs and existing industry card explorer.
  hero.className = 'hero v23-hero v23-hero--'+industry+' v23-style--'+(style==='premium'||style==='editorial'?style:'modern');
  hero.innerHTML = `<div class="v23-hero-shell"><div class="v23-hero-copy"><span class="v23-overline">${info.tag} <i>·</i> 2026 / CONCEPT</span><h1>${escapeHTML(info.head).replace(/\n/g,'<br>')}</h1><p>${escapeHTML(info.sub)}</p><a class="v23-hero-cta" href="#v23-workflow">${escapeHTML(info.cta)} <span aria-hidden="true">↗</span></a><div class="v23-hero-note">${info.detail} · 가상 시연</div></div><div class="v23-hero-visual" aria-label="${escapeHTML(info.detail)} 시각적 미리보기">${info.scene}</div></div><div class="v23-bottom-rail"><span>ALLFILEONE / INDUSTRY DESIGN STUDY</span><span>${info.stat} <span aria-hidden="true">✳</span></span></div>`;
  const nav = document.getElementById('demo-nav');
  if (nav && !nav.querySelector('[href="#v23-workflow"]')) {
    const a=document.createElement('a');a.href='#v23-workflow';a.textContent='업종 기능';nav.insertBefore(a,nav.querySelector('[href="#contact"]'));
  }
  const workflow = document.createElement('section');workflow.id='v23-workflow';workflow.className='v23-workflow v23-workflow--'+industry;
  workflow.setAttribute('aria-labelledby','v23-workflow-title');
  workflow.innerHTML = `<div class="v23-workflow-inner"><div class="v23-workflow-header"><div><span class="v23-workflow-kicker">REAL INTERACTION / DEMO ONLY</span><h2 id="v23-workflow-title">${escapeHTML(info.cta)}</h2><p>실제 업종별 서비스 흐름을 브라우저에서 체험합니다. 모든 데이터·가격·일정은 가상 예시입니다.</p></div><span class="v23-workflow-chip">NO ACCOUNT · NO SUBMISSION</span></div><div id="v23-form-root"></div><p class="v23-legal">가상 브랜드 시연이며 실제 예약·주문·진료·가맹 신청·견적 접수는 이루어지지 않습니다. 개인정보는 입력하지 마세요.</p></div>`;
  hero.insertAdjacentElement('afterend',workflow);
  const root = workflow.querySelector('#v23-form-root');
  // V24: keep all demo output entirely in this browser. Never post data to a server.
  const output = (msg) => {
    const e=root.querySelector('[data-v23-output]');
    if(e)e.textContent=String(msg);
    const tools=root.querySelector('[data-v24-tools]');
    if(tools)tools.hidden=false;
    const status=root.querySelector('[data-v24-status]');
    if(status)status.textContent='';
  };
  const block = (body) => {root.innerHTML=body+`<div class="v23-result" role="status" aria-live="polite" data-v23-output>입력값을 선택하면 여기에서 결과를 확인할 수 있습니다.</div><div class="v24-result-tools" data-v24-tools hidden role="group" aria-label="시연 결과 활용"><button type="button" class="v24-export" data-v24-copy>결과 복사</button><button type="button" class="v24-export" data-v24-save>TXT로 저장</button><span class="v24-privacy">가상 결과 · 서버 전송 없음</span></div><p class="v24-export-status" role="status" aria-live="polite" data-v24-status></p>`;};
  const optionList=(items)=>items.map(([value,label])=>`<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`).join('');
  const field=(label,id,html)=>`<label class="v23-field" for="${id}"><span>${label}</span>${html}</label>`;
  const btn=(label)=>`<button class="v23-run" type="button" data-v23-run>${label} <span aria-hidden="true">↗</span></button>`;
  const comma=n=>Math.round(n).toLocaleString('ko-KR');
  const get=id=>root.querySelector('#'+id);
  const attach=(fn)=>root.querySelector('[data-v23-run]')?.addEventListener('click',fn);
  switch(industry){
    case 'manufacturing':{
      const products={shaft:{label:'정밀 샤프트',moq:50,unit:6400},sensor:{label:'산업용 센서',moq:10,unit:29000},bracket:{label:'알루미늄 브라켓',moq:100,unit:1800}};
      block(`<div class="v23-fields">${field('제품','v23-product',`<select id="v23-product">${optionList(Object.entries(products).map(([key,p])=>[key,p.label]))}</select>`)}${field('가상 주문 수량','v23-qty','<input id="v23-qty" type="number" min="1" max="1000000" step="1" value="50">')}${btn('가상 견적 계산')}</div>`);
      attach(()=>{const p=products[get('v23-product').value],n=Number(get('v23-qty').value);if(!Number.isSafeInteger(n)||n<1||n>1000000)return output('수량은 1~1,000,000 사이 정수로 입력해 주세요.');if(n<p.moq)return output(`${p.label}: 최소 주문 수량(MOQ) ${p.moq}개가 필요합니다. 현재 ${n}개입니다.`);output(`${p.label} ${comma(n)}개 × 예시 단가 ${comma(p.unit)}원 = 가상 금액 ${comma(n*p.unit)}원 (세금·배송 제외, 실제 견적 아님)`);});break;
    }
    case 'clinic':{
      const depts={internal:['월·수·금 09:00–17:00','신분증, 기존 검사 결과가 있으면 준비'],health:['화·목 10:00–16:00','건강 상태 및 복용 중인 약 안내 준비'],screen:['월~금 09:00–12:00','검진 종류별 사전 안내를 별도로 확인']};
      block(`<div class="v23-fields">${field('진료 안내 종류','v23-dept',`<select id="v23-dept">${optionList([['internal','내과 일반진료'],['health','건강 상담'],['screen','검진 안내']])}</select>`)}${btn('방문 정보 확인')}</div>`);
      attach(()=>{const p=depts[get('v23-dept').value];output(`예시 진료 시간: ${p[0]} · 방문 전 확인: ${p[1]}. 실제 의료기관 시간표가 아닙니다.`);});break;
    }
    case 'academy':{
      const courses=[['초등','월·수','초등 창의 수학 · 16:00'],['초등','토','초등 영어 읽기 · 10:00'],['중등','화·목','중등 사고력 수학 · 18:00'],['중등','금','중등 영어 토론 · 19:00']];
      block(`<div class="v23-fields">${field('학년 구분','v23-grade',`<select id="v23-grade">${optionList([['all','전체'],['초등','초등'],['중등','중등']])}</select>`)}${field('희망 요일','v23-day',`<select id="v23-day">${optionList([['all','전체'],['월','월'],['화','화'],['수','수'],['목','목'],['금','금'],['토','토']])}</select>`)}${btn('강좌 시간표 검색')}</div>`);
      attach(()=>{const g=get('v23-grade').value,d=get('v23-day').value,found=courses.filter(c=>(g==='all'||c[0]===g)&&(d==='all'||c[1].includes(d)));output(found.length?found.map(c=>c[2]+' ('+c[1]+')').join(' / '):'선택 조건에 해당하는 가상 강좌가 없습니다.');});break;
    }
    case 'interior':{
      block(`<div class="v23-fields">${field('공간 유형','v23-space',`<select id="v23-space">${optionList([['주거 공간','주거 공간'],['상업 공간','상업 공간'],['오피스','오피스']])}</select>`)}${field('대상 면적 (㎡)','v23-area','<input id="v23-area" type="number" min="1" max="10000" step="1" value="84">')}${field('우선 과제','v23-goal',`<select id="v23-goal">${optionList([['동선 개선','동선 개선'],['수납 개선','수납 개선'],['분위기 변경','분위기 변경']])}</select>`)}${btn('시공 준비 브리프')}</div>`);
      attach(()=>{const n=Number(get('v23-area').value);if(!Number.isSafeInteger(n)||n<1||n>10000)return output('면적은 1~10,000㎡ 사이 정수로 입력해 주세요.');output(`${get('v23-space').value} / ${n}㎡ / ${get('v23-goal').value}: 현장 실측 → 기존 구조 확인 → 예산·공정 협의 → 자재·일정 검토. 실제 견적·공사 일정은 아닙니다.`);});break;
    }
    case 'commerce':{
      const goods={cup:['세라믹 컵',28000],bag:['패브릭 백',19000],tray:['우드 트레이',42000]};const cart=new Map();
      block(`<div class="v23-fields">${field('상품','v23-goods',`<select id="v23-goods">${optionList(Object.entries(goods).map(([k,p])=>[k,`${p[0]} / ${comma(p[1])}원`]))}</select>`)}${field('수량','v23-goodsqty','<input id="v23-goodsqty" type="number" min="1" max="99" value="1">')}${btn('가상 장바구니 담기')}<button class="v23-clear" type="button" data-v23-clear>장바구니 비우기</button></div>`);
      attach(()=>{const q=Number(get('v23-goodsqty').value);if(!Number.isSafeInteger(q)||q<1||q>99)return output('1~99개 사이 정수 수량을 입력해 주세요.');const k=get('v23-goods').value;const next=(cart.get(k)||0)+q;if(next>99)return output('한 상품의 가상 수량은 99개 이하로 제한합니다.');cart.set(k,next);const total=[...cart].reduce((s,[id,qty])=>s+goods[id][1]*qty,0);output(`${[...cart].map(([id,qty])=>goods[id][0]+' '+qty+'개').join(' · ')} / 합계 ${comma(total)}원. 결제는 이루어지지 않습니다.`);});
      root.querySelector('[data-v23-clear]').addEventListener('click',()=>{cart.clear();output('가상 장바구니를 비웠습니다.');});break;
    }
    case 'professional':{
      const prep={tax:'사업자등록 및 관련 신고 자료, 문의사항 요약',contract:'검토할 계약서 초안, 쟁점·기한 메모',account:'재무제표 및 거래내역 목록, 검토 목적 메모'};
      block(`<div class="v23-fields">${field('상담 분야','v23-expert',`<select id="v23-expert">${optionList([['tax','세무 신고 안내'],['contract','계약 검토 안내'],['account','회계 자문 안내']])}</select>`)}${btn('준비서류 예시 보기')}</div>`);
      attach(()=>output(`상담 전 준비 예시: ${prep[get('v23-expert').value]}. 개인정보·원본 문서 업로드는 받지 않으며 법률·세무 자문이 아닙니다.`));break;
    }
    case 'association':{
      const news=[['연구','2026 연구자료 공개 안내'],['행사','11월 커뮤니티 포럼'],['공지','정기 운영 공지'],['행사','회원 간담회 일정'],['연구','지식 공유 세미나 자료']];
      block(`<div class="v23-fields">${field('소식 종류','v23-news',`<select id="v23-news">${optionList([['all','전체'],['연구','연구'],['행사','행사'],['공지','공지']])}</select>`)}${field('검색어','v23-term','<input id="v23-term" type="search" placeholder="검색어 (선택)">')}${btn('공지·자료 검색')}</div>`);
      attach(()=>{const c=get('v23-news').value,q=get('v23-term').value.trim(),items=news.filter(x=>(c==='all'||c===x[0])&&(!q||x[1].includes(q)));output(items.length?items.map(x=>`[${x[0]}] ${x[1]}`).join(' / '):'일치하는 가상 공지가 없습니다.');});break;
    }
    case 'franchise':{
      const steps=['상표·운영 방식 확인','가맹계약서 및 정보공개서 검토','입지·상권 기초 조사','교육·물류 지원 범위 확인','운영비·수익 가정 검토'];
      block(`<div class="v23-checkgroup" role="group" aria-label="창업 준비 확인 항목">${steps.map((v,i)=>`<label><input type="checkbox" data-v23-step="${i}"><span>${escapeHTML(v)}</span></label>`).join('')}</div>${btn('준비 단계 확인')}`);
      attach(()=>{const done=[...root.querySelectorAll('[data-v23-step]:checked')];output(`${done.length}/${steps.length}개 항목 확인. 미확인: ${steps.filter((_,i)=>!done.some(e=>Number(e.dataset.v23Step)===i)).join(' · ')||'없음'}. 실제 가맹 조건·법률 판단이 아닙니다.`);});break;
    }
    case 'stay':{
      const rooms={forest:{label:'포레스트 룸',cap:2,night:130000},garden:{label:'가든 스위트',cap:4,night:220000}};
      const start=new Date();start.setDate(start.getDate()+7);const end=new Date(start);end.setDate(start.getDate()+1);
      const format=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
      block(`<div class="v23-fields">${field('객실','v23-room',`<select id="v23-room">${optionList(Object.entries(rooms).map(([id,r])=>[id,`${r.label} / 정원 ${r.cap}명`]))}</select>`)}${field('체크인','v23-checkin',`<input id="v23-checkin" type="date" min="${format(new Date())}" value="${format(start)}">`)}${field('체크아웃','v23-checkout',`<input id="v23-checkout" type="date" min="${format(new Date())}" value="${format(end)}">`)}${field('투숙 인원','v23-guests','<input id="v23-guests" type="number" min="1" max="20" step="1" value="2">')}${btn('가상 숙박 요금 계산')}</div>`);
      attach(()=>{const r=rooms[get('v23-room').value],g=Number(get('v23-guests').value),a=get('v23-checkin').value,b=get('v23-checkout').value;
        if(!a||!b)return output('체크인·체크아웃 날짜를 선택해 주세요.');
        // Date-only UTC arithmetic avoids daylight-saving time distortions.
        const nights=(Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000;
        if(a<format(new Date()))return output('체크인 날짜는 오늘 또는 이후 날짜로 입력해 주세요.');
        if(!Number.isSafeInteger(g)||g<1||g>20)return output('투숙 인원은 1~20명으로 입력해 주세요.');if(g>r.cap)return output(`${r.label}의 가상 정원은 ${r.cap}명입니다. 객실 또는 인원을 변경해 주세요.`);
        if(!Number.isInteger(nights)||nights<1||nights>30)return output('체크아웃은 체크인 이후여야 하며 1~30박만 계산합니다.');output(`${r.label} / ${g}명 / ${nights}박 × ${comma(r.night)}원 = ${comma(nights*r.night)}원 (가상 요금, 실제 예약 아님)`);});break;
    }
    case 'realestate':{
      const listings=[['서울','아파트',83000,'도심형 아파트 A'],['경기','오피스',26000,'비즈니스 오피스 B'],['인천','아파트',48000,'리버뷰 아파트 C'],['서울','오피스',61000,'스튜디오 오피스 D']];
      block(`<div class="v23-fields">${field('지역','v23-region',`<select id="v23-region">${optionList([['all','전체'],['서울','서울'],['경기','경기'],['인천','인천']])}</select>`)}${field('유형','v23-estate-type',`<select id="v23-estate-type">${optionList([['all','전체'],['아파트','아파트'],['오피스','오피스']])}</select>`)}${field('예산 상한 (만원)','v23-budget','<input id="v23-budget" type="number" min="1" max="10000000" step="1000" value="60000">')}${btn('가상 매물 검색')}</div>`);
      attach(()=>{const b=Number(get('v23-budget').value),r=get('v23-region').value,t=get('v23-estate-type').value;if(!Number.isSafeInteger(b)||b<1||b>10000000)return output('유효한 예산 상한(만원)을 입력해 주세요.');const filtered=listings.filter(x=>(r==='all'||x[0]===r)&&(t==='all'||x[1]===t)&&x[2]<=b);output(filtered.length?filtered.map(x=>`${x[3]} · ${comma(x[2])}만원`).join(' / '):'조건에 맞는 가상 매물이 없습니다.');});break;
    }
    case 'event':{
      const events=[['opening','10:00','11:00','오프닝 세션'],['talk','11:15','12:15','주제 발표'],['workshop','11:30','12:30','참여 워크숍'],['network','13:00','14:00','네트워킹']];
      block(`<div class="v23-checkgroup" role="group" aria-label="가상 세션 선택">${events.map(e=>`<label><input type="checkbox" value="${e[0]}" data-v23-session><span>${e[1]}–${e[2]} · ${e[3]}</span></label>`).join('')}</div>${btn('내 행사 일정 확인')}`);
      attach(()=>{const ids=new Set([...root.querySelectorAll('[data-v23-session]:checked')].map(e=>e.value));const chosen=events.filter(e=>ids.has(e[0]));if(!chosen.length)return output('먼저 세션을 선택해 주세요.');const pairs=[];for(let i=0;i<chosen.length;i++)for(let j=i+1;j<chosen.length;j++){if(chosen[i][1]<chosen[j][2]&&chosen[j][1]<chosen[i][2])pairs.push(chosen[i][3]+' ↔ '+chosen[j][3]);}output(chosen.map(e=>e[1]+' '+e[3]).join(' / ')+(pairs.length?' · 시간 중복 주의: '+pairs.join(', '):' · 시간 중복 없음'));});break;
    }
    case 'corporate':{
      const domains={consult:['시장 진입 전략','사업 가능성 검토 → 실행 계획'],ops:['업무 효율화','업무 진단 → 개선안 → 지표 확인'],digital:['디지털 전환','데이터 정리 → 시스템 설계 → 운영']};
      block(`<div class="v23-fields">${field('관심 사업 영역','v23-domain',`<select id="v23-domain">${optionList([['consult','전략 컨설팅'],['ops','업무 운영 혁신'],['digital','디지털 전환']])}</select>`)}${btn('업무 진행 예시 보기')}</div>`);
      attach(()=>{const p=domains[get('v23-domain').value];output(`${p[0]}: ${p[1]}. 실제 기업 실적이 아닌 서비스 설명 예시입니다.`);});break;
    }
  }
  // V24: keyboard activation and user-initiated export, shared by all 12 industries.
  root.addEventListener('keydown', event => {
    if(event.key==='Enter' && event.target.matches('input:not([type="checkbox"])')) {
      event.preventDefault();
      root.querySelector('[data-v23-run]')?.click();
    }
  });
  const exportText=()=>[
    '[ALLFILEONE WEB STUDIO · 시연 결과]',
    '업종: '+industry,
    '스타일: '+style,
    '작성일: '+new Date().toLocaleDateString('ko-KR'),
    '',
    root.querySelector('[data-v23-output]')?.textContent || '',
    '',
    '※ 이 정보는 가상 홈페이지 기능 시연용입니다.',
    '※ 실제 주문·예약·가격·전문 자문·상담 접수에 사용할 수 없습니다.',
    '※ 파일은 현재 브라우저에서 생성되며 서버로 전송되지 않습니다.'
  ].join('\n');
  const status=root.querySelector('[data-v24-status]');
  root.querySelector('[data-v24-copy]')?.addEventListener('click', async () => {
    try {
      if(!navigator.clipboard || !window.isSecureContext) throw Error('clipboard-unavailable');
      await navigator.clipboard.writeText(exportText());
      status.textContent='시연 결과를 복사했습니다. 실제 상담이 접수된 것은 아닙니다.';
    } catch (_) {
      status.textContent='이 브라우저에서는 복사를 허용하지 않습니다. TXT로 저장 버튼을 이용해 주세요.';
    }
  });
  root.querySelector('[data-v24-save]')?.addEventListener('click', () => {
    const text=exportText();
    const blob=new Blob(['\ufeff',text],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url;
    a.download='AllFileOne_'+industry+'_Demo_Brief.txt';
    root.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),15000);
    status.textContent='시연 결과 TXT 다운로드를 요청했습니다. 실제 접수는 이루어지지 않습니다.';
  });
  // Track no analytics, no cookies and no back-end calls.
  workflow.dataset.v23Ready='true';
  workflow.dataset.v24Ready='true';
})();