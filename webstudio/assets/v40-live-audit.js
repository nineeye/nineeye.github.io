/* AllFileOne WebStudio V40: same-origin, zero-service live publication checks.
 * Checks what a visitor's browser can actually retrieve. This is NOT an email receipt test.
 * GitHub/Cloudflare CI deploy confirmation is tracked separately as official evidence.
 */
'use strict';
(() => {
  const el = id => document.getElementById(id);
  if (!el('run-quick') || !el('results')) return;
  const root = new URL('./', location.href);
  const industries = Object.freeze(['manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event']);
  const styles = Object.freeze(['modern','premium','editorial']);
  const state = {busy:false, mode:'핵심', records:[], version:'미확인', release:'미확인', updated:'미검사'};
  el('status-origin').textContent = root.href;
  const safeMessage = error => (error && error.name === 'AbortError') ? '응답 시간 제한 초과' : String(error?.message || '알 수 없는 오류').slice(0,120);
  async function read(path) {
    const url = new URL(path, root);
    if (url.origin !== root.origin || !/^https?:$/.test(root.protocol)) throw new Error('HTTP(S) 동일 출처에서만 검사할 수 있습니다.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url.href, {cache:'no-store',credentials:'same-origin',redirect:'follow',signal:controller.signal});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const body = await response.text();
      if (body.length > 1_500_000) throw new Error('허용 파일 크기 초과');
      return body;
    } finally {clearTimeout(timer);}
  }
  function result(name,path,pass,detail) {
    const record={name,path,pass:!!pass,detail};
    state.records.push(record);
    const row=document.createElement('div');
    row.className='result-row';row.setAttribute('role','listitem');
    const status=document.createElement('span'); status.dataset.result='true'; status.className=pass?'ok':'fail'; status.textContent=pass?'● 통과':'● 확인 필요';
    const middle=document.createElement('div');
    const title=document.createElement('div'); title.className='name';title.textContent=name;
    const info=document.createElement('small');info.textContent=detail;
    middle.append(title,info);
    const link=document.createElement('a');link.href=new URL(path,root).href;link.textContent='경로 열기 ↗';
    row.append(status,middle,link);el('results').append(row);
  }
  async function check(name,path,predicate,detail) {
    try {
      const body=await read(path);
      const ok=!!predicate(body);
      result(name,path,ok,ok?detail:'응답은 받았지만 기대한 파일 내용과 일치하지 않습니다.');
    }catch(error){result(name,path,false,safeMessage(error));}
  }
  const checks=[
    ['메인 페이지','index.html',t=>t.includes('id="industry-solutions"')&&t.includes('site-current-version')&&t.includes('WEBSTUDIO-V40-20261108'),'판매용 업종 3개와 버전 표시'],
    ['1분 제작 진단','fit-check.html',t=>t.includes('WEB STUDIO')&&t.includes('fit'),'업종 추천 진단 페이지'],
    ['제조·도매 제작 상품','for-manufacturing.html',t=>t.includes('name="module"')&&t.includes('source=sector')&&t.includes('v38-solutions.js'),'제조 업종별 구성과 상담 진입'],
    ['학원·교육 제작 상품','for-academy.html',t=>t.includes('name="module"')&&t.includes('source=sector')&&t.includes('v38-solutions.js'),'학원 업종별 구성과 상담 진입'],
    ['인테리어 제작 상품','for-interior.html',t=>t.includes('name="module"')&&t.includes('source=sector')&&t.includes('v38-solutions.js'),'시공 업종별 구성과 상담 진입'],
    ['실제 상담 준비서','contact.html',t=>t.includes('v26-contact.js')&&t.includes('v39-sector-handoff.js')&&t.includes('v40-mail-fallback.js'),'고객이 고른 기능·직접 메일 보내기 안내'],
    ['문의 복구 기능','assets/v40-mail-fallback.js',t=>t.includes('v40-mail-fallback')&&t.includes('nineeyes@naver.com'),'웹메일 사용자 이메일 주소 복사 대안'],
    ['업종별 기능 전달','assets/v39-sector-handoff.js',t=>t.includes('ALLFILEONE_SECTOR_SCOPE'),'업종별 허용 기능을 상담서로 연결'],
    ['디자인 전환','assets/demo.js',t=>t.includes('v37-chooser'),'모던·프리미엄·에디토리얼 변경 기능'],
    ['사이트맵','sitemap.xml',t=>['for-manufacturing.html','for-academy.html','for-interior.html'].every(name=>t.includes(name)),'3개 업종 판매 페이지 검색 링크'],
    ['운영 안내','plan-guide.html',t=>t.includes('pg-form'),'3개 제작 상품 범위·비용 안내']
  ];
  async function checkVersion() {
    try {
      const body=await read('assets/current-release.json');
      const parsed=JSON.parse(body);
      const version=String(parsed?.version||'');
      const match=/^V([1-9][0-9]{0,3})$/.exec(version);
      const pass=parsed.product==='AllFileOne WebStudio'&&match&&Number(match[1])>=40&&
        String(parsed.release_id||'').startsWith('WEBSTUDIO-'+version+'-');
      state.version=pass?version:'미확인';
      state.release=pass?parsed.release_id:'미확인';
      el('expected-version').textContent=state.version;
      el('release-label').textContent=state.release;
      result('실제 공개 릴리스','assets/current-release.json',pass,pass?'서버가 응답한 버전 '+version:'V40 이상 버전 식별 또는 형식 검증에 실패했습니다.');
    }catch(error){result('실제 공개 릴리스','assets/current-release.json',false,safeMessage(error));}
  }
  async function run(full) {
    if(state.busy)return;
    state.busy=true;state.records=[];state.mode=full?'전체 36개':'핵심';
    el('results').replaceChildren();el('run-quick').disabled=true;el('run-all').disabled=true;
    el('overall').textContent='검사 중';el('summary').textContent='현재 브라우저가 방문 중인 서버의 파일을 확인하고 있습니다.';
    try {
      await checkVersion();
      for(let i=0;i<checks.length;i+=4){
        await Promise.all(checks.slice(i,i+4).map(([name,path,predicate,desc])=>check(name,path,predicate,desc)));
      }
      if(full){
        const tasks=industries.flatMap(id=>styles.map(style=>({id,style,path:`demo/${id}/${style}/index.html`})));
        for(let i=0;i<tasks.length;i+=4){
          await Promise.all(tasks.slice(i,i+4).map(t=>check(t.id+' / '+t.style,t.path,html=>
            html.includes('data-industry="'+t.id+'"')&&html.includes('data-v13-style="'+t.style+'"')&&html.includes('assets/demo.js'),'실제 가상 디자인 데모 HTML')));
        }
      }
      state.updated=new Date().toLocaleString('ko-KR');
      el('last-check').textContent=state.updated;
      const passed=state.records.filter(item=>item.pass).length;
      const failed=state.records.length-passed;
      el('overall').textContent=failed===0?'공개 파일 검사 통과':failed+'개 항목 확인 필요';
      el('summary').textContent=`${state.mode} 검사 ${passed}/${state.records.length} 통과. 이것은 브라우저의 공개 파일 접근 검사이며 이메일 수신·실결제·예약 접수 증거가 아닙니다.`;
      el('light').className='light '+(failed===0?'ok':'bad');
      el('copy-report').disabled=false;el('download-report').disabled=false;
    } finally {state.busy=false;el('run-quick').disabled=false;el('run-all').disabled=false;}
  }
  function report() {
    return [
      '[올파일원 웹스튜디오 / 공개 파일 배포 점검]',
      '검사 사이트: '+root.href, '서버 응답 버전: '+state.version,
      '릴리스 식별자: '+state.release,'검사 시각: '+state.updated,'검사 범위: '+state.mode,
      ...state.records.map(x=>(x.pass?'PASS':'HOLD')+' '+x.path+' / '+x.name+' / '+x.detail),
      '주의: Cloudflare 빌드 성공, 이메일 수신, 예약·결제 동작과는 서로 다른 검증 범위입니다.'
    ].join('\n');
  }
  el('run-quick').addEventListener('click',()=>run(false));
  el('run-all').addEventListener('click',()=>run(true));
  el('copy-report').addEventListener('click',async()=>{
    try{
      if(!navigator.clipboard?.writeText)throw new Error('clipboard unsupported');
      await navigator.clipboard.writeText(report()); el('report-feedback').textContent='점검 보고서를 복사했습니다.';
    }catch {el('report-feedback').textContent='복사할 수 없습니다. TXT 파일 저장을 이용해 주세요.';}
  });
  el('download-report').addEventListener('click',()=>{
    const blob=new Blob(['\ufeff'+report()],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');
    link.href=url;link.download='AllFileOne_WebStudio_'+(state.version==='미확인'?'Unknown':state.version)+'_Live_Check.txt';
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    el('report-feedback').textContent='TXT 검사 보고서를 저장했습니다.';
  });
  run(false);
})();