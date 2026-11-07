'use strict';
(() => {
  const cards = [...document.querySelectorAll('.work-card')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const input = document.getElementById('work-search');
  const status = document.getElementById('work-status');
  const empty = document.getElementById('no-results');
  let selected = 'all';
  function render() {
    const needle = input.value.normalize('NFKC').toLocaleLowerCase('ko-KR').trim();
    let count = 0;
    for (const card of cards) {
      const keywords = (card.dataset.terms || '').normalize('NFKC').toLocaleLowerCase('ko-KR');
      const matches = (selected === 'all' || card.dataset.category === selected) && (!needle || keywords.includes(needle));
      card.hidden = !matches;
      if(matches) count++;
    }
    status.textContent = `${count}개 디자인을 표시합니다. (전체 ${cards.length}개)`;
    empty.hidden = count !== 0;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    render();
  }));
  input.addEventListener('input', render);
  render();
})();
