/* V67: first-party, no API, no customer tracking. Compare three ACTUAL desktop HTML pages
   per industry; opening a choice exposes a full-size live, interactive original page. */
(()=>{'use strict';
const DATA=window.AFO_V67_INDUSTRIES;
// A single source of truth: titles, kinds and summaries come from the working V28 engine.
const CATALOG=window.ALLFILEONE_V28_CATALOG || {};
const KINDS=Object.freeze({filter:'검색·필터',calc:'계산',compare:'항목 비교',quiz:'선택 안내',timeline:'절차 안내',checklist:'준비 체크',schedule:'일정·시간표',cart:'장바구니 계산',staycalc:'숙박 요금 계산',ics:'일정 파일 저장'});
const actualFeatures=sector=>Array.isArray(CATALOG[sector]?.features) && CATALOG[sector].features.length===4 ? CATALOG[sector].features : null;
const STYLES=['modern','premium','editorial'];
const LABEL={modern:'모던',premium:'프리미엄',editorial:'에디토리얼'};
const roots={select:document.getElementById('industry-select'),name:document.getElementById('sector-name'),tag:document.getElementById('sector-tag'),description:document.getElementById('sector-description'),count:document.querySelector('.sector-count'),grid:document.getElementById('feature-links'),interactive:document.getElementById('interactive-demo'),open:document.getElementById('open-full'),desc:document.getElementById('active-description'),estimate:document.getElementById('estimate-link'),button:document.getElementById('download-scope')};
if(!DATA||!roots.select||!roots.interactive){return;}
const keys=Object.keys(DATA);
const params=new URLSearchParams(location.search);
let industry=keys.includes(params.get('industry'))?params.get('industry'):'manufacturing';
let style=STYLES.includes(params.get('style'))?params.get('style'):'modern';
const cards=[...document.querySelectorAll('.design-card')];
const demoUrl=(which,feature)=>{
 const url=new URL('./demo/'+encodeURIComponent(industry)+'/'+encodeURIComponent(which)+'/index.html',location.href);
 if(Number.isInteger(feature)){
  url.searchParams.set('feature',String(feature));url.hash='v28-tools';
 }
 return url.href;
};
function syncURL(){
 const url=new URL(location.href);url.searchParams.set('industry',industry);url.searchParams.set('style',style);
 history.replaceState(null,'',url.href);
}
function resizeFrames(){
 document.querySelectorAll('[data-preview]').forEach(box=>{
  const iframe=box.querySelector('iframe');if(!iframe)return;
  const zoom=box.clientWidth/1280;
  iframe.style.transform='scale('+zoom+')';
 });
}
function renderLive(){
 cards.forEach(card=>{
  const selected=card.dataset.style===style;
  card.classList.toggle('is-selected',selected);
  card.querySelector('[data-open]').setAttribute('aria-pressed',String(selected));
 });
 roots.desc.textContent=DATA[industry].name+' · '+LABEL[style]+' 실제 페이지 체험 중';
 roots.open.href=demoUrl(style);
 // Do not reload if only change is a selected button for the same URL.
 if(roots.interactive.src!==demoUrl(style))roots.interactive.src=demoUrl(style);
 roots.estimate.href='./index.html?industry='+encodeURIComponent(industry)+'&theme='+encodeURIComponent(style)+'#estimate';
 syncURL();
}
function renderIndustry(){
 const data=DATA[industry];
 roots.select.value=industry;
 roots.tag.textContent=data.tag;
 roots.name.textContent=data.name;
 roots.description.textContent=data.lead;
 roots.count.textContent=String(keys.indexOf(industry)+1).padStart(2,'0')+' / 12';
 cards.forEach(card=>{
  const which=card.dataset.style;
  const url=demoUrl(which);
  card.querySelector('[data-direct]').href=url;
  const frame=card.querySelector('iframe');
  if(frame.getAttribute('src')!==url)frame.setAttribute('src',url);
 });
 roots.grid.replaceChildren();
 const features=actualFeatures(industry);
 if(!features){
  const warning=document.createElement('p');warning.className='feature-unavailable';warning.setAttribute('role','status');
  warning.textContent='실제 도구 목록을 확인할 수 없어 기능 체험 링크를 표시하지 않았습니다. 새로고침 후 다시 확인해 주세요.';
  roots.grid.append(warning);
 }else features.forEach((feature,i)=>{
  const link=document.createElement('a');link.href=demoUrl(style,i);link.target='_blank';link.rel='noopener';
  link.setAttribute('aria-label',DATA[industry].name+' '+feature.title+' 도구 체험 (새 창)');
  const index=document.createElement('span');index.className='feature-no';index.textContent='WORKFLOW '+String(i+1).padStart(2,'0');
  const type=document.createElement('span');type.className='feature-kind';type.textContent=KINDS[feature.kind]||'업무 도구';
  const title=document.createElement('strong');title.textContent=feature.title;
  const summary=document.createElement('span');summary.className='feature-summary';summary.textContent=feature.desc;
  const sub=document.createElement('small');sub.textContent='가상 데이터 시연 · 새 창에서 체험 ↗';
  link.append(index,type,title,summary,sub);roots.grid.append(link);
 });
 renderLive();resizeFrames();
}
roots.select.addEventListener('change',()=>{if(!DATA[roots.select.value])return;industry=roots.select.value;renderIndustry();});
cards.forEach(card=>card.querySelector('[data-open]').addEventListener('click',()=>{
 style=card.dataset.style;
 renderIndustry();
 document.getElementById('working').scrollIntoView({behavior:'auto',block:'start'});
}));
document.getElementById('reload-live').addEventListener('click',()=>{roots.interactive.src=demoUrl(style);});
roots.button.addEventListener('click',()=>{
 const d=DATA[industry];
 const features=actualFeatures(industry);
 const lines=['올파일원 웹스튜디오 업종별 비교 기획 요약','업종: '+d.name,'선택 디자인: '+LABEL[style],
  '업종의 핵심 과제: '+d.lead,'','핵심 업무 기능 (가상 데이터 시연):',
  ...(features ? features.map((f,i)=>String(i+1)+'. '+f.title+' ['+(KINDS[f.kind]||'업무 도구')+'] - '+f.desc) : ['실제 기능 카탈로그를 읽지 못해 확인된 도구를 기재할 수 없습니다.']),'',
  '디자인 3가지 비교:',
  '모던: 실용적인 분할 레이아웃, 빠른 탐색, 벤토형 정보 카드',
  '프리미엄: 짙은 브랜드 무대, 중앙 정렬, 금빛 포인트',
  '에디토리얼: 잡지형 비대칭, 대형 타이포그래피, 스토리형 순서','',
  '샘플 주소: '+demoUrl(style),'',
  '주의: 시연 자료는 가상이며 실제 고객 접수·예약·결제·실시간 데이터 연동을 제공하지 않습니다.',
  '견적은 제작 범위 확인 후 산정됩니다.'];
 const content='\ufeff'+lines.join('\r\n')+'\r\n';
 const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='AllFileOne_'+industry+'_'+style+'_scope.txt';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
});
// ResizeObserver avoids window-width assumptions when cards change column count.
if('ResizeObserver' in window){const ob=new ResizeObserver(resizeFrames);document.querySelectorAll('[data-preview]').forEach(el=>ob.observe(el));}
else window.addEventListener('resize',resizeFrames);
window.addEventListener('popstate',()=>{const q=new URLSearchParams(location.search);if(DATA[q.get('industry')])industry=q.get('industry');if(STYLES.includes(q.get('style')))style=q.get('style');renderIndustry();});
renderIndustry();
window.AFO_V67_COMPARE_READY=true;
})();