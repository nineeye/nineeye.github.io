'use strict';
(() => {
  // Original, dependency-free feature composition. All records describe production requirements,
  // not completed server/PG functionality. Each stage is explicit to prevent misleading claims.
  const MODULES = [
    {id:'company',group:'content',name:'회사·브랜드 소개',desc:'사업 소개, 장점, 서비스 및 연락처의 명확한 전달',stage:'demo',demo:'builder.html',keywords:'기업 회사 소개 브랜드 홈페이지'},
    {id:'portfolio',group:'content',name:'실적·작업 포트폴리오',desc:'업종별 사례, 사진·작업 흐름·유형별 탐색',stage:'demo',demo:'portfolio.html',keywords:'사진 시공 프로젝트 사례'},
    {id:'catalog',group:'content',name:'제품 규격 카탈로그',desc:'검색과 종류별 필터, 제품 비교 및 문의 동선',stage:'demo',demo:'demo/manufacturing/modern/index.html#experience',keywords:'제조 규격 제품 검색 도매'},
    {id:'gallery',group:'content',name:'이미지·콘텐츠 갤러리',desc:'브랜드·공간·상품 사진을 반응형 화면에 배치',stage:'demo',demo:'index.html#gallery',keywords:'갤러리 이미지 사진 슬라이더'},
    {id:'faq',group:'content',name:'질문·답변 FAQ',desc:'고객이 많이 묻는 내용을 펼치고 접는 안내',stage:'demo',demo:'index.html#faq',keywords:'자주 질문 안내'},
    {id:'quickquote',group:'quote',name:'빠른 견적 계산',desc:'수량·면적·옵션 선택에 따른 예시 계산',stage:'demo',demo:'specialty/renovation.html',keywords:'견적 가격 비용 계산 시공'},
    {id:'tierquote',group:'quote',name:'거래처·등급별 단가',desc:'고객 등급·구매 수량에 따른 가격 규칙',stage:'demo',demo:'specialty/wholesale.html',keywords:'거래처 주문 도매 등급 가격 수량'},
    {id:'estimatefile',group:'quote',name:'견적 내용 TXT·CSV 저장',desc:'선택한 품목·구성을 브라우저에서 파일로 내보내기',stage:'demo',demo:'specialty/wholesale.html',keywords:'견적 내보내기 다운로드'},
    {id:'emailinquiry',group:'quote',name:'이메일 상담 연결',desc:'고객의 이메일 앱으로 문의 초안 전달',stage:'demo',demo:'contact.html',keywords:'메일 상담 문의 신청'},
    {id:'quotehistory',group:'quote',name:'견적 요청 이력 관리',desc:'서버에 견적을 저장하고 상태별로 조회·수정',stage:'server',demo:'specialty/wholesale.html',keywords:'관리자 견적 db 내역'},
    {id:'timetable',group:'booking',name:'시간표·일정 안내',desc:'강좌·진료·운영 시간표의 검색과 선택',stage:'demo',demo:'specialty/academybooking.html',keywords:'수업 진료 일정 시간표 학원'},
    {id:'datepicker',group:'booking',name:'희망 날짜·시간 선택',desc:'달력과 시간대를 선택하는 예약 준비 단계',stage:'demo',demo:'specialty/staybooking.html',keywords:'예약 객실 방문 날짜 숙박'},
    {id:'capacity',group:'booking',name:'중복예약·정원 통제',desc:'동시 신청을 서버에서 잠금·확정하는 재고 관리',stage:'server',demo:'specialty/staybooking.html',keywords:'예약 잔여석 수량 중복 동시성'},
    {id:'approval',group:'booking',name:'예약 승인·변경',desc:'관리자 승인·취소·변경 이력과 권한 검사',stage:'server',demo:'specialty/academybooking.html',keywords:'예약 관리자 승인 취소'},
    {id:'sync',group:'booking',name:'외부 캘린더 연동',desc:'외부 캘린더 계정·권한·동기화 관리',stage:'external',demo:'specialty/academybooking.html',keywords:'캘린더 구글 동기화 api'},
    {id:'notice',group:'admin',name:'공지 검색·게시판',desc:'공지 조회, 로컬 임시 수정 및 CSV 저장 시연',stage:'demo',demo:'specialty/memberboard.html',keywords:'공지 게시판 협회 자료실'},
    {id:'cms',group:'admin',name:'관리자 콘텐츠 수정',desc:'로그인 후 실제 DB에 글·페이지 저장',stage:'server',demo:'specialty/memberboard.html',keywords:'관리자 cms 게시글'},
    {id:'branch',group:'admin',name:'지점별 운영 정보',desc:'지점·진료과·요일별 안내 콘텐츠 분리',stage:'demo',demo:'specialty/multiclinic.html',keywords:'병원 다지점 지점 운영 안내'},
    {id:'uploads',group:'admin',name:'첨부파일 안전 업로드',desc:'파일 검사·권한·크기 제한·저장소·삭제 정책',stage:'server',demo:'specialty/memberboard.html',keywords:'파일 자료실 보안 업로드'},
    {id:'roles',group:'admin',name:'관리자·직원 권한',desc:'직원별 로그인·역할·감사 로그·복구',stage:'server',demo:'specialty/memberboard.html',keywords:'계정 로그인 관리자 권한 보안'},
    {id:'productsearch',group:'commerce',name:'상품 검색·필터',desc:'카테고리·조건별 상품 검색과 비교',stage:'demo',demo:'demo/commerce/modern/index.html#experience',keywords:'쇼핑몰 상품 검색 필터'},
    {id:'favorites',group:'commerce',name:'관심상품 목록',desc:'고객이 목록을 선택해 비교하는 시연',stage:'demo',demo:'demo/commerce/modern/index.html#experience',keywords:'위시리스트 관심상품 찜'},
    {id:'cart',group:'commerce',name:'장바구니 수량·금액',desc:'상품·수량·예시 금액을 브라우저에서 계산',stage:'demo',demo:'specialty/wholesale.html',keywords:'장바구니 카트 쇼핑'},
    {id:'orders',group:'commerce',name:'실제 주문 접수·이력',desc:'고객·재고·주문 상태를 서버에 안전하게 저장',stage:'server',demo:'specialty/wholesale.html',keywords:'주문 내역 배송 db'},
    {id:'payment',group:'commerce',name:'카드·간편결제 연동',desc:'PG 계약·심사·결제 검증·취소·정산 필요',stage:'external',demo:'specialty/wholesale.html',keywords:'결제 pg 카드 페이'},
    {id:'seo',group:'growth',name:'검색엔진 기본 최적화',desc:'페이지 제목·설명·시맨틱 구조·사이트맵',stage:'demo',demo:'index.html',keywords:'검색 seo 네이버 구글 노출'},
    {id:'a11y',group:'growth',name:'접근성·모바일 UX',desc:'키보드·명도·반응형·모션 감소 대응',stage:'demo',demo:'builder.html',keywords:'접근성 모바일 반응형 wcag'},
    {id:'multi',group:'growth',name:'다국어 페이지',desc:'한국어·영어 등 실제 콘텐츠 번역·번역 검수',stage:'server',demo:'builder.html',keywords:'영어 다국어 번역 언어'},
    {id:'map',group:'growth',name:'지도·길찾기 링크',desc:'주소 안내와 외부 지도 서비스 연결',stage:'external',demo:'specialty/multiclinic.html',keywords:'지도 네이버 카카오 위치'},
    {id:'notify',group:'growth',name:'문자·메일 자동 알림',desc:'전송사업자·수신동의·발송 실패·요금 확인',stage:'external',demo:'specialty/academybooking.html',keywords:'문자 sms 알림 이메일 전송'}
  ];
  const LABEL = {demo:'브라우저 시연',server:'서버 개발 필요',external:'외부 서비스 필요'};
  const CAT = {content:'소개·콘텐츠',quote:'견적·문의',booking:'예약·일정',admin:'운영·관리',commerce:'상품·주문',growth:'연동·품질'};
  const INDUSTRY = ['manufacturing','corporate','academy','clinic','interior','stay','commerce','association','other'];
  const GOALS = ['lead','trust','booking','sales','operations'];
  const PRESETS = {
    manufacturing:['company','catalog','quickquote','tierquote','estimatefile','emailinquiry','seo'],
    corporate:['company','portfolio','faq','emailinquiry','seo','a11y'],
    academy:['company','timetable','datepicker','capacity','approval','emailinquiry','seo'],
    clinic:['company','branch','timetable','faq','map','a11y'],
    interior:['company','portfolio','gallery','quickquote','emailinquiry','seo'],
    stay:['company','gallery','datepicker','capacity','emailinquiry','seo'],
    commerce:['company','productsearch','favorites','cart','orders','payment','seo'],
    association:['company','notice','cms','uploads','roles','emailinquiry'],
    other:['company','faq','emailinquiry','seo','a11y']
  };
  const STORE = 'allfileone_webstudio_modules_v8';
  const $ = id => document.getElementById(id);
  const byId = new Map(MODULES.map(item => [item.id,item]));
  const selection = new Set();
  const checks = new Set();
  const form = {industry:$('industry'),name:$('project-name'),goal:$('primary-goal')};
  const feedback = $('feedback');
  let activeCategory = 'all';
  const allTabs = [...document.querySelectorAll('[data-cat]')];
  const today = () => { const d=new Date();const y=d.getFullYear();return y+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  const clean = (value,max=60) => typeof value === 'string' ? value.slice(0,max) : '';
  function current(){ return {version:8, industry:form.industry.value,goal:form.goal.value,name:form.name.value,features:MODULES.filter(m=>selection.has(m.id)).map(m=>m.id),checks:[...checks]}; }
  function remember(){ try {localStorage.setItem(STORE,JSON.stringify(current()));} catch {feedback.textContent='브라우저 저장을 사용할 수 없습니다. JSON 파일로 설정을 보관해 주세요.';} }
  function validateDraft(raw){
    if(!raw || typeof raw!=='object' || Array.isArray(raw) || raw.version!==8) throw new Error('V8의 올바른 설정 JSON 파일이 아닙니다.');
    if(!INDUSTRY.includes(raw.industry)||!GOALS.includes(raw.goal)) throw new Error('업종 또는 목적 값이 올바르지 않습니다.');
    if(typeof raw.name!=='string'||raw.name.length>60)throw new Error('프로젝트 이름이 너무 길거나 올바르지 않습니다.');
    if(!Array.isArray(raw.features)||raw.features.length>MODULES.length||raw.features.some(x=>typeof x!=='string'||!byId.has(x)))throw new Error('알 수 없는 기능 설정이 포함되어 있습니다.');
    if(!Array.isArray(raw.checks)||raw.checks.length>6||raw.checks.some(x=>typeof x!=='string'||!['content','domain','data','privacy','maint','cost'].includes(x)))throw new Error('확인 항목 설정이 올바르지 않습니다.');
    return raw;
  }
  function restore(raw){
    const p=validateDraft(raw);
    form.industry.value=p.industry;form.goal.value=p.goal;form.name.value=clean(p.name,60);
    selection.clear();p.features.forEach(id=>selection.add(id));
    checks.clear();p.checks.forEach(id=>checks.add(id));
    document.querySelectorAll('[data-check]').forEach(el=>{el.checked=checks.has(el.dataset.check)});
    renderSelection();renderModules();remember();
  }
  function create(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
  const grid=$('module-grid');
  function card(item){
    const article=create('article','module-card');article.dataset.module=item.id;article.dataset.category=item.group;article.dataset.stage=item.stage;
    const header=create('header');header.append(create('span','module-code',CAT[item.group]));header.append(create('span','tag '+item.stage,LABEL[item.stage]));
    const heading=create('h3','',item.name);const desc=create('p','',item.desc);
    const foot=create('div','module-foot');const link=create('a','',item.stage==='demo'?'실제 데모 보기 ↗':'관련 화면 시연 ↗');link.href=item.demo;
    const btn=create('button','pick','+ 기능 선택');btn.type='button';btn.dataset.pick=item.id;btn.setAttribute('aria-pressed','false');
    btn.addEventListener('click',()=>{if(selection.has(item.id))selection.delete(item.id);else selection.add(item.id);renderModules();renderSelection();remember();feedback.textContent=item.name+(selection.has(item.id)?' 기능을 담았습니다.':' 기능을 제외했습니다.');});
    foot.append(link,btn);article.append(header,heading,desc,foot);return article;
  }
  const frag=document.createDocumentFragment();MODULES.forEach(m=>frag.append(card(m)));grid.append(frag);
  function renderModules(){
    const search=$('feature-search').value.normalize('NFKC').trim().toLocaleLowerCase('ko-KR');
    const stage=$('stage-filter').value;let visible=0;
    grid.querySelectorAll('.module-card').forEach(el=>{
      const m=byId.get(el.dataset.module);
      const haystack=(m.name+' '+m.desc+' '+m.keywords+' '+CAT[m.group]).normalize('NFKC').toLocaleLowerCase('ko-KR');
      const show=(activeCategory==='all'||m.group===activeCategory)&&(stage==='all'||m.stage===stage)&&(!search||haystack.includes(search));
      el.hidden=!show;if(show)visible++;
      const on=selection.has(m.id);el.classList.toggle('chosen',on);
      const btn=el.querySelector('[data-pick]');btn.setAttribute('aria-pressed',String(on));btn.textContent=on?'✓ 선택됨':'+ 기능 선택';
    });
    $('result-count').textContent='30개 중 '+visible+'개 기능 표시';$('no-results').hidden=visible!==0;
  }
  function warningsFor(items){
    const arr=[];
    if(items.some(x=>x.stage==='server')) arr.push('운영용 DB·계정 권한·백업·복구·입력 검증을 설계하고 실기 검증해야 합니다. 이 페이지에서는 해당 서버 기능이 아직 실행되지 않습니다.');
    if(items.some(x=>x.stage==='external')) arr.push('외부 서비스 계약·심사·사용량·수수료를 확인해야 합니다. 추가 비용 0원을 보장할 수 없는 기능이 포함됩니다.');
    if(items.some(x=>['capacity','approval','orders','quotehistory'].includes(x.id))) arr.push('신청·주문·견적 데이터는 동시 처리, 취소, 중복 방지와 관리자 확인 절차가 필수입니다.');
    if(items.some(x=>['roles','uploads','cms'].includes(x.id))) arr.push('운영자 인증과 업로드 보안, 접근 권한, 변경 이력과 데이터 복구 테스트가 필요합니다.');
    if(items.some(x=>['emailinquiry','notify','auth','orders','quotehistory'].includes(x.id))) arr.push('실제 문의자·회원 정보를 처리하기 전에 개인정보 수집·보관·삭제 및 접근 통제를 검토해야 합니다.');
    if(!items.length) arr.push('기능을 하나 이상 선택하면 운영 조건이 자동 표시됩니다.');
    return arr;
  }
  function renderSelection(){
    const chosen=MODULES.filter(m=>selection.has(m.id));
    $('selected-count').textContent=String(chosen.length);
    for(const type of ['demo','server','external'])$(type+'-count').textContent=String(chosen.filter(x=>x.stage===type).length);
    const summary=$('selected-list');summary.replaceChildren();
    if(!chosen.length)summary.append(create('p','empty-chosen','아직 선택한 기능이 없습니다.'));
    else chosen.forEach(item=>{
      const row=create('div','chosen-row');const left=create('div');left.append(create('strong','',item.name),create('span','', ' · '+LABEL[item.stage]));
      const btn=create('button','','제외');btn.type='button';btn.setAttribute('aria-label',item.name+' 제외');btn.addEventListener('click',()=>{selection.delete(item.id);renderModules();renderSelection();remember();});row.append(left,btn);summary.append(row);
    });
    const server=chosen.filter(x=>x.stage==='server').length,external=chosen.filter(x=>x.stage==='external').length;
    $('scope-message').textContent=!chosen.length?'필요한 기능을 하나 이상 선택하세요.':(server||external?'단순 소개형이 아닌 운영 시스템 설계가 필요한 구성입니다.':'정적 소개·시연 중심으로 시작할 수 있는 구성입니다.')+' 선택한 기능의 화면 데모와 운영판 개발 범위를 상담에서 분리해 확정합니다.';
    const warningBox=$('warnings');warningBox.replaceChildren();warningsFor(chosen).forEach(msg=>warningBox.append(create('div','warning',msg)));
    updateEmail();
  }
  const checkNames={content:'제품·서비스 내용과 이미지 저작권',domain:'도메인·호스팅 계정 소유자',data:'운영 데이터·백업·복구 정책',privacy:'개인정보 수집·보관·삭제 정책',maint:'유지보수·수정 범위·검수 조건',cost:'외부 결제·문자·API·호스팅 비용'};
  function brief(){
    const selected=MODULES.filter(m=>selection.has(m.id));
    const lines=['[올파일원 웹스튜디오] 홈페이지 기능 제작 요청서','작성일: '+today(),'','브랜드·프로젝트: '+(form.name.value.trim()||'미정'),'업종: '+form.industry.options[form.industry.selectedIndex].text,'목적: '+form.goal.options[form.goal.selectedIndex].text,'', '선택한 기능: '+selected.length+'개','※ 아래 기능들은 요구사항 초안입니다. 서버·결제·예약의 실제 운영 구현은 별도 개발·검수해야 합니다.',''];
    ['demo','server','external'].forEach(stage=>{
      lines.push('['+LABEL[stage]+']');
      const records=selected.filter(x=>x.stage===stage);lines.push(...(records.length?records.map((m,i)=>(i+1)+'. '+m.name+' — '+m.desc):['선택 없음']),'');
    });
    lines.push('[구축 전 확인사항]');Object.entries(checkNames).forEach(([key,label])=>lines.push((checks.has(key)?'[확인] ':'[미확인] ')+label));
    lines.push('','[범위·위험 검토]');warningsFor(selected).forEach((s,i)=>lines.push((i+1)+'. '+s));
    lines.push('','[계약 전 확정 필요]','운영 비용·호스팅 사용량·유료 외부 연동 여부·검수 기준·인계 파일·운영·보안 책임','', '※ 이메일 버튼은 초안을 작성할 뿐 전송하지 않습니다.','※ 본 페이지는 서버로 입력 내용을 보내지 않습니다.','제작 문의: nineeyes@naver.com');
    return lines.join('\n');
  }
  function updateEmail(){
    const selected=MODULES.filter(m=>selection.has(m.id));
    const body=['홈페이지 기능 제작 문의','브랜드: '+(form.name.value.trim()||'미정'),'선택 기능: '+(selected.map(m=>m.name).join(', ')||'미정'),'','이메일에서 전송하기 전에 업체 정보를 추가해 주세요.','전체 요구사항은 TXT 파일을 첨부하면 좋습니다.'].join('\n');
    const href='mailto:nineeyes@naver.com?subject='+encodeURIComponent('[올파일원 웹스튜디오] 홈페이지 제작 문의')+'&body='+encodeURIComponent(body.slice(0,1600));
    $('email-plan').href=href;
  }
  function exportFile(name,contents,type){
    const url=URL.createObjectURL(new Blob(['\uFEFF',contents],{type}));const link=create('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('feature-search').addEventListener('input',renderModules);
  $('stage-filter').addEventListener('change',renderModules);
  allTabs.forEach(btn=>btn.addEventListener('click',()=>{activeCategory=btn.dataset.cat;allTabs.forEach(t=>t.setAttribute('aria-pressed',String(t===btn)));renderModules();}));
  $('clear-filters').addEventListener('click',()=>{activeCategory='all';allTabs.forEach(t=>t.setAttribute('aria-pressed',String(t.dataset.cat==='all')));$('feature-search').value='';$('stage-filter').value='all';renderModules();});
  $('apply-preset').addEventListener('click',()=>{selection.clear();PRESETS[form.industry.value].forEach(id=>selection.add(id));renderModules();renderSelection();remember();feedback.textContent='해당 업종 추천 기능 '+selection.size+'개를 담았습니다. 필요 없는 항목은 제외할 수 있습니다.';});
  Object.values(form).forEach(el=>el.addEventListener(el===form.name?'input':'change',()=>{remember();updateEmail();}));
  document.querySelectorAll('[data-check]').forEach(el=>el.addEventListener('change',()=>{if(el.checked)checks.add(el.dataset.check);else checks.delete(el.dataset.check);remember();}));
  $('download-txt').addEventListener('click',()=>{exportFile('allfileone_website_feature_brief.txt',brief(),'text/plain;charset=utf-8');feedback.textContent='제작 요청서 TXT 파일을 생성했습니다. 서버로 전송하지 않았습니다.';});
  $('export-json').addEventListener('click',()=>{exportFile('allfileone_website_feature_settings.json',JSON.stringify(current(),null,2),'application/json;charset=utf-8');feedback.textContent='V8 편집 설정을 JSON 파일로 저장했습니다.';});
  $('copy-plan').addEventListener('click',async()=>{if(!navigator.clipboard?.writeText){feedback.textContent='복사를 지원하지 않는 브라우저입니다. TXT 파일 저장을 이용해 주세요.';return;}try{await navigator.clipboard.writeText(brief());feedback.textContent='제작 요청서를 복사했습니다. 실제 상담은 아직 접수되지 않았습니다.';}catch{feedback.textContent='브라우저의 복사 권한이 거부됐습니다. TXT 파일을 저장해 주세요.';}});
  $('import-json').addEventListener('change',async e=>{
    const f=e.target.files?.[0];if(!f)return;
    if(f.size>65536){feedback.textContent='64KB 이하의 V8 설정 JSON 파일만 불러올 수 있습니다.';e.target.value='';return;}
    try{restore(JSON.parse((await f.text()).replace(/^\uFEFF/,'')));feedback.textContent='이전 설정을 불러왔습니다.';}catch(err){feedback.textContent='설정 파일 오류: '+(err instanceof SyntaxError?'JSON 형식을 확인해 주세요.':err.message);}finally{e.target.value='';}
  });
  $('reset-plan').addEventListener('click',()=>{
    selection.clear();checks.clear();form.name.value='';form.industry.value='manufacturing';form.goal.value='lead';
    document.querySelectorAll('[data-check]').forEach(el=>el.checked=false);
    try{localStorage.removeItem(STORE);}catch{}renderSelection();renderModules();feedback.textContent='기능과 사업 정보·브라우저 저장 초안을 초기화했습니다.';
  });
  // Actual client-side examples, explicitly not production data, booking or order processing.
  function quoteSim(){const q=Number($('qty').value);if(!Number.isInteger(q)||q<1||q>10000){$('quote-value').textContent='1~10,000 입력';$('quote-rule').textContent='1 이상 10,000 이하의 정수를 입력해 주세요.';return;}
    const discount=q>=50?.15:q>=10?.08:0;const sum=Math.round(45000*q*(1-discount));$('quote-value').textContent=sum.toLocaleString('ko-KR')+'원';$('quote-rule').textContent='가상 단가 45,000원 × '+q+'개 · 구간 할인 '+Math.round(discount*100)+'% (실제 공급가 아님)';}
  $('qty').addEventListener('input',quoteSim);quoteSim();
  $('visit-date').min=today();let chosenTime='';
  function renderBooking(){const d=$('visit-date').value;if(!d||!chosenTime){$('reservation-result').textContent='날짜와 시간을 선택하세요. 실제 예약은 접수되지 않습니다.';return;}
    if(d<today()){$('reservation-result').textContent='오늘 이후 날짜를 선택해 주세요. 실제 예약은 접수되지 않습니다.';return;}
    $('reservation-result').textContent=d+' '+chosenTime+' 희망 일정 선택됨 · 실제 예약 접수·잔여 확인 아님';}
  document.querySelectorAll('[data-time]').forEach(btn=>btn.addEventListener('click',()=>{chosenTime=btn.dataset.time;document.querySelectorAll('[data-time]').forEach(el=>el.setAttribute('aria-pressed',String(el===btn)));renderBooking();}));
  $('visit-date').addEventListener('change',renderBooking);
  const notices=[...$('notices').querySelectorAll('li')];$('notice-search').addEventListener('input',()=>{const q=$('notice-search').value.normalize('NFKC').trim().toLocaleLowerCase('ko-KR');let n=0;notices.forEach(li=>{li.hidden=!!q&&!li.textContent.normalize('NFKC').toLocaleLowerCase('ko-KR').includes(q);if(!li.hidden)n++;});$('notice-count').textContent='예시 공지 '+n+'건 표시';});
  // Restore only allowlisted local settings; corrupt/stale drafts are ignored safely.
  try {const saved=localStorage.getItem(STORE);if(saved)restore(JSON.parse(saved));}catch{feedback.textContent='이전에 저장된 초안은 현재 버전과 호환되지 않아 불러오지 않았습니다.';}
  const q=new URLSearchParams(location.search).get('industry');
  let hasSaved=false;try{hasSaved=!!localStorage.getItem(STORE);}catch{}
  if(q&&INDUSTRY.includes(q)&&!hasSaved){form.industry.value=q;}
  renderModules();renderSelection();
})();
