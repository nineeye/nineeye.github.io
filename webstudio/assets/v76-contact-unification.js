/* AllFileOne WebStudio V76 — one authoritative consultation packet for legacy controls.
   Activates ONLY when a V65.3 imported brief has V72's complete packet panel.
   Zero API calls, no storage, no automatic mail, no promise of delivery. */
(()=>{'use strict';
 const RECIPIENT='nineeyes@naver.com';
 const MAX_CHARS=100000;
 function init(){
   const form=document.getElementById('brief-form');
   const imported=document.getElementById('v653-import');
   const authoritative=document.getElementById('v653-full-brief');
   if(!form||!imported||imported.dataset.v72Ready!=='true'||!authoritative||document.body.dataset.v76Unified)return;
   const nodes={
     copyOld:document.getElementById('v42-copy-complete'),
     copyAll:document.getElementById('v47-copy-all'),
     downloadAll:document.getElementById('v47-download-all'),
     inspect:document.getElementById('v47-show-all'),
     print:document.getElementById('brief-print'),
     review:document.getElementById('v47-review'),
     preview:document.getElementById('v47-review-text')
   };
   const statuses={
     copyOld:document.getElementById('v42-copy-feedback'),
     copyAll:document.getElementById('v47-status'),
     downloadAll:document.getElementById('v47-status'),
     inspect:document.getElementById('v47-status'),
     print:document.getElementById('brief-feedback')
   };
   function status(key,message){if(statuses[key])statuses[key].textContent=message;}
   function whole(){
     // V72 recomputes this from the most recent form input and preserves an
     // earlier quote as reference-only if industry/design changed (V73).
     const current=authoritative.textContent.trim();
     const sector=form.elements.namedItem('industry')?.selectedOptions?.[0]?.textContent.trim()||'홈페이지';
     const subject='[올파일원 웹스튜디오] '+sector.slice(0,75)+' 홈페이지 제작 문의';
     const out=['받는 사람: '+RECIPIENT,'제목: '+subject,'',current];
     // V46 start-kit is additional work, never silently drop it from V47's flow.
     const kit=document.getElementById('v46-full-report')?.textContent.trim();
     if(kit&&!current.includes(kit))out.push('','[추가 자료: 시작 준비키트 전체본]',kit);
     out.push('','※ 이 파일 복사·저장·인쇄는 실제 이메일 발송이나 접수가 아닙니다. 사용 중인 웹메일에서 직접 보내기를 눌러주세요.');
     const result=out.join('\n');
     return current.length&&result.length<=MAX_CHARS?result:null;
   }
   function validate(key){
     if(!form.checkValidity()){
       form.reportValidity?.();
       status(key,'업종과 제작 목적을 선택해야 합니다. 아직 상담이 전송되지 않았습니다.');
       return null;
     }
     const value=whole();
     if(!value)status(key,'전체 상담 준비서를 만들 수 없습니다. 원본 내용과 글자 수를 확인해 주세요.');
     return value;
   }
   function bind(button,key,fn){
     if(!button)return;
     button.addEventListener('click',event=>{
       // The earlier V42/V47/V34 handlers use the shortened preview. Prevent
       // those handlers only when the V72 full brief is available.
       event.preventDefault();event.stopImmediatePropagation();fn(key);
     },true);
   }
   async function copy(key){
     const text=validate(key);if(!text)return;
     try{
       if(typeof navigator.clipboard?.writeText!=='function')throw Error('clipboard unavailable');
       await navigator.clipboard.writeText(text);
       status(key,'마지막 수정사항을 포함한 전체 상담서를 복사했습니다. 아직 메일이 발송되지는 않았습니다.');
     }catch(_){
       if(nodes.review&&nodes.preview){
         nodes.preview.textContent=text;nodes.review.hidden=false;nodes.preview.focus();
       }
       status(key,'자동 복사가 제한됐습니다. 전체 내용을 직접 선택하거나 TXT로 저장해 주세요. 아직 발송되지 않았습니다.');
     }
   }
   function save(key){
     const text=validate(key);if(!text)return;
     const blob=new Blob(['\ufeff',text],{type:'text/plain;charset=utf-8'});
     const url=URL.createObjectURL(blob), a=document.createElement('a');
     a.href=url;a.download='AllFileOne_V76_Complete_Inquiry.txt';document.body.append(a);
     a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
     status(key,'최종 전체 상담서 TXT 저장을 요청했습니다. 이메일에 첨부하고 직접 보내기를 눌러야 합니다.');
   }
   function inspect(key){
     const text=validate(key);if(!text)return;
     if(!nodes.review||!nodes.preview)return;
     nodes.preview.textContent=text;
     nodes.review.hidden=!nodes.review.hidden;
     if(nodes.inspect)nodes.inspect.textContent=nodes.review.hidden?'보낼 내용 확인':'미리보기 닫기';
     status(key,nodes.review.hidden?'미리보기를 닫았습니다.':'실제 발송 전 최종 상담서 전체 내용을 표시합니다.');
   }
   function print(key){
     const text=validate(key);if(!text)return;
     status(key,'인쇄·PDF에는 현재 업종과 마지막 수정내용이 포함된 전체 상담서가 표시됩니다. 이메일 전송은 아닙니다.');
     window.print();
   }
   bind(nodes.copyOld,'copyOld',copy);
   bind(nodes.copyAll,'copyAll',copy);
   bind(nodes.downloadAll,'downloadAll',save);
   bind(nodes.inspect,'inspect',inspect);
   bind(nodes.print,'print',print);
   document.body.dataset.v76Unified='true';
   for(const n of [nodes.copyOld,nodes.copyAll,nodes.downloadAll,nodes.inspect,nodes.print]){
     if(n)n.dataset.v76Complete='true';
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
 window.AFO_V76_CONTACT_UNIFICATION='v76.0';
})();