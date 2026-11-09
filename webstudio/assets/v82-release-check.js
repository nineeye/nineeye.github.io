/* V82: same-origin explicit public asset probe; never infer email receipt from a page response. */
(()=>{'use strict';
const $=id=>document.getElementById(id),root=new URL('./',document.baseURI),rows=$('records'),run=$('run-v82'),save=$('save');
if(!rows||!run||!save)return;
let results=[],stamp='미실행';
const probes=[
 ['공개 V82 페이지','release-check-v82.html',s=>s.includes('OPERATOR / PUBLIC DEPLOYMENT')&&s.includes('v82-release-check.js')],
 ['공개 V82 검증 스크립트','assets/v82-release-check.js',s=>s.includes("window.AFO_V82_PROBE='V82-20261109'")],
 ['홈페이지의 최신 버전','index.html',s=>s.includes('홈페이지 HTML 버전 V82')&&s.includes('WEBSTUDIO-V82-20261109')],
 ['실제 제작 범위 선택','feature-scope-v81.html',s=>s.includes('assets/v81-production-scope.js')],
 ['실제 고객 상담 페이지','contact.html',s=>s.includes('id="brief-form"')&&s.includes('v76-contact-unification.js')],
 ['36개 데모의 공통 실행기','assets/demo.js',s=>s.includes('v80-simulator.js')&&s.includes('v28')],
 ['84개 가상 시연 버전','assets/v80-simulator.js',s=>s.includes("version:'V80-20261109'")],
 ['12업종 기능 안내','industry-features-v77.html',s=>s.includes('v77-industry-hub.js')]
];
async function get(path){const url=new URL(path,root);if(url.origin!==root.origin)throw Error('외부 주소 차단');const c=new AbortController();const timer=setTimeout(()=>c.abort(),7000);try{const r=await fetch(url.href,{cache:'no-store',credentials:'same-origin',signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);if(new URL(r.url).origin!==root.origin)throw Error('외부 리디렉션');const txt=await r.text();if(txt.length>2e6)throw Error('본문 과다');return txt;}finally{clearTimeout(timer)}}
function add(name,path,passed,detail){results.push({name,path,passed:!!passed,detail});const div=document.createElement('div');div.className='result '+(passed?'pass':'hold');div.setAttribute('role','listitem');const tag=document.createElement('b');tag.textContent=passed?'PASS':'HOLD';const content=document.createElement('span');content.textContent=name+' · '+path+' · '+detail;div.append(tag,content);rows.append(div)}
async function checkOne([name,path,predicate]){try{const text=await get(path),ok=predicate(text);add(name,path,ok,ok?'HTTP 응답과 V82 본문 표식 일치':'본문 표식 불일치/예전 버전');}catch(e){add(name,path,false,String(e?.message||e).slice(0,130))}}
async function doRun(){if(run.disabled)return;run.disabled=true;save.disabled=true;results=[];rows.replaceChildren();$('probe-state').textContent='실제 공개 주소를 검사하고 있습니다.';try{const text=await get('assets/current-release.json'),m=JSON.parse(text);const ok=m.product==='AllFileOne WebStudio'&&m.version==='V82'&&m.release_id==='WEBSTUDIO-V82-20261109'&&m.v82_released_source_version==='V82-20261109';add('정확한 V82 릴리스','assets/current-release.json',ok,ok?'V82 공개 선언 파일 일치':'구버전 또는 잘못된 릴리스 선언');if(!ok){$('probe-state').textContent='HOLD: 버전이 일치하지 않아 다른 파일 검사를 중단했습니다.';return;}for(let i=0;i<probes.length;i+=4)await Promise.all(probes.slice(i,i+4).map(checkOne));}catch(e){add('공개 버전 선언','assets/current-release.json',false,String(e?.message||e).slice(0,130));}finally{stamp=new Date().toLocaleString('ko-KR');const pass=results.filter(r=>r.passed).length;$('pass').textContent=pass;$('hold').textContent=results.length-pass;const verdict=results.length===probes.length+1&&pass===results.length?'PASS_PUBLIC_FILES_ONLY':'HOLD_PUBLIC_DEPLOY';$('probe-state').textContent=verdict+' · '+pass+'/'+results.length+'건. 실제 이메일 수신·결제는 포함되지 않습니다.';save.disabled=false;run.disabled=false;}}
function report(){return ['올파일원 웹스튜디오 V82 공개 배포 검사','검사한 실제 주소: '+root.href,'시각: '+stamp,'PASS: '+results.filter(x=>x.passed).length,'HOLD: '+results.filter(x=>!x.passed).length,'',...results.map(x=>(x.passed?'PASS':'HOLD')+' | '+x.name+' | '+x.path+' | '+x.detail),'','주의: 파일 검사 결과는 실제 이메일 수신, 고객 계약, 서버 동작의 성공을 뜻하지 않습니다.'].join('\n')+'\n'}
run.addEventListener('click',doRun);save.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob(['\ufeff',report()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='AFO_V82_PUBLIC_CHECK_LATEST_KO.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)});
window.AFO_V82_PROBE='V82-20261109';
})();