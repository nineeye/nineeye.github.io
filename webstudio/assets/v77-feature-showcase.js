/* WebStudio V78: 8 cards: 4 original V28 simulations + 1 new V78 simulation + 3 unbuilt production options. */
(()=>{'use strict';
const DATA=window.AFO_V77_FEATURE_EXTENSION,BASE=window.ALLFILEONE_V28_CATALOG,DEMO=window.AFO_V78_SIMULATOR;
const industry=document.body?.dataset.industry,style=document.body?.dataset.v13Style||'modern';
const existing=BASE?.[industry]?.features,additional=DATA?.[industry]?.extra,main=document.querySelector('main');
if(!main||!Array.isArray(existing)||existing.length!==4||!Array.isArray(additional)||additional.length!==4||!DEMO||document.getElementById('v77-showcase'))return;
const index=DEMO.indexFor(industry);if(index<0||additional[index]?.status!=='simulated'||additional.filter(f=>f.status==='planned').length!==3)return;
const h=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el};
const selected=new Set(),section=h('section','v77-showcase');section.id='v77-showcase';section.setAttribute('aria-labelledby','v77-heading');
const wrap=h('div','v77-wrap'),intro=h('div','v77-intro');
intro.append(h('span','v77-kicker','8 FEATURE BLUEPRINT · '+BASE[industry].name),h('h2','','우리 업종에 필요한 8가지 기능'));
intro.querySelector('h2').id='v77-heading';
intro.append(h('p','','기존 가상 시연 4개에 업종별 새로운 가상 시연 1개를 더했습니다. 나머지 3개는 실제 고객용 운영시스템을 별도로 개발해야 하는 제작 옵션입니다.'));
const legend=h('div','v77-legend');legend.append(h('span','v77-live-mark','● 기존 시연 4개'),h('span','v77-live-mark','◆ 추가 가상 시연 1개'),h('span','v77-plan-mark','◇ 운영 연동 미구현 3개'));intro.append(legend);
const grid=h('div','v77-grid');grid.setAttribute('aria-label','8가지 업종별 핵심 기능');
const panel=h('div','v78-inline');panel.hidden=true;panel.id='v78-simulator-panel';panel.setAttribute('aria-label','추가 시연 직접 조작 영역');
const head=h('div','v78-inline-head');const close=h('button','','닫기');close.type='button';head.append(h('strong','','직접 체험 / 가상 데이터'),close);const target=h('div','v78-mount');const bottomClose=h('button','v78-bottom-close','시연 닫기 ↑');bottomClose.type='button';panel.append(head,target,bottomClose);const hide=()=>{panel.hidden=true;target.replaceChildren()};close.addEventListener('click',hide);bottomClose.addEventListener('click',hide);
function liveCard(f,i){const box=h('article','v77-card v77-card-live');box.dataset.status='live';
 box.append(h('span','v77-number','0'+(i+1)+' / 가상 시연'),h('h3','',f.title),h('p','',f.desc));
 const a=h('a','v77-card-action','브라우저 시연 열기 ↗');const url=new URL(document.baseURI);url.searchParams.set('feature',String(i));url.hash='v28-tools';a.href=url.href;a.setAttribute('aria-label',f.title+' 시연 열기');box.append(a);return box;}
function newDemoCard(f,i){const box=h('article','v77-card v77-card-v78');box.dataset.status='live';box.dataset.v78New='true';
 box.append(h('span','v77-number','0'+(i+5)+' / 추가 가상 시연'),h('h3','',f.title),h('p','',f.desc));
 const b=h('button','v77-card-action','기능 직접 조작하기 ↘');b.type='button';b.setAttribute('aria-controls',panel.id);b.setAttribute('aria-expanded','false');
 b.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;b.setAttribute('aria-expanded',String(open));if(open){DEMO.mount(target,industry);panel.scrollIntoView({block:'nearest',behavior:'instant'});}else target.replaceChildren()});
 [close,bottomClose].forEach(btn=>btn.addEventListener('click',()=>b.setAttribute('aria-expanded','false')));box.append(b);return box;}
function planCard(f,i){const box=h('article','v77-card v77-card-planned');box.dataset.status='planned';
 box.append(h('span','v77-number','0'+(i+5)+' / 제작 옵션'),h('h3','',f.title),h('p','',f.desc));
 const b=h('button','v77-card-action v77-pick','＋ 제작 희망 목록에 담기');b.type='button';b.dataset.feature=String(i);
 const sync=()=>{const yes=selected.has(i);b.textContent=yes?'✓ 목록에 담김 · 해제':'＋ 제작 희망 목록에 담기';b.setAttribute('aria-pressed',String(yes));box.classList.toggle('v77-picked',yes)};
 b.addEventListener('click',()=>{selected.has(i)?selected.delete(i):selected.add(i);sync();update()});sync();box.append(b);return box;}
existing.forEach((f,i)=>grid.append(liveCard(f,i)));additional.forEach((f,i)=>grid.append(i===index?newDemoCard(f,i):planCard(f,i)));
const footer=h('div','v77-footer'),help=h('p','v77-help','남은 제작 옵션 선택 0/3 · 이 브라우저에서만 선택합니다.');help.setAttribute('role','status');help.setAttribute('aria-live','polite');
const actions=h('div','v77-footer-actions'),download=h('button','v77-primary','선택한 제작 옵션 TXT 저장 ↓');download.type='button';
const contact=h('a','v77-secondary','이 디자인으로 제작 상담하기 ↗');contact.href=new URL('../../../contact.html?'+new URLSearchParams({source:'demo',industry,theme:style}).toString(),document.baseURI).href;
actions.append(download,contact);footer.append(help,actions);
function update(){help.textContent='운영 연동 미구현 옵션 '+selected.size+'/3 선택 · 자동 접수되지 않습니다.';download.disabled=selected.size===0}
function save(){if(!selected.size)return;
 const lines=['올파일원 웹스튜디오 · 업종별 기능 제작 요청 초안','업종: '+BASE[industry].name,'디자인: '+style,'',
 '기존 가상 시연 4개:',...existing.map((f,i)=>String(i+1)+'. '+f.title),'','추가 가상 시연 1개:',additional[index].title+' (실제 운영 연동 없음)','',
 '별도 구현할 제작 옵션 (아직 미구현):',...additional.filter((f,i)=>selected.has(i)).map(x=>'◇ '+x.title+' — '+x.desc),'',
 '참고 사이트: '+DATA[industry].reference,'주의: 기능 시연 및 범위 협의용이며 자동 접수·실시간 연동·계약·결제 기능이 아닙니다.'];
 const blob=new Blob(['\ufeff'+lines.join('\r\n')+'\r\n'],{type:'text/plain;charset=utf-8'}),link=h('a'),u=URL.createObjectURL(blob);link.href=u;link.download='AllFileOne_'+industry+'_feature_plan.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);help.textContent=selected.size+'개 미구현 옵션을 TXT로 저장했습니다. 상담 시 직접 첨부해 주세요.';}
download.addEventListener('click',save);update();wrap.append(intro,grid,panel,footer);section.append(wrap);
const tools=document.getElementById('v28-tools');if(tools?.parentNode)tools.insertAdjacentElement('afterend',section);else main.append(section);
const nav=document.querySelector('#demo-nav');if(nav&&!nav.querySelector('a[href="#v77-showcase"]')){const a=h('a','','8가지 기능');a.href='#v77-showcase';nav.insertBefore(a,nav.querySelector('a[href="#contact"]'));}
window.AFO_V78_SHOWCASE_READY=true;
})();