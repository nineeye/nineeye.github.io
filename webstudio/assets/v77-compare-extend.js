/* V77 complements (does not replace) the four real V28 links with four planning cards. */
(()=>{'use strict';const EXTRA=window.AFO_V77_FEATURE_EXTENSION;const grid=document.getElementById('feature-links');const select=document.getElementById('industry-select');const heading=document.getElementById('workflow-title');if(!EXTRA||!grid||!select)return;
function render(){const sector=select.value;const entry=EXTRA[sector];if(!entry)return;
 grid.querySelectorAll('[data-v77-plan]').forEach(x=>x.remove());
 entry.extra.forEach((feature,i)=>{const card=document.createElement('article');card.className='v77-compare-planned';card.dataset.v77Plan=String(i);
 const id=document.createElement('span');id.textContent='05–08 / 제작 검토 '+String(i+1);
 const title=document.createElement('strong');title.textContent=feature.title;
 const desc=document.createElement('p');desc.textContent=feature.desc;
 const status=document.createElement('small');status.textContent='미구현 · 실제 연동은 별도 견적';
 const link=document.createElement('a');const url=new URL('./industry-features-v77.html',document.baseURI);url.searchParams.set('industry',sector);link.href=url.href;link.textContent='업종별 기능 상세 보기 ↗';
 card.append(id,title,desc,status,link);grid.append(card);
 });
 if(heading)heading.textContent='이 업종에서 필요한 8가지 기능';
 const note=document.getElementById('v77-workflow-notice');if(note)note.textContent='초록 4개: 가상 데이터로 작동하는 시연 · 베이지색 4개: 제작 상담용 기능(미구현)';
}
window.addEventListener('afo:v70-selection',render);render();window.AFO_V77_COMPARE_READY=true;
})();