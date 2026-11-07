'use strict';
/* AllFileOne WebStudio V26 — client-only project brief, zero tracking / zero network uploads. */
(() => {
  const form = document.getElementById('brief-form');
  if (!form) return;
  const output = document.getElementById('brief-output');
  const headline = document.getElementById('brief-summary');
  const feedback = document.getElementById('brief-feedback');
  const mailButton = document.getElementById('brief-email');
  const copyButton = document.getElementById('brief-copy');
  const saveButton = document.getElementById('brief-download');
  const recipient = 'nineeyes@naver.com';
  const data = {
    industries: {
      manufacturing: '제조 · 도매', corporate: '기업 · 회사소개', clinic: '병원 · 의원', academy: '학원 · 교육',
      interior: '인테리어 · 시공', commerce: '브랜드 · 쇼핑몰', professional: '법률 · 세무 · 회계',
      association: '협회 · 단체', franchise: '프랜차이즈 · 창업', stay: '숙박 · 펜션',
      realestate: '부동산 · 분양', event: '행사 · 캠페인',
      restaurant: '음식점 · 카페 (추가 시연)', beauty: '뷰티 · 미용 (추가 시연)', logistics: '물류 · 운송 (추가 시연)'
    },
    themes: {modern: '모던', premium: '프리미엄', editorial: '에디토리얼', undecided: '디자인 추천 요청'},
    goals: {lead:'견적·상담 문의 늘리기',showcase:'제품·서비스·포트폴리오 소개',booking:'방문·예약 연결',commerce:'상품 판매·외부 구매 연결',information:'공지·자료·행사 안내',brand:'브랜드·회사 신뢰 강화'},
    budgets: {unknown:'미정',under50:'50만원 미만','50to100':'50~100만원','100to300':'100~300만원',over300:'300만원 이상'},
    timings: {flexible:'협의 가능','2weeks':'2주 이내','1month':'1개월 이내','3months':'3개월 이내'},
    features: {catalog:'제품·서비스 검색',quote:'견적 요청·품목 선택',booking:'예약·일정 연결',store:'상품·장바구니',portfolio:'시공·작품 갤러리',calendar:'시간표·행사 일정',cms:'공지·콘텐츠 관리',location:'위치·찾아오는 길'}
  };
  const get = key => form.elements.namedItem(key)?.value || '';
  const safe = (object, key, empty = '선택하지 않음') => Object.prototype.hasOwnProperty.call(object,key) ? object[key] : empty;
  const chosenFeatures = () => [...form.querySelectorAll('input[name="feature"]:checked')]
    .map(input => safe(data.features, input.value, '')).filter(Boolean);
  // V33: only known plan/addon keys arrive from our own example estimator.
  // The monetary amount is NEVER accepted from a URL: recompute it from the
  // same local rate card used by the homepage calculator.
  const estimateModel = window.WEBSTUDIO_ESTIMATE_MODEL;
  const quotedChoices = estimateModel?.parse(
    window.location.search,Object.keys(data.industries)) || null;
  const activeQuote = () => get('industry') === quotedChoices?.industry ? quotedChoices : null;
  const estimateLines = () => {
    const quote=activeQuote();
    if(!quote)return [];
    const fmt=new Intl.NumberFormat('ko-KR');
    return [
      '메인에서 선택한 제작 상품: '+estimateModel.planLabels[quote.plan],
      '메인에서 선택한 추가 기능: '+(quote.addons.map(k=>estimateModel.addonLabels[k]).join(', ')||'없음'),
      '예시 계산 금액: '+fmt.format(quote.total)+'원부터 (기획 참고용)',
      '※ 부가세, 도메인, 외부 서비스, 실제 데이터 연동 및 유지보수는 별도 협의'
    ];
  };
  // V32: explicit scope input is optional and stays entirely in the visitor's browser.
  const scopeData = {
    pages:{unknown:'미정 / 추천 요청',small:'1~3페이지',medium:'4~8페이지',large:'9페이지 이상'},
    operations:{unknown:'미정 / 추천 요청',static:'소개형 정적 사이트',external:'외부 예약·결제 서비스 연동',managed:'관리자·회원·데이터 처리 기능'},
    assets:{logo:'로고·브랜드 정보',photos:'제품·서비스 사진',copy:'소개 문구·가격표',domain:'도메인·호스팅 계정'},
    materials:{
      manufacturing:'제품 규격표·납기 안내',corporate:'사업 소개·서비스 자료',clinic:'진료시간표·의료진 안내',
      academy:'강좌 시간표·수강 안내',interior:'시공사례·시공 범위',commerce:'상품 사진·배송·환불 정책',
      professional:'상담 분야·필요 서류',association:'회원 안내·공지 자료',franchise:'가맹 안내·공식 사업자료',
      stay:'객실 사진·운영시간·예약 정책',realestate:'매물 자료·표시 허용 범위',event:'프로그램·시간표·참가 안내',
      restaurant:'메뉴·가격표·영업시간',beauty:'시술 안내·가격·운영시간',logistics:'운송 범위·규격·접수 정책'
    }
  };
  const chosenAssets = () => [...form.querySelectorAll('input[name="asset"]:checked')]
    .map(input => safe(scopeData.assets,input.value,'')).filter(Boolean);
  function scopeRisks() {
    const selected=new Set([...form.querySelectorAll('input[name="feature"]:checked')].map(i=>i.value));
    const warnings=[];
    if (get('operation')==='external'||selected.has('booking')||get('goal')==='booking'||activeQuote()?.addons.includes('reservation'))
      warnings.push('외부 예약·일정 서비스 연동 방식과 요금·계정 소유권 협의 필요');
    if (get('operation')==='managed'||selected.has('cms')||activeQuote()?.addons.includes('cms'))
      warnings.push('관리자·콘텐츠 저장·접근권한에 필요한 서버/외부 서비스와 유지보수 협의 필요');
    if (selected.has('store')||get('goal')==='commerce')
      warnings.push('실제 판매는 결제대행·개인정보·배송·환불 정책 별도 검증 필요');
    if (get('operation')==='static' && warnings.length)
      warnings.unshift('정적 사이트만으로는 선택한 실운영 기능이 완성되지 않으므로 범위 재확인 필요');
    return [...new Set(warnings)];
  }
  function scopeLines() {
    return [
      '예상 페이지 규모: '+safe(scopeData.pages,get('pagecount'),'미정'),
      '운영 방식: '+safe(scopeData.operations,get('operation'),'미정'),
      '주요 방문 고객: '+(get('audience').trim()||'협의 필요'),
      '준비된 자료: '+(chosenAssets().join(', ')||'미정'),
      '업종별 준비 참고: '+safe(scopeData.materials,get('industry'),'업종별 협의 필요'),
      '별도 연동·운영 확인: '+(scopeRisks().join(' / ')||'선택사항 및 운영 범위 협의 필요')
    ];
  }
  // V31: the URL conveys at most four numeric feature indices; names are read
  // from our own trusted local catalog, never copied from untrusted query text.
  const galleryChoice = (() => {
    const query = new URLSearchParams(window.location.search);
    const industry = query.get('industry');
    const raw = query.get('selected') || '';
    if (query.get('source') !== 'gallery' ||
        !Object.prototype.hasOwnProperty.call(data.industries,industry) ||
        !/^[0-3](?:,[0-3]){0,3}$/.test(raw)) return {industry:'',titles:[]};
    const features = window.ALLFILEONE_V28_CATALOG?.[industry]?.features;
    if (!Array.isArray(features) || features.length !== 4) return {industry:'',titles:[]};
    const titles = [...new Set(raw.split(',').map(Number))]
      .map(n => features[n]?.title).filter(t => typeof t === 'string' && t.length <= 80);
    return {industry,titles};
  })();
  const importedTitles = () => get('industry') === galleryChoice.industry ? galleryChoice.titles : [];
  function briefLines() {
    return [
      '[올파일원 웹스튜디오 · 홈페이지 제작 상담 준비서]',
      '업종: ' + safe(data.industries, get('industry')),
      '디자인: ' + safe(data.themes, get('theme')),
      '목표: ' + safe(data.goals, get('goal')),
      '필요 기능: ' + (chosenFeatures().join(', ') || '미정') +
        (importedTitles().length ? ' / 시연에서 선택한 기능: ' + importedTitles().join(', ') : ''),
      ...estimateLines(),
      ...scopeLines(),
      '예산: ' + safe(data.budgets, get('budget'), '미정'),
      '일정: ' + safe(data.timings, get('timing'), '협의 가능'),
      '추가 요청: ' + (get('details').trim() || '없음'),
      '',
      '※ 위 내용은 가상 사이트 제작 상담을 위한 사전 준비서입니다.',
      '※ 웹페이지에서 자동 제출되지 않았으며, 이메일 앱에서 직접 전송해야 합니다.',
      '※ 실제 예약·결제·서버 접수를 의미하지 않습니다.'
    ];
  }
  function render() {
    const ind = safe(data.industries, get('industry'),'업종을 선택해 주세요');
    const theme = safe(data.themes, get('theme'));
    headline.textContent = ind + (get('industry') ? ' / ' + theme : '');
    output.textContent = briefLines().join('\n');
    const quoted=document.getElementById('v33-quote-summary');
    if(quoted){
      const details=estimateLines();
      quoted.hidden=!details.length;
      quoted.textContent=details.length
        ? '메인 홈페이지에서 선택한 참고 견적을 가져왔습니다.\n'+details.join('\n')
        : '';
    }
    const guidance = document.getElementById('v32-scope-guidance');
    if (guidance) {
      const base = '준비 참고: '+safe(scopeData.materials,get('industry'),'업종을 선택해 주세요.');
      const risks = scopeRisks();
      guidance.textContent = base + (risks.length ? ' / 추가 확인: '+risks.join(' / ') :
        ' / 실제 데이터·가격·납품 범위는 상담 후 확정합니다.');
    }
    const selectedInfo = document.getElementById('v31-selected-demo');
    if (selectedInfo) {
      const titles = importedTitles();
      selectedInfo.hidden = titles.length === 0;
      selectedInfo.textContent = titles.length
        ? '선택한 시연 기능 '+titles.length+'개: '+titles.join(' · ')+' (실제 예약·구매가 아닌 기능 기획 참고용)'
        : '';
    }
  }
  function valid() {
    if (!form.checkValidity()) {
      feedback.textContent = '업종과 제작 목적을 먼저 선택해 주세요.';
      form.reportValidity();
      return false;
    }
    return true;
  }
  function prepareMail() {
    const subject = `[올파일원 웹스튜디오] ${safe(data.industries,get('industry'))} 홈페이지 제작 문의`;
    const lines = briefLines();
    let body = lines.join('\n');
    let uri = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    let shortened = false;
    if (uri.length > 1900) {
      // Many email handlers have URI length limits. Preserve core requirements; full TXT / clipboard remain available.
      const compressed = lines.filter(line => /^(업종|디자인|목표|필요 기능|운영 방식|예산|일정):/.test(line))
        .concat('추가 요청: 상세 내용과 준비 자료는 TXT 파일로 별도 전달하겠습니다.',
                '※ 이 메일은 사용자 앱에서 직접 전송해야 합니다.');
      body = compressed.join('\n');
      uri = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      shortened = true;
    }
    if (uri.length > 1900) {
      body = lines.slice(0,5).concat('상세 요청사항은 복사 또는 TXT 파일로 전달하겠습니다.').join('\n');
      uri = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      shortened = true;
    }
    return {uri, shortened};
  }
  function announce(message) { feedback.textContent = message; }
  form.addEventListener('input',render);
  form.addEventListener('change',render);
  form.addEventListener('submit',e=>e.preventDefault());
  copyButton.addEventListener('click',async()=>{
    if (!valid()) return;
    const full = briefLines().join('\n');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('not-available');
      await navigator.clipboard.writeText(full);
      announce('요청서 전체 내용을 복사했습니다. 메일에 붙여넣어 직접 전송해 주세요.');
    } catch {
      announce('이 브라우저에서는 자동 복사가 불가능합니다. 미리보기 텍스트를 직접 선택하거나 TXT 저장을 이용해 주세요.');
    }
  });
  saveButton.addEventListener('click',()=>{
    if (!valid()) return;
    const file = new Blob(['\ufeff' + briefLines().join('\n')],{type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'allfileone_project_brief.txt';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
    announce('TXT 파일을 저장했습니다. 저장은 상담 접수가 아니며, 파일을 이메일에 첨부하거나 내용을 보내 주세요.');
  });
  mailButton.addEventListener('click',()=>{
    if (!valid()) return;
    const {uri, shortened} = prepareMail();
    announce(shortened
      ? '이메일 앱을 여는 중입니다. 주소 길이 제한으로 요청사항 일부가 생략됐습니다. 전체 내용은 복사하거나 TXT로 저장해 추가해 주세요. 실제 전송은 메일 앱에서 완료해야 합니다.'
      : '이메일 앱을 여는 중입니다. 메일 앱에서 보내기를 눌러야 실제로 전송됩니다. 창이 열리지 않으면 복사 또는 TXT 저장을 이용해 주세요.');
    // No HTTP request to our site or third-party services. mailto uses the visitor's own mail app.
    window.location.href = uri;
  });
  const params = new URLSearchParams(location.search);
  const industry = params.get('industry');
  const theme = params.get('theme') || params.get('style');
  if (industry && Object.prototype.hasOwnProperty.call(data.industries,industry)) form.elements.industry.value = industry;
  if (theme && Object.prototype.hasOwnProperty.call(data.themes,theme)) form.elements.theme.value = theme;
  render();
})();
