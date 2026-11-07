/* ALLFILEONE WEB STUDIO / V35 — client-side, same-origin deployment audit.
 * Does not transmit any personal information or use external services.
 * A PASS means publicly served file content was observed, not end-to-end booking/payment readiness.
 */
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const root = new URL('./', window.location.href);
  const expected = 'WEBSTUDIO-V35-20261107';
  const ids = ['manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event'];
  const styles = ['modern','premium','editorial'];
  const state = {busy:false, results:[], mode:'핵심', last:''};
  $('status-origin').textContent = root.origin + root.pathname;
  const safeText = (value) => String(value ?? '');

  async function get(path) {
    const url = new URL(path, root);
    if (url.origin !== root.origin) throw new Error('타 도메인 요청 차단');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url.href, {cache:'no-store',credentials:'same-origin',redirect:'follow',signal:controller.signal});
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      if (text.length > 1_500_000) throw new Error('파일 크기 제한 초과');
      return {text, contentType:res.headers.get('content-type') || ''};
    } finally {window.clearTimeout(timeout);}
  }
  const checks = [
    {name:'공개 최신 버전 포인터',path:'assets/current-release.json',match:r=>{const d=JSON.parse(r.text);return d.product==='AllFileOne WebStudio'&&d.version==='V35'&&d.release_id==='WEBSTUDIO-V35-20261107';},detail:'Cloudflare가 제공하는 현재 릴리스 버전 선언'},
    {name:'버전 자동 표시 스크립트',path:'assets/version-badge.js',match:r=>r.text.includes('current-release.json')&&r.text.includes('site-current-version'),detail:'새 버전의 배포 정보를 읽는 별도 스크립트'},
    {name:'V33 배포 버전',path:'assets/release-v33.json',match:r=>{const d=JSON.parse(r.text);return d.release_id==='WEBSTUDIO-V33-20261107' && d.product==='AllFileOne WebStudio' && d.version==='V33' && d.core_feature_count===48 && d.archive_reuse_feature_count===12;},detail:'12업종×4기능 릴리스 파일 확인'},
    {name:'메인 홈페이지',path:'index.html',match:r=>r.text.includes('WEBSTUDIO-V33-20261107')&&r.text.includes('estimate-to-brief')&&r.text.includes('contact.html#scope-options')&&r.text.includes('assets/v31-selection.css')&&r.text.includes('assets/v29-gallery.css')&&r.text.includes('assets/v30-proof.css')&&r.text.includes('reuse-lab.html')&&r.text.includes('builder.html')&&r.text.includes('design-gallery-v13.html'),detail:'V27 표식 및 기존 주요 링크 보존'},
    {name:'업종별 실행 모듈',path:'assets/v23-industry.js',match:r=>r.text.includes('v24-result-tools')&&r.text.includes('workflow.dataset.v24Ready'),detail:'12업종 전용 기능·결과 저장'},
    {name:'36개 데모 공통 로더',path:'assets/demo.js',match:r=>r.text.includes('v23-industry.js')&&r.text.includes('v27-demo-bridge.js')&&r.text.includes('v28-catalog.js')&&r.text.includes('v28-tools.js'),detail:'기존 V23/V27 기능과 V28 순차 로드'},
    {name:'12업종·48개 기능 데이터',path:'assets/v28-catalog.js',match:r=>r.text.includes('ALLFILEONE_V28_CATALOG')&&ids.every(id=>r.text.includes('\"'+id+'\":'))&&((r.text.match(/\"kind\":/g)||[]).length===48),detail:'업종당 4개 기능 정의 일치'},
    {name:'V28 기능 엔진',path:'assets/v28-tools.js',match:r=>r.text.includes('v28Ready')&&r.text.includes('mountStay')&&r.text.includes('mountICS')&&r.text.includes('v28-export-txt'),detail:'검색·계산·일정·장바구니·ICS 기능 엔진'},
    {name:'V28 반응형 CSS',path:'assets/v28-tools.css',match:r=>r.text.includes('.v28-suite')&&r.text.includes('@media(max-width:530px)'),detail:'모바일/태블릿 대응 패널 스타일'},
    {name:'샘플→상담 연결 스크립트',path:'assets/v27-demo-bridge.js',match:r=>r.text.includes('data-v27-conversion')||r.text.includes('v27Conversion')&&r.text.includes("source:'demo'"),detail:'가상 샘플에서 업종·스타일 전달'},
    {name:'새 상담 연결 스타일',path:'assets/v27-conversion.css',match:r=>r.text.includes('.v27-conversion'),detail:'PC·모바일 CTA 레이아웃'},
    {name:'업종 맞춤 상담 페이지',path:'contact.html',match:r=>r.text.includes('WEBSTUDIO-V27-20261107')&&r.text.includes('v26-contact.js')&&r.text.includes('v27-contact-context.js'),detail:'기존 V26 상담 기능 보존 및 샘플 연결'},
    {name:'상담 자동선택 스크립트',path:'assets/v27-contact-context.js',match:r=>r.text.includes("source') !== 'demo'")&&r.text.includes('v27ContextReady'),detail:'12개 업종·스타일·추천 기능 연결'},
    {name:'V26 상담 준비서 스크립트',path:'assets/v26-contact.js',match:r=>r.text.includes('briefLines')&&r.text.includes('mailto:')&&r.text.includes('reportValidity'),detail:'상담서 복사·TXT·이메일 초안 기능 보존'},
    {name:'V27 상담 연결 스타일',path:'assets/v27-contact-context.css',match:r=>r.text.includes('.v27-context'),detail:'샘플 선택 확인 메시지 반응형 스타일'},
    {name:'무료 시안 제작기',path:'builder.html',match:r=>r.text.includes('<html')&&r.text.includes('WEB STUDIO'),detail:'기존 제작기 접근성'},
    {name:'기능 조합 설계실',path:'modules.html',match:r=>r.text.includes('<html')&&r.text.includes('WEB STUDIO'),detail:'기존 모듈 기능 보존'},
    {name:'V30 실제 기능 목록',path:'assets/main.js',match:r=>r.text.includes('v30-proof-list')&&r.text.includes('featureIndex')&&r.text.includes('contact.html?industry='),detail:'12업종마다 4개 실행 가능한 기능 목록'},
    {name:'V30 기능 직접 이동',path:'assets/v28-tools.js',match:r=>r.text.includes('selectedFeature')&&r.text.includes('selectTab(initialTab)')&&r.text.includes('scrollIntoView'),detail:'0~3 탭 선택 및 입력 반례'},
    {name:'V30 기능 카드 스타일',path:'assets/v30-proof.css',match:r=>r.text.includes('.v30-proof-list')&&r.text.includes('.v30-archive'),detail:'PC·모바일 업종 기능 증명과 추가 3업종 안내'},
    {name:'과거 프로젝트 3업종 체험실',path:'reuse-lab.html',match:r=>r.text.includes('reuse-lab.js')&&r.text.includes('restaurant')&&r.text.includes('logistics'),detail:'음식점·뷰티·물류 12개 추가 시연의 진입점'},
    {name:'과거 기능 재사용 실행기',path:'assets/reuse-lab.js',match:r=>r.text.includes('restaurantMenu')&&r.text.includes('beautyCompare')&&r.text.includes('logisticsVolume'),detail:'세 업종 12개 오프라인 인터랙션 엔진'},
    {name:'추가 업종 반응형 스타일',path:'assets/reuse-lab.css',match:r=>r.text.includes('.lab-grid')&&r.text.includes('@media'),detail:'작은 화면과 키보드 포커스'},
    {name:'추가 업종 상담 선택',path:'contact.html',match:r=>r.text.includes('value="restaurant"')&&r.text.includes('value="beauty"')&&r.text.includes('value="logistics"'),detail:'기존 12업종과 3개 추가 업종의 상담서 선택 지원'},
    {name:'V31 선택 기능 카드',path:'assets/main.js',match:r=>r.text.includes('v31-pick-input')&&r.text.includes('selectedByIndustry')&&r.text.includes("source:'gallery'"),detail:'업종별 기능 선택·상담 링크'},
    {name:'V31 상담서 기능명 반영',path:'assets/v26-contact.js',match:r=>r.text.includes('galleryChoice')&&r.text.includes('시연에서 선택한 기능:'),detail:'기능 카탈로그의 실제 이름만 전달'},
    {name:'V31 상담 선택 패널',path:'contact.html',match:r=>r.text.includes('id="v31-selected-demo"')&&r.text.includes('assets/v28-catalog.js'),detail:'브라우저 상담서에서 선택 내용 확인'},
    {name:'V31 기능 선택 스타일',path:'assets/v31-selection.css',match:r=>r.text.includes('.v31-selected-demo')&&r.text.includes('.v31-pick'),detail:'PC·모바일 체크박스 접근성'},
    {name:'V32 제작 범위 상담 확장',path:'contact.html',match:r=>r.text.includes('id="scope-options"')&&r.text.includes('name="operation"')&&r.text.includes('name="asset"'),detail:'고객이 선택하는 페이지 범위·운영 방식·자료 준비'},
    {name:'V32 실제 운영 의존성 안내',path:'assets/v26-contact.js',match:r=>r.text.includes('function scopeRisks()')&&r.text.includes('function scopeLines()')&&r.text.includes('웹페이지에서 자동 제출되지 않았으며'),detail:'예약·결제·관리자 연동 범위, TXT/메일 초안 반영'},
    {name:'V32 반응형 제작 상담 패널',path:'assets/v32-scope.css',match:r=>r.text.includes('.v32-scope')&&r.text.includes('@media'),detail:'모바일·키보드 지원 및 선택형 입력'},
    {name:'V33 공유 참고 견적 기준',path:'assets/v33-estimate-model.js',match:r=>r.text.includes('WEBSTUDIO_ESTIMATE_MODEL')&&r.text.includes('calculate(')&&r.text.includes('parse('),detail:'메인과 상담서가 동일 기준으로 계산'},
    {name:'V33 견적→상담 연결',path:'assets/v33-estimate-bridge.js',match:r=>r.text.includes('estimate-to-brief')&&r.text.includes("source:'estimate'"),detail:'고객 선택 상품·추가 옵션만 주소로 전달'},
    {name:'V33 상담서 견적 반영',path:'assets/v26-contact.js',match:r=>r.text.includes('estimateModel?.parse')&&r.text.includes('...estimateLines()'),detail:'URL 금액 미사용, 자체 기준표에서 재계산'},
    {name:'V33 버튼 및 모바일 디자인',path:'assets/v33-estimate.css',match:r=>r.text.includes('.v33-estimate-cta')&&r.text.includes('.v33-imported-quote'),detail:'PC·모바일 상담 연결'}

,
    {name:'V34 현재 배포 선언',path:'assets/release-v34.json',match:r=>{const d=JSON.parse(r.text);return d.release_id==='WEBSTUDIO-V34-20261107'&&d.version==='V34'&&d.core_feature_count===48&&d.archive_reuse_feature_count===12;},detail:'60개 기능 보존과 PDF 준비서 개선 릴리스'},
    {name:'V34 직접 체험 증거 카드',path:'index.html',match:r=>r.text.includes('v34-liveproof')&&r.text.includes('assets/v34-polish.css')&&r.text.includes('WEBSTUDIO-V34-20261107'),detail:'실제 작동하는 업종별 데모와 정직한 시연 고지'},
    {name:'V34 인쇄 상담서 버튼',path:'contact.html',match:r=>r.text.includes('id="brief-print"')&&r.text.includes('assets/v34-brief-print.js')&&r.text.includes('assets/v34-brief-print.css'),detail:'브라우저에서 PDF로 저장 버튼 확인'},
    {name:'V34 인쇄 기능',path:'assets/v34-brief-print.js',match:r=>r.text.includes("window.print()")&&r.text.includes("form.checkValidity()"),detail:'서버로 전송하지 않는 인쇄 기능'},
    {name:'V34 A4 인쇄 전용 스타일',path:'assets/v34-brief-print.css',match:r=>r.text.includes('@media print')&&r.text.includes('#brief-output'),detail:'A4 PDF 전용 준비서 서식'},
    {name:'V34 반응형 실력 증명 디자인',path:'assets/v34-polish.css',match:r=>r.text.includes('.v34-proof-grid')&&r.text.includes('prefers-reduced-motion'),detail:'PC·모바일·접근성 스타일 보존'},
    {name:'V35 상품 비교 릴리스 선언',path:'assets/release-v35.json',match:r=>{const d=JSON.parse(r.text);return d.product==='AllFileOne WebStudio'&&d.release_id===expected&&d.version==='V35'&&d.core_feature_count===48&&d.archive_reuse_feature_count===12;},detail:'기존 시연 60개 기능 보존 및 상품 비교 출시 선언'},
    {name:'V35 상품·범위 비교 화면',path:'plan-guide.html',match:r=>r.text.includes('WEBSTUDIO-V35-20261107')&&r.text.includes('id="pg-form"')&&r.text.includes('id="pg-consult"')&&r.text.includes('assets/v35-plan-guide.js')&&r.text.includes('assets/v35-plan-guide.css'),detail:'업종별 3상품 범위 안내와 가격 선택기'},
    {name:'V35 상품 계산 스크립트',path:'assets/v35-plan-guide.js',match:r=>r.text.includes('model.calculate(')&&r.text.includes("source:'estimate'")&&r.text.includes('URLSearchParams')&&r.text.includes('download'),detail:'V33 가격모델 재사용과 상담 이동·TXT 저장'},
    {name:'V35 반응형·접근성 상품 CSS',path:'assets/v35-plan-guide.css',match:r=>r.text.includes('.planner-grid')&&r.text.includes('.table-scroll')&&r.text.includes('@media(max-width:580px)')&&r.text.includes('prefers-reduced-motion'),detail:'모바일·태블릿 상품 비교 서식'},
    {name:'V35 메인 상품 비교 진입점',path:'index.html',match:r=>r.text.includes('WEBSTUDIO-V35-20261107')&&r.text.includes('plan-guide.html')&&r.text.includes('site-current-version'),detail:'메인 가격 섹션·내비게이션에서 연결'},
    {name:'V35 상담 화면 상품 비교 링크',path:'contact.html',match:r=>r.text.includes('WEBSTUDIO-V35-20261107')&&r.text.includes('plan-guide.html'),detail:'상담 전 상품 범위 확인 연결'},
    {name:'V35 공개 검색용 링크',path:'sitemap.xml',match:r=>r.text.includes('plan-guide.html'),detail:'신규 비교 페이지 검색 인덱싱용 sitemap 등록'},
    {name:'V29 실물 캡처 갤러리',path:'assets/main.js',match:r=>r.text.includes('assets/v13-shots/')&&r.text.includes('card-consult')&&r.text.includes('contact.html?industry='),detail:'실제 시연 화면 미리보기와 상담 연결'},
    {name:'V29 갤러리 반응형 CSS',path:'assets/v29-gallery.css',match:r=>r.text.includes('.v29-real-shot')&&r.text.includes('.card-consult')&&r.text.includes('@media'),detail:'모바일·PC 디자인·접근성'},
    {name:'원본 데모 화면 캡처',path:'assets/v13-shots/manufacturing-modern.svg',match:r=>r.text.includes('data:image/jpeg;base64,'),detail:'외부 이미지 대신 자체 시연 화면 캡처'}
  ];
  function setBusy(busy) {
    state.busy=busy;
    $('run-quick').disabled=busy;
    $('run-all').disabled=busy;
    $('overall').textContent=busy?'검사 진행 중':'검사 준비 중';
    $('light').className='light';
    $('summary').textContent=busy?'현재 서버에서 공개된 파일을 확인하고 있습니다.':'검사가 시작되지 않았습니다.';
  }
  function add(result) {
    state.results.push(result);
    const row=document.createElement('div');row.className='result-row';row.setAttribute('role','listitem');
    const status=document.createElement('span');status.dataset.result='true';status.className=result.ok?'ok':'fail';status.textContent=result.ok?'● 통과':'● 확인 필요';
    const desc=document.createElement('div');
    const name=document.createElement('div');name.className='name';name.textContent=result.name;
    const detail=document.createElement('small');detail.textContent=result.detail+(result.error?' · '+result.error:'');
    desc.append(name,detail);
    const link=document.createElement('a');link.href=new URL(result.path,root).href;link.textContent='파일 보기 ↗';
    row.append(status,desc,link);
    $('results').append(row);
  }
  async function inspect(spec) {
    try {
      const r=await get(spec.path);
      const matches=!!spec.match(r);
      add({name:spec.name,path:spec.path,ok:matches,detail:spec.detail,error:matches?'':'기대 내용과 실제 파일이 일치하지 않습니다'});
    } catch(e) {
      add({name:spec.name,path:spec.path,ok:false,detail:spec.detail,error:e?.name==='AbortError'?'응답 시간 초과':safeText(e.message).slice(0,100)});
    }
  }
  async function run(all) {
    if(state.busy)return;
    state.results=[];
    state.mode=all?'전체 36개':'핵심';
    $('results').replaceChildren();setBusy(true);
    const isLocal = root.protocol !== 'https:' && root.protocol !== 'http:';
    if(isLocal){add({name:'운영 환경 확인',path:'site-check.html',ok:false,detail:'HTTP(S) 주소에서만 실배포 검증이 가능합니다',error:'로컬 파일 실행은 운영 서버 검증이 아닙니다'});}
    else {
      // Small batches avoid a burst of network requests on free hosting.
      for(const spec of checks)await inspect(spec);
      if(all){
        const queue=ids.flatMap(id=>styles.map(style=>({name:id+' / '+style,path:`demo/${id}/${style}/index.html`,detail:'개별 가상 데모 경로',match:r=>r.text.includes('data-industry="'+id+'"')&&r.text.includes('data-v13-style="'+style+'"')&&r.text.includes('assets/demo.js')})));
        for(let i=0;i<queue.length;i+=4) await Promise.all(queue.slice(i,i+4).map(inspect));
      }
    }
    state.last=new Date().toLocaleString('ko-KR');
    $('last-check').textContent=state.last;
    const pass=state.results.filter(r=>r.ok).length;
    const total=state.results.length;
    const allPass=pass===total && total>0;
    $('overall').textContent=allPass?'공개 파일 검사 통과':`${total-pass}개 항목 확인 필요`;
    $('summary').textContent=`${state.mode} 검사: ${pass}/${total}개 통과. 통과는 공개 파일의 존재·내용만 검증하며 실제 주문·예약·문의 수신 완료를 의미하지 않습니다.`;
    $('light').className='light '+(allPass?'ok':'bad');
    $('copy-report').disabled=false;
    $('download-report').disabled=false;
    state.busy=false;
    $('run-quick').disabled=false;$('run-all').disabled=false;
  }
  function report() {
    return ['[ALLFILEONE WEB STUDIO / V28 PUBLIC AUDIT]','사이트: '+root.href,'검사: '+state.mode,'시각: '+state.last,
      ...state.results.map(r=>(r.ok?'PASS ':'FAIL ')+r.path+' / '+r.name+(r.error?' / '+r.error:'')),
      '주의: 정적 파일 검사 결과이며 실제 고객 접수·예약·결제 및 Windows 실행 검증은 아닙니다.',
      '개인정보 수집 및 외부 API 전송 없음'].join('\n');
  }
  $('run-quick').addEventListener('click',()=>run(false));
  $('run-all').addEventListener('click',()=>run(true));
  $('copy-report').addEventListener('click',async()=>{
    try {await navigator.clipboard.writeText(report());$('report-feedback').textContent='보고서를 복사했습니다.';}
    catch {$('report-feedback').textContent='복사가 제한되어 있습니다. TXT 저장을 이용해 주세요.';}
  });
  $('download-report').addEventListener('click',()=>{
    const blob=new Blob(['\ufeff'+report()],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='AllFileOne_WebStudio_V35_Live_Check.txt';document.body.append(a);a.click();a.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    $('report-feedback').textContent='TXT 보고서를 저장했습니다.';
  });
  run(false);
})();
