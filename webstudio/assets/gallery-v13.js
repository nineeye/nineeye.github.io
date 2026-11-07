
'use strict';
(() => {
  const industries = {"manufacturing":{"name":"제조 · 도매","brand":"모노팩토리","english":"MONO FACTORY","sub":"제품 규격과 납품 역량을 한눈에. 견적 문의까지 자연스럽게 연결합니다."},"corporate":{"name":"기업 · 회사소개","brand":"오름파트너스","english":"OREUM PARTNERS","sub":"회사의 비전부터 서비스, 프로젝트 실적까지 일관된 메시지로 소개합니다."},"clinic":{"name":"병원 · 의원","brand":"온유메디컬","english":"ONYU MEDICAL","sub":"진료과목, 의료진, 운영시간과 찾아오는 길을 알아보기 쉽게 구성합니다."},"academy":{"name":"학원 · 교육","brand":"브릿지아카데미","english":"BRIDGE ACADEMY","sub":"과정 소개와 일정, 상담 신청 동선을 명확하게 보여주는 교육 사이트입니다."},"interior":{"name":"인테리어 · 시공","brand":"결스튜디오","english":"GYEOL STUDIO","sub":"시공 전후의 변화를 시각적으로 보여주고 상담까지 연결합니다."},"commerce":{"name":"브랜드 · 쇼핑몰","brand":"소일마켓","english":"SOIL MARKET","sub":"상품의 매력을 전하고 구매·배송·교환 안내를 정리합니다."},"professional":{"name":"법률 · 세무 · 회계","brand":"정담어드바이저리","english":"JEONGDAM ADVISORY","sub":"전문 분야와 상담 절차를 차분하게 안내하는 신뢰형 홈페이지입니다."},"association":{"name":"협회 · 단체","brand":"내일연구회","english":"TOMORROW FORUM","sub":"공지사항, 연구자료, 소식을 회원과 방문자에게 체계적으로 안내합니다."},"franchise":{"name":"프랜차이즈 · 창업","brand":"모닝브루","english":"MORNING BREW","sub":"브랜드 강점, 창업 과정, 가맹 문의를 한 페이지에 소개합니다."},"stay":{"name":"숙박 · 펜션","brand":"숨스테이","english":"SOOM STAY","sub":"객실, 부대시설, 주변 관광지와 예약 링크를 감각적으로 구성합니다."},"realestate":{"name":"부동산 · 분양","brand":"자리공간","english":"JARI SPACE","sub":"매물과 입지 정보, 공간 이미지를 한눈에 비교하도록 돕습니다."},"event":{"name":"행사 · 캠페인","brand":"크리에이트데이","english":"CREATE DAY","sub":"행사 프로그램, 일정, 신청 동선을 한 화면에서 보여줍니다."}};
  const allowed = new Set(Object.keys(industries));
  const buttons = [...document.querySelectorAll('[data-industry]')];
  const search = document.getElementById('industry-search');
  const empty = document.getElementById('empty-industries');
  const status = document.getElementById('gallery-status');
  const styles = ['modern','premium','editorial'];
  function render(industry) {
    if (!allowed.has(industry)) return;
    const item=industries[industry];
    document.getElementById('current-english').textContent = item.english + ' · THREE CREATIVE DIRECTIONS';
    document.getElementById('current-brand').textContent = item.brand;
    document.getElementById('current-desc').textContent = item.sub;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.industry === industry)));
    styles.forEach(style => {
      const card=document.querySelector('[data-card="'+style+'"]');
      if (!card) return;
      const path='demo/'+industry+'/'+style+'/index.html';
      const thumb='assets/v13-shots/'+industry+'-'+style+'.svg';
      card.querySelector('img').src = thumb;
      card.querySelector('img').alt = item.name+' '+style+' 디자인 실제 웹페이지 캡처';
      card.querySelector('.card-image').href = path;
      card.querySelector('.card-image').setAttribute('aria-label',item.name+' '+style+' 스타일 실제 샘플 열기');
      card.querySelector('.card-link').href = path;
    });
    status.textContent=item.name+' 업종의 세 가지 디자인이 표시됐습니다.';
  }
  buttons.forEach((button,index) => {
    button.addEventListener('click', () => render(button.dataset.industry));
    button.addEventListener('keydown', event => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      const visible=buttons.filter(btn => !btn.hidden);
      if (!visible.length) return;
      event.preventDefault();
      const current=visible.indexOf(button);
      const delta=event.key==='ArrowDown' ? 1 : -1;
      const next=visible[(current+delta+visible.length)%visible.length];
      next.focus();render(next.dataset.industry);
    });
  });
  search.addEventListener('input', () => {
    const term=search.value.trim().normalize('NFKC').toLocaleLowerCase('ko-KR');
    let count=0;
    buttons.forEach(button => {
      const info=industries[button.dataset.industry];
      const hay=(info.name+' '+info.english+' '+info.brand).normalize('NFKC').toLocaleLowerCase('ko-KR');
      button.hidden=!!term && !hay.includes(term);
      if(!button.hidden)count++;
    });
    empty.hidden=count!==0;
  });
  const params=new URLSearchParams(location.search);
  if (allowed.has(params.get('industry'))) render(params.get('industry'));
})();
