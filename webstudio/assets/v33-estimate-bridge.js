'use strict';
/* V33: pass only public option identifiers from example estimator to consultation. */
(() => {
  const form=document.getElementById('estimate-form');
  const button=document.getElementById('estimate-to-brief');
  const model=window.WEBSTUDIO_ESTIMATE_MODEL;
  if(!form||!button||!model)return;
  const industry=form.querySelector('#estimate-industry');
  const plan=form.querySelector('#estimate-plan');
  const style=document.getElementById('gallery-style');
  const feedback=document.getElementById('estimate-brief-status');
  function update(){
    const selected=Array.from(form.querySelectorAll('input[type=checkbox]:checked'))
      .map(input=>input.value).filter(k=>Object.prototype.hasOwnProperty.call(model.addons,k));
    const quote=model.calculate(plan?.value,selected);
    const industryId=industry?.value||'';
    const industryAvailable=Array.from(industry?.options||[]).some(option=>option.value===industryId&&industryId!=='');
    const theme=model.allowedThemes.includes(style?.value)?style.value:'modern';
    if(!industryAvailable||!quote){
      button.href='./contact.html';
      button.textContent='업종 선택 후 상담 준비하기 ↗';
      if(feedback)feedback.textContent='먼저 업종과 제작 범위를 선택하면 구성 정보가 상담서로 전달됩니다.';
      return;
    }
    const q=new URLSearchParams({source:'estimate',industry:industryId,theme,plan:quote.plan});
    if(quote.addons.length)q.set('addons',quote.addons.join(','));
    button.href='./contact.html?'+q.toString()+'#brief';
    button.textContent='이 구성으로 제작 상담 준비하기 ↗';
    if(feedback)feedback.textContent='선택한 업종·디자인·상품·추가 기능 식별자만 다음 화면으로 전달합니다. 이름이나 개인정보는 보내지 않습니다.';
  }
  for(const eventName of ['change','input'])form.addEventListener(eventName,update);
  style?.addEventListener('change',update);
  form.addEventListener('reset',()=>setTimeout(update,0));
  button.addEventListener('click',update);
  update();
})();
