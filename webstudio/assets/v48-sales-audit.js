/* AllFileOne WebStudio V48 — read-only live sales-funnel validation.
 * Fetches only public same-origin static files. No visitor data, API, tracking, payment or email submission.
 * An HTTP/file check is NOT a real email receipt or search-index verification.
 */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const target = get('v48-sales-audit');
  if (!target || target.dataset.initialized === 'yes') return;
  target.dataset.initialized = 'yes';
  const root = new URL('./', document.baseURI);
  const base = path => new URL(path, root);
  const sectorPaths = ['manufacturing', 'academy', 'interior'];
  const RULES = [
    {id:'release',path:'assets/current-release.json',label:'최신 릴리스 식별',test:text=>{const x=JSON.parse(text);return x.product==='AllFileOne WebStudio'&&x.version==='V63'&&x.release_id==='WEBSTUDIO-V63-20261108'&&x.v63_browser_public_target===true&&x.v62_webmail_copy_actions===3&&x.inquiry_flagship_sectors===6&&x.scope_planner_industries===6&&x.launch_kit_industries===6&&x.sales_industry_pages===6&&x.quick_inquiry_industries===6;}},
    {id:'home',path:'index.html',label:'메인에서 6업종 이동',test:text=>[...sectorPaths,'restaurant','beauty','logistics'].every(id=>text.includes('for-'+id+'.html'))},
    {id:'manufacturing',path:'for-manufacturing.html',label:'제조·도매 판매페이지·상담 동선',test:t=>t.includes('v43-industry-lab.js')&&t.includes('launch-kit.html')&&t.includes('contact.html')&&t.includes('rel="canonical"')},
    {id:'academy',path:'for-academy.html',label:'학원·교육 판매페이지·상담 동선',test:t=>t.includes('v43-industry-lab.js')&&t.includes('launch-kit.html')&&t.includes('contact.html')&&t.includes('rel="canonical"')},
    {id:'interior',path:'for-interior.html',label:'인테리어 판매페이지·상담 동선',test:t=>t.includes('v43-industry-lab.js')&&t.includes('launch-kit.html')&&t.includes('contact.html')&&t.includes('rel="canonical"')},
    {id:'sector-faq',path:'for-manufacturing.html',label:'제조업 구매자 질문 콘텐츠',test:t=>(t.match(/class="v44-faq-item"/g)||[]).length>=4},
    {id:'kit',path:'launch-kit.html',label:'제작 시작키트·상담 연결',test:t=>t.includes('id="checklist"')&&t.includes('v45-launch-kit.js')&&t.includes('v46-handoff.js')},
    {id:'kit-js',path:'assets/v45-launch-kit.js',label:'고객 준비자료 TXT 생성',test:t=>t.includes('downloadTxt')&&t.includes('projectMemo')&&t.includes('selected()')},
    {id:'handoff',path:'assets/v46-handoff.js',label:'일회성 안전 인계',test:t=>t.includes('sessionStorage.removeItem(KEY)')&&t.includes('source=startkit')&&t.includes('MAX_AGE_MS')},
    {id:'contact',path:'contact.html',label:'상담서·메일 패키지 연결',test:t=>t.includes('id="brief-form"')&&t.includes('v26-contact.js')&&t.includes('v46-handoff.js')&&t.includes('v47-mail-packet.js')},
    {id:'packet',path:'assets/v47-mail-packet.js',label:'전체 문의 메일 수동 발송 준비',test:t=>t.includes('v46-full-report')&&t.includes('v47-download-all')&&t.includes('nineeyes@naver.com')&&!t.includes('fetch(')},
    {id:'webmail',path:'assets/v42-webmail-guide.js',label:'웹메일 수동 전송 안내',test:t=>t.includes('https://mail.naver.com/')&&t.includes('v42-copy-complete')},
    {id:'sitemap',path:'sitemap.xml',label:'사이트맵의 6업종·시작키트',test:t=>[...sectorPaths,'restaurant','beauty','logistics'].map(x=>'for-'+x+'.html').concat('launch-kit.html').every(x=>t.includes(x))},
    {id:'robots',path:'robots.txt',label:'검색 로봇·사이트맵 안내',test:t=>/Sitemap:\s*https:\/\/allfileone-webstudio\.pages\.dev\/sitemap\.xml/.test(t)&&t.includes('Disallow: /demo/')},
    {id:'plans',path:'plan-guide.html',label:'제작 상품·비용 고지',test:t=>t.includes('29')&&t.includes('59')&&t.includes('99')&&t.includes('확정 견적')},
    {id:'designs',path:'design-gallery-v13.html',label:'36개 디자인 선택 화면',test:t=>t.includes('gallery-v13')&&t.includes('demo')}
  ];
  // V56: validate new customer pathways rather than counting HTTP 200 as real conversion.
  const newSectors=['restaurant','beauty','logistics'];
  RULES.push(
    {id:'quick-six',path:'quick-inquiry.html',label:'6개 업종 실제 선택 가능',test:t=>[...sectorPaths,...newSectors].every(x=>t.includes('name="industry" value="'+x+'"'))&&t.includes('v55-sector-expansion.js')},
    {id:'quick-options',path:'assets/v55-sector-expansion.js',label:'음식점·뷰티·물류 개별 기능/규모',test:t=>newSectors.every(x=>t.includes(x+':{name:'))&&t.includes('AFO_V55_HANDOFF_SCOPES')},
    {id:'quick-js-six',path:'assets/v49-quick-inquiry.js',label:'맞춤 문의 코드 확장',test:t=>t.includes('...window.AFO_V55_QUICK_DATA')&&t.includes('v49-download')},
    {id:'detail-js-six',path:'assets/v51-quick-handoff.js',label:'15분 1회 상세 인계',test:t=>t.includes('...window.AFO_V55_HANDOFF_SECTORS')&&t.includes('sessionStorage.removeItem(KEY)')},
    {id:'detail-six',path:'contact.html',label:'상세 상담 업종 6개 선택',test:t=>newSectors.every(x=>t.includes('<option value="'+x+'">'))},
    {id:'hub-six',path:'industry-showcase-v54.html',label:'3개 새 기능 시연·제작 문의',test:t=>newSectors.every(x=>t.includes('quick-inquiry.html?industry='+x))},
    {id:'restaurant',path:'experiences/onsang-dining.html',label:'음식점 제작 문의 목적지',test:t=>t.includes('../quick-inquiry.html?industry=restaurant')&&t.includes('noindex')},
    {id:'beauty',path:'experiences/yeobaek-salon.html',label:'뷰티 제작 문의 목적지',test:t=>t.includes('../quick-inquiry.html?industry=beauty')&&t.includes('noindex')},
    {id:'logistics',path:'experiences/route18-logistics.html',label:'물류 제작 문의 목적지',test:t=>t.includes('../quick-inquiry.html?industry=logistics')&&t.includes('noindex')}
  );
  // V57: buyer-specific sales page links, canonical and truthful demo scope.
  ['restaurant','beauty','logistics'].forEach(id=>{
    RULES.push({id:'sales-'+id,path:'for-'+id+'.html',
      label:(id==='restaurant'?'음식점':id==='beauty'?'뷰티':'물류')+' 판매 페이지',
      test:t=>t.includes('quick-inquiry.html?industry='+id)&&t.includes('assets/v57-sales.css')&&t.includes('실제 고객 납품 실적이 아닌')&&t.includes('rel="canonical"')});
  });
  // V58: never pass if the new six-sector launch kit is missing.
  RULES.push(
    {id:'kit-six',path:'launch-kit.html',label:'6개 업종 준비키트',test:t=>['manufacturing','academy','interior','restaurant','beauty','logistics'].every(x=>t.includes('data-sector="'+x+'"'))&&t.indexOf('v58-launch-data.js')<t.indexOf('v45-launch-kit.js')},
    {id:'kit-data',path:'assets/v58-launch-data.js',label:'신규 3업종 준비자료',test:t=>['restaurant','beauty','logistics'].every(x=>t.includes(x+':{label:'))&&t.includes('AFO_V58_LAUNCH_DATA')},
    {id:'kit-core',path:'assets/v45-launch-kit.js',label:'6업종 동적 체크·TXT 저장',test:t=>t.includes('...window.AFO_V58_LAUNCH_DATA')&&t.includes('Object.keys(DATA)')&&t.includes('downloadTxt')},
    {id:'kit-handoff-six',path:'assets/v46-handoff.js',label:'상세 상담 인계 업종 확장',test:t=>['restaurant','beauty','logistics'].every(x=>t.includes(x+":'"))&&t.includes('sessionStorage.removeItem(KEY)')},
    ...['restaurant','beauty','logistics'].map(x=>({id:'kit-'+x,path:'for-'+x+'.html',label:x+' 제작자료 CTA',test:t=>t.includes('launch-kit.html?industry='+x)}))
  );
  // V60: validate real source links; never equate static file presence with mail receipt.
  RULES.push(
    {id:'scope-page',path:'delivery-scope.html',label:'6업종 납품 범위 협의표',test:t=>t.includes('id="v60-form"')&&t.includes('v60-delivery-scope.js')&&t.includes('v60-preview')&&t.includes('rel="canonical"')&&t.includes('협의용 초안')},
    {id:'scope-js',path:'assets/v60-delivery-scope.js',label:'포함·제외·TXT·상담 동작 코드',test:t=>['manufacturing','academy','interior','restaurant','beauty','logistics'].every(id=>t.includes(id+':{label:'))&&t.includes('v60-save')&&t.includes('v60-to-contact')&&!t.includes('fetch(')},
    {id:'scope-css',path:'assets/v60-delivery-scope.css',label:'범위표 반응형 스타일',test:t=>t.includes('.sectors')&&t.includes('max-width:620px')&&t.includes('.result pre')},
    {id:'scope-handoff',path:'assets/v60-scope-handoff.js',label:'15분 1회 상세 상담 인계',test:t=>t.includes('sessionStorage.removeItem(KEY)')&&t.includes('15*60*1000')&&t.includes('c.industry!==q.get')&&!t.includes('innerHTML')},
    {id:'scope-contact',path:'contact.html',label:'상담서 V60 인계 연결',test:t=>t.includes('v60-scope-handoff.js')&&t.includes('v60-import.css')&&t.includes('id="brief-form"')},
    {id:'scope-sitemap',path:'sitemap.xml',label:'범위 협의표 사이트맵',test:t=>t.includes('/delivery-scope.html')},
    ...['manufacturing','academy','interior','restaurant','beauty','logistics'].map(id=>({id:'scope-'+id,path:'for-'+id+'.html',label:id+' 범위 협의 전환',test:t=>t.includes('delivery-scope.html?industry='+id)}))
  );
  // V61 source-based sales continuity: fail closed if the new fallback pathway disappears.
  RULES.push(
    {id:'inquiry-six',path:'inquiry.html',label:'선택적 실제 문의 업종 6개',test:t=>['제조·도매','학원·교육','인테리어·시공','음식점·카페','뷰티·미용','물류·운송'].every(x=>t.includes('<option>'+x+'</option>'))},
    {id:'inquiry-fallback',path:'inquiry.html',label:'미설정 시 1분/상세 상담 우회로',test:t=>t.includes('id="manual-inquiry-alternatives"')&&t.includes('href="quick-inquiry.html"')&&t.includes('href="contact.html"')&&t.includes('inbox-disabled')},
    {id:'inquiry-js',path:'assets/inquiry.js',label:'무료·안전한 업종 프리셋',test:t=>t.includes('industryLabels')&&t.includes('Object.prototype.hasOwnProperty.call')&&t.includes('/api/inbox-status')&&!t.includes('localStorage')},
    {id:'audit-tool',path:'tools/v61_site_integrity.py',label:'링크·앵커·사이트맵 정적 점검',test:t=>t.includes('class SourceParser')&&t.includes('BROKEN_FRAGMENT')&&t.includes('MISSING_STATIC_FILE')&&t.includes('STALE_MANIFEST')},
    {id:'audit-run',path:'RUN_V61_SITE_AUDIT.cmd',label:'Windows Downloads 자동 점검기',test:t=>t.includes('git -c credential.interactive=never clone')&&t.includes('v61_site_integrity.py')&&t.includes('--expected-version V61')&&t.includes('Downloads')},
    {id:'audit-tests',path:'tools/test_v61_site_integrity.py',label:'정적 품질 회귀시험',test:t=>t.includes('unittest.TestCase')&&t.includes('test_stale_manifest')&&t.includes('test_missing_html_link')}
  );
  // V62: manual webmail delivery must remain explicit and provider-independent.
  RULES.push(
    {id:'mail-ui',path:'quick-inquiry.html',label:'제목/본문 복사 및 2개 웹메일 링크',test:t=>t.includes('id="v62-subject"')&&t.includes('id="v62-body"')&&t.includes('id="v62-gmail"')&&t.includes('id="v49-webmail"')&&t.indexOf('v62-webmail.js')>t.indexOf('v49-quick-inquiry.js')},
    {id:'mail-js',path:'assets/v62-webmail.js',label:'복사 차단·문안 변조 거부',test:t=>t.includes('navigator.clipboard?.writeText')&&t.includes('v62-manual-copy')&&t.includes("parsed[1] !== 'nineeyes@naver.com'")&&!t.includes('fetch(')&&!t.includes('sessionStorage')},
    {id:'mail-css',path:'assets/v62-webmail.css',label:'웹메일 모바일 안내',test:t=>t.includes('.v62-send-guide')&&t.includes('max-width:590px')},
    {id:'mail-noauto',path:'quick-inquiry.html',label:'실제 이메일 발송 오인 방지',test:t=>t.includes('웹메일 열기·문안 복사는 실제 발송이나 상담 접수가 아닙니다')}
  );
  // V63: live browser QA is a separate, owner-run Windows operation.
  RULES.push(
    {id:'edge-tool',path:'tools/v63_edge_live_qa.py',label:'Windows Edge 공개 브라우저 검증 코드',test:t=>t.includes("Network.responseReceived")&&t.includes("PASS_PUBLIC_BROWSER_SMOKE_ONLY")&&t.includes("HOLD_BROWSER_OR_NETWORK")&&t.includes("V63_LIVE_BROWSER_EVIDENCE_LATEST.zip")},
    {id:'edge-run',path:'RUN_V63_EDGE_LIVE_QA.cmd',label:'Windows Downloads 검사 결과 자동 저장',test:t=>t.includes('py -3.14')&&t.includes('V63_LIVE_BROWSER_RESULT_KO.txt')&&t.includes('notepad.exe')},
    {id:'edge-tests',path:'tools/test_v63_edge_protocol.py',label:'브라우저 제어·거부 검증',test:t=>t.includes('unittest.TestCase')&&t.includes('test_report_hold_on_failure')&&t.includes('test_chromium_screen_capture')},
    {id:'edge-version',path:'index.html',label:'최신 V63 홈페이지 버전 식별',test:t=>t.includes('WEBSTUDIO-V63-20261108')&&t.includes('홈페이지 HTML 버전 V63')}
  );
  const state={running:false,records:[],completed:'',version:''};
  const renderHead=(name,text)=>{const el=document.createElement(name);el.textContent=text;return el;};
  const title=renderHead('h3','V63 · 6업종 공개 브라우저 검증 준비·판매 동선 점검');
  const lead=renderHead('p','이 브라우저가 연결된 서버의 공개 파일을 확인합니다. 네이버·Google 색인, 실제 상담 메일 수신, 실거래·계약 완료 여부는 확인하지 못합니다.');
  const toolbar=document.createElement('div');toolbar.className='v48-toolbar';
  const start=document.createElement('button');start.type='button';start.id='v48-run';start.textContent='판매 동선 다시 검사';
  const save=document.createElement('button');save.type='button';save.id='v48-save';save.textContent='TXT 결과 저장';save.disabled=true;
  const copy=document.createElement('button');copy.type='button';copy.id='v48-copy';copy.textContent='검사 결과 복사';copy.disabled=true;
  toolbar.append(start,save,copy);
  const status=renderHead('p','배포 파일 검사 준비 중');status.id='v48-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const list=document.createElement('ol');list.id='v48-results';list.className='v48-results';
  const external=renderHead('p','검색 등록은 운영자 계정의 소유 확인이 필요합니다. 이 점검은 네이버·Google 사이트 등록을 대신하지 않습니다.');external.className='v48-disclosure';
  const providers=document.createElement('p');providers.className='v48-providers';
  [['네이버 서치어드바이저','https://searchadvisor.naver.com/'],['Google Search Console','https://search.google.com/search-console']].forEach(([caption,href])=>{const link=document.createElement('a');link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=caption+' ↗';providers.append(link)});
  target.append(title,lead,toolbar,status,list,external,providers);
  async function read(path){
    const url=base(path);
    if(!['http:','https:'].includes(root.protocol)||url.origin!==root.origin||!url.pathname.startsWith(root.pathname))throw Error('검사 경로가 동일 출처가 아닙니다');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(url.href,{cache:'no-store',credentials:'omit',redirect:'follow',signal:controller.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      if(new URL(response.url).origin!==root.origin)throw Error('외부 출처로 리다이렉트됨');
      const text=await response.text();if(text.length>1500000)throw Error('허용 크기 초과');return text;
    }finally{clearTimeout(timer)}
  }
  function result(rule,pass,detail){
    const item={id:rule.id,path:rule.path,label:rule.label,pass:!!pass,detail:String(detail).slice(0,120)};
    state.records.push(item);
    const li=document.createElement('li');li.className=pass?'v48-ok':'v48-hold';
    const mark=renderHead('strong',pass?'통과':'확인 필요');mark.className='v48-mark';
    const body=document.createElement('span');body.append(renderHead('b',rule.label),renderHead('small',rule.path+' · '+item.detail));
    const a=document.createElement('a');a.href=base(rule.path).href;a.textContent='열기';
    li.append(mark,body,a);list.append(li);
  }
  async function run(){
    if(state.running)return;state.running=true;start.disabled=true;save.disabled=true;copy.disabled=true;
    state.records=[];list.replaceChildren();state.version='';state.completed='';status.textContent='공개 판매 파일 '+RULES.length+'개 항목 검사 중입니다…';
    try{
      for(let i=0;i<RULES.length;i+=4){
        const batch=RULES.slice(i,i+4);
        await Promise.all(batch.map(async(rule)=>{
          try{
            const raw=await read(rule.path);const pass=!!rule.test(raw);
            if(rule.id==='release'&&pass)state.version=JSON.parse(raw).version;
            result(rule,pass,pass?'공개 파일 응답·기대 내용 확인':'파일 내용이 기대와 다름');
          }catch(e){result(rule,false,e.name==='AbortError'?'응답 시간 제한':e.message||'파일 접근 불가')}
        }));
      }
      const pass=state.records.filter(x=>x.pass).length;
      state.completed=new Date().toLocaleString('ko-KR');
      status.textContent=`${pass}/${RULES.length}개 통과 · 배포 식별 ${state.version||'미확인'} · ${state.completed}. 실제 이메일 수신·검색 색인은 미검증입니다.`;
      save.disabled=false;copy.disabled=false;
    }finally{start.disabled=false;state.running=false;}
  }
  function report(){return [
    '올파일원 웹스튜디오 / V63 공개 판매 동선 점검',
    '검사 출처: '+root.href,'서버 표시 버전: '+(state.version||'미확인'),
    '검사 시각: '+state.completed,
    '공개 파일: '+state.records.filter(x=>x.pass).length+'/'+RULES.length+' 통과',
    ...state.records.map(x=>(x.pass?'PASS':'HOLD')+' | '+x.label+' | '+x.path+' | '+x.detail),
    '', '주의: 검사는 공개 정적 파일·문구만 검사합니다. 실제 고객 문의 수신, 색인 등록, 실계약을 확인하지 않습니다.'
  ].join('\n')+'\n'}
  start.addEventListener('click',run);
  save.addEventListener('click',()=>{
    const blob=new Blob(['\ufeff',report()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='AllFileOne_WebStudio_V63_Sales_Audit.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  });
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(report());status.textContent+=' · 보고서를 복사했습니다.'}catch(_){status.textContent+=' · 클립보드가 차단되어 TXT 저장을 이용하세요.'}});
  run();
})();
