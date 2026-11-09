/* WebStudio V87 original code. No network requests, no storage, no trackers, no auto mail. */
(()=>{'use strict';
const sectors=window.AFO_V67_INDUSTRIES||{},catalog=window.ALLFILEONE_V28_CATALOG||{},ext=window.AFO_V77_FEATURE_EXTENSION||{};
const keys=Object.keys(sectors).filter(k=>catalog[k]&&ext[k]);
const styles=['modern','premium','editorial'],stylename={modern:'모던',premium:'프리미엄',editorial:'에디토리얼'};
const planName={basic:'기본 소개형',business:'업종 맞춤형',advanced:'업무 기능 협의형'};
const $=id=>document.getElementById(id);
if(keys.length!==12||!$('v87-features')){const f=$('v87-feedback');if(f)f.textContent='업종 데이터 12개를 읽지 못했습니다. 원본 소스를 확인하세요.';return;}
const q=new URLSearchParams(location.search);let industry=keys.includes(q.get('industry'))?q.get('industry'):keys[0],style=styles.includes(q.get('style'))?q.get('style'):'modern';
let selected=new Set(),catalogFeatures=[],report='';
const safeText=(n)=>n.replace(/[\u0000-\u001f\u007f]/g,' ').trim();
const currentPlan=()=>document.querySelector('input[name="project-plan"]:checked')?.value||'business';
function myFeatures(){const first=catalog[industry]?.features||[],later=ext[industry]?.extra||[];
 if(first.length!==4||later.filter(x=>x.status==='simulated').length!==3||later.filter(x=>x.status==='planned').length!==1)return [];
 const base=first.map((x,i)=>({index:i,title:x.title,desc:x.desc,planned:false,url:'./demo/'+industry+'/'+style+'/index.html?feature='+i+'#v28-tools'}));
 return [...base,...later.filter(x=>x.status==='simulated').map((x,i)=>({index:i+4,title:x.title,desc:x.desc,planned:false,url:'./feature-lab-v80.html?industry='+encodeURIComponent(industry)+'&feature='+later.indexOf(x)})),...later.filter(x=>x.status==='planned').map(x=>({index:7,title:x.title,desc:x.desc,planned:true,url:'./feature-scope-v81.html?industry='+industry+'&style='+style}))];
}
function makeElement(tag,className,txt){const n=document.createElement(tag);if(className)n.className=className;if(txt!==undefined)n.textContent=txt;return n;}
function renderFeatureList(){catalogFeatures=myFeatures();const root=$('v87-features');root.replaceChildren();if(catalogFeatures.length!==8){root.append(makeElement('p','','기능 목록을 읽지 못했습니다.'));return;}
 for(const f of catalogFeatures){const box=makeElement('label','feature-item'+(f.planned?' is-planned':''));const top=makeElement('div','feature-top');const input=makeElement('input');input.type='checkbox';input.dataset.feature=String(f.index);input.checked=selected.has(f.index);input.setAttribute('aria-label',f.title+' 의뢰 검토에 포함');const status=makeElement('span','',f.planned?'현재 미구현 / 별도 개발':'가상 브라우저 시연');top.append(input,status);box.append(top,makeElement('h3','',f.title),makeElement('p','',f.desc));const a=makeElement('a','','시연·구현 범위 보기 ↗');a.href=f.url;a.target='_blank';a.rel='noopener';a.addEventListener('click',event=>event.stopPropagation());box.append(a);box.classList.toggle('selected',input.checked);input.addEventListener('change',()=>{input.checked?selected.add(f.index):selected.delete(f.index);box.classList.toggle('selected',input.checked);refresh()});root.append(box)}
}
function buildReport(){const ss=sectors[industry],selectedFeatures=catalogFeatures.filter(f=>selected.has(f.index));const checks=[...document.querySelectorAll('[data-confirm]')];const note=safeText($('v87-notes').value).slice(0,500);
 const timeline=$('v87-timeline').selectedOptions[0].textContent,budget=$('v87-budget').selectedOptions[0].textContent;
 return ['올파일원 웹스튜디오 V87 / 홈페이지 제작 상담 요청서','[고객 작성용 · 메일 미전송]','',
 '업종: '+ss.name,'디자인: '+stylename[style],'홈페이지 유형: '+planName[currentPlan()],
 '선택한 업종별 디자인 체험: '+$('v87-demo').href,'','[실제 제작 협의가 필요한 기능: '+selectedFeatures.length+'/8]',
 ...(selectedFeatures.length?selectedFeatures.map((f,i)=>(i+1)+'. '+f.title+' ['+(f.planned?'현재 미구현':'가상 시연만 있음')+']'):['아직 기능을 선택하지 않았습니다.']),
 '','[협의 조건]','희망 일정: '+timeline,'예산 방향: '+budget,
 '추가 요청: '+(note||'없음'),'','[계약 전 확인 체크]',...checks.map(c=>(c.checked?'[확인 예정] ':'[미확인] ')+safeText(c.parentElement.textContent)),
 '','[안내]','가격 29/59/99만원부터는 기획 예시 시작가이며, 실제 견적·납품보장·기능 포함을 뜻하지 않습니다.',
 'VAT, 도메인, 호스팅, 수정 횟수, 유지보수, 이미지 저작권, 데이터 관리, 외부 서비스를 계약 전 확정해야 합니다.',
 '7개 가상 체험과 1개 미구현 기능은 실제 예약·결제·회원·개인정보 저장 시스템이 아닙니다.',
 '작성 내용은 브라우저에서만 보관하며 서버로 자동 전송되지 않습니다.',
 '메일 앱을 열더라도 고객이 직접 보내기를 눌러야 발송됩니다. 이 문서는 계약·견적·실수신 증빙이 아닙니다.',''].join('\n');}
function refresh(){
 $('v87-industry').value=industry;const n=sectors[industry];
 $('v87-selection').textContent=n.name+' · '+stylename[style];$('v87-description').textContent=(n.lead||'')+' · 실제 HTML 가상 시연';
 document.querySelectorAll('[data-style]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.style===style)));
 const params=new URLSearchParams({industry,style});$('v87-demo').href='./experience-v85.html?'+params;
 $('v87-deep-scope').href='./feature-scope-v81.html?'+params;
 if(location.protocol==='http:'||location.protocol==='https:'){const next=new URL(location.href);next.searchParams.set('industry',industry);next.searchParams.set('style',style);history.replaceState(null,'',next.href);}
 $('v87-feature-summary').textContent='선택한 기능 '+selected.size+'/8개';const checks=[...document.querySelectorAll('[data-confirm]')];$('v87-confirm-status').textContent='6가지 협의 항목 중 '+checks.filter(c=>c.checked).length+'개 확인';
 report=buildReport();$('v87-report').textContent=report;
 // Privacy: never place personal notes in the page URL. The mail app only gets the body if the visitor clicks the link.
 const summary=catalogFeatures.filter(f=>selected.has(f.index)).map(f=>'• '+f.title+' ('+(f.planned?'실운영 별도 개발':'가상 시연')+')').join('\n');
 const body=['올파일원 웹스튜디오 홈페이지 제작 상담 요청','업종: '+n.name,'디자인: '+stylename[style],
 '유형: '+planName[currentPlan()],'필요 기능:\n'+(summary||'(선택 없음)'),
 '희망 일정: '+$('v87-timeline').selectedOptions[0].textContent,'예산 방향: '+$('v87-budget').selectedOptions[0].textContent,
 '추가 요청: '+safeText($('v87-notes').value).slice(0,500),
 '','상세 내용은 TXT 첨부 또는 본문 붙여넣기 예정.','메일 앱에서 직접 발송해야 접수됩니다.'].join('\n');
 $('v87-email').href='mailto:nineeyes@naver.com?subject='+encodeURIComponent('홈페이지 제작 상담 요청 · '+n.name)+'&body='+encodeURIComponent(body.slice(0,1800));
}
$('v87-industry').addEventListener('change',e=>{if(keys.includes(e.target.value)){industry=e.target.value;selected=new Set();renderFeatureList();refresh();$('v87-feedback').textContent='업종이 바뀌어 선택 기능을 초기화했습니다. 상담 요청서는 발송되지 않았습니다.';}});
document.querySelectorAll('[data-style]').forEach(b=>b.addEventListener('click',()=>{if(styles.includes(b.dataset.style)){style=b.dataset.style;renderFeatureList();refresh()}}));
document.querySelectorAll('input[name="project-plan"], [data-confirm]').forEach(c=>c.addEventListener('change',refresh));
['v87-timeline','v87-budget','v87-notes'].forEach(id=>$(id).addEventListener('input',refresh));
$('v87-select-all').addEventListener('click',()=>{selected=new Set(catalogFeatures.map(f=>f.index));renderFeatureList();refresh()});
$('v87-clear-all').addEventListener('click',()=>{selected=new Set();renderFeatureList();refresh()});
$('v87-save').addEventListener('click',()=>{const file=new Blob(['\ufeff'+report.replace(/\n/g,'\r\n')],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(file),a=makeElement('a');a.href=url;a.download='AllFileOne_V87_'+industry+'_project_request.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);$('v87-feedback').textContent='TXT 파일 저장 완료. 아직 이메일을 발송하지 않았습니다.';});
$('v87-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(report);$('v87-feedback').textContent='요청서 본문 복사 완료. 이메일 본문에 직접 붙여 넣어 주세요.';}catch(e){$('v87-feedback').textContent='브라우저의 복사 권한이 제한됐습니다. TXT 저장을 이용해 주세요.';}});
$('v87-email').addEventListener('click',()=>{$('v87-feedback').textContent='메일 앱을 엽니다. 보내기를 직접 누르세요. 실제 메일 수신은 확인되지 않았습니다.';});
renderFeatureList();refresh();window.AFO_V87_INQUIRY_READY=true;window.AFO_V87_BUILD_REPORT=()=>report;
})();
