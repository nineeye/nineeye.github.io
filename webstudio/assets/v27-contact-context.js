/* WebStudio V27 / restore the industry & style chosen in a fictional demo.
 * All values are allowlisted. Only static design identifiers are read from URL.
 * No query string is ever transmitted to a backend, and demo results are not
 * copied into a real project brief. */
'use strict';
(() => {
  const form = document.getElementById('brief-form');
  if (!form || document.querySelector('[data-v27-context]')) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('source') !== 'demo') return;
  const industry = params.get('industry');
  const style = params.get('theme') || params.get('style');
  const knownIndustries = new Set([
    'manufacturing','corporate','clinic','academy','interior','commerce',
    'professional','association','franchise','stay','realestate','event'
  ]);
  const knownStyles = new Set(['modern','premium','editorial']);
  if (!knownIndustries.has(industry) || !knownStyles.has(style)) return;
  const presets = {
    manufacturing: ['lead',['catalog','quote']],
    corporate: ['brand',['portfolio']],
    clinic: ['booking',['booking','location']],
    academy: ['booking',['calendar','booking']],
    interior: ['showcase',['portfolio','quote']],
    commerce: ['commerce',['catalog','store']],
    professional: ['lead',['quote']],
    association: ['information',['cms','calendar']],
    franchise: ['lead',['quote','portfolio']],
    stay: ['booking',['booking','location']],
    realestate: ['lead',['catalog','location']],
    event: ['information',['calendar','booking']]
  };
  // Preserve any explicitly selected values; defaults are only offered if blank.
  if (!form.elements.goal.value) form.elements.goal.value = presets[industry][0];
  const checked = form.querySelectorAll('input[name="feature"]:checked');
  if (checked.length === 0) {
    for (const id of presets[industry][1]) {
      const input = [...form.querySelectorAll('input[name="feature"]')].find(n=>n.value===id);
      if (input) input.checked = true;
    }
  }
  const banner = document.createElement('aside');
  banner.className = 'v27-context';
  banner.dataset.v27Context='true';
  banner.setAttribute('role','status');
  const name = form.elements.industry.selectedOptions[0]?.textContent.trim() || industry;
  const styleName = form.elements.theme.selectedOptions[0]?.textContent.trim() || style;
  const label = document.createElement('div');
  label.className='v27-context-body';
  const tag = document.createElement('span');
  tag.className='v27-context-kicker';
  tag.textContent='DESIGN SELECTED · DEMO CONTEXT';
  const title = document.createElement('strong');
  title.textContent='시안 선택 내용이 연결됐습니다';
  const text = document.createElement('p');
  text.textContent = name+' / '+styleName+' — 이 업종에 일반적으로 필요한 기능을 미리 체크했습니다. ' +
    '필요에 맞게 자유롭게 수정하세요. 가상 주문·가격·예약 결과는 가져오지 않았습니다.';
  label.append(tag,title,text);
  const back = document.createElement('a');
  back.className = 'v27-context-back';
  back.href = './demo/'+industry+'/'+style+'/index.html';
  back.textContent='선택한 샘플로 돌아가기 ↗';
  banner.append(label,back);
  const section = document.getElementById('brief');
  const workspace = section?.querySelector('.workspace');
  if (workspace) workspace.before(banner);
  else form.before(banner);
  form.dispatchEvent(new Event('change',{bubbles:true}));
  document.body.dataset.v27ContextReady='true';
})();
