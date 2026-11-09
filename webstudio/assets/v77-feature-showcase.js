/* WebStudio V79: 12 sectors; four V28 demos + two functional fictional prototypes + two unbuilt options. */
(()=>{'use strict';
const E=window.AFO_V77_FEATURE_EXTENSION||{},C=window.ALLFILEONE_V28_CATALOG||{},S78=window.AFO_V78_SIMULATOR,S79=window.AFO_V79_SIMULATOR;
const sector=document.body?.dataset.industry,style=document.body?.dataset.v13Style||'modern';
const existing=C[sector]?.features,extra=E[sector]?.extra,main=document.querySelector('main');
if(!main||!Array.isArray(existing)||existing.length!==4||!Array.isArray(extra)||extra.length!==4||!S78||!S79||document.getElementById('v77-showcase'))return;
const liveIndices=[S78.indexFor(sector),S79.indexFor(sector)];
if(new Set(liveIndices).size!==2||!liveIndices.every(i=>i>=0&&i<=3&&extra[i]?.status==='simulated')||extra.filter(x=>x.status==='planned').length!==2)return;
const h=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const section=h('section','v77-showcase');section.id='v77-showcase';section.setAttribute('aria-labelledby','v77-heading');
const wrap=h('div','v77-wrap'),intro=h('div','v77-intro');intro.append(h('span','v77-kicker','8 FEATURE BLUEPRINT · '+C[sector].name),h('h2','','우리 업종에 필요한 8가지 기능'));
intro.querySelector('h2').id='v77-heading';intro.append(h('p','','가상 데이터로 직접 체험 가능한 기능 6개와, 실제 납품 시 별도 개발해야 할 기능 2개를 구분해 제공합니다.'));
const legend=h('div','v77-legend');legend.append(h('span','v77-live-mark','● 기존 가상 시연 4개'),h('span','v77-live-mark','◆ 추가 가상 시연 2개'),h('span','v77-plan-mark','◇ 미구현 제작 옵션 2개'));intro.append(legend);
const grid=h('div','v77-grid');grid.setAttribute('aria-label','업종별 8가지 기능');
const panel=h('div','v78-inline');panel.hidden=true;panel.id='v78-simulator-panel';panel.setAttribute('aria-label','가상 기능 체험 영역');
const head=h('div','v78-inline-head'),topClose=h('button','','닫기');topClose.type='button';head.append(h('strong','','직접 체험 / 가상 데이터'),topClose);
const target=h('div','v78-mount'),bottomClose=h('button','v78-bottom-close','시연 닫기 ↑');bottomClose.type='button';panel.append(head,target,bottomClose);
let active=null;const clear=()=>{panel.hidden=true;target.replaceChildren();if(active){active.setAttribute('aria-expanded','false');active=null;}};
topClose.addEventListener('click',clear);bottomClose.addEventListener('click',clear);
existing.forEach((f,i)=>{const card=h('article','v77-card v77-card-live');card.dataset.status='live';card.append(h('span','v77-number',String(i+1).padStart(2,'0')+' / 가상 시연'),h('h3','',f.title),h('p','',f.desc));
 const link=h('a','v77-card-action','브라우저 시연 열기 ↗'),url=new URL(document.baseURI);url.searchParams.set('feature',String(i));url.hash='v28-tools';link.href=url.href;link.setAttribute('aria-label',f.title+' 시연 열기');card.append(link);grid.append(card);});
const selected=new Set();
extra.forEach((f,i)=>{const simulated=f.status==='simulated',card=h('article',simulated?'v77-card v77-card-v78':'v77-card v77-card-planned');card.dataset.status=simulated?'live':'planned';
 card.append(h('span','v77-number',String(i+5).padStart(2,'0')+(simulated?' / 추가 가상 시연':' / 제작 검토')),h('h3','',f.title),h('p','',f.desc));
 if(simulated){card.dataset.v78New='true';const button=h('button','v77-card-action','기능 직접 조작하기 ↘');button.type='button';button.setAttribute('aria-controls',panel.id);button.setAttribute('aria-expanded','false');
  button.addEventListener('click',()=>{if(active===button&&!panel.hidden){clear();return;}const engine=i===S78.indexFor(sector)?S78:S79;
   if(!engine.mount(target,sector)){clear();return;}if(active)active.setAttribute('aria-expanded','false');active=button;button.setAttribute('aria-expanded','true');panel.hidden=false;panel.scrollIntoView({block:'nearest',behavior:'instant'});});card.append(button);
 }else{const button=h('button','v77-card-action v77-pick','＋ 제작 희망 목록에 담기');button.type='button';button.dataset.feature=String(i);
  const update=()=>{const yes=selected.has(i);button.textContent=yes?'✓ 목록에 담김 · 해제':'＋ 제작 희망 목록에 담기';button.setAttribute('aria-pressed',String(yes));card.classList.toggle('v77-picked',yes)};
  button.addEventListener('click',()=>{selected.has(i)?selected.delete(i):selected.add(i);update();sync()});update();card.append(button);
 }grid.append(card);});
const footer=h('div','v77-footer'),help=h('p','v77-help');help.setAttribute('role','status');help.setAttribute('aria-live','polite');
const actions=h('div','v77-footer-actions'),download=h('button','v77-primary','선택한 제작 옵션 TXT 저장 ↓');download.type='button';
const contact=h('a','v77-secondary','이 디자인으로 제작 상담하기 ↗');contact.href=new URL('../../../contact.html?'+new URLSearchParams({source:'demo',industry:sector,theme:style}).toString(),document.baseURI).href;
function sync(){help.textContent='운영 연동 미구현 옵션 '+selected.size+'/2개 선택 · 이 브라우저에서만 선택합니다.';download.disabled=!selected.size;}
function save(){if(!selected.size)return;const lines=['올파일원 웹스튜디오 / 업종별 8가지 기능 기획 초안','업종: '+C[sector].name,'디자인: '+style,'','기존 가상 시연 4개:',...existing.map((f,i)=>String(i+1)+'. '+f.title),'','추가 가상 시연 2개:',...extra.filter(x=>x.status==='simulated').map(x=>'◆ '+x.title+' (실제 운영 연동 없음)'),'','제작 옵션 (미구현 · 별도 구현 필요):',...extra.filter((x,i)=>selected.has(i)).map(x=>'◇ '+x.title+' — '+x.desc),'','실제 사용자 자료·예약·결제·회원 기능은 구현되지 않았고, 이 TXT는 전송되지 않습니다.'];
 const blob=new Blob(['\ufeff'+lines.join('\r\n')+'\r\n'],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=h('a');link.href=url;link.download='AllFileOne_'+sector+'_8features_v79.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);help.textContent='선택한 미구현 기능 '+selected.size+'개를 TXT로 저장했습니다. 실제 이메일은 전송하지 않았습니다.';}
download.addEventListener('click',save);sync();actions.append(download,contact);footer.append(help,actions);wrap.append(intro,grid,panel,footer);section.append(wrap);
const tools=document.getElementById('v28-tools');if(tools?.parentNode)tools.insertAdjacentElement('afterend',section);else main.append(section);
const nav=document.getElementById('demo-nav');if(nav&&!nav.querySelector('a[href="#v77-showcase"]')){const a=h('a','','8가지 기능');a.href='#v77-showcase';nav.insertBefore(a,nav.querySelector('a[href="#contact"]'));}
window.AFO_V79_SHOWCASE_READY=true;
})();