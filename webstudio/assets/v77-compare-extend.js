/* V80 comparison catalog: 4 old demos + 3 interactive fictional new demos + 1 unbuilt production option. */
(()=>{'use strict';const E=window.AFO_V77_FEATURE_EXTENSION||{},S78=window.AFO_V78_SIMULATOR,S79=window.AFO_V79_SIMULATOR,S80=window.AFO_V80_SIMULATOR;
const grid=document.getElementById('feature-links'),select=document.getElementById('industry-select'),heading=document.getElementById('workflow-title');if(!grid||!select||!S78||!S79||!S80)return;
function render(){const sector=select.value,entry=E[sector];if(!entry)return;
 grid.querySelectorAll('[data-v77-plan]').forEach(x=>x.remove());
 entry.extra.forEach((f,i)=>{const on=f.status==='simulated',card=document.createElement('article');card.className=on?'v77-compare-v78':'v77-compare-planned';card.dataset.v77Plan=String(i);
 const id=document.createElement('span');id.textContent=String(i+5).padStart(2,'0')+' / '+(on?'가상 시연':'제작 검토');const name=document.createElement('strong');name.textContent=f.title;const desc=document.createElement('p');desc.textContent=f.desc;
 const status=document.createElement('small');status.textContent=on?'브라우저에서 조작 가능 · 실제 운영 미연동':'미구현 · 실제 운영 연동은 별도 견적';
 const link=document.createElement('a'),url=new URL(on?'./feature-lab-v80.html':'./industry-features-v77.html',document.baseURI);url.searchParams.set('industry',sector);if(on)url.searchParams.set('feature',String(i));link.href=url.href;link.textContent=on?'직접 조작하기 ↗':'업종별 기능 상세 보기 ↗';
 card.append(id,name,desc,status,link);grid.append(card);});
 if(heading)heading.textContent='이 업종에서 필요한 8가지 기능';const note=document.getElementById('v77-workflow-notice');if(note)note.textContent='기존 가상 시연 4개 + 추가 가상 시연 3개 + 별도 구현할 운영 기능 1개';}
window.addEventListener('afo:v70-selection',render);render();window.AFO_V80_COMPARE_READY=true;
})();