/* AllFileOne WebStudio V50 — local-only owner readiness, no credentials, cookies or tracking.
 * Same-origin static reads cannot verify mail delivery or search index. Manual checks stay in memory.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const run = $('auto-run'), list = $('auto-results');
  if(!run || !list || !document.getElementById('manual-list')) return;
  const origin = new URL('./', document.baseURI);
  const industries = ['manufacturing','academy','interior'];
  const RULES = [
    ['release','릴리스 식별','assets/current-release.json',t=>{const j=JSON.parse(t);return j.product==='AllFileOne WebStudio'&&j.version==='V62'&&j.release_id==='WEBSTUDIO-V62-20261108'&&j.v62_webmail_copy_actions===3&&j.inquiry_flagship_sectors===6&&j.scope_planner_industries===6&&j.launch_kit_industries===6&&j.sales_industry_pages===6&&j.quick_inquiry_industries===6&&j.quick_to_detailed_industries===6;}],
    ['home','메인 6업종 이동','index.html',t=>[...industries,'restaurant','beauty','logistics'].every(x=>t.includes('for-'+x+'.html'))],
    ...industries.map(x=>[x,x==='manufacturing'?'제조·도매 판매':x==='academy'?'학원·교육 판매':'인테리어·시공 판매','for-'+x+'.html',t=>t.includes('launch-kit.html')&&t.includes('quick-inquiry.html')&&t.includes('rel="canonical"')]),
    ['quick','1분 문의 화면','quick-inquiry.html',t=>t.includes('id="v49-form"')&&t.includes('v49-quick-inquiry.js')&&t.includes('v49-mailto')],
    ['quickjs','문의 문안 작성 코드','assets/v49-quick-inquiry.js',t=>t.includes('v49-download')&&t.includes('mailto:')&&!t.includes('fetch(')],
    ['contact','상세 상담서','contact.html',t=>t.includes('id="brief-form"')&&t.includes('v47-mail-packet.js')],
    ['kit','제작 준비키트','launch-kit.html',t=>t.includes('v46-handoff.js')&&t.includes('id="checklist"')],
    ['sitemap','6업종 판매 페이지 사이트맵','sitemap.xml',t=>[...industries,'restaurant','beauty','logistics'].map(x=>'for-'+x+'.html').concat('quick-inquiry.html').every(x=>t.includes(x))],
    ['robots','검색 로봇 안내','robots.txt',t=>/Sitemap:\s*https:\/\//.test(t)&&t.includes('/sitemap.xml')]
  ];
  // V56: actual six-sector sales routes; avoid false-positive checks of older releases.
  const additional = ['restaurant','beauty','logistics'];
  RULES.push(
    ['quick-six','6개 업종 빠른 문의','quick-inquiry.html',t=>[...industries,...additional].every(x=>t.includes('name="industry" value="'+x+'"'))&&t.indexOf('v55-sector-expansion.js')>=0&&t.indexOf('v55-sector-expansion.js')<t.indexOf('v49-quick-inquiry.js')],
    ['quick-data','추가 3업종 고유 기능','assets/v55-sector-expansion.js',t=>additional.every(x=>t.includes(x+':{name:'))&&t.includes('AFO_V55_QUICK_DATA')&&t.includes('AFO_V55_HANDOFF_SCOPES')],
    ['quick-code','6업종 문의 코드 연결','assets/v49-quick-inquiry.js',t=>t.includes('...window.AFO_V55_QUICK_DATA')&&t.includes('v49-mailto')&&!t.includes('fetch(')],
    ['handoff-code','6업종 상세 상담 인계 코드','assets/v51-quick-handoff.js',t=>t.includes('...window.AFO_V55_HANDOFF_SECTORS')&&t.includes('...window.AFO_V55_HANDOFF_SCOPES')&&t.includes('sessionStorage.removeItem(KEY)')],
    ['detail-six','상세 상담서 6업종','contact.html',t=>additional.every(x=>t.includes('<option value="'+x+'">'))&&t.includes('v51-quick-handoff.js')],
    ['hub-six','독립 시연 → 맞춤 문의','industry-showcase-v54.html',t=>additional.every(x=>t.includes('quick-inquiry.html?industry='+x))],
    ['restaurant','음식점 시연 → 문의','experiences/onsang-dining.html',t=>t.includes('../quick-inquiry.html?industry=restaurant')&&t.includes('noindex')],
    ['beauty','뷰티 시연 → 문의','experiences/yeobaek-salon.html',t=>t.includes('../quick-inquiry.html?industry=beauty')&&t.includes('noindex')],
    ['logistics','물류 시연 → 문의','experiences/route18-logistics.html',t=>t.includes('../quick-inquiry.html?industry=logistics')&&t.includes('noindex')],
    ['hub-sitemap','새 업종 시연 체험관 사이트맵','sitemap.xml',t=>t.includes('industry-showcase-v54.html')]
  );
  // V57: sales-page production routes added without claiming real client projects.
  ['restaurant','beauty','logistics'].forEach(id=>{
    RULES.push(['sales-'+id,
      id==='restaurant'?'음식점 판매 상품':id==='beauty'?'뷰티 판매 상품':'물류 판매 상품',
      'for-'+id+'.html',
      t=>t.includes('quick-inquiry.html?industry='+id)&&t.includes('assets/v57-sales.css')&&t.includes('실제 고객 납품 실적이 아닌')&&t.includes('rel="canonical"')]);
  });
  // V58: six unique industry checklists and one-time consultation path.
  RULES.push(
    ['kit-six','준비키트 6업종 선택','launch-kit.html',t=>['manufacturing','academy','interior','restaurant','beauty','logistics'].every(x=>t.includes('data-sector="'+x+'"'))&&t.indexOf('v58-launch-data.js')<t.indexOf('v45-launch-kit.js')],
    ['kit-data','신규 3업종 실제 준비자료','assets/v58-launch-data.js',t=>['restaurant','beauty','logistics'].every(x=>t.includes(x+':{label:'))&&t.includes('AFO_V58_LAUNCH_DATA')],
    ['kit-core','준비키트 동적 체크·TXT 저장','assets/v45-launch-kit.js',t=>t.includes('...window.AFO_V58_LAUNCH_DATA')&&t.includes('Object.keys(DATA)')&&t.includes('downloadTxt')],
    ['kit-handoff-six','6업종 준비서 상세 상담 인계','assets/v46-handoff.js',t=>['restaurant','beauty','logistics'].every(x=>t.includes(x+":'"))&&t.includes('sessionStorage.removeItem(KEY)')],
    ...['restaurant','beauty','logistics'].map(x=>['kit-'+x,x+' 제작자료 CTA','for-'+x+'.html',t=>t.includes('launch-kit.html?industry='+x)])
  );
  // V60: scope/acceptance tool and six industry-specific direct sales links.
  RULES.push(
    ['scope-page','6업종 납품 범위·검수 협의표','delivery-scope.html',t=>t.includes('id="v60-form"')&&t.includes('v60-delivery-scope.js')&&t.includes('v60-preview')&&t.includes('rel="canonical"')&&t.includes('협의용 초안')],
    ['scope-js','포함·제외·TXT·상담 기능','assets/v60-delivery-scope.js',t=>['manufacturing','academy','interior','restaurant','beauty','logistics'].every(id=>t.includes(id+':{label:'))&&t.includes('v60-save')&&t.includes('v60-to-contact')&&!t.includes('fetch(')],
    ['scope-css','범위표 반응형 화면','assets/v60-delivery-scope.css',t=>t.includes('.sectors')&&t.includes('max-width:620px')&&t.includes('.result pre')],
    ['scope-handoff','15분 1회 상담서 인계','assets/v60-scope-handoff.js',t=>t.includes('sessionStorage.removeItem(KEY)')&&t.includes('15*60*1000')&&t.includes('c.industry!==q.get')&&!t.includes('innerHTML')],
    ['scope-contact','상세 상담서 입력·인계','contact.html',t=>t.includes('v60-scope-handoff.js')&&t.includes('v60-import.css')&&t.includes('id="brief-form"')],
    ['scope-sitemap','범위 협의 공개 페이지 검색 경로','sitemap.xml',t=>t.includes('/delivery-scope.html')],
    ...['manufacturing','academy','interior','restaurant','beauty','logistics'].map(id=>['scope-'+id,id+' 제작 페이지 범위 안내','for-'+id+'.html',t=>t.includes('delivery-scope.html?industry='+id)])
  );
  // V61: prevent missing industry intake, broken manual fallback and absent release tooling.
  RULES.push(
    ['inquiry-six','선택적 접수 업종 6개 정확 표시','inquiry.html',t=>['제조·도매','학원·교육','인테리어·시공','음식점·카페','뷰티·미용','물류·운송'].every(x=>t.includes('<option>'+x+'</option>'))],
    ['inquiry-fallback','서버 비활성 시 이메일 대체 문의','inquiry.html',t=>t.includes('id="manual-inquiry-alternatives"')&&t.includes('href="quick-inquiry.html"')&&t.includes('href="contact.html"')&&t.includes('inbox-disabled')],
    ['inquiry-js','6업종 공개 ID 사전선택·비활성 안전','assets/inquiry.js',t=>t.includes('industryLabels')&&t.includes('Object.prototype.hasOwnProperty.call')&&t.includes('/api/inbox-status')&&!t.includes('localStorage')],
    ['audit-tool','무료 정적 소스 품질 감사기','tools/v61_site_integrity.py',t=>t.includes('class SourceParser')&&t.includes('BROKEN_FRAGMENT')&&t.includes('MISSING_STATIC_FILE')&&t.includes('STALE_MANIFEST')],
    ['audit-run','Windows Downloads 자동 결과','RUN_V61_SITE_AUDIT.cmd',t=>t.includes('git -c credential.interactive=never clone')&&t.includes('v61_site_integrity.py')&&t.includes('--expected-version V61')&&t.includes('Downloads')],
    ['audit-tests','정적 감사기 반례·회귀 시험','tools/test_v61_site_integrity.py',t=>t.includes('unittest.TestCase')&&t.includes('test_stale_manifest')&&t.includes('test_missing_html_link')]
  );
  // V62: six-sector webmail manual-send route, independent subject/body copy.
  RULES.push(
    ['mail-ui','6업종 웹메일 복사 안내','quick-inquiry.html',t=>t.includes('id="v62-subject"')&&t.includes('id="v62-body"')&&t.includes('id="v62-gmail"')&&t.includes('id="v49-webmail"')&&t.indexOf('v62-webmail.js')>t.indexOf('v49-quick-inquiry.js')],
    ['mail-js','제목·본문 분리와 수동 복사','assets/v62-webmail.js',t=>t.includes('navigator.clipboard?.writeText')&&t.includes('v62-manual-copy')&&t.includes("parsed[1] !== 'nineeyes@naver.com'")&&!t.includes('fetch(')&&!t.includes('sessionStorage')],
    ['mail-css','수동 발송·모바일 안내 스타일','assets/v62-webmail.css',t=>t.includes('.v62-send-guide')&&t.includes('max-width:590px')],
    ['mail-noauto','자동 발송 부재 안내','quick-inquiry.html',t=>t.includes('메일은 전송되지 않았습니다')||t.includes('웹메일 열기·문안 복사는 실제 발송이나 상담 접수가 아닙니다')]
  );
  const state = {ran:false,busy:false,records:[],when:'',release:'미확인'};
  const manual = [...document.querySelectorAll('#manual-list input[data-check]')];
  function updateManual(){
    const count=manual.filter(x=>x.checked).length;
    $('manual-count').textContent=count+'/'+manual.length+' 자체 확인';
  }
  manual.forEach(x=>x.addEventListener('change',updateManual));
  updateManual();
  async function load(path){
    const u=new URL(path,origin);
    if(!['http:','https:'].includes(origin.protocol)||u.origin!==origin.origin||!u.pathname.startsWith(origin.pathname))throw Error('동일 출처 HTTP(S) 검사가 아닙니다');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(u.href,{credentials:'omit',cache:'no-store',redirect:'follow',signal:controller.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      if(new URL(response.url).origin!==origin.origin)throw Error('외부 URL로 이동');
      const txt=await response.text();if(txt.length>1200000)throw Error('파일 크기 제한 초과');
      return txt;
    }finally{clearTimeout(timer)}
  }
  function result(rule,pass,detail){
    const entry={key:rule[0],label:rule[1],path:rule[2],pass,detail:String(detail).slice(0,130)};
    return entry;
  }
  function show(records){
    list.replaceChildren();
    records.forEach(rec=>{
      const li=document.createElement('li');
      const mark=document.createElement('b');mark.className=rec.pass?'ok':'hold';mark.textContent=rec.pass?'통과':'확인 필요';
      const wrap=document.createElement('div');
      const label=document.createElement('div');label.className='name';label.textContent=rec.label;
      const info=document.createElement('div');info.className='detail';info.textContent=rec.path+' · '+rec.detail;
      wrap.append(label,info);li.append(mark,wrap);list.append(li);
    });
  }
  async function execute(){
    if(state.busy)return;state.busy=true;run.disabled=true;$('auto-status').textContent='공개 파일 검사 중입니다…';
    state.records=[];state.ran=false;state.when='';state.release='미확인';list.replaceChildren();
    try {
      const records = new Array(RULES.length);
      for(let i=0;i<RULES.length;i+=3){
        await Promise.all(RULES.slice(i,i+3).map(async(rule,k)=>{
          let entry;
          try {const t=await load(rule[2]);const pass=!!rule[3](t);
            if(rule[0]==='release'&&pass)state.release=JSON.parse(t).version;
            entry=result(rule,pass,pass?'공개 파일과 필요한 내용 확인':'파일 내용이 기대와 다름');
          }catch(e){entry=result(rule,false,e?.name==='AbortError'?'응답 시간 제한':e?.message||'검사 불가');}
          records[i+k]=entry;
        }));
      }
      state.records=records;state.ran=true;state.when=new Date().toLocaleString('ko-KR');show(records);
      const good=records.filter(x=>x.pass).length;
      $('auto-count').textContent=good+'/'+RULES.length+' 파일 검사';
      $('auto-status').textContent='자동 검사 '+good+'/'+RULES.length+' 통과 · 확인 버전 '+state.release+' · 실제 메일 수신·검색 색인은 미검증입니다.';
    }finally {state.busy=false;run.disabled=false;}
  }
  function report(){
    const done=manual.filter(x=>x.checked).length;
    return [
      '올파일원 웹스튜디오 / V62 첫 고객 수주 준비도 자체 점검',
      '검사 사이트: '+origin.href,'검사 시각: '+(state.when||'미실시'),
      '공개 파일 확인: '+(state.ran?state.records.filter(x=>x.pass).length+'/'+RULES.length:'미실시'),
      '공개 릴리스: '+state.release,
      ...state.records.map(x=>(x.pass?'PASS':'HOLD')+' | '+x.label+' | '+x.path+' | '+x.detail),
      '', '운영자 직접 확인: '+done+'/'+manual.length+' (본인 체크, 자동 확인 아님)',
      ...manual.map((x,i)=>(x.checked?'[자체 확인] ':'[미확인] ')+(i+1)+'. '+x.closest('label')?.querySelector('b')?.textContent),
      '', '경계: 공개 파일 확인과 실제 메일 수신·네이버/Google 색인·계약·매출은 별개입니다.',
      '이 도구는 고객 정보, 비밀 키, 수신 확인 결과를 자동 조회하거나 저장하지 않습니다.'
    ].join('\r\n')+'\r\n';
  }
  function message(t){$('report-status').textContent=t;}
  $('report-preview').addEventListener('click',()=>{const x=$('report-text');x.textContent=report();x.hidden=!x.hidden;$('report-preview').textContent=x.hidden?'보고서 미리보기':'미리보기 닫기';message(x.hidden?'미리보기를 닫았습니다.':'브라우저 화면에만 보고서를 표시합니다.');});
  $('report-copy').addEventListener('click',async()=>{const x=report();try{if(typeof navigator.clipboard?.writeText!=='function')throw Error('clipboard blocked');await navigator.clipboard.writeText(x);message('점검 기록을 복사했습니다. 자동 업로드되지 않습니다.')}catch(_){const pre=$('report-text');pre.textContent=x;pre.hidden=false;message('자동 복사가 차단되었습니다. 아래 내용을 선택해 복사하거나 TXT를 저장하세요.');}});
  $('report-download').addEventListener('click',()=>{const blob=new Blob(['\ufeff',report()],{type:'text/plain;charset=utf-8'});const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download='AllFileOne_V62_Owner_Readiness.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),2500);message('TXT를 저장했습니다. 이것은 자체 확인 기록이며 외부 전송·접수가 아닙니다.');});
  run.addEventListener('click',execute);
  // Auto-run only public-file checks; owner/manual decisions remain explicitly manual.
  execute();
  // Deliberately do not persist owner's checked state or automatically claim checks passed.
})();
