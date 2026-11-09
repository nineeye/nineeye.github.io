/* V88: manual mail fallback only. No POST/GET, storage, analytics, auto send. */
(()=>{'use strict';
 const root=document.querySelector('.v88-fallback');if(!root)return;
 const get=id=>document.getElementById(id), mail=get('v87-email'),status=get('v88-copy-status'),wrap=get('v88-manual-wrap'),txt=get('v88-manual-text');
 const approvedAddress='nineeyes@naver.com';
 function item(kind){const link=mail.getAttribute('href')||'',q=link.indexOf('?'),params=q>=0?new URLSearchParams(link.slice(q+1)):new URLSearchParams();
   if(kind==='to')return approvedAddress;
   if(kind==='subject')return params.get('subject')||'홈페이지 제작 상담 요청';
   if(kind==='body')return params.get('body')||document.getElementById('v87-report')?.textContent||'홈페이지 제작 상담 요청';
   return '';}
 async function copy(kind){const value=item(kind);wrap.hidden=true;txt.value='';
   try{if(!navigator.clipboard||!navigator.clipboard.writeText)throw Error('no-clipboard');await navigator.clipboard.writeText(value);status.textContent=(kind==='to'?'수신 주소':kind==='subject'?'메일 제목':'메일 본문')+'을 복사했습니다. 메일 앱에서 붙여넣고 직접 발송하세요. (수신 확인 안 됨)';}
   catch(_){txt.value=value;wrap.hidden=false;txt.focus();txt.select();status.textContent='자동 복사를 할 수 없습니다. 선택된 내용을 Ctrl+C로 직접 복사하세요. (아직 미발송)';}}
 [['v88-copy-to','to'],['v88-copy-subject','subject'],['v88-copy-body','body']].forEach(([id,kind])=>get(id)?.addEventListener('click',()=>copy(kind)));
 window.AFO_V88_MANUAL_MAIL_READY=true;
})();
