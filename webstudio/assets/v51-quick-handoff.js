/* AllFileOne WebStudio V51: strict, explicit quick-inquiry -> detailed brief bridge.
 * No network, tracking, cookies, automatic email send, payment or user-input URL params.
 * sessionStorage is one-shot and removed before validation on the receiving page.
 */
(()=>{'use strict';
const KEY='afo.webstudio.v51.quickbrief', TTL=15*60*1000;
const SECTORS=Object.freeze({
 ...window.AFO_V55_HANDOFF_SECTORS,
 manufacturing:Object.freeze({catalog:['제품·규격 검색 중심','catalog','showcase'],quote:['품목별 견적 문의 중심','quote','lead'],docs:['카탈로그·도면 자료실 중심',null,'information'],intro:['회사·제품 소개 중심',null,'showcase']}),
 academy:Object.freeze({course:['과정·강좌 소개 중심','catalog','showcase'],schedule:['반별 시간표 안내 중심','calendar','information'],consult:['학부모·학생 상담 안내 중심',null,'lead'],notice:['공지·교육 자료 제공 중심','cms','information']}),
 interior:Object.freeze({portfolio:['시공 사례·포트폴리오 중심','portfolio','showcase'],quote:['지역·면적별 견적 문의 중심','quote','lead'],process:['시공 진행 과정 안내 중심',null,'showcase'],intro:['시공 서비스 소개 중심',null,'showcase']})
});
const SCOPES=Object.freeze({
 ...window.AFO_V55_HANDOFF_SCOPES,manufacturing:{small:'대표 제품 1~20종',medium:'제품 21~100종',large:'제품 101종 이상',unknown:'품목 수 미정'},academy:{small:'강좌 1~5개',medium:'강좌 6~20개',large:'강좌 21개 이상',unknown:'강좌 수 미정'},interior:{small:'사례 1~10건',medium:'사례 11~30건',large:'사례 31건 이상',unknown:'사례 수 미정'}});
const TIMES=Object.freeze({'미정·협의':'flexible','1개월 내 협의':'1month','1~3개월 내 협의':'3months','3개월 이후':'flexible'});
const BUDGETS=Object.freeze({'미정·협의':'unknown','50만원 미만 검토':'under50','50~100만원 검토':'50to100','100~300만원 검토':'100to300','300만원 이상 검토':'over300'});
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k), clean=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
function notify(s){const o=document.getElementById('v51-status');if(o)o.textContent=s;}
function launch(){
 const form=document.getElementById('v49-form');const actions=document.querySelector('.result-actions');
 if(!form||!actions||document.getElementById('v51-to-detail'))return;
 const a=document.createElement('a');a.id='v51-to-detail';a.className='v51-to-detail';a.href='./contact.html?source=quickv51&industry=manufacturing&theme=modern';
 a.textContent='작성 내용 유지하고 상세 상담하기 ↗';
 const help=document.createElement('p');help.className='v51-help';help.textContent='같은 탭에서만 한 번 전달됩니다. 브라우저에 15분 이내 임시 보관하며 상담서가 읽는 즉시 삭제합니다.';
 const st=document.createElement('p');st.id='v51-status';st.className='v51-status';st.setAttribute('role','status');st.setAttribute('aria-live','polite');
 actions.after(a,help,st);
 a.addEventListener('click',e=>{
  if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey){e.preventDefault();notify('개인정보 보호를 위해 같은 탭에서 일반 클릭으로 이동해 주세요.');return;}
  if(!form.checkValidity()){e.preventDefault();form.reportValidity();notify('업종·기능·규모를 먼저 확인해 주세요.');return;}
  const industry=form.querySelector('input[name="industry"]:checked')?.value;
  const feature=form.elements.namedItem('feature')?.value,scope=form.elements.namedItem('scope')?.value;
  const timing=form.elements.namedItem('timing')?.value,budget=form.elements.namedItem('budget')?.value;
  if(!has(SECTORS,industry)||!has(SECTORS[industry],feature)||!has(SCOPES[industry],scope)||!has(TIMES,timing)||!has(BUDGETS,budget)){
   e.preventDefault();notify('현재 선택을 검증할 수 없습니다. TXT 저장 또는 문의 내용 복사를 이용해 주세요.');return;
  }
  const data={v:51,ts:Date.now(),industry,feature,scope,timing,budget,note:clean(form.elements.namedItem('note')?.value,240)};
  try{sessionStorage.setItem(KEY,JSON.stringify(data));a.href='./contact.html?source=quickv51&industry='+encodeURIComponent(industry)+'&theme=modern';}
  catch(_){e.preventDefault();notify('브라우저 임시 저장이 차단되었습니다. TXT 저장 또는 문의 내용 복사를 이용해 주세요.');}
 });
}
function contact(){
 const form=document.getElementById('brief-form');if(!form||document.getElementById('v51-import'))return;
 const q=new URLSearchParams(location.search);if(q.get('source')!=='quickv51')return;
 let text;try{text=sessionStorage.getItem(KEY);sessionStorage.removeItem(KEY);}catch(_){return;}
 if(!text||text.length>1800)return;
 let d;try{d=JSON.parse(text)}catch(_){return}
 if(!d||d.v!==51||!Number.isSafeInteger(d.ts)||d.ts>Date.now()+60000||Date.now()-d.ts>TTL||
   !has(SECTORS,d.industry)||d.industry!==q.get('industry')||!has(SECTORS[d.industry],d.feature)||
   !has(SCOPES[d.industry],d.scope)||!has(TIMES,d.timing)||!has(BUDGETS,d.budget)||
   typeof d.note!=='string'||d.note.length>240||/[\u0000-\u001f\u007f]/.test(d.note))return;
 const info=SECTORS[d.industry][d.feature];const fields=form.elements;
 if(fields.namedItem('industry'))fields.namedItem('industry').value=d.industry;
 if(fields.namedItem('goal'))fields.namedItem('goal').value=info[2];
 if(fields.namedItem('budget'))fields.namedItem('budget').value=BUDGETS[d.budget];
 if(fields.namedItem('timing'))fields.namedItem('timing').value=TIMES[d.timing];
 const feature=info[1];if(feature){const item=[...form.querySelectorAll('input[name="feature"]')].find(e=>e.value===feature);if(item)item.checked=true;}
 const details=fields.namedItem('details');if(!details)return;
 const lines=['[1분 빠른 문의에서 이어쓰기]','가장 필요한 기능: '+info[0], '자료 규모: '+SCOPES[d.industry][d.scope], '일정: '+d.timing,'예산: '+d.budget];
 if(d.note)lines.push('추가 요청: '+d.note);
 const plain=lines.join('\n');const current=clean(details.value,700);const cap=(details.maxLength>0?details.maxLength:700);
 const together=(current?current+'\n\n':'')+plain;
 if(together.length>cap){
  // Data is not silently truncated: show the full original, explain text length limit.
  details.value=(current?current+'\n\n':'')+plain.slice(0,Math.max(0,cap-current.length-(current?2:0)-27))+'\n[상세 내용은 위에서 복사]';
 }else details.value=together;
 const panel=document.createElement('aside');panel.id='v51-import';panel.className='v51-import';panel.setAttribute('aria-label','1분 문의에서 가져온 내용');
 const title=document.createElement('strong');title.textContent='빠른 문의 내용을 이어받았습니다';
 const desc=document.createElement('p');desc.textContent='업종·목표·선택 기능·예산·일정을 상담서에 반영했습니다. 변경이 필요하면 아래에서 수정하세요. 저장이나 전송은 하지 않았습니다.';
 const pre=document.createElement('pre');pre.id='v51-full-brief';pre.textContent=plain;
 const copy=document.createElement('button');copy.type='button';copy.textContent='가져온 내용 전체 복사';
 const msg=document.createElement('p');msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');
 copy.addEventListener('click',async()=>{try{if(typeof navigator.clipboard?.writeText!=='function')throw Error('blocked');await navigator.clipboard.writeText(pre.textContent);msg.textContent='복사했습니다. 직접 이메일에 붙여넣고 발송해 주세요.';}catch(_){msg.textContent='자동 복사 불가. 위 텍스트를 직접 선택해 복사해 주세요.';}});
 panel.append(title,desc,pre,copy,msg);
 if(together.length>cap){const w=document.createElement('p');w.className='v51-warning';w.textContent='상담서 글자 수 제한 때문에 일부 내용이 축약됐습니다. 전체 원문을 복사하여 메일에 추가해 주세요.';panel.append(w);}
 const workspace=document.querySelector('#brief .workspace');(workspace||form).before(panel);
 form.dispatchEvent(new Event('input',{bubbles:true}));
}
function init(){launch();contact()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
