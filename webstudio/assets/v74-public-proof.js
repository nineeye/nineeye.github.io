/* ALLFILEONE WEB STUDIO V74 — actual same-origin public asset audit.
 * No paid APIs, cookies, storage, PII, external uploads or background monitoring.
 * HTTP file presence does NOT prove UI behavior, emails received or contracts.
 */
(()=>{'use strict';
 const element=id=>document.getElementById(id);
 const runSmall=element('check-essential'),runAll=element('check-all'),rows=element('verification-results');
 if(!runSmall||!runAll||!rows)return;
 const root=new URL('./',document.baseURI);
 const sectors=Object.freeze(['manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event']);
 const styles=Object.freeze(['modern','premium','editorial']);
 const state={busy:false,mode:'미검사',records:[],version:'미확인',base:'미확인',time:'미검사',origin:root.href};
 element('observed-origin').textContent=root.origin+root.pathname.replace(/[^/]*$/,'');
 const exactVersion='V74-20261109';
 const must=(...terms)=>body=>terms.every(term=>body.includes(term));
 const requirements=[
  ['검증 화면','site-proof-v74.html',must('data-v74-proof="V74-20261109"','assets/v74-public-proof.js')],
  ['최초 진입','index.html',must('design-compare-live.html','contact.html')],
  ['디자인 비교','design-compare-live.html',must('assets/v70-buyer-bridge.js','assets/v28-catalog.js')],
  ['실제 견적 안내','plan-guide.html',must('pg-form','v653')],
  ['상담 준비서','contact.html',must('v72-complete-contact.js','id="brief-form"','mailto:nineeyes@naver.com')],
  ['상담 내용 보존','assets/v72-complete-contact.js',must('AFO_V73_SCOPE_GUARD','v73.0','function packet()')],
  ['3가지 시각 디자인','assets/v69-artdirection.css',must('theme-modern','theme-premium','theme-editorial','v23-hero')],
  ['업종별 디자인 동작','assets/v69-artdirection.js',must('V69','STYLES')],
  ['업종별 기능 연결','assets/v67-compare.js',must('actualFeatures(industry)','feature.title','feature.desc')],
  ['제작 요구사항','assets/v70-buyer-bridge.js',must('AFO_V70','sessionStorage')],
  ['36개 데모 공통 실행기','assets/demo.js',must('v69-artdirection.js','v28')],
  ['상담 요약 전달','assets/v653-sales-bridge.js',must('v71','mailto')],
  ['사이트맵','sitemap.xml',must('contact.html','for-manufacturing.html')]
 ];
 const safeReason=e=>e?.name==='AbortError'?'응답 제한 시간 초과':String(e?.message||'파일 접근 실패').slice(0,110);
 async function fetchText(path){
  const target=new URL(path,root);
  if(target.origin!==root.origin || !['https:','http:'].includes(target.protocol))throw Error('동일 사이트 HTTP(S) 파일만 조회할 수 있습니다.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
  try{
   const r=await fetch(target.href,{cache:'no-store',credentials:'same-origin',redirect:'follow',signal:controller.signal});
   if(!r.ok)throw Error('HTTP '+r.status);
   if(new URL(r.url).origin!==root.origin)throw Error('다른 도메인으로 이동한 응답');
   const data=await r.text();
   if(data.length>2000000)throw Error('파일 크기 초과');
   return data;
  }finally{clearTimeout(timer)}
 }
 function addResult(name,path,pass,detail){
  state.records.push({name,path,pass:!!pass,detail});
  const line=document.createElement('div');line.className='result-item '+(pass?'pass':'hold');line.setAttribute('role','listitem');
  const flag=document.createElement('span');flag.className='mark';flag.textContent=pass?'PASS':'HOLD';
  const description=document.createElement('div'),heading=document.createElement('b'),sub=document.createElement('small');
  heading.textContent=name;sub.textContent=path+' · '+detail;description.append(heading,sub);line.append(flag,description);rows.append(line);
 }
 async function check(name,path,accept){
  try{const body=await fetchText(path);const ok=Boolean(accept(body));addResult(name,path,ok,ok?'HTTP 응답 및 실제 본문 표식 일치':'HTTP 응답은 받았으나 해당 버전의 본문이 아닙니다.');}
  catch(e){addResult(name,path,false,safeReason(e));}
 }
 async function manifest(){
  const path='assets/current-release.json';
  try{
   const txt=await fetchText(path),m=JSON.parse(txt);
   const v74=m.v74_public_proof_version===exactVersion&&m.v74_public_audit_no_mail_receipt_claim===true;
   const v73=m.v73_scope_guard_version==='V73-20261109'&&m.v73_auto_mail_submission===false;
   const v72=m.v72_complete_packet_version==='V72-20261109'&&m.v72_consistent_copy_save===true;
   const base=String(m.version||'');
   const ok=v74&&v73&&v72&&m.product==='AllFileOne WebStudio'&&/^V[0-9]+$/.test(base);
   state.base=base||'미확인';state.version=ok?'V74 (기본 '+base+')':'미확인';
   addResult('정확한 공개 릴리스',path,ok,ok?'V74 + 이전 기능 V72·V73 표식 확인':'V74 표식 또는 핵심 기능 표식 불일치');
  }catch(e){addResult('정확한 공개 릴리스',path,false,safeReason(e));}
 }
 function catalog(){
  const catalog=window.ALLFILEONE_V28_CATALOG;
  const complete=Boolean(catalog&&sectors.every(id=>Array.isArray(catalog[id]?.features)&&catalog[id].features.length===4&&catalog[id].features.every(f=>typeof f.title==='string'&&f.title&&typeof f.desc==='string'&&f.desc)));
  addResult('업종별 48개 시연 기능 정의','assets/v28-catalog.js',complete,complete?'12업종 × 각 4개 기능 이름·설명 구조 확인':'카탈로그를 로드하지 못했거나 구성에 누락이 있습니다.');
 }
 async function run(full){
  if(state.busy)return;
  state.busy=true;state.records=[];state.version='미확인';state.base='미확인';state.time='미검사';state.mode=full?'전체 36개 데모':'핵심';
  rows.replaceChildren();runSmall.disabled=true;runAll.disabled=true;element('proof-copy').disabled=true;element('proof-save').disabled=true;
  element('verification-status').textContent='현재 공개된 파일을 확인하고 있습니다. 검사 결과에 이메일 실제 수신은 포함되지 않습니다.';
  element('release-summary').textContent='검사 중';
  try{
   await manifest();
   await check('V74 검증 기능 자체','assets/release-v74.json',text=>{
    const m=JSON.parse(text);return m.release===exactVersion&&m.public_proof===true&&m.mail_receipt_verified===false;
   });
   catalog();
   for(let i=0;i<requirements.length;i+=4){
    await Promise.all(requirements.slice(i,i+4).map(([name,path,predicate])=>check(name,path,predicate)));
   }
   if(full){
    const demos=sectors.flatMap(sector=>styles.map(style=>({sector,style,path:'demo/'+sector+'/'+style+'/index.html'})));
    for(let i=0;i<demos.length;i+=4){
     await Promise.all(demos.slice(i,i+4).map(x=>check('시연 '+x.sector+' / '+x.style,x.path,html=>
      html.includes('data-industry="'+x.sector+'"')&&html.includes('data-v13-style="'+x.style+'"')&&html.includes('../../../assets/demo.js'))));
    }
   }
   const passed=state.records.filter(x=>x.pass).length,hold=state.records.length-passed;
   state.time=new Date().toLocaleString('ko-KR');
   element('pass-count').textContent=String(passed);element('hold-count').textContent=String(hold);element('total-count').textContent=String(state.records.length);
   element('observed-version').textContent=state.version;element('checked-at').textContent=state.time;
   const clean=hold===0&&state.version.startsWith('V74');
   element('release-summary').textContent=clean?'공개 파일 검사 통과':'배포 확인 필요';
   element('verification-status').textContent=state.mode+' · '+passed+'/'+state.records.length+'건 확인 · '+hold+'건 확인 필요. 실제 클릭·이메일 수신·계약 완료는 별도로 검증해야 합니다.';
   element('proof-copy').disabled=false;element('proof-save').disabled=false;
  }finally{state.busy=false;runSmall.disabled=false;runAll.disabled=false;}
 }
 function report(){return [
  '[올파일원 웹스튜디오 V74 / 공개 배포 검증 보고서]',
  '실제 검사 주소: '+state.origin,'검사 시각: '+state.time,'검사 모드: '+state.mode,
  '확인한 기능 버전: '+state.version,'기본 릴리스: '+state.base,
  '통과 '+state.records.filter(x=>x.pass).length+' / 전체 '+state.records.length,
  ...state.records.map(x=>(x.pass?'PASS':'HOLD')+' | '+x.name+' | '+x.path+' | '+x.detail),
  '', '검증 범위: 브라우저에서 조회한 동일 사이트 HTTP 응답·본문 표식, 로드된 가상 시연 카탈로그.',
  '미검증: 실제 이메일 송수신, 고객 계약, 외부 검색 색인, 결제, 서버 예약 및 화면 수동 조작.',
  '이 보고서는 버튼을 누른 브라우저에서 생성되며 외부에 자동 전송되지 않습니다.'
 ].join('\n')+'\n'}
 runSmall.addEventListener('click',()=>run(false));runAll.addEventListener('click',()=>run(true));
 element('proof-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(report());element('save-feedback').textContent='TXT 보고서 내용을 복사했습니다.'}catch(_){element('save-feedback').textContent='클립보드 접근이 차단되었습니다. TXT 저장을 사용하세요.'}});
 element('proof-save').addEventListener('click',()=>{const blob=new Blob(['\ufeff',report()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='AllFileOne_WebStudio_V74_Public_Proof.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);element('save-feedback').textContent='공개 배포 검사 TXT 저장을 요청했습니다.'});
 window.AFO_V74_PUBLIC_PROOF='V74-20261109';
})();