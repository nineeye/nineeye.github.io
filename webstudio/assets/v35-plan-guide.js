'use strict';
/* V35: one allowlisted rate card shared with V33. Client-only, no collection. */
(() => {
  const form = document.getElementById('pg-form');
  const model = window.WEBSTUDIO_ESTIMATE_MODEL;
  if (!form) return;
  const byId = id => document.getElementById(id);
  const total = byId('pg-total'), output = byId('pg-summary'), risk = byId('pg-risk');
  const consult = byId('pg-consult'), feedback = byId('pg-feedback');
  const number = new Intl.NumberFormat('ko-KR');
  const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
  const industryLabels = Object.freeze({
    manufacturing:'제조·도매',corporate:'기업·회사소개',clinic:'병원·의원',academy:'학원·교육',
    interior:'인테리어·시공',commerce:'브랜드·쇼핑몰',professional:'법률·세무·회계',
    association:'협회·단체',franchise:'프랜차이즈',stay:'숙박·펜션',realestate:'부동산',
    event:'행사·캠페인',restaurant:'음식점·카페',beauty:'뷰티·미용',logistics:'물류·운송'
  });
  const themeLabels = Object.freeze({modern:'모던',premium:'프리미엄',editorial:'에디토리얼'});
  const selected = () => [...form.querySelectorAll('input[name="addon"]:checked')].map(input => input.value);
  const plan = () => form.elements.plan.value;
  const industry = () => form.elements.industry.value;
  const theme = () => form.elements.theme.value;
  function quote() {
    if (!model || !own(model.plans,plan())) return null;
    return model.calculate(plan(), selected());
  }
  function details() {
    const q = quote();
    if (!q) return null;
    return [
      '[올파일원 웹스튜디오 · 제작 상품 비교 참고서]',
      '업종: ' + (industryLabels[industry()] || '미선택'),
      '선호 디자인: ' + (themeLabels[theme()] || '모던'),
      '상품: ' + model.planLabels[q.plan],
      '기본 참고 금액: ' + number.format(model.plans[q.plan]) + '원',
      '추가 기능: ' + (q.addons.length ? q.addons.map(key => model.addonLabels[key] + ' (+' + number.format(model.addons[key]) + '원)').join(', ') : '없음'),
      '참고 합계: ' + number.format(q.total) + '원',
      '※ 부가세, 도메인, 호스팅, 유지보수, 외부 서비스 비용 별도 협의',
      '※ 실제 예약·결제·회원·관리자 기능은 별도 운영/보안 확인',
      '※ 이 문서는 확정 견적·계약·결제·상담 접수가 아닙니다.'
    ];
  }
  function render() {
    feedback.textContent='';
    form.querySelectorAll('.plan-choice').forEach(label=>label.classList.toggle('is-selected', label.querySelector('input').checked));
    const lines=details();
    if (!lines) {
      total.textContent='계산 불가'; output.textContent='공통 기준표를 읽지 못했습니다. 새로고침 후 다시 시도해 주세요.';
      consult.href='./contact.html#brief'; consult.classList.add('is-disabled');consult.setAttribute('aria-disabled','true');
      risk.textContent='예시 금액의 정확성을 확인할 수 없습니다.';return;
    }
    const q=quote();
    total.textContent=number.format(q.total)+'원'; output.textContent=lines.join('\n');
    const selectedAddons=new Set(q.addons);
    const warnings=[];
    if(selectedAddons.has('reservation'))warnings.push('예약 연동: 외부 서비스 계정·요금·운영 방식 별도 확인');
    if(selectedAddons.has('cms'))warnings.push('콘텐츠 관리: 로그인·데이터 저장·접근권한 서버 필요 여부 검토');
    if(industry()==='commerce')warnings.push('실제 쇼핑몰 판매는 결제·환불·배송·개인정보 정책 별도 확인');
    risk.textContent = '별도 확인: 부가세·도메인·호스팅·유지보수.'+(warnings.length?'\n'+warnings.join('\n'):'');
    if (!own(industryLabels,industry())) {
      consult.href='./contact.html#brief'; consult.classList.add('is-disabled'); consult.setAttribute('aria-disabled','true');
      consult.firstChild.textContent='업종을 선택하면 상담서로 연결됩니다 ';
    } else {
      const query=new URLSearchParams({source:'estimate',industry:industry(),theme:theme(),plan:q.plan});
      if(q.addons.length)query.set('addons',q.addons.join(','));
      consult.href='./contact.html?'+query.toString()+'#brief';
      consult.classList.remove('is-disabled');consult.removeAttribute('aria-disabled');
      consult.firstChild.textContent='선택한 구성으로 상담 준비서 열기 ';
    }
  }
  const incoming=new URLSearchParams(location.search);
  const requestedPlan=incoming.get('plan');
  if (model && own(model.plans,requestedPlan)) {
    const radio=form.querySelector('input[name="plan"][value="'+requestedPlan+'"]');if(radio)radio.checked=true;
  }
  const requestedIndustry=incoming.get('industry');
  if (own(industryLabels,requestedIndustry)) form.elements.industry.value=requestedIndustry;
  const requestedTheme=incoming.get('theme');
  if(own(themeLabels,requestedTheme))form.elements.theme.value=requestedTheme;
  form.addEventListener('input',render);form.addEventListener('change',render);
  form.addEventListener('reset',()=>{window.setTimeout(render,0)});
  document.querySelectorAll('[data-select-plan]').forEach(link => link.addEventListener('click',() => {
    const choice=link.dataset.selectPlan;
    if(model && own(model.plans,choice)) {
      const radio=form.querySelector('input[name="plan"][value="'+choice+'"]');
      if(radio){radio.checked=true;render();}
    }
  }));
  consult.addEventListener('click',event=>{if(consult.getAttribute('aria-disabled')==='true'){event.preventDefault();form.elements.industry.focus();feedback.textContent='업종을 선택한 후 상담 준비서로 이동해 주세요.';}});
  byId('pg-copy').addEventListener('click',async()=>{
    const lines=details();if(!lines)return;
    try {await navigator.clipboard.writeText(lines.join('\n'));feedback.textContent='선택한 구성서를 복사했습니다. 상담이 자동 접수된 것은 아닙니다.';}
    catch {feedback.textContent='자동 복사가 불가능합니다. 위 구성 내용을 직접 선택하거나 TXT 파일로 저장해 주세요.';}
  });
  byId('pg-save').addEventListener('click',()=>{
    const lines=details();if(!lines)return;
    const url=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\n')],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='allfileone_plan_comparison.txt';document.body.append(a);a.click();a.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),4000);
    feedback.textContent='구성서를 TXT로 저장했습니다. 저장은 상담 접수가 아닙니다.';
  });
  render();
})();
