/* V77: original no-API 8-feature showcase per industry, 4 live + 4 quote-only. */
(()=>{'use strict';
const DATA=window.AFO_V77_FEATURE_EXTENSION;
const BASE=window.ALLFILEONE_V28_CATALOG;
const industry=document.body?.dataset.industry;
const style=document.body?.dataset.v13Style||'modern';
const existing=BASE?.[industry]?.features;
const additional=DATA?.[industry]?.extra;
const main=document.querySelector('main');
if(!main||!Array.isArray(existing)||existing.length!==4||!Array.isArray(additional)||additional.length!==4||document.getElementById('v77-showcase'))return;
const h=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el};
const selected=new Set();
const section=h('section','v77-showcase');section.id='v77-showcase';section.setAttribute('aria-labelledby','v77-heading');
const wrap=h('div','v77-wrap'),intro=h('div','v77-intro');
intro.append(h('span','v77-kicker','8 FEATURE BLUEPRINT · '+BASE[industry].name),h('h2','', '우리 업종에 필요한 8가지 기능'));
intro.querySelector('h2').id='v77-heading';
intro.append(h('p','', '기존 4개는 실제 클릭·검색·계산하는 가상 데이터 시연입니다. 나머지 4개는 대표 사이트 조사에서 도출한 제작 옵션으로, 아직 운영 기능이 아닙니다.'));
const legend=h('div','v77-legend');legend.append(h('span','v77-live-mark','● 4개 직접 체험'),h('span','v77-plan-mark','◇ 4개 제작 검토 (미구현)'));intro.append(legend);
const grid=h('div','v77-grid');grid.setAttribute('aria-label','8가지 업종별 핵심 기능');
function liveCard(f,i){const box=h('article','v77-card v77-card-live');box.dataset.status='live';
 box.append(h('span','v77-number','0'+(i+1)+' / 직접 체험'),h('h3','',f.title),h('p','',f.desc));
 const a=h('a','v77-card-action','브라우저 시연 열기 ↗');const url=new URL(document.baseURI);url.searchParams.set('feature',String(i));url.hash='v28-tools';a.href=url.href;a.setAttribute('aria-label',f.title+' 시연 열기');box.append(a);return box;}
function planCard(f,i){const box=h('article','v77-card v77-card-planned');box.dataset.status='planned';
 box.append(h('span','v77-number','0'+(i+5)+' / 제작 옵션'),h('h3','',f.title),h('p','',f.desc));
 const b=h('button','v77-card-action v77-pick','＋ 제작 요청 목록에 담기');b.type='button';b.dataset.feature=String(i);
 const sync=()=>{const yes=selected.has(i);b.textContent=yes?'✓ 목록에 담김 · 해제':'＋ 제작 요청 목록에 담기';b.setAttribute('aria-pressed',String(yes));box.classList.toggle('v77-picked',yes)};
 b.addEventListener('click',()=>{selected.has(i)?selected.delete(i):selected.add(i);sync();update()});sync();box.append(b);return box;}
existing.forEach((f,i)=>grid.append(liveCard(f,i)));additional.forEach((f,i)=>grid.append(planCard(f,i)));
const footer=h('div','v77-footer'),help=h('p','v77-help','추가 제작 옵션 선택 0/4 · 실제 신청·예약·결제가 자동 접수되지는 않습니다.');help.setAttribute('role','status');help.setAttribute('aria-live','polite');
const actions=h('div','v77-footer-actions'),download=h('button','v77-primary','선택한 제작 기능 TXT 저장 ↓');download.type='button';
const contact=h('a','v77-secondary','이 디자인으로 제작 상담하기 ↗');contact.href=new URL('../../../contact.html?'+new URLSearchParams({source:'demo',industry,theme:style}).toString(),document.baseURI).href;
actions.append(download,contact);footer.append(help,actions);
function update(){help.textContent='추가 제작 옵션 '+selected.size+'/4 선택 · 브라우저에서만 선택하며 실제 의뢰가 자동 접수되지 않습니다.';download.disabled=selected.size===0}
function save(){if(!selected.size)return;const lines=['올파일원 웹스튜디오 · 업종별 기능 제작 요청 초안','업종: '+BASE[industry].name,'디자인: '+style,'','기존 가상 시연 4개:',...existing.map((f,i)=>String(i+1)+'. '+f.title),'','추가 제작 옵션 (아직 구현되지 않음):',...additional.filter((f,i)=>selected.has(i)).map(x=>'◇ '+x.title+' — '+x.desc),'','참고 사이트: '+DATA[industry].reference,'주의: 기능 시연 및 범위 협의용이며 자동 접수·실시간 연동·계약·결제 기능이 아닙니다.'];
 const blob=new Blob(['\ufeff'+lines.join('\r\n')+'\r\n'],{type:'text/plain;charset=utf-8'});const link=h('a');const u=URL.createObjectURL(blob);link.href=u;link.download='AllFileOne_'+industry+'_feature_plan.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);help.textContent=selected.size+'개 제작 옵션을 포함한 TXT를 저장했습니다. 상담 시 첨부해 주세요.';}
download.addEventListener('click',save);update();wrap.append(intro,grid,footer);section.append(wrap);
const tools=document.getElementById('v28-tools');if(tools?.parentNode)tools.insertAdjacentElement('afterend',section);else main.append(section);
const nav=document.querySelector('#demo-nav');if(nav&&!nav.querySelector('a[href="#v77-showcase"]')){const a=h('a','', '8가지 기능');a.href='#v77-showcase';nav.insertBefore(a,nav.querySelector('a[href="#contact"]'));}
window.AFO_V77_SHOWCASE_READY=true;
})();