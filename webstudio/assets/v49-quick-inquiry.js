/* AllFileOne WebStudio V49 — original no-dependency quick inquiry.
 * Nothing is transmitted or stored by this page. Email actions are user initiated.
 */
(() => {
  'use strict';
  const RECIPIENT = 'nineeyes@naver.com';
  const DATA = Object.freeze({
    ...window.AFO_V55_QUICK_DATA,
    manufacturing: {name:'제조 · 도매',features:[['catalog','제품·규격 검색 중심'],['quote','품목별 견적 문의 중심'],['docs','카탈로그·도면 자료실 중심'],['intro','회사·제품 소개 중심']],scopes:[['small','대표 제품 1~20종'],['medium','제품 21~100종'],['large','제품 101종 이상'],['unknown','품목 수 미정']]},
    academy: {name:'학원 · 교육',features:[['course','과정·강좌 소개 중심'],['schedule','반별 시간표 안내 중심'],['consult','학부모·학생 상담 안내 중심'],['notice','공지·교육 자료 제공 중심']],scopes:[['small','강좌 1~5개'],['medium','강좌 6~20개'],['large','강좌 21개 이상'],['unknown','강좌 수 미정']]},
    interior: {name:'인테리어 · 시공',features:[['portfolio','시공 사례·포트폴리오 중심'],['quote','지역·면적별 견적 문의 중심'],['process','시공 진행 과정 안내 중심'],['intro','시공 서비스 소개 중심']],scopes:[['small','사례 1~10건'],['medium','사례 11~30건'],['large','사례 31건 이상'],['unknown','사례 수 미정']]}
  });
  const $ = id => document.getElementById(id);
  const form = $('v49-form'), feature = $('v49-feature'), scope = $('v49-scope'), output = $('v49-output'), status = $('v49-status');
  if (!form || !feature || !scope || !output || !status) return;
  const has = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);
  const clean = (value,max=240) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
  let current = 'manufacturing';
  const urlValue = new URLSearchParams(window.location.search).get('industry');
  if (has(DATA,urlValue)) {
    const radio = form.querySelector('input[name="industry"][value="'+urlValue+'"]');
    if (radio) radio.checked = true;
  }
  function industry() {
    const id = form.querySelector('input[name="industry"]:checked')?.value;
    return has(DATA,id) ? id : 'manufacturing';
  }
  function setOptions(node,pairs) {
    node.replaceChildren();
    for (const [value,label] of pairs) {
      const option = document.createElement('option');option.value=value;option.textContent=label;node.append(option);
    }
  }
  function refreshSector() {
    current = industry();
    const data=DATA[current];
    setOptions(feature,data.features);setOptions(scope,data.scopes);
    render();
  }
  function labelFor(pairs,value) {
    const found = pairs.find(pair=>pair[0]===value);
    return found ? found[1] : '';
  }
  function parts() {
    const data=DATA[industry()];
    const f=labelFor(data.features,feature.value),s=labelFor(data.scopes,scope.value);
    const timing=clean(form.elements.namedItem('timing')?.value,40);
    const budget=clean(form.elements.namedItem('budget')?.value,40);
    const note=clean(form.elements.namedItem('note')?.value,240);
    const subject='[올파일원 웹스튜디오] '+data.name+' 홈페이지 제작 문의';
    const lines=[
      '안녕하세요. 홈페이지 제작 관련하여 상담을 요청합니다.',
      '',
      '업종: '+data.name,
      '가장 필요한 기능: '+(f||'미선택'),
      '예상 자료 규모: '+(s||'미선택'),
      '희망 일정: '+timing,
      '참고 예산: '+budget,
      '추가 요청: '+(note||'상담 시 협의'),
      '',
      '위 조건에 적합한 제작 범위·예상 비용·필요 자료를 안내받고 싶습니다.',
      '※ 예산·일정은 의뢰인의 희망이며 확정 견적이나 납기 약속이 아닙니다.',
      '※ 연락은 제가 직접 발송한 이메일로 부탁드립니다.'
    ];
    return {subject,body:lines.join('\n')};
  }
  function whole() { const p=parts();return '받는 사람: '+RECIPIENT+'\n제목: '+p.subject+'\n\n'+p.body+'\n'; }
  function render() {output.textContent=whole();}
  function valid(){
    if (!form.checkValidity()){status.textContent='필수 항목을 확인해 주세요. 메일은 아직 전송되지 않았습니다.';form.reportValidity();return false;}
    if (!labelFor(DATA[industry()].features,feature.value)||!labelFor(DATA[industry()].scopes,scope.value)){
      status.textContent='업종·기능·규모가 맞지 않습니다. 다시 골라 주세요.';return false;
    }
    return true;
  }
  function manualFallback(value){
    output.textContent=value;output.focus();
    status.textContent='이 브라우저에서 자동 복사가 제한되었습니다. 아래 문안을 선택하여 복사하거나 TXT로 저장해 주세요.';
  }
  async function copy(value,success){
    try {if (typeof navigator.clipboard?.writeText!=='function') throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(value);status.textContent=success;
    }catch(_){manualFallback(value);}
  }
  form.addEventListener('change',event=>{if(event.target?.name==='industry')refreshSector();else render();status.textContent='';});
  form.addEventListener('input',()=>{render();status.textContent='';});
  form.addEventListener('submit',event=>event.preventDefault());
  $('v49-copy').addEventListener('click',()=>{if(valid())copy(whole(),'문의 내용을 복사했습니다. 이메일에서 직접 붙여넣어 보내 주세요. 아직 접수되지 않았습니다.');});
  $('v49-recipient').addEventListener('click',()=>copy(RECIPIENT,'받는 사람 주소를 복사했습니다. 웹메일에서 직접 보내 주세요.'));
  $('v49-download').addEventListener('click',()=>{
    if(!valid())return;
    const blob=new Blob(['\ufeff',whole()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='AllFileOne_Quick_Inquiry_V49.txt';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);status.textContent='TXT 파일을 저장했습니다. 이메일 발송이나 상담 접수는 아직 이루어지지 않았습니다.';
  });
  $('v49-mailto').addEventListener('click',()=>{
    if(!valid())return;
    const p=parts(),uri='mailto:'+RECIPIENT+'?subject='+encodeURIComponent(p.subject)+'&body='+encodeURIComponent(p.body);
    if(uri.length>1900){status.textContent='메일 주소 길이가 너무 깁니다. TXT 저장이나 복사를 이용해 주세요.';return;}
    status.textContent='메일 앱으로 초안을 여는 중입니다. 반드시 메일 앱의 보내기를 직접 눌러야 합니다.';
    window.location.href=uri;
  });
  refreshSector();
})();
