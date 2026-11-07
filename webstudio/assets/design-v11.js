'use strict';
(() => {
  const available = {
    wholesale: {title:'01 — B2B 자동 견적 시스템',img:'assets/wholesale-feature.svg',url:'specialty/wholesale.html',alt:'실제 도매몰 시연 화면. 고객이 거래 등급과 수량을 선택해 견적을 계산할 수 있습니다.'},
    academybooking: {title:'02 — 학원 시간표·예약 시연',img:'assets/academybooking-feature.svg',url:'specialty/academybooking.html',alt:'실제 교육업 시연 화면. 고객이 수업과 예약 날짜 및 시간을 선택할 수 있습니다.'},
    renovation: {title:'03 — 인테리어 예시 견적',img:'assets/renovation-feature.svg',url:'specialty/renovation.html',alt:'실제 시공업 시연 화면. 면적과 마감재를 선택해 예시 견적을 계산할 수 있습니다.'}
  };
  const buttons = [...document.querySelectorAll('[data-view]')];
  const img = document.getElementById('hero-demo-image');
  const link = document.getElementById('hero-demo-link');
  const label = document.getElementById('hero-demo-title');
  buttons.forEach(button => button.addEventListener('click', () => {
    const selected = available[button.dataset.view];
    if (!selected) return;
    img.src = selected.img;
    img.alt = selected.alt;
    link.href = selected.url;
    label.textContent = selected.title;
    buttons.forEach(b => {
      const active = b === button;
      b.classList.toggle('active',active);
      b.setAttribute('aria-pressed', String(active));
    });
  }));
  const menuButton=document.getElementById('menu-toggle');
  const nav=document.getElementById('main-nav');
  function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','메뉴 열기');nav.classList.remove('is-open');}
  menuButton.addEventListener('click',()=>{
    const open=menuButton.getAttribute('aria-expanded')!=='true';
    menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');nav.classList.toggle('is-open',open);
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeMenu();});
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elements=[...document.querySelectorAll('.reveal')];
  if(reduce||!('IntersectionObserver' in window)){
    elements.forEach(el=>el.classList.add('is-visible'));
  }else{
    const observer=new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:0.08,rootMargin:'0px 0px 20px 0px'});
    elements.forEach(el=>observer.observe(el));
  }
})();
