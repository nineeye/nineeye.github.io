/* ALLFILEONE WEB STUDIO / V25 — client-side, same-origin deployment audit.
 * Does not transmit any personal information or use external services.
 * A PASS means publicly served file content was observed, not end-to-end booking/payment readiness.
 */
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const root = new URL('./', window.location.href);
  const expected = 'WEBSTUDIO-V25-20261107';
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
    {name:'V25 배포 버전',path:'assets/release-v25.json',match:r=>{const d=JSON.parse(r.text);return d.release_id === expected && d.product==='AllFileOne WebStudio' && d.version==='V25';}, detail:'배포 식별 파일의 내용 검증'},
    {name:'메인 홈페이지',path:'index.html',match:r=>r.text.includes('WEBSTUDIO-V25-20261107')&&r.text.includes('builder.html')&&r.text.includes('design-gallery-v13.html'),detail:'V25 표식 및 핵심 링크 확인'},
    {name:'업종별 실행 모듈',path:'assets/v23-industry.js',match:r=>r.text.includes('v24-result-tools')&&r.text.includes('workflow.dataset.v24Ready'),detail:'업종별 기능·결과 저장 스크립트'},
    {name:'공통 데모 연결',path:'assets/demo.js',match:r=>r.text.includes('v23-industry.js'),detail:'36개 데모가 공유하는 실행기'},
    {name:'무료 시안 제작기',path:'builder.html',match:r=>r.text.includes('<html')&&r.text.includes('WEB STUDIO'),detail:'제작기 페이지 내용 확인'},
    {name:'기능 조합 설계실',path:'modules.html',match:r=>r.text.includes('<html')&&r.text.includes('WEB STUDIO'),detail:'기능 조합 페이지 내용 확인'},
    {name:'이메일 문의 페이지',path:'contact.html',match:r=>r.text.includes('mailto:nineeyes@naver.com')&&r.text.includes('<html'),detail:'문의 페이지 및 이메일 연결 확인'}
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
    return ['[ALLFILEONE WEB STUDIO / V25 PUBLIC AUDIT]','사이트: '+root.href,'검사: '+state.mode,'시각: '+state.last,
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
    const a=document.createElement('a');a.href=url;a.download='AllFileOne_WebStudio_V25_Live_Check.txt';document.body.append(a);a.click();a.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    $('report-feedback').textContent='TXT 보고서를 저장했습니다.';
  });
  run(false);
})();