/* AllFileOne WebStudio V86: 12 original industry buyer guides. Zero API, no cookies, no POST. */
(()=>{'use strict';const root=document.body;if(!root.dataset.v86Industry)return;
 const industry=root.dataset.v86Industry;const styles=['modern','premium','editorial'];let style=new URLSearchParams(location.search).get('style');if(!styles.includes(style))style='modern';
 const goals=[...document.querySelectorAll('[data-v86-goal]')];let goal=0;
 const byid=id=>document.getElementById(id);
 const controls=[...document.querySelectorAll('[data-v86-style]')];
 const features=[...document.querySelectorAll('[data-v86-feature]')];
 const choices=[...document.querySelectorAll('[data-v86-check]')];
 const styleLabel={modern:'모던',premium:'프리미엄',editorial:'에디토리얼'};
 function render(){
  goals.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===goal)));
  const chosen=goals[goal];if(!chosen)return;
  const allowed=new Set(chosen.dataset.v86Highlight.split(',').map(Number));
  features.forEach((el,i)=>el.classList.toggle('is-highlight',allowed.has(i)));
  byid('v86-goal-current').textContent=chosen.querySelector('strong').textContent;
  controls.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v86Style===style)));
  document.querySelectorAll('[data-v86-style-card]').forEach(el=>el.classList.toggle('is-selected',el.dataset.v86StyleCard===style));
  const args=new URLSearchParams({industry,style});
  byid('v86-view-site').href='../experience-v85.html?'+args;
  byid('v86-to-scope').href='../feature-scope-v81.html?'+args;
  const v87=byid('v87-start');if(v87)v87.href='../start-project-v87.html?'+args;
  const checked=choices.filter(x=>x.checked).length;
  byid('v86-readiness-status').textContent='제작 준비 '+checked+'/'+choices.length+'개 확인 · 브라우저에서만 반영';
  if(['http:','https:'].includes(location.protocol)){const next=new URL(location.href);next.searchParams.set('style',style);history.replaceState(null,'',next.href);}
 }
 goals.forEach((b,i)=>b.addEventListener('click',()=>{goal=i;render()}));
 controls.forEach(b=>b.addEventListener('click',()=>{if(styles.includes(b.dataset.v86Style)){style=b.dataset.v86Style;render()}}));
 choices.forEach(c=>c.addEventListener('change',render));
 byid('v86-download').addEventListener('click',()=>{
  const selected=goals[goal],featured=features.filter(x=>x.classList.contains('is-highlight'));
  const lines=['올파일원 웹스튜디오 V86 · 홈페이지 제작 준비서','','업종: '+byid('v86-industry-name').textContent,
   '선택한 디자인: '+styleLabel[style], '목표: '+selected.querySelector('strong').textContent,
   '상담용 체험 주소: '+byid('v86-view-site').href,'',
   '관심 가상 기능 (실제 운영/예약·결제 미구현):',...featured.map(x=>' - '+x.querySelector('h3').textContent),'',
   '고객 준비 항목 (직접 선택):',...choices.map(x=>(x.checked?' [완료] ':' [미완료] ')+x.parentNode.textContent.trim()),'',
   '실제 운영 연동은 미구현이며 별도 개발·견적·보안 검토 필요.',
   '이 문서는 계약·확정 견적서·고객 거래/납품 실적이 아닙니다.',
   '고객 정보/예약/결제/이메일 문의는 자동 전송하지 않습니다.','',''];
  const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='AllFileOne_V86_'+industry+'_brief.txt';a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  byid('v86-feedback').textContent='준비서를 다운로드했습니다. 이메일은 전송되지 않았습니다.';
 });
 window.addEventListener('popstate',()=>{const q=new URLSearchParams(location.search);style=styles.includes(q.get('style'))?q.get('style'):'modern';render()});
 render();window.AFO_V86_GUIDE_READY=true;
})();
