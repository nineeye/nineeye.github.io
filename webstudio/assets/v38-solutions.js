/* AllFileOne WebStudio V38: original opt-in scope planner, no remote calls. */
'use strict';
(() => {
  const root = document.querySelector('[data-v38-planner]');
  if (!root) return;
  const known = Object.freeze({manufacturing:'제조·도매',academy:'학원·교육',interior:'인테리어·시공'});
  const industry = document.body.dataset.v38Industry;
  if (!Object.prototype.hasOwnProperty.call(known,industry)) return;
  const checkboxes = [...root.querySelectorAll('input[name="module"]')];
  const count = document.getElementById('v38-count');
  const list = document.getElementById('v38-selected');
  const feedback = document.getElementById('v38-feedback');
  const copy = document.getElementById('v38-copy');
  const download = document.getElementById('v38-download');
  const clean = v => String(v).replace(/[\r\n\u0000-\u001f\u007f]/g,' ').trim();
  const chosen = () => checkboxes.filter(c => c.checked).map(c => ({name:clean(c.dataset.name),detail:clean(c.dataset.detail)}));
  const brief = () => {
    const items = chosen();
    return ['[올파일원 웹스튜디오 | 제작 상담 참고 메모]',
      '업종: '+known[industry],
      '관심 기능: '+(items.length ? items.map(i=>i.name).join(', ') : '아직 선택하지 않음'),
      ...items.map(i => '- '+i.name+': '+i.detail),
      '',
      '※ 가상 시연을 바탕으로 작성한 참고 목록이며 계약·견적 확정이 아닙니다.',
      '※ 실제 기능 범위, 운영비, 보안·개인정보, 외부 연동은 상담 시 확인합니다.'].join('\n');
  };
  const render = () => {
    const items = chosen();
    count.textContent = items.length+'개 기능 선택';
    list.replaceChildren();
    for(const item of items){ const li = document.createElement('li');li.textContent=item.name;list.append(li); }
    if (!items.length){const li=document.createElement('li');li.textContent='원하는 기능을 선택해 주세요.';list.append(li);}
    feedback.textContent='';
  };
  checkboxes.forEach(c=>c.addEventListener('change',render));
  copy?.addEventListener('click',async()=>{
    if(!chosen().length){feedback.textContent='기능을 하나 이상 선택해 주세요.';return;}
    try{await navigator.clipboard.writeText(brief());feedback.textContent='선택한 구성 메모를 복사했습니다. 상담서에 붙여넣으세요.';}
    catch{feedback.textContent='복사가 허용되지 않는 환경입니다. TXT 저장을 이용해 주세요.';}
  });
  download?.addEventListener('click',()=>{
    if(!chosen().length){feedback.textContent='기능을 하나 이상 선택해 주세요.';return;}
    const file = new Blob(['\ufeff',brief()],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(file),anchor=document.createElement('a');
    anchor.href=url;anchor.download='AllFileOne_'+industry+'_consultation_scope.txt';
    document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),500);
    feedback.textContent='참고 메모를 TXT로 저장했습니다. 최종 상담 요청은 별도로 보내야 합니다.';
  });
  render();
})();