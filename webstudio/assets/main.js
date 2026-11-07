'use strict';
(() => {
  const root = document;
  const grid = root.getElementById('gallery-grid');
  const filterButtons = [...root.querySelectorAll('.filter')];
  const search = root.getElementById('site-search');
  const styleSelect = root.getElementById('gallery-style');
  const industrySelect = root.getElementById('estimate-industry');
  const planSelect = root.getElementById('estimate-plan');
  const form = root.getElementById('estimate-form');
  const galleryCount = root.getElementById('gallery-count');
  const noResults = root.getElementById('no-results');
  const formatter = new Intl.NumberFormat('ko-KR');
  const plans = {basic:290000, business:590000, advanced:990000};
  const addOns = {catalog:250000,reservation:120000,languages:200000,cms:350000,seo:100000};
  let catalog = [];
  let currentFilter = 'all';
  const qs = new URLSearchParams(window.location.search);
  const desiredIndustry = qs.get('industry');
  const desiredTheme = qs.get('theme');
  if (['modern','premium','editorial'].includes(desiredTheme)) styleSelect.value = desiredTheme;

  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function makeCard(item, index) {
    const article = node('article','gallery-card');
    article.style.setProperty('--card-accent',item.accent);
    article.style.setProperty('--card-soft',item.soft);
    article.style.setProperty('--card-dark',item.dark);
    const art = node('a','card-visual');
    art.href = `demo/${item.id}/${styleSelect.value}/index.html`;
    art.setAttribute('aria-label',`${item.name} ${styleSelect.selectedOptions[0].textContent} 디자인 샘플 열기`);
    const visualTop = node('div','visual-browser');
    const dots = node('span','browser-dots');
    dots.innerHTML = '<i></i><i></i><i></i>';
    visualTop.append(dots,node('span','visual-url',`${item.english.toLowerCase().replaceAll(' ','-')}.example`));
    // V29: Show a real browser capture of this exact industry + style.
    // These are locally-owned V13 demo captures; never an external stock image.
    const vis = node('div','visual-stage v29-shot-stage');
    const image = node('img','v29-real-shot');
    image.src = `assets/v13-shots/${item.id}-${styleSelect.value}.svg`;
    image.alt = `${item.name} · ${styleSelect.selectedOptions[0].textContent} 데모의 실제 화면 캡처`;
    image.loading = index < 3 ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.width = 900; image.height = 563;
    const shotTag = node('span','v29-shot-tag','자체 제작 시연 화면');
    image.addEventListener('error',() => {
      image.src = `assets/scene-${item.id}.svg`;
      image.alt = `${item.name} 업종 설명 일러스트`;
      shotTag.textContent = '일러스트로 대체 표시';
    },{once:true});
    vis.append(image,shotTag);
    const hover = node('span','visual-hover','미리보기 ↗');
    art.append(visualTop,vis,hover);
    const bottom = node('div','card-content');
    const top = node('div','card-category');
    top.append(node('span','card-counter',String(index+1).padStart(2,'0')+' / 12'),node('span','card-category-pill',item.name));
    const title = node('h3','',item.name+' 홈페이지');
    const description = node('p','',item.description);
    const footer = node('div','card-footer');
    const link = node('a','card-link','샘플 체험하기 ↗');
    link.href=art.href;
    const quote = node('button','card-quote','견적 조합 +');
    quote.type='button';
    quote.addEventListener('click',()=>{
      industrySelect.value=item.id;
      calculate();
      root.getElementById('estimate').scrollIntoView({behavior:'smooth'});
    });
    const consult = node('a','card-consult','이 시안으로 상담 ↗');
    consult.href = `contact.html?industry=${encodeURIComponent(item.id)}&theme=${encodeURIComponent(styleSelect.value)}`;
    consult.setAttribute('aria-label',`${item.name} ${styleSelect.selectedOptions[0].textContent} 디자인으로 제작 상담 준비하기`);
    footer.append(link,quote,consult);
    bottom.append(top,title,description,footer);
    article.append(art,bottom);
    return article;
  }
  function render() {
    const keyword = search.value.trim().toLocaleLowerCase('ko-KR');
    const matches = catalog.filter(item => (currentFilter==='all'||item.group===currentFilter)
      && [item.name,item.brand,item.description,...item.tags].join(' ').toLocaleLowerCase('ko-KR').includes(keyword));
    const fragment=document.createDocumentFragment();
    matches.forEach((item,i)=>fragment.append(makeCard(item,i)));
    grid.replaceChildren(fragment);
    galleryCount.textContent=`${matches.length}개 업종 · ${styleSelect.selectedOptions[0].textContent} 스타일의 실제 시연 화면입니다. 샘플은 가상 브랜드로 제작되었으며 고객 납품 실적이 아닙니다.`;
    noResults.hidden=matches.length>0;
  }
  filterButtons.forEach(btn=>btn.addEventListener('click',()=>{
    currentFilter=btn.dataset.filter;
    filterButtons.forEach(b=>{const selected=b===btn;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
    render();
  }));
  search.addEventListener('input',render);
  styleSelect.addEventListener('change',render);
  function calculate() {
    const selectedAddons=[...form.querySelectorAll('input[type=checkbox]:checked')].map(el=>el.value);
    const total=plans[planSelect.value]+selectedAddons.reduce((sum,key)=>sum+addOns[key],0);
    root.getElementById('estimate-result').textContent=`${formatter.format(total/10000)}만원~`;
    const industryName = industrySelect.selectedOptions[0]?.textContent ?? '업종 미선택';
    const planName = planSelect.selectedOptions[0]?.textContent.split(' · ')[0] ?? '';
    root.getElementById('estimate-summary').textContent=`${industryName} · ${planName} · 추가 기능 ${selectedAddons.length}개`;
    return { total, industryName,planName,selectedAddons };
  }
  form.addEventListener('input',calculate);
  form.addEventListener('change',calculate);
  form.addEventListener('reset',()=>setTimeout(()=>{calculate();root.getElementById('copy-feedback').textContent='';},0));
  function quoteText() {
    const q=calculate();
    const labels={catalog:'제품·서비스 카탈로그',reservation:'외부 예약 서비스 연결',languages:'영문 페이지 구성',cms:'콘텐츠 수정 관리 기능',seo:'검색 노출 구조 정리'};
    return ['[올파일원 웹스튜디오 참고 견적]',`업종: ${q.industryName}`,`디자인: ${styleSelect.selectedOptions[0].textContent}`,`기본 상품: ${q.planName}`,`추가 기능: ${q.selectedAddons.length?q.selectedAddons.map(x=>labels[x]).join(', '):'없음'}`,`예상 금액: ${formatter.format(q.total)}원부터`,'※ 기획 단계의 예시 금액입니다. 확정 견적이 아니며 부가세·외부 서비스·유지보수 등은 별도입니다.'].join('\n');
  }
  async function copyText(value){
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);return;
    }
    const box=node('textarea');box.value=value;box.setAttribute('readonly','');
    box.style.position='fixed';box.style.top='-10000px';
    document.body.append(box);box.select();
    const copied=document.execCommand('copy');box.remove();
    if (!copied) throw new Error('copy unavailable');
  }
  root.getElementById('copy-estimate').addEventListener('click',async()=>{
    const info=root.getElementById('copy-feedback');
    try {await copyText(quoteText());info.textContent='견적 내용이 복사되었습니다. 상담 접수는 아직 연결되지 않았습니다.';}
    catch {info.textContent='자동 복사가 불가능한 환경입니다. HTTPS로 접속하여 다시 시도해 주세요.';}
  });

root.getElementById('download-estimate').addEventListener('click',()=>{
  const text = quoteText() + '\n\n[상담 전에 정리할 사항]\n홈페이지의 목적: \n필요한 페이지: \n원하는 제작 시기: \n참고 사이트: \n';
  const blob = new Blob(['\uFEFF',text],{type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = node('a');
  a.href = url;
  a.download = 'allfileone_website_brief.txt';
  document.body.append(a);
  a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  root.getElementById('copy-feedback').textContent='구성서를 다운로드했습니다. 파일은 이 브라우저에서 생성되며 서버로 전송되지 않습니다.';
});
  const email=(window.WEBSTUDIO_CONFIG?.contactEmail||'').trim();
  const mailLink=root.getElementById('mail-estimate');
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    mailLink.hidden=false;
    mailLink.href=`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('[올파일원 웹스튜디오] 홈페이지 제작 문의')}`;
    mailLink.addEventListener('click',()=>{mailLink.href=`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('[올파일원 웹스튜디오] 홈페이지 제작 문의')}&body=${encodeURIComponent(quoteText())}`;});
    root.getElementById('lead-note').textContent='견적 문의는 방문자의 기본 이메일 앱을 통해 작성됩니다. 전송 여부는 이메일 앱에서 확인해야 합니다.';
  }
  root.querySelectorAll('.price-choose').forEach(btn=>btn.addEventListener('click',()=>{
    planSelect.value=btn.dataset.plan;calculate();root.getElementById('estimate').scrollIntoView({behavior:'smooth'});
  }));
  const toggle=root.getElementById('mobile-toggle');
  const nav=root.getElementById('nav-links');
  toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);toggle.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','메뉴 열기');}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}});
  try {
    const data=window.WEBSTUDIO_CATALOG;
    if(!data || !Array.isArray(data.industries))throw new Error('catalog missing');
    catalog=data.industries;
    const fragment=document.createDocumentFragment();
    for(const item of catalog){const option=node('option','',item.name);option.value=item.id;fragment.append(option);}
    industrySelect.append(fragment);
    if(catalog.some(item=>item.id===desiredIndustry))industrySelect.value=desiredIndustry;
    render();calculate();
  } catch {
    galleryCount.textContent='샘플 데이터를 읽지 못했습니다. 페이지를 새로고침해 주세요.';
    noResults.hidden=false;
    noResults.textContent='배포 파일에 assets/catalog.js가 포함되어 있는지 확인해 주세요.';
  }
})();

/* V4 accessible animations */
'use strict';
(()=>{
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 if(!('IntersectionObserver' in window))return;
 const targets=[...document.querySelectorAll('.section-head,.gallery-card,.solution-card,.value-grid article,.price-card,.delivery-steps article,.proof-choices a')];
 targets.forEach((el,i)=>{el.classList.add('observe-reveal');el.style.setProperty('--reveal-delay',(i%3)*70+'ms');});
 const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}});},{threshold:.08,rootMargin:'0px 0px 10px 0px'});
 targets.forEach(el=>observer.observe(el));
 // Cards created after the initial script (catalog).
 const grid=document.getElementById('gallery-grid');
 if(grid){const cards=new MutationObserver(()=>{grid.querySelectorAll('.gallery-card:not(.observe-reveal)').forEach((el,i)=>{el.classList.add('observe-reveal');el.style.setProperty('--reveal-delay',(i%3)*65+'ms');observer.observe(el);});});cards.observe(grid,{childList:true});}
})();
