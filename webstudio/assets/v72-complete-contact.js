/* AllFileOne WebStudio V72 — complete, current customer consultation packet.
 * Runs only after an explicitly imported V65.3/V71 precontract brief.
 * Never submits data: clipboard, local TXT, and owner-clicked mailto only.
 */
(()=>{'use strict';
function initialize(){
 const form=document.getElementById('brief-form');
 const imported=document.getElementById('v653-import');
 const pre=document.getElementById('v653-full-brief');
 const actions=document.getElementById('v71-full-actions');
 const standard=document.getElementById('brief-output');
 if(!form||!imported||!pre||!actions||!standard||imported.dataset.v72Ready)return;
 const seed=pre.textContent;
 const feedback=imported.querySelector('.v653-feedback');
 const buttons=actions.querySelectorAll('button');
 const mail=actions.querySelector('#v71-mailto');
 if(buttons.length!==2||!mail)return;
 const baseButtons=['brief-copy','brief-download','brief-email'].map(id=>document.getElementById(id));
 if(baseButtons.some(b=>!b))return;
 // V26's on-page preview is refreshed by its own input/change listener.
 // Capture it only after the form has had an opportunity to refresh.
 function packet(){
  return ['[올파일원 웹스튜디오 / 최종 상담 준비서 — 전체본]',
    '※ 이메일 발송·접수 전입니다. 방문자가 직접 내용을 확인하고 전송해야 합니다.',
    '', '[A. 선택한 업종·디자인·상품·계약 전 확인]',seed,
    '', '[B. 방문자가 마지막으로 수정한 기본 상담서]',standard.textContent,
    '', '※ B의 추가 요청란은 최대 700자입니다. A의 전체 요구사항은 삭제되지 않습니다.',
    '※ 가격·납기·도메인·호스팅·외부 서비스·운영 연동은 계약 전 별도 협의합니다.'].join('\n');
 }
 function refresh(){
  pre.textContent=packet();
  const count=document.getElementById('v72-packet-count');
  if(count)count.textContent='최종 상담 준비서 '+pre.textContent.length.toLocaleString('ko-KR')+'자 · 전체본';
 }
 const count=document.createElement('p');count.id='v72-packet-count';count.className='v72-packet-count';
 const note=document.createElement('p');note.className='v72-packet-note';
 note.textContent='제작 범위와 지금 수정한 상담 내용을 함께 보존합니다. 이 화면의 복사·TXT 버튼은 모두 전체본을 사용합니다. 이메일은 요약문만 열리므로 TXT를 추가로 첨부하거나 붙여넣어 직접 발송하세요.';
 pre.before(count);actions.before(note);
 form.addEventListener('input',()=>queueMicrotask(refresh));
 form.addEventListener('change',()=>queueMicrotask(refresh));
 form.addEventListener('reset',()=>requestAnimationFrame(refresh));
 async function copyFull(){
  try{
   if(typeof navigator.clipboard?.writeText!=='function')throw Error('clipboard-blocked');
   await navigator.clipboard.writeText(packet());
   feedback.textContent='최종 상담 준비서 전체를 복사했습니다. 이메일에서 직접 보내기를 눌러야 접수됩니다.';
  }catch(_){feedback.textContent='자동 복사가 차단되었습니다. 위 전체본을 직접 선택하거나 TXT로 저장해 주세요.';pre.focus();}
 }
 function saveFull(){
  const blob=new Blob(['\ufeff',packet()],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='AllFileOne_V72_Complete_Consultation.txt';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
  feedback.textContent='전체 상담 준비서 TXT 저장을 요청했습니다. 실제 메일 접수는 아닙니다.';
 }
 function mailUrl(){
  const ind=form.elements.namedItem('industry');
  const sector=ind?.selectedOptions?.[0]?.textContent?.trim()||'홈페이지';
  const subject='[올파일원 웹스튜디오] '+sector+' 홈페이지 제작 문의';
  const lines=standard.textContent.split('\n');
  const important=lines.filter(s=>/^(업종|디자인|목표|필요 기능|예산|일정):/.test(s));
  const heading=['안녕하세요. 홈페이지 제작 상담을 요청합니다.',
   '다음은 요약이며 전체 요구사항은 TXT 첨부 또는 별도 붙여넣기로 전달합니다.',
   ...important.slice(0,6)];
  const suffix=['전체 상담 준비서는 별도 첨부합니다. 실제 가격과 납기는 상담 후 확정합니다.',
   '이 이메일은 자동 전송되지 않았으며 직접 보내야 합니다.'];
  const encode=(parts)=>'mailto:nineeyes@naver.com?subject='+encodeURIComponent(subject)+
   '&body='+encodeURIComponent([...parts,...suffix].join('\n'));
  let uri=encode(heading);
  if(uri.length>1750)uri=encode(heading.slice(0,3));
  if(uri.length>1750)uri=encode(['안녕하세요. 홈페이지 제작 문의입니다. 상세 내용은 TXT로 첨부합니다.']);
  return uri;
 }
 function mailNotice(){
  feedback.textContent='이메일 앱에 요약문을 여는 요청을 했습니다. 위 전체 TXT를 별도로 첨부하거나 복사하고, 직접 보내기를 눌러야 실제 전송됩니다.';
 }
 function capture(btn, fn){
  btn.addEventListener('click',event=>{
   event.preventDefault();event.stopImmediatePropagation();fn();
  },true);
 }
 capture(buttons[0],copyFull);capture(buttons[1],saveFull);
 capture(baseButtons[0],copyFull);capture(baseButtons[1],saveFull);
 mail.href=mailUrl();
 mail.addEventListener('click',e=>{
  e.stopImmediatePropagation();mail.href=mailUrl();mailNotice();
 },true);
 capture(baseButtons[2],()=>{mailNotice();window.location.href=mailUrl();});
 baseButtons[0].setAttribute('aria-label','최종 상담 준비서 전체 복사');
 baseButtons[1].setAttribute('aria-label','최종 상담 준비서 전체 TXT 저장');
 baseButtons[2].setAttribute('aria-label','전체 준비서는 별도 첨부해야 하는 요약 이메일 초안 열기');
 imported.dataset.v72Ready='true';
 document.body.dataset.v72Packet='true';
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
else initialize();
window.AFO_V72_PACKET_VERSION='v72.0';
})();