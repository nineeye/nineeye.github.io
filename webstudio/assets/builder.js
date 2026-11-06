'use strict';
(() => {
  const INDUSTRIES = [
    {id:'manufacturing',name:'제조 · 도매',brand:'모노팩토리',headline:'기술의 차이를, 신뢰의 가치로.',desc:'현장에서 필요한 제품과 솔루션을 정확하게 제안합니다.',label:'INDUSTRIAL SOLUTIONS',services:['정밀 부품·자재','제품 규격·자료실','납품·견적 문의'],strength:'제품 정보가 이해되는 구조',benefit:'제품 규격부터 공급 역량까지, 고객이 빠르게 비교할 수 있도록 설명합니다.'},
    {id:'corporate',name:'기업 · 회사소개',brand:'오름파트너스',headline:'사업의 다음 가능성을 만듭니다.',desc:'고객의 성공을 위해 전문성과 실행력을 연결합니다.',label:'BUSINESS PARTNERS',services:['기업 비전·연혁','서비스·사업영역','프로젝트·문의'],strength:'첫인상이 신뢰로 이어지도록',benefit:'회사의 경쟁력과 핵심 메시지를 분명하게 전달하는 구성입니다.'},
    {id:'clinic',name:'병원 · 의원',brand:'온유메디컬',headline:'당신의 건강한 일상을 함께합니다.',desc:'진료 정보와 의료진 안내를 더 친절하고 명확하게 전달합니다.',label:'PATIENT EXPERIENCE',services:['진료과목 안내','의료진·진료 일정','오시는 길·문의'],strength:'필요한 진료 정보를 빠르게',benefit:'지점·진료과·일정을 쉽게 찾을 수 있는 환자 중심의 안내 구성입니다.'},
    {id:'academy',name:'학원 · 교육',brand:'배움클래스',headline:'배우는 즐거움이 성장을 만듭니다.',desc:'좋은 수업이 필요한 사람을 만나는 공간을 설계합니다.',label:'EDUCATION & LEARNING',services:['강좌·교육과정','시간표·강사진','수강 상담 안내'],strength:'수업 선택까지 자연스럽게',benefit:'과정별 대상·일정·특징을 한눈에 비교하도록 돕습니다.'},
    {id:'interior',name:'인테리어 · 시공',brand:'결스페이스',headline:'공간에 새로운 일상을 더합니다.',desc:'다양한 공간에 꼭 맞는 디자인과 시공 솔루션을 소개합니다.',label:'SPACE & RENOVATION',services:['시공 프로젝트','자재·공간 소개','상담·견적 안내'],strength:'시공 경험을 보여주는 포트폴리오',benefit:'현장 조건과 공사 유형을 비교하는 고객을 위한 정보 구조입니다.'},
    {id:'commerce',name:'브랜드 · 쇼핑몰',brand:'모먼트샵',headline:'좋은 제품의 가치를 발견하세요.',desc:'브랜드의 이야기를 일상 속 즐거운 경험으로 연결합니다.',label:'BRAND & COMMERCE',services:['브랜드 스토리','대표 상품 소개','상품·구매 문의'],strength:'제품을 고르는 즐거움',benefit:'상품을 돋보이게 하고 구매 전 궁금한 정보를 알기 쉽게 설명합니다.'},
    {id:'professional',name:'법률 · 세무 · 회계',brand:'정온파트너스',headline:'복잡한 문제에 명확한 방향을.',desc:'고객의 중요한 판단을 돕는 전문 상담 서비스를 안내합니다.',label:'PROFESSIONAL SERVICES',services:['전문 업무 분야','상담 안내','자주 묻는 질문'],strength:'전문 영역을 명확하게 설명',benefit:'상담 전 필요한 범위와 진행 과정을 투명하게 제공합니다.'},
    {id:'association',name:'협회 · 단체',brand:'우리연결협회',headline:'함께하는 가치가 변화를 만듭니다.',desc:'회원과 공동체를 연결하는 소통의 중심이 됩니다.',label:'COMMUNITY NETWORK',services:['협회 소개','공지·자료실','회원 안내'],strength:'구성원 모두를 위한 정보',benefit:'필요한 공지와 자료에 쉽고 빠르게 접근하도록 설계합니다.'},
    {id:'franchise',name:'프랜차이즈 · 창업',brand:'브랜드온',headline:'좋은 창업의 시작, 좋은 파트너.',desc:'브랜드 경쟁력과 가맹 안내를 간결하게 소개합니다.',label:'FRANCHISE & PARTNERS',services:['브랜드 소개','가맹 절차','창업 상담'],strength:'신뢰할 수 있는 가맹 안내',benefit:'창업 희망자가 궁금해하는 정보와 상담 흐름을 자연스럽게 연결합니다.'},
    {id:'stay',name:'숙박 · 펜션',brand:'노크스테이',headline:'쉼이 특별해지는 하루.',desc:'머무는 순간을 기대하게 만드는 공간의 이야기를 전합니다.',label:'STAY & HOSPITALITY',services:['객실·시설 소개','요금·이용 안내','예약 문의'],strength:'머무는 경험을 먼저 보여드립니다',benefit:'객실 유형과 시설·이용 안내를 한눈에 살펴보도록 구성합니다.'},
    {id:'realestate',name:'부동산 · 분양',brand:'도시포인트',headline:'다음 공간의 가치를 발견하다.',desc:'지역과 입지, 공간 정보를 보기 쉽게 소개합니다.',label:'PROPERTY & PLACE',services:['매물·사업지 소개','위치·입지 정보','상담·문의'],strength:'선택에 필요한 정보를 먼저',benefit:'비교 포인트를 구조화해 고객이 궁금한 사항을 찾기 쉽게 합니다.'},
    {id:'event',name:'행사 · 캠페인',brand:'모먼트페스타',headline:'사람과 이야기가 만나는 순간.',desc:'기억에 남는 이벤트와 참여 경험을 설계합니다.',label:'EVENTS & CAMPAIGNS',services:['행사 소개','프로그램·일정','참여 안내'],strength:'행사 정보를 한눈에',benefit:'일정·프로그램·참여 방법을 명확한 동선으로 연결합니다.'}
  ];
  const PALETTES = {
    teal:{accent:'#197b73',dark:'#0f3739',surface:'#e8f5f0'},
    blue:{accent:'#2758ab',dark:'#182c52',surface:'#eaf0fa'},
    violet:{accent:'#7255a8',dark:'#292042',surface:'#f2edfa'},
    coral:{accent:'#bc6254',dark:'#492c2a',surface:'#faeee9'},
    forest:{accent:'#29754d',dark:'#173b2d',surface:'#e8f4ea'},
    slate:{accent:'#3b5565',dark:'#202e3c',surface:'#eef2f5'}
  };
  const STYLES = ['modern','premium','editorial'];
  const KEY = 'allfileone_webstudio_builder_v7';
  const byId = id => document.getElementById(id);
  const industry = byId('industry'), brand=byId('brand'), headline=byId('headline');
  const description=byId('description'), email=byId('contact-email');
  const preview=byId('preview-site'), stage=byId('preview-stage');
  const feedback=byId('export-feedback'), previewNote=byId('preview-note');
  const escapeHtml = input => String(input).replace(/[&<>"']/g, char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const getIndustry = id => INDUSTRIES.find(item=>item.id===id) || INDUSTRIES[0];
  const getRadio = name => document.querySelector('input[name="'+name+'"]:checked')?.value;
  const field = name => document.querySelector('input[name="'+name+'"]').checked;
  const limit = (input,max) => typeof input==='string' ? input.slice(0,max) : '';
  const allow = (input,list,fallback) => list.includes(input) ? input : fallback;
  const initial = () => ({industry:'manufacturing',brand:'모노팩토리',headline:INDUSTRIES[0].headline,description:INDUSTRIES[0].desc,email:'',style:'modern',accent:'teal',services:true,strengths:true,contact:true});
  const fromObject = value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('올바른 JSON 설정 파일이 아닙니다.');
    const base = initial();
    const ind = getIndustry(value.industry);
    return {
      industry:ind.id,brand:limit(value.brand,45) || ind.brand,
      headline:limit(value.headline,90) || ind.headline,
      description:limit(value.description,220) || ind.desc,
      email:limit(value.email,120),
      style:allow(value.style,STYLES,'modern'),accent:allow(value.accent,Object.keys(PALETTES),'teal'),
      services:typeof value.services==='boolean'?value.services:base.services,
      strengths:typeof value.strengths==='boolean'?value.strengths:base.strengths,
      contact:typeof value.contact==='boolean'?value.contact:base.contact
    };
  };
  function getState(){return {industry:industry.value,brand:brand.value,headline:headline.value,description:description.value,email:email.value,style:getRadio('style')||'modern',accent:getRadio('accent')||'teal',services:field('services'),strengths:field('strengths'),contact:field('contact')};}
  function setState(s){
    const state = fromObject(s);
    industry.value=state.industry;brand.value=state.brand;headline.value=state.headline;
    description.value=state.description;email.value=state.email;
    document.querySelector('input[name="style"][value="'+state.style+'"]').checked=true;
    document.querySelector('input[name="accent"][value="'+state.accent+'"]').checked=true;
    for(const key of ['services','strengths','contact']) document.querySelector('input[name="'+key+'"]').checked=state[key];
  }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(getState()));}catch{previewNote.textContent='브라우저 저장 기능을 사용할 수 없습니다. JSON 파일로 설정을 저장해 주세요.';}}
  function refresh(save=true){
    const state=getState(), industryData=getIndustry(state.industry), palette=PALETTES[state.accent]||PALETTES.teal;
    preview.style.setProperty('--accent',palette.accent);preview.style.setProperty('--dark',palette.dark);preview.style.setProperty('--surface',palette.surface);
    preview.dataset.style=state.style;
    byId('p-brand').textContent=state.brand.trim()||'브랜드명을 입력하세요';
    byId('p-footer-brand').textContent=state.brand.trim()||'YOUR BRAND';
    byId('p-headline').textContent=state.headline.trim()||'메인 제목을 입력하세요';
    byId('p-description').textContent=state.description.trim()||'고객에게 전하고 싶은 소개 문구를 작성해 보세요.';
    byId('p-kicker').textContent=industryData.label+' / WEB EXPERIENCE';
    byId('p-strength-title').textContent=industryData.strength;
    byId('p-strength-desc').textContent=industryData.benefit;
    byId('p-contact-address').textContent=state.email.trim()||'고객 문의 이메일은 추후 추가할 수 있습니다.';
    byId('p-cta').textContent=state.contact?'문의 살펴보기 ↗':state.services?'서비스 살펴보기 ↗':'더 알아보기 ↗';
    byId('p-services').hidden=!state.services;byId('p-strengths').hidden=!state.strengths;byId('p-contact').hidden=!state.contact;
    const grid=byId('p-service-grid');grid.replaceChildren();
    industryData.services.forEach((title,i)=>{
      const item=document.createElement('div');item.className='preview-service';
      const number=document.createElement('span');number.textContent='0'+(i+1);
      const label=document.createElement('b');label.textContent=title;
      const desc=document.createElement('small');desc.textContent='핵심 정보를 알기 쉽게 전달합니다.';
      item.append(number,label,desc);grid.append(item);
    });
    if(save) persist();
  }
  function validate(){
    if(!brand.value.trim() || !headline.value.trim()){
      feedback.textContent='브랜드명과 메인 제목은 비워둘 수 없습니다.';
      (!brand.value.trim()?brand:headline).focus();return false;
    }
    if(email.value.trim() && !email.validity.valid){
      feedback.textContent='이메일 형식을 확인해 주세요.';email.focus();return false;
    }
    return true;
  }
  const downloadable = (name,content,type) => {
    const blob=new Blob(['\uFEFF',content],{type});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
  function exportHtml(state){
    const data=getIndustry(state.industry),palette=PALETTES[state.accent]||PALETTES.teal;
    const title=escapeHtml(state.brand.trim()),h1=escapeHtml(state.headline.trim()),desc=escapeHtml(state.description.trim());
    const emailAddress=state.email.trim();
    const contactHref=state.contact?'#contact':state.services?'#services':state.strengths?'#about':'#top';
    const nav=(state.services?'<a href="#services">서비스</a>':'')+(state.strengths?'<a href="#about">소개</a>':'')+(state.contact?'<a href="#contact">문의</a>':'');
    const services=state.services?'<section id="services" class="section"><div class="shell"><span class="eyebrow">OUR SERVICES</span><h2>어떤 서비스를 제공하나요?</h2><div class="services">'+data.services.map((s,i)=>'<article><span>0'+(i+1)+'</span><h3>'+escapeHtml(s)+'</h3><p>핵심 정보를 이해하기 쉽게 구성했습니다.</p></article>').join('')+'</div></div></section>':'';
    const strength=state.strengths?'<section id="about" class="about"><div class="shell"><span class="eyebrow">WHY CHOOSE US</span><h2>'+escapeHtml(data.strength)+'</h2><p>'+escapeHtml(data.benefit)+'</p></div></section>':'';
    const address=emailAddress&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)?'<a href="mailto:'+encodeURIComponent(emailAddress)+'">'+escapeHtml(emailAddress)+'</a>':'<span>업무용 문의 주소 준비 중</span>';
    const contact=state.contact?'<section id="contact" class="contact"><div class="shell"><span class="eyebrow">CONTACT</span><h2>함께할 다음 프로젝트를 이야기하세요.</h2><p>아래 연락처로 직접 문의해 주세요.</p>'+address+'</div></section>':'';
    const font=state.style==='premium'?'Georgia, "Noto Serif KR", serif':'system-ui, -apple-system, "Malgun Gothic", sans-serif';
    const heroText=state.style==='editorial'?palette.dark:'#fff';const heroBg=state.style==='editorial'?palette.surface:palette.dark;
    const css=`:root{font-family:${font};color:${palette.dark};background:#fff;--accent:${palette.accent};--dark:${palette.dark};--surface:${palette.surface}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;min-width:320px}a{color:inherit}a:focus-visible{outline:3px solid var(--accent);outline-offset:4px}.shell{width:min(1120px,calc(100% - 42px));margin:auto}.header{display:flex;gap:20px;align-items:center;justify-content:space-between;padding:26px 0}.header b{font-size:21px;letter-spacing:-.05em;overflow-wrap:anywhere}.header nav{display:flex;gap:21px;font-size:13px;font-weight:700}.header a{text-decoration:none}.hero{position:relative;overflow:hidden;background:${heroBg};color:${heroText};padding:110px 0 115px;${state.style==='premium'?'text-align:center;':''}}.hero .shell{position:relative;z-index:1}.eyebrow{font-size:11px;letter-spacing:.17em;font-weight:850}.hero .eyebrow{opacity:.75}.hero h1{font-size:clamp(39px,6vw,77px);max-width:860px;letter-spacing:-.075em;line-height:1.19;overflow-wrap:anywhere;margin:20px 0;${state.style==='premium'?'margin-left:auto;margin-right:auto;':''}}.hero p{max-width:610px;line-height:1.85;font-size:16px;opacity:.8;${state.style==='premium'?'margin-left:auto;margin-right:auto;':''}}.cta{display:inline-block;margin-top:20px;border-radius:8px;background:var(--accent);padding:14px 21px;color:#fff;text-decoration:none;font-size:13px;font-weight:800}.decor{position:absolute;right:-70px;top:20px;width:340px;height:340px;border:1px solid currentColor;border-radius:50%;opacity:.10;box-shadow:0 0 0 60px currentColor,0 0 0 120px currentColor;pointer-events:none}.section,.about,.contact{padding:92px 0}.section h2,.about h2,.contact h2{font-size:clamp(28px,4vw,45px);letter-spacing:-.06em;line-height:1.2}.services{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px;margin-top:31px}.services article{border:1px solid #dce8e2;border-radius:12px;padding:25px}.services article span{color:var(--accent);font-size:13px;font-weight:850}.services article h3{font-size:19px;letter-spacing:-.04em}.services article p,.about p,.contact p{color:#617876;line-height:1.8;font-size:14px}.about{background:var(--surface)}.about h2{max-width:680px}.contact a{font-weight:800;color:var(--accent)}footer{background:var(--dark);color:#dbebe4;padding:29px 0;font-size:12px}footer .shell{display:flex;justify-content:space-between;gap:16px}footer small{opacity:.75}@media(max-width:650px){.header{align-items:flex-start;flex-direction:column}.header nav{flex-wrap:wrap}.hero{padding:77px 0 85px}.services{grid-template-columns:1fr}.section,.about,.contact{padding:67px 0}footer .shell{flex-direction:column}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}`;
    return '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="description" content="'+escapeHtml(state.description.trim()||state.headline.trim())+'"><title>'+title+' | 홈페이지 디자인 시안</title><style>'+css+'</style></head><body id="top"><!-- 올파일원 웹스튜디오: 이 파일은 실제 사이트 시안입니다. 실서비스 운영 전에 콘텐츠·기능·법률 안내 검증 필요. --><header class="header shell"><b>'+title+'</b><nav aria-label="주요 메뉴">'+nav+'</nav></header><main><section class="hero"><div class="decor" aria-hidden="true"></div><div class="shell"><span class="eyebrow">'+escapeHtml(data.label)+'</span><h1>'+h1+'</h1><p>'+desc+'</p><a class="cta" href="'+contactHref+'">'+(state.contact?'문의하기':'더 알아보기')+' ↗</a></div></section>'+services+strength+contact+'</main><footer><div class="shell"><span>© '+title+'</span><small>ALLFILEONE WEB STUDIO · 디자인 시안 (운영판 아님)</small></div></footer></body></html>\n';
  }
  function brief(state){
    const data=getIndustry(state.industry);
    return ['[올파일원 웹스튜디오] 홈페이지 시안 제작 요청서','',
      '업종: '+data.name,'회사·브랜드: '+state.brand.trim(),'메인 제목: '+state.headline.trim(),
      '소개 문구: '+state.description.trim(),'문의 이메일: '+(state.email.trim()||'미정'),
      '디자인 스타일: '+({modern:'모던',premium:'프리미엄',editorial:'에디토리얼'}[state.style]),
      '대표 컬러: '+state.accent,'서비스·제품 소개: '+(state.services?'표시':'숨김'),
      '강점 영역: '+(state.strengths?'표시':'숨김'),'문의 영역: '+(state.contact?'표시':'숨김'),
      '추천 서비스 구성: '+data.services.join(' / '),'',
      '[실제 제작 전 확정할 항목]','1. 도메인·호스팅·계정 소유권','2. 콘텐츠 최종본과 이미지 저작권','3. 실제 운영 기능(DB/예약/주문/관리자)','4. 개인정보 처리·보안 및 외부 서비스 비용','5. 테스트·검수·납품·유지보수 범위','',
      '※ 본 내용은 사용자의 브라우저에서 작성한 참고용 문서이며, 문의·계약·결제 접수가 아닙니다.',
      '상담: nineeyes@naver.com'].join('\n');
  }
  INDUSTRIES.forEach(item=>{const op=document.createElement('option');op.value=item.id;op.textContent=item.name;industry.append(op);});
  try{const saved=localStorage.getItem(KEY);if(saved){setState(JSON.parse(saved));previewNote.textContent='이 브라우저에 저장된 이전 편집 내용을 불러왔습니다. 서버에는 저장되지 않습니다.';}else setState(initial());}catch{setState(initial());}
  byId('builder-form').addEventListener('submit',evt=>evt.preventDefault());
  byId('builder-form').addEventListener('input',()=>refresh());
  byId('builder-form').addEventListener('change',()=>refresh());
  industry.addEventListener('change',()=>{
    const data=getIndustry(industry.value);
    headline.value=data.headline;description.value=data.desc;
    // Keep a manually entered brand name; only update the default sample name.
    if(INDUSTRIES.some(item=>item.brand===brand.value.trim()))brand.value=data.brand;
    refresh();previewNote.textContent='선택한 업종의 기본 문구가 적용됐습니다. 회사명은 필요에 따라 수정해 주세요.';
  });
  byId('reset-preset').addEventListener('click',()=>{const data=getIndustry(industry.value);headline.value=data.headline;description.value=data.desc;refresh();previewNote.textContent='업종별 기본 문구를 다시 적용했습니다.';});
  byId('reset-all').addEventListener('click',()=>{setState(initial());try{localStorage.removeItem(KEY);}catch{}refresh(false);previewNote.textContent='처음 상태로 되돌렸습니다. 브라우저에 저장했던 편집 내용도 지웠습니다.';feedback.textContent='';});
  document.querySelectorAll('[data-device]').forEach(btn=>btn.addEventListener('click',()=>{stage.classList.toggle('mobile',btn.dataset.device==='mobile');document.querySelectorAll('[data-device]').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));}));
  byId('download-html').addEventListener('click',()=>{
    if(!validate())return;
    downloadable('allfileone_website_draft.html',exportHtml(getState()),'text/html;charset=utf-8');
    feedback.textContent='HTML 시안을 다운로드했습니다. 브라우저에서 독립적으로 열 수 있습니다. 자동 홈페이지 배포는 아닙니다.';
  });
  byId('download-brief').addEventListener('click',()=>{if(!validate())return;downloadable('allfileone_website_project_brief.txt',brief(getState()),'text/plain;charset=utf-8');feedback.textContent='제작 요구서를 TXT로 저장했습니다. 상담 신청은 별도로 보내야 합니다.';});
  byId('download-json').addEventListener('click',()=>{if(!validate())return;downloadable('allfileone_website_settings.json',JSON.stringify({format:'allfileone-webstudio-v7',...getState()},null,2),'application/json;charset=utf-8');feedback.textContent='수정 가능한 디자인 설정을 JSON으로 다운로드했습니다.';});
  byId('import-json').addEventListener('change',async evt=>{
    const file=evt.target.files?.[0];if(!file)return;
    try{
      if(file.size>256*1024)throw new Error('설정 파일은 256KB 이하여야 합니다.');
      const incoming=JSON.parse(await file.text());
      if(incoming.format!=='allfileone-webstudio-v7')throw new Error('올파일원 시안 제작기 V7 설정 파일만 불러올 수 있습니다.');
      const state=fromObject(incoming);
      if(state.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email))throw new Error('설정 파일의 이메일 형식이 올바르지 않습니다.');
      setState(state);refresh();feedback.textContent='저장한 설정을 불러왔습니다.';
    }catch(err){feedback.textContent='설정 불러오기 실패: '+(err instanceof Error?err.message:'파일을 확인해 주세요.');}
    finally{evt.target.value='';}
  });
  refresh(false);
  // Pure generator is available to local automated tests; it does not expose write access to state.
  window.ALLFILEONE_BUILDER_QA=Object.freeze({exportHtml,fromObject,getState,escapeHtml,industryCount:INDUSTRIES.length});
})();
