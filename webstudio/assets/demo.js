'use strict';
(()=>{
 const toggle=document.querySelector('.mobile-menu'); const nav=document.querySelector('#demo-nav');
 toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);toggle.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
 nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}));
 document.querySelector('#demo-inquiry')?.addEventListener('click',()=>{document.querySelector('#demo-feedback').textContent='이 페이지는 가상 브랜드의 디자인 샘플입니다. 실제 문의나 예약이 접수되지는 않습니다. 상단의 “이 디자인으로 견적” 버튼을 이용해 주세요.';});
})();
