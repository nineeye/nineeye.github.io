/* AllFileOne WebStudio V27 — 36 demo -> real project brief handoff.
 * Only known industry/style identifiers are transferred. No demo prices, personal
 * information, fake bookings, cookies, analytics, network POST or storage. */
'use strict';
(() => {
  const allowedIndustries = new Set([
    'manufacturing','corporate','clinic','academy','interior','commerce',
    'professional','association','franchise','stay','realestate','event'
  ]);
  const allowedStyles = new Set(['modern','premium','editorial']);
  const industry = document.body?.dataset.industry;
  const style = document.body?.dataset.v13Style;
  if (!allowedIndustries.has(industry) || !allowedStyles.has(style)) return;
  if (document.querySelector('[data-v27-conversion]')) return;
  const params = new URLSearchParams({industry,theme:style,source:'demo'});
  const briefUrl = '../../../contact.html?' + params.toString();
  const quoteUrl = '../../../index.html?industry=' + encodeURIComponent(industry)
    + '&theme=' + encodeURIComponent(style) + '#estimate';
  // Upgrade the existing (formerly estimate-only) header action without
  // removing the original quote calculator, which remains available below.
  const headerAction = document.querySelector('header.site-head a.head-cta');
  if (headerAction) {
    headerAction.href = briefUrl;
    headerAction.textContent = '이 디자인으로 상담 준비 ↗';
    headerAction.setAttribute('aria-label', '현재 업종과 디자인을 선택한 제작 상담 준비서로 이동');
  }
  const main = document.querySelector('main');
  if (!main) return;
  const section = document.createElement('aside');
  section.className = 'v27-conversion';
  section.dataset.v27Conversion = 'true';
  section.setAttribute('aria-label','이 샘플로 홈페이지 제작 준비하기');
  const content = document.createElement('div');
  content.className = 'v27-conversion-copy';
  const kicker = document.createElement('span');
  kicker.className = 'v27-conversion-kicker';
  kicker.textContent = 'FROM DEMO TO YOUR WEBSITE / NEXT STEP';
  const heading = document.createElement('h2');
  heading.textContent = '마음에 드는 구성을 찾으셨나요?';
  const detail = document.createElement('p');
  detail.textContent = '이 업종과 디자인을 선택한 상담 준비서를 바로 만들 수 있습니다. ' +
    '가상 제품·가격·일정·선택 결과는 전달하지 않으며, 실제 문의는 방문자가 이메일에서 전송합니다.';
  content.append(kicker,heading,detail);
  const actions = document.createElement('div');
  actions.className = 'v27-conversion-actions';
  const brief = document.createElement('a');
  brief.className = 'v27-conversion-primary';
  brief.href = briefUrl;
  brief.textContent = '이 디자인으로 상담 준비 ↗';
  const estimate = document.createElement('a');
  estimate.className = 'v27-conversion-secondary';
  estimate.href = quoteUrl;
  estimate.textContent = '예상 제작비 구성 살펴보기 ↗';
  actions.append(brief,estimate);
  section.append(content,actions);
  // Prefer immediately after the working demo to keep the contextual CTA next
  // to the interaction. If absent, append near the end of the main document.
  const workflow = document.getElementById('v23-workflow');
  if (workflow) workflow.insertAdjacentElement('afterend',section);
  else main.append(section);
  document.body.dataset.v27Ready = 'true';
})();
