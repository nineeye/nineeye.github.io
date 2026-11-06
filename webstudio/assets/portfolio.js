'use strict';
(() => {
  const cards = [...document.querySelectorAll('[data-case]')];
  const tabs = [...document.querySelectorAll('[data-filter]')];
  const search = document.getElementById('pf-search');
  const count = document.getElementById('pf-count');
  const empty = document.getElementById('pf-empty');
  const tray = document.getElementById('pf-selection');
  const selectionText = document.getElementById('pf-selection-text');
  const live = document.getElementById('pf-live');
  const send = document.getElementById('pf-send');
  const selected = new Set();
  let category = 'all';

  function selectedBrief() {
    const items = cards.filter(card => selected.has(card.dataset.case));
    const lines = [
      '올파일원 웹스튜디오 · 제작 기능 참고 목록',
      '※ 아래 항목은 가상 브랜드로 만든 시연 사례입니다. 실제 운영 구축 범위는 상담 후 확정됩니다.',
      ''
    ];
    items.forEach((card, i) => lines.push((i+1)+'. '+card.dataset.title+' / '+card.dataset.feature));
    return lines.concat([
      '', '우리 업종/사업:', '원하는 주요 페이지:', '현재 운영 중인 사이트:',
      '희망 일정:', '참고 예산:', '', '문의: nineeyes@naver.com'
    ]).join('\n');
  }
  function renderCards() {
    let visible = 0;
    const term = search.value.normalize('NFKC').trim().toLocaleLowerCase('ko-KR');
    cards.forEach(card => {
      const isCategory = category === 'all' || card.dataset.category.split(' ').includes(category);
      const keywords = (card.dataset.title+' '+card.dataset.feature+' '+card.dataset.keywords).normalize('NFKC').toLocaleLowerCase('ko-KR');
      const show = isCategory && (!term || keywords.includes(term));
      card.hidden = !show;
      if (show) visible++;
    });
    count.textContent = '표시 중 '+visible+'개 · 전체 '+cards.length+'개';
    empty.hidden = visible !== 0;
  }
  function renderSelection() {
    const n = selected.size;
    tray.hidden = n === 0;
    selectionText.textContent = n+'개 기능 참고 사례 선택';
    cards.forEach(card => {
      const button = card.querySelector('[data-pick]');
      const on = selected.has(card.dataset.case);
      button.setAttribute('aria-pressed', String(on));
      button.textContent = on ? '✓ 선택됨' : '+ 제작에 참고';
    });
    if (n) {
      const subject = '[올파일원 웹스튜디오] 기능형 홈페이지 제작 상담';
      send.href = 'mailto:nineeyes@naver.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(selectedBrief());
    } else send.removeAttribute('href');
  }
  tabs.forEach(tab => tab.addEventListener('click', () => {
    category = tab.dataset.filter;
    tabs.forEach(btn => btn.setAttribute('aria-pressed', String(btn === tab)));
    renderCards();
  }));
  search.addEventListener('input', renderCards);
  cards.forEach(card => card.querySelector('[data-pick]').addEventListener('click', () => {
    const id = card.dataset.case;
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    renderSelection();
    live.textContent = selected.has(id) ? card.dataset.title+'을 참고 목록에 담았습니다.' : card.dataset.title+'을 참고 목록에서 제외했습니다.';
  }));
  document.getElementById('pf-reset').addEventListener('click', () => {
    selected.clear(); renderSelection(); live.textContent = '선택 목록을 비웠습니다.';
  });
  document.getElementById('pf-copy').addEventListener('click', async () => {
    if (!selected.size) return;
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      live.textContent = '자동 복사가 불가능합니다. 이메일 문의 버튼을 이용해 주세요.'; return;
    }
    try {
      await navigator.clipboard.writeText(selectedBrief());
      live.textContent = '기능 참고 목록을 복사했습니다. 상담은 아직 발송되지 않았습니다.';
    } catch {
      live.textContent = '복사 권한이 거부됐습니다. 이메일 문의 버튼을 이용해 주세요.';
    }
  });
  document.getElementById('pf-download').addEventListener('click', () => {
    if (!selected.size) return;
    const blob = new Blob(['\uFEFF', selectedBrief()], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'allfileone_function_request.txt';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    live.textContent = '기능 참고 목록을 TXT 파일로 저장했습니다. 서버로 전송하지 않았습니다.';
  });
  const params = new URLSearchParams(location.search);
  const view = params.get('type');
  if (['quote','booking','manage'].includes(view)) {
    const tab = tabs.find(button => button.dataset.filter === view);
    if (tab) tab.click();
  }
  renderCards(); renderSelection();
})();
