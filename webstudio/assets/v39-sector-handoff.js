/* AllFileOne WebStudio V39 — preserve ONLY approved feature IDs from the three sector product pages.
 * Zero storage, zero HTTP/API calls, zero third-party dependencies. All displayed text is local/trusted.
 */
'use strict';
(() => {
  const form = document.getElementById('brief-form');
  if (!form) return;
  const query = new URLSearchParams(location.search);
  if (query.get('source') !== 'sector') return;
  const definitions = Object.freeze({
    manufacturing: {name:'제조·도매', goal:'lead', modules:Object.freeze({
      catalog:['규격별 제품 검색','catalog'],quote:['견적 요청 구조','quote'],
      docs:['도면·자료 제공',null],crm:['문의 추적 방식',null]
    })},
    academy: {name:'학원·교육',goal:'lead',modules:Object.freeze({
      timetable:['반별 시간표','calendar'],course:['교육 과정 소개','catalog'],
      inquiry:['상담 준비 양식',null],notice:['공지·자료실','cms']
    })},
    interior: {name:'인테리어·시공',goal:'showcase',modules:Object.freeze({
      portfolio:['시공 포트폴리오','portfolio'],beforeafter:['시공 전후 비교','portfolio'],
      process:['시공 진행 안내',null],inquiry:['프로젝트 문의서','quote']
    })}
  });
  const has=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
  const industry=query.get('industry');
  if (!industry || !has(definitions,industry)) return;
  const config=definitions[industry];
  const scope=query.get('scope') || '';
  // Reject tampered, overlong or duplicate scope values instead of displaying raw URL text.
  if (scope.length>80 || (scope && !/^[a-z]+(?:,[a-z]+){0,3}$/.test(scope))) return;
  const ids=scope ? scope.split(',') : [];
  if (new Set(ids).size !== ids.length || ids.some(id=>!has(config.modules,id))) return;
  const selected=ids.map(id=>config.modules[id][0]);
  const note=selected.length ?
    '[업종별 제작 상품에서 선택한 관심 기능]\n'+selected.map(label=>'- '+label).join('\n')+
    '\n※ 실제 구현 및 운영 비용은 상담으로 확정합니다.' : '';
  if (form.elements.industry?.value !== industry) form.elements.industry.value=industry;
  if (!form.elements.goal?.value) form.elements.goal.value=config.goal;
  const detail=form.elements.namedItem('details');
  if (detail && !String(detail.value).trim() && note.length<=Number(detail.maxLength||700)) detail.value=note;
  const featureInputs=[...form.querySelectorAll('input[name="feature"]')];
  const mapped=[...new Set(ids.map(id=>config.modules[id][1]).filter(Boolean))];
  for (const id of mapped) {
    const input=featureInputs.find(node=>node.value===id);
    if(input) input.checked=true;
  }
  const banner=document.createElement('aside');
  banner.id='v39-sector-handoff'; banner.className='v39-sector-handoff';
  banner.setAttribute('role','status'); banner.setAttribute('aria-live','polite');
  const title=document.createElement('strong');
  title.textContent=config.name+' 제작 상품에서 이어졌습니다.';
  const info=document.createElement('p');
  info.textContent=selected.length ?
    '선택한 '+selected.length+'개 기능: '+selected.join(' · ')+'. 아래 상담 준비서의 요청사항에 반영했습니다. 자유롭게 수정할 수 있습니다.' :
    '업종과 제작 방향을 연결했습니다. 관심 기능을 직접 선택해 주세요.';
  const back=document.createElement('a');
  back.href='./for-'+industry+'.html';back.textContent='상품 페이지로 돌아가기 ↗';
  banner.append(title,info,back);
  const section=document.getElementById('brief');
  const workspace=section?.querySelector('.workspace');
  if(workspace) workspace.before(banner);
  else form.before(banner);
  const indField=form.elements.industry;
  indField?.addEventListener('change',()=>{
    if(indField.value!==industry){
      info.textContent='업종이 변경됐습니다. 이전 선택 기능과 추가 요청사항을 새 업종에 맞게 확인해 주세요.';
      if (detail?.value === note) detail.value='';
      form.dispatchEvent(new Event('input',{bubbles:true}));
    }
  });
  form.dispatchEvent(new Event('input',{bubbles:true}));
})();