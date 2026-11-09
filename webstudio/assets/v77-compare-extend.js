/* WebStudio V78: compare page has 4 original demos, 1 new interactive fictional demo, and 3 unbuilt options. */
(()=>{'use strict';const EXTRA=window.AFO_V77_FEATURE_EXTENSION,S=window.AFO_V78_SIMULATOR;const grid=document.getElementById('feature-links');const select=document.getElementById('industry-select');const heading=document.getElementById('workflow-title');if(!EXTRA||!grid||!select||!S)return;
function render(){const sector=select.value,entry=EXTRA[sector];if(!entry)return;
 grid.querySelectorAll('[data-v77-plan]').forEach(x=>x.remove());
 entry.extra.forEach((feature,i)=>{const simulated=feature.status==='simulated';const card=document.createElement('article');card.className=simulated?'v77-compare-v78':'v77-compare-planned';card.dataset.v77Plan=String(i);
 const id=document.createElement('span');id.textContent='0'+String(i+5)+' / '+(simulated?'가상 시연':'제작 검토');
 const title=document.createElement('strong');title.textContent=feature.title;
 const desc=document.createElement('p');desc.textContent=feature.desc;
 const status=document.createElement('small');status.textContent=simulated?'브라우저에서 조작 가능 · 실제 운영 연동 없음':'미구현 · 실제 연동은 별도 견적';
 const link=document.createElement('a');const url=new URL(simulated?'./feature-lab-v78.html':'./industry-features-v77.html',document.baseURI);url.searchParams.set('industry',sector);link.href=url.href;link.textContent=simulated?'직접 조작하기 ↗':'업종별 기능 상세 보기 ↗';
 card.append(id,title,desc,status,link);grid.append(card);
 });
 if(heading)heading.textContent='이 업종에서 필요한 8가지 기능';
 const note=document.getElementById('v77-workflow-notice');if(note)note.textContent='기존 가상 시연 4개 + 추가 가상 시연 1개 + 실제 운영 연동 미구현 3개';
}
window.addEventListener('afo:v70-selection',render);render();window.AFO_V78_COMPARE_READY=true;
})();