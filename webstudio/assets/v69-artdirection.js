/* WebStudio V69 · first-party signature art-direction for all 36 fictional demos.
   Decorative enhancement only: existing functional V23/V28/V66 scripts remain the owners
   of the actual working tools. No network, no customer data, no paid API. */
(() => {
  'use strict';
  const STYLES = Object.freeze({
    modern: {eyebrow:'01 / SYSTEM', title:'Clear by design', detail:'정보와 기능을 빠르게 찾는 모던 인터페이스'},
    premium: {eyebrow:'02 / ATELIER', title:'Crafted presence', detail:'몰입감 있는 브랜드 중심 프리미엄 무대'},
    editorial: {eyebrow:'03 / JOURNAL', title:'Stories matter', detail:'큰 활자와 비대칭 여백의 에디토리얼 레이아웃'}
  });
  const EDITIONS = Object.freeze({
    manufacturing:'INDUSTRY / 01', corporate:'CORPORATE / 02', clinic:'CARE / 03',
    academy:'EDUCATION / 04', interior:'SPACES / 05', commerce:'OBJECTS / 06',
    professional:'ADVISORY / 07', association:'COMMUNITY / 08',franchise:'BRANDS / 09',
    stay:'RETREATS / 10', realestate:'PROPERTY / 11', event:'EVENTS / 12'
  });
  const add=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;n.textContent=text;return n;};
  function init(){
    const body=document.body, sector=body?.dataset.v13Industry,
          style=body?.dataset.v13Style, edition=EDITIONS[sector], identity=STYLES[style];
    const hero=document.querySelector('.hero.v23-hero');
    const shell=hero?.querySelector('.v23-hero-shell');
    if(!identity||!edition||!shell||body.dataset.v69Ready==='true')return false;
    const signature=add('div','v69-hero-signature','');
    signature.setAttribute('aria-label',style+' 디자인 방향');
    signature.append(add('span','v69-signature-id',identity.eyebrow),
                     add('strong','v69-signature-name',identity.title),
                     add('small','v69-signature-sector',edition));
    shell.append(signature);
    const note=add('div','v69-design-identity',identity.detail);
    const copy=hero.querySelector('.v23-hero-copy');
    if(copy)copy.append(note);
    // Add a tiny explanatory marker to the style switcher without rewriting any links.
    const chooser=document.querySelector('.v37-chooser-intro small');
    if(chooser)chooser.textContent='선택한 디자인: '+identity.detail+' · 다른 스타일도 바로 비교 가능';
    body.dataset.v69Ready='true';
    return true;
  }
  function boot(){
    if(init())return;
    const main=document.querySelector('main');if(!main)return;
    // V23 creates its hero asynchronously. Wait for its real markup, not a timer.
    const observer=new MutationObserver(()=>{if(init())observer.disconnect();});
    observer.observe(main,{subtree:true,childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.AFO_V69_DESIGN_EDITION='v69.0';
})();