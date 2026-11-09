'use strict';
(()=>{
 const toggle=document.querySelector('.mobile-menu'); const nav=document.querySelector('#demo-nav');
 toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);toggle.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
 nav?.addEventListener('click',(event)=>{if(!event.target.closest('a'))return;nav.classList.remove('open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','메뉴 열기');});
 document.querySelector('#demo-inquiry')?.addEventListener('click',()=>{document.querySelector('#demo-feedback').textContent='이 페이지는 가상 브랜드의 디자인 샘플입니다. 실제 문의나 예약이 접수되지는 않습니다. 상단의 “이 디자인으로 견적” 버튼을 이용해 주세요.';});
})();

/* Interactive demo module, all 36 HTML pages inherit without regeneration. */

'use strict';
(()=>{
 const data={"manufacturing":{"title":"제품 카탈로그 · 견적 바구니","eyebrow":"B2B PRODUCT FINDER","desc":"가상 제품을 필터링하고 원하는 품목을 견적 목록에 담아보세요.","items":[["M-101 정밀 샤프트","기계 부품","스테인리스 · Ø12~40mm"],["A-220 공정 센서","자동화","디지털 출력 · IP67"],["P-380 패킹 소재","자재 공급","소량·대량 주문 대응"],["C-450 제어 모듈","자동화","Modbus · Ethernet"],["S-520 금속 브라켓","기계 부품","알루미늄 가공"]],"unit":"선택 품목","action":"견적 품목 목록 정리"},"corporate":{"title":"전문분야별 프로젝트 살펴보기","eyebrow":"BUSINESS CAPABILITIES","desc":"사업 분야를 선택하면 소개 항목을 좁혀볼 수 있습니다.","items":[["시장 진입 전략","컨설팅","조사 → 실행 전략 → 운영"],["업무 프로세스 개선","운영","업무 진단과 개선 과제"],["디지털 전환 가이드","컨설팅","시스템·데이터 검토"],["지속가능 경영","성장","실행 계획 및 지표 관리"]],"unit":"관심 서비스","action":"관심 서비스 정리"},"clinic":{"title":"진료 안내 · 일정 미리보기","eyebrow":"CARE JOURNEY PREVIEW","desc":"진료과를 선택해 예시 진료 일정을 확인하세요. 예약은 이루어지지 않습니다.","items":[["내과 일반진료","진료과","월·수·금 09:00~17:00"],["건강 상담","상담","화·목 10:00~16:00"],["검진 안내","진료과","월~금 09:00~12:00"],["예약·내원 절차","상담","초진 및 서류 안내"]],"unit":"관심 안내","action":"방문 준비 항목 정리"},"academy":{"title":"강좌 탐색 · 관심 수업 담기","eyebrow":"COURSE EXPLORER","desc":"수업 유형과 시간을 비교하고 관심 수업을 선택해 보세요. 수강 신청은 접수되지 않습니다.","items":[["초등 창의 수학","초등","월·수 16:00"],["중등 사고력 수학","중등","화·목 18:00"],["초등 영어 읽기","초등","토 10:00"],["중등 영어 토론","중등","금 19:00"]],"unit":"관심 수업","action":"상담용 수업 목록 정리"},"interior":{"title":"시공 사례 · 공간 유형별 보기","eyebrow":"PROJECT FILTER","desc":"가상 시공 프로젝트를 공간 유형에 따라 살펴보고 관심 사례를 모아보세요.","items":[["오피스 리뉴얼","상업 공간","실용적 수납과 밝은 동선"],["카페 브랜드 공간","상업 공간","따뜻한 소재와 조명"],["아파트 34평","주거 공간","생활 동선 중심 리모델링"],["소형 주거 18평","주거 공간","공간 활용 최적화"]],"unit":"관심 사례","action":"관심 시공 사례 정리"},"professional":{"title":"상담 분야 선택하기","eyebrow":"EXPERTISE SELECTOR","desc":"상담 분야별 필요한 사전 자료를 비교해 보세요. 전문적 조언을 제공하지 않는 예시입니다.","items":[["세무 신고 상담","세무","사업 형태와 기존 신고 내역"],["법인 설립 절차","기업","사업 목적과 조직 구조"],["계약 검토 절차","법률","계약서와 핵심 쟁점"],["회계 장부 관리","세무","자료 제출 주기 및 방법"]],"unit":"관심 분야","action":"사전 상담 준비서 정리"},"association":{"title":"공지 · 자료실 검색 데모","eyebrow":"NOTICE & RESOURCES","desc":"회원 공지와 자료 유형을 전환해 찾아볼 수 있습니다.","items":[["2026 정기총회 안내","공지","일정 및 참석 신청 방법"],["운영 규정 개정안","자료실","최신 규정 개정 요약"],["교육 세미나 일정","행사","오프라인 세미나 일정"],["활동 보고서 샘플","자료실","가상 연간 활동 요약"]],"unit":"저장한 자료","action":"관심 자료 목록 정리"},"franchise":{"title":"가맹 안내 · 준비 항목 체크","eyebrow":"FRANCHISE PLANNER","desc":"출점 형태별 준비사항을 비교하는 예시입니다. 예상 수익을 보장하지 않습니다.","items":[["소형 매장 상담","창업 형태","매장 콘셉트·상권 분석"],["표준 매장 안내","창업 형태","인력·시설·교육 범위"],["브랜드 교육 과정","교육","오픈 전 운영 교육"],["개설 절차 확인","교육","계약·인허가 확인"]],"unit":"확인할 항목","action":"가맹 상담 체크리스트"},"commerce":{"title":"상품 탐색 · 장바구니 체험","eyebrow":"SHOPPING JOURNEY","desc":"가상 상품을 장바구니에 담고 선택 항목을 확인하세요. 실제 결제는 이루어지지 않습니다.","items":[["프리미엄 에코 백","라이프스타일","예시 가격 24,000원"],["세라믹 텀블러","리빙","예시 가격 38,000원"],["데스크 오거나이저","리빙","예시 가격 29,000원"],["데일리 파우치","라이프스타일","예시 가격 19,000원"]],"unit":"장바구니 품목","action":"가상 장바구니 확인"},"stay":{"title":"객실 비교 · 관심 객실 선택","eyebrow":"ROOM DISCOVERY","desc":"객실별 구성과 기준 인원을 비교합니다. 실시간 예약이나 객실 재고와는 연결되지 않습니다.","items":[["스탠다드 룸","2인","퀸 베드 · 와이파이"],["가든 스위트","4인","테라스 · 거실"],["패밀리 룸","4인","침실 2개 · 주방"],["프라이빗 빌라","6인","독립 정원 · 거실"]],"unit":"관심 객실","action":"객실 비교표 정리"},"realestate":{"title":"매물 목록 · 조건별 검색","eyebrow":"PROPERTY EXPLORER","desc":"지역·유형별 가상 매물을 검색합니다. 실제 거래 가능 매물이 아닙니다.","items":[["송도 오피스 소형","업무 공간","전용 45㎡ · 예시"],["청라 상가 1층","상업 시설","전용 72㎡ · 예시"],["부평 오피스 중형","업무 공간","전용 112㎡ · 예시"],["구월동 근린 상가","상업 시설","전용 88㎡ · 예시"]],"unit":"관심 매물","action":"관심 매물 목록 정리"},"event":{"title":"프로그램 탐색 · 관심 일정","eyebrow":"EVENT PROGRAM","desc":"행사 프로그램을 일정·유형별로 비교합니다. 실제 참가 신청은 이루어지지 않습니다.","items":[["개막 키노트","컨퍼런스","09:30~10:30"],["디자인 워크숍","워크숍","11:00~12:30"],["파트너 네트워킹","네트워킹","14:00~15:30"],["브랜드 전략 세션","컨퍼런스","16:00~17:00"]],"unit":"관심 프로그램","action":"참가 희망 일정 정리"}};
 const parts=location.pathname.split('/').filter(Boolean);
 const slug=parts.indexOf('demo')>=0?parts[parts.indexOf('demo')+1]:document.body.dataset.industry;
 const config=data[slug]; if(!config)return;
 const services=document.querySelector('#services');if(!services)return;
 const section=document.createElement('section');section.className='experience';section.id='experience';
 section.setAttribute('aria-labelledby','experience-title');
 const chosen=new Set();let filter='전체';let query='';
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const groups=['전체',...new Set(config.items.map(i=>i[1]))];
 section.innerHTML=`<div class="exp-wrap"><div class="exp-head"><div><span class="exp-eyebrow">${esc(config.eyebrow)} · LIVE INTERACTION</span><h2 id="experience-title">${esc(config.title)}</h2><p>${esc(config.desc)}</p></div><div class="exp-live"><span class="exp-pulse"></span> 버튼·검색·선택 실제 동작</div></div><div class="exp-panel"><div class="exp-toolbar"><div class="exp-tags" aria-label="카테고리 필터" role="group"></div><label class="exp-search"><span class="sr-only">샘플 내용 검색</span><input id="exp-search" type="search" placeholder="검색어 입력..." autocomplete="off"></label></div><div class="exp-grid" id="exp-cards"></div><div class="exp-empty" id="exp-empty" hidden>일치하는 항목이 없습니다.</div><div class="exp-summary"><div><span>선택한 ${esc(config.unit)}</span><strong id="exp-count">0개</strong><p id="exp-list">항목을 선택하면 여기에 정리됩니다.</p></div><div class="exp-actions"><button type="button" id="exp-copy" class="exp-action">${esc(config.action)} ↗</button><button type="button" id="exp-reset" class="exp-reset">선택 초기화</button></div></div><div id="exp-feedback" class="exp-feedback" role="status" aria-live="polite"></div></div><p class="exp-disclaimer">* 실제 화면에서 동작하는 프런트엔드 시연입니다. 브랜드·상품·일정·매물은 모두 가상이며 결제, 예약, 상담이 접수되거나 개인정보가 저장되지 않습니다.</p></div>`;
 services.insertAdjacentElement('afterend',section);
 const nav=document.querySelector('#demo-nav');if(nav){const a=document.createElement('a');a.href='#experience';a.textContent='기능 체험';nav.insertBefore(a,nav.querySelector('a[href="#contact"]'));}
 const tags=section.querySelector('.exp-tags'); const cards=section.querySelector('#exp-cards');
 const list=section.querySelector('#exp-list');const count=section.querySelector('#exp-count');
 const feedback=section.querySelector('#exp-feedback');
 function sync(){const selected=config.items.filter(it=>chosen.has(it[0]));count.textContent=selected.length+'개';list.textContent=selected.length?selected.map(it=>it[0]).join(' · '):'항목을 선택하면 여기에 정리됩니다.';}
 function render(){tags.replaceChildren();groups.forEach(g=>{const b=document.createElement('button');b.type='button';b.textContent=g;b.className=g===filter?'exp-tag active':'exp-tag';b.setAttribute('aria-pressed',String(g===filter));b.addEventListener('click',()=>{filter=g;render()});tags.append(b);});cards.replaceChildren();let shown=0;config.items.forEach((it,i)=>{if(filter!=='전체'&&it[1]!==filter)return;if(query&&!it.join(' ').toLocaleLowerCase('ko').includes(query))return;shown++;const card=document.createElement('article');card.className='exp-card';card.innerHTML=`<div class="exp-cardtop"><span>0${i+1} / ${esc(it[1])}</span><span aria-hidden="true">✦</span></div><h3>${esc(it[0])}</h3><p>${esc(it[2])}</p>`;const btn=document.createElement('button');btn.type='button';btn.className='exp-select';const update=()=>{let active=chosen.has(it[0]);btn.textContent=active?'✓ 선택됨 · 해제':'＋ 관심 항목 담기';btn.classList.toggle('selected',active);btn.setAttribute('aria-pressed',String(active));};update();btn.addEventListener('click',()=>{chosen.has(it[0])?chosen.delete(it[0]):chosen.add(it[0]);update();sync();feedback.textContent='선택 내용이 이 브라우저에서 반영됐습니다.';});card.append(btn);cards.append(card);});section.querySelector('#exp-empty').hidden=shown>0;sync();}
 section.querySelector('#exp-search').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('ko');render()});
 section.querySelector('#exp-reset').addEventListener('click',()=>{chosen.clear();filter='전체';query='';section.querySelector('#exp-search').value='';feedback.textContent='선택을 초기화했습니다.';render()});
 section.querySelector('#exp-copy').addEventListener('click',async()=>{if(!chosen.size){feedback.textContent='먼저 관심 항목을 하나 이상 선택해 주세요.';return;}const txt=['[올파일원 웹스튜디오 · '+config.title+']',...config.items.filter(it=>chosen.has(it[0])).map(it=>'• '+it[0]+' — '+it[2]),'※ 가상 브랜드 기능 시연용으로 실제 주문·예약·문의가 아닙니다.'].join('\n');try{if(!navigator.clipboard||!window.isSecureContext)throw Error('clipboard');await navigator.clipboard.writeText(txt);feedback.textContent='선택 목록을 복사했습니다. 실제 제출되지는 않았습니다.';}catch{const a=document.createElement('a');const blob=new Blob(['\ufeff'+txt],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);a.href=url;a.download='allfileone_demo_selection.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);feedback.textContent='선택 목록을 TXT 파일로 저장했습니다.';}});
 render();
})();

/* WebStudio V23 — additive loader. Existing demo filters and cards remain unchanged. */
(() => {
  const me = document.currentScript || document.querySelector('script[src$="/assets/demo.js"]');
  if (!me?.src || document.querySelector('[data-v23-stylesheet]')) return;
  const base = new URL('.', me.src);
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('v23-industry.css', base).href;
  css.dataset.v23Stylesheet = 'true';
  document.head.append(css);
  const script = document.createElement('script');
  script.src = new URL('v23-industry.js', base).href;
  script.async = true;
  script.dataset.v23Module = 'true';
  // V27 deliberately loads AFTER V23 has generated its workflow, avoiding
  // asynchronous ordering races when the demo is opened from the 36-card gallery.
  script.addEventListener('load', () => {
    const css27 = document.createElement('link');
    css27.rel = 'stylesheet';
    css27.href = new URL('v27-conversion.css', base).href;
    css27.dataset.v27Stylesheet = 'true';
    document.head.append(css27);
    const bridge27 = document.createElement('script');
    bridge27.src = new URL('v27-demo-bridge.js', base).href;
    bridge27.async = true;
    bridge27.dataset.v27Module = 'true';
    // V28 loads only after V27 is ready: existing demo interactions and
    // the consultation bridge are preserved even if the new assets fail.
    bridge27.addEventListener('load', () => {
      if (document.querySelector('[data-v28-stylesheet]')) return;
      const css28 = document.createElement('link');
      css28.rel = 'stylesheet';
      css28.href = new URL('v28-tools.css', base).href;
      css28.dataset.v28Stylesheet = 'true';
      document.head.append(css28);
      const catalog28 = document.createElement('script');
      catalog28.src = new URL('v28-catalog.js', base).href;
      catalog28.async = true;
      catalog28.dataset.v28Catalog = 'true';
      catalog28.addEventListener('load', () => {
        const ui28 = document.createElement('script');
        ui28.src = new URL('v28-tools.js', base).href;
        ui28.async = true;
        ui28.dataset.v28Module = 'true';
        // V77 expands industry functions only AFTER V28 demo tools finish loading.
      ui28.addEventListener('load',()=>{
        if(document.querySelector('script[data-v77-script]'))return;
        const css77=document.createElement('link');css77.rel='stylesheet';
        css77.href=new URL('v77-feature-showcase.css',base).href;document.head.append(css77);
        const cat77=document.createElement('script');cat77.src=new URL('v77-feature-data.js',base).href;cat77.async=true;
        cat77.addEventListener('load',()=>{
          const css78=document.createElement('link');css78.rel='stylesheet';css78.href=new URL('v78-simulator.css',base).href;document.head.append(css78);
          const data78=document.createElement('script');data78.src=new URL('v78-simulator-data.js',base).href;data78.async=true;data78.dataset.v78Data='true';
          data78.addEventListener('load',()=>{
            const engine78=document.createElement('script');engine78.src=new URL('v78-simulator.js',base).href;engine78.async=true;engine78.dataset.v78Engine='true';
            engine78.addEventListener('load',()=>{
              const css79=document.createElement('link');css79.rel='stylesheet';css79.href=new URL('v79-simulator.css',base).href;document.head.append(css79);
              const data79=document.createElement('script');data79.src=new URL('v79-simulator-data.js',base).href;data79.async=true;
              data79.addEventListener('load',()=>{
                const sim79=document.createElement('script');sim79.src=new URL('v79-simulator.js',base).href;sim79.async=true;
                sim79.addEventListener('load',()=>{
                  const css80=document.createElement('link');css80.rel='stylesheet';css80.href=new URL('v80-simulator.css',base).href;document.head.append(css80);
                  const data80=document.createElement('script');data80.src=new URL('v80-simulator-data.js',base).href;data80.async=true;
                  data80.addEventListener('load',()=>{
                    const sim80=document.createElement('script');sim80.src=new URL('v80-simulator.js',base).href;sim80.async=true;
                    sim80.addEventListener('load',()=>{
                      const js77=document.createElement('script');js77.src=new URL('v77-feature-showcase.js',base).href;
                      js77.async=true;js77.dataset.v77Script='true';document.head.append(js77);
                    },{once:true});document.head.append(sim80);
                  },{once:true});document.head.append(data80);
                },{once:true});document.head.append(sim79);
              },{once:true});document.head.append(data79);
            },{once:true});document.head.append(engine78);
          },{once:true});document.head.append(data78);
        },{once:true});document.head.append(cat77);
      },{once:true});
      document.head.append(ui28);
      }, {once:true});
      document.head.append(catalog28);
    }, {once:true});
    document.head.append(bridge27);
  }, {once:true});
  document.head.append(script);
})();

/* V37 Original code: all 36 fictional demos; no APIs, storage, or tracking. */
'use strict';
(() => {
 const names = Object.freeze({manufacturing:'제조·도매',corporate:'기업·회사소개',clinic:'병원·의원',academy:'학원·교육',interior:'인테리어·시공',commerce:'쇼핑몰·브랜드',professional:'전문 서비스',association:'협회·단체',franchise:'프랜차이즈',stay:'숙박·펜션',realestate:'부동산·분양',event:'행사·캠페인'});
 const styles = Object.freeze({modern:'모던',premium:'프리미엄',editorial:'에디토리얼'});
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function init(){
  const b=document.body, industry=b?.dataset.v13Industry||b?.dataset.industry||'', style=b?.dataset.v13Style||'', main=document.querySelector('main');
  if(!main||!own(names,industry)||!own(styles,style)||document.getElementById('v37-chooser'))return;
  const outer=document.createElement('section');outer.id='v37-chooser';outer.className='v37-chooser';outer.setAttribute('aria-label','업종별 디자인 스타일 비교');
  const inner=document.createElement('div');inner.className='v37-chooser-inner';
  const intro=document.createElement('div');intro.className='v37-chooser-intro';
  const kicker=document.createElement('span');kicker.className='v37-kicker';kicker.textContent='DESIGN EDITIONS / 03';
  const heading=document.createElement('strong');heading.textContent=names[industry]+' · 디자인 비교';
  const note=document.createElement('small');note.textContent='같은 업종을 세 가지 디자인으로 비교하세요.';
  intro.append(kicker,heading,note);
  const nav=document.createElement('nav');nav.className='v37-style-links';nav.setAttribute('aria-label','디자인 스타일 선택');
  Object.keys(styles).forEach(key=>{const a=document.createElement('a');a.href='../'+key+'/index.html';a.textContent=styles[key];a.dataset.v37Style=key;if(key===style)a.setAttribute('aria-current','page');nav.append(a)});
  const consult=document.createElement('a');consult.className='v37-consult';consult.textContent='이 디자인으로 상담하기 ↗';
  consult.href='../../../contact.html?'+new URLSearchParams({source:'demo',industry,theme:style}).toString();
  const clarity=document.createElement('p');clarity.className='v37-clarity';clarity.textContent='가상 브랜드 시연입니다. 실제 예약·결제·납품 실적을 나타내지 않습니다.';
  inner.append(intro,nav,consult);outer.append(inner,clarity);main.parentNode.insertBefore(outer,main);b.dataset.v37ChooserReady='true';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* WebStudio V65.2: a single industry-specific requirement workflow shared by all 36 demos.
   Keep every existing V23/V27/V28/V37 interactive feature intact. */
(() => {
 const current=document.currentScript||document.querySelector('script[src$="/assets/demo.js"]');
 if(!current?.src||document.querySelector('script[data-v652-script]'))return;
 const base=new URL('.',current.src);
 const style=document.createElement('link');
 style.rel='stylesheet';style.href=new URL('v652-sector-requirements.css',base).href;
 style.dataset.v652Stylesheet='true';document.head.append(style);
 const script=document.createElement('script');
 script.src=new URL('v652-sector-requirements.js',base).href;
 script.async=true;script.dataset.v652Script='true';document.head.append(script);
})();


/* WebStudio V66: deliberate alternative design systems and immediate sector-specific
   core-feature entry. Keep all existing V28/V65.2 workflows and consultation. */
(() => {
 const me=document.currentScript||document.querySelector('script[src$="/assets/demo.js"]');
 if(!me?.src||document.querySelector('[data-v66-script]'))return;
 const base=new URL('.',me.src);
 const css=document.createElement('link');css.rel='stylesheet';
 css.href=new URL('v66-distinct-designs.css',base).href;
 css.dataset.v66Stylesheet='true';document.head.append(css);
 const js=document.createElement('script');
 js.src=new URL('v66-sector-artdirection.js',base).href;
 js.async=true;js.dataset.v66Script='true';document.head.append(js);
})();


/* WebStudio V69: 3 art-directed layout grammars in actual dynamically rendered V23 heroes.
   Additive: V23/V28/V66 remain unchanged. No user data / paid API / remote model. */
(() => {
 const me=document.currentScript||document.querySelector('script[src$="/assets/demo.js"]');
 if(!me?.src||document.querySelector('script[data-v69-script]'))return;
 const base=new URL('.',me.src);
 const css=document.createElement('link');css.rel='stylesheet';
 css.href=new URL('v69-artdirection.css',base).href;
 css.dataset.v69Stylesheet='true';document.head.append(css);
 const js=document.createElement('script');js.src=new URL('v69-artdirection.js',base).href;
 js.async=true;js.dataset.v69Script='true';document.head.append(js);
})();

/* V81 scope continuation for all 36 demo layouts: no auto submission. */
(()=>{'use strict';if(document.getElementById('v81-demo-scope-link'))return;
const parts=location.pathname.split('/').filter(Boolean),pos=parts.indexOf('demo');
const sector=pos>=0?parts[pos+1]:document.body.dataset.industry,style=pos>=0?parts[pos+2]:'modern';
const allowed=['manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event'];
if(!allowed.includes(sector)||!['modern','premium','editorial'].includes(style))return;
const link=document.createElement('a');link.id='v81-demo-scope-link';link.textContent='이 업종의 실제 운영 기능 8개 선택 ↗';const url=new URL('../../../feature-scope-v81.html',document.baseURI);url.searchParams.set('industry',sector);url.searchParams.set('style',style);link.href=url.href;
link.style.cssText='display:inline-flex;align-items:center;justify-content:center;min-height:44px;background:#205747;color:#fff;text-decoration:none;padding:12px 18px;border-radius:3px;font:800 13px system-ui,sans-serif;margin:12px';
const target=document.getElementById('v77-showcase')||document.getElementById('v28-tools')||document.querySelector('main');
if(target){const wrap=document.createElement('div');wrap.style.cssText='text-align:center;padding:8px 16px 20px';wrap.append(link);target.insertAdjacentElement('afterend',wrap)}
})();