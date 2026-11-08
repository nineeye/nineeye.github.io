/* AllFileOne WebStudio V43 — original, offline representative industry labs.
 * Fictional records only. No API, analytics, cookies, accounts, bookings or data transmission.
 */
'use strict';
(() => {
  const root = document.querySelector('[data-v43-lab]');
  if (!root || root.dataset.v43Ready === 'yes') return;
  const industry = document.body.dataset.v38Industry;
  const common = { all: '전체', empty: '조건에 맞는 가상 견본이 없습니다. 필터를 바꿔 보세요.' };
  const DATA = {
    manufacturing: {
      name: '제조·도매', subject: '제품·규격', collection: '검토 품목', trigger: 'quote',
      kinds: [['all','전체 제품군'],['fastener','체결 부품'],['pipe','배관 부품'],['mount','설치 부품']],
      contexts: [['all','전체 재질'],['steel','스테인리스'],['aluminum','알루미늄'],['carbon','탄소강']],
      labels: ['제품군','재질'], search: '예: M8, 25A, 브래킷',
      entries: [
        ['MF-101','육각 볼트 M8 × 30','fastener','steel','SUS304 / M8 × 30','예시 최소 주문 단위 100개','규격·수량·납품 희망일을 먼저 비교합니다.'],
        ['MF-102','육각 볼트 M10 × 40','fastener','carbon','탄소강 / M10 × 40','예시 최소 주문 단위 200개','표면 처리와 사용 환경 확인 항목을 제안합니다.'],
        ['MF-103','플랜지 25A','pipe','steel','SUS304 / 25A','예시 최소 주문 단위 20개','압력 등급과 도면 확인이 필요한 예시입니다.'],
        ['MF-104','이음관 15A','pipe','carbon','탄소강 / 15A','예시 최소 주문 단위 50개','연결 규격을 상담 전에 정리하는 체험입니다.'],
        ['MF-105','L형 브래킷 40','mount','aluminum','AL6061 / 40 × 40','예시 최소 주문 단위 50개','홀 위치·하중 조건을 함께 기록합니다.'],
        ['MF-106','프로파일 고정판','mount','steel','SUS304 / 80 × 60','예시 최소 주문 단위 30개','설치 방향을 견적 전 확인하는 예시입니다.'],
        ['MF-107','압력배관 커플링 20A','pipe','aluminum','AL6061 / 20A','예시 최소 주문 단위 30개','실제 적합성·인증은 별도 확인이 필요합니다.'],
        ['MF-108','나사형 스페이서 M6','fastener','aluminum','AL6061 / M6','예시 최소 주문 단위 100개','길이·체결 목적을 먼저 선택해 봅니다.']
      ]
    },
    academy: {
      name: '학원·교육', subject: '강좌·시간표', collection: '관심 수업', trigger: 'timetable',
      kinds: [['all','전체 학년'],['elementary','초등'],['middle','중등'],['high','고등']],
      contexts: [['all','전체 요일'],['mon','월요일'],['wed','수요일'],['fri','금요일']],
      labels: ['대상 학년','수업 요일'], search: '예: 수학, 독해, 과학',
      entries: [
        ['ED-101','초등 사고력 수학','elementary','mon','초등 / 월 16:00','회당 60분 · 가상 시간표','학습 목표와 학년을 먼저 비교합니다.'],
        ['ED-102','초등 독서·독해','elementary','wed','초등 / 수 17:00','회당 70분 · 가상 시간표','상담 전에 읽기 수준을 정리하는 예시입니다.'],
        ['ED-103','중등 개념 수학','middle','mon','중등 / 월 18:30','회당 90분 · 가상 시간표','과정별 학습 목표가 소개됩니다.'],
        ['ED-104','중등 영어 문법','middle','fri','중등 / 금 18:00','회당 80분 · 가상 시간표','기존 수준과 희망 시간을 비교합니다.'],
        ['ED-105','고등 수학 집중','high','wed','고등 / 수 19:00','회당 110분 · 가상 시간표','개별 학습 방향 상담을 가정한 체험입니다.'],
        ['ED-106','고등 과학 탐구','high','fri','고등 / 금 19:30','회당 100분 · 가상 시간표','선택 과목·희망 학습 목표를 정리합니다.'],
        ['ED-107','초등 기초 영어','elementary','fri','초등 / 금 15:30','회당 60분 · 가상 시간표','학년·희망 시간대 선택을 체험합니다.'],
        ['ED-108','중등 과학 실험','middle','wed','중등 / 수 18:00','회당 90분 · 가상 시간표','학습 콘텐츠 안내 구조를 보여줍니다.']
      ]
    },
    interior: {
      name: '인테리어·시공', subject: '공간·시공 범위', collection: '참고 콘셉트', trigger: 'portfolio',
      kinds: [['all','전체 공간'],['residential','주거 공간'],['commercial','상업 공간'],['office','사무 공간']],
      contexts: [['all','전체 범위'],['partial','부분 변경'],['whole','전체 구성']],
      labels: ['공간 유형','시공 범위'], search: '예: 주방, 카페, 사무실',
      entries: [
        ['IN-101','주거 주방 동선 개선','residential','partial','주거 / 주방 18㎡','가상 콘셉트 · 실측 필요','조리 동선·수납 위치를 정리한 사례형 시연입니다.'],
        ['IN-102','아파트 전체 구성','residential','whole','주거 / 84㎡','가상 콘셉트 · 실측 필요','공간별 우선순위를 구분하는 방법을 보여 줍니다.'],
        ['IN-103','소형 카페 좌석 계획','commercial','whole','상업 / 45㎡','가상 콘셉트 · 실측 필요','고객 이동과 주문 동선을 비교합니다.'],
        ['IN-104','매장 진열 벽 개선','commercial','partial','상업 / 22㎡','가상 콘셉트 · 실측 필요','브랜드 진열과 조명을 설명합니다.'],
        ['IN-105','업무실 집중 공간','office','partial','사무 / 32㎡','가상 콘셉트 · 실측 필요','회의 공간과 집중 공간의 분리를 제안합니다.'],
        ['IN-106','스튜디오 사무실','office','whole','사무 / 120㎡','가상 콘셉트 · 실측 필요','동선·회의실·접객 영역 구성 예시입니다.'],
        ['IN-107','주거 욕실 개선','residential','partial','주거 / 9㎡','가상 콘셉트 · 실측 필요','방수 등 기술 적합성은 별도 현장검토가 필요합니다.'],
        ['IN-108','팝업 스토어 동선','commercial','whole','상업 / 65㎡','가상 콘셉트 · 실측 필요','동선과 상품 노출의 관계를 살펴봅니다.']
      ]
    }
  };
  if (!Object.prototype.hasOwnProperty.call(DATA,industry)) return;
  const cfg = DATA[industry], selected = new Map();
  const $ = (id) => root.querySelector('[data-v43-'+id+']');
  const cards = $('cards'), chosen = $('selected'), counter = $('count'), hint = $('feedback');
  const filter1=$('primary'), filter2=$('secondary'), query=$('search');
  const label1=$('primary-label'), label2=$('secondary-label');
  const safeText = (element,value) => { element.textContent = String(value); return element; };
  function elt(tag,cls,text) {
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text!==undefined)safeText(n,text);
    return n;
  }
  function fill(select,values){for(const [id,title] of values){const o=elt('option','',title);o.value=id;select.append(o);}}
  safeText(label1,cfg.labels[0]);safeText(label2,cfg.labels[1]);
  query.placeholder=cfg.search;fill(filter1,cfg.kinds);fill(filter2,cfg.contexts);
  const entries=cfg.entries.map(([id,title,primary,secondary,meta,secondaryNote,description])=>Object.freeze({id,title,primary,secondary,meta,secondaryNote,description}));
  function matches(e){const q=query.value.trim().toLocaleLowerCase('ko');return (filter1.value==='all'||filter1.value===e.primary)&&(filter2.value==='all'||filter2.value===e.secondary)&&(!q||[e.id,e.title,e.meta,e.description].some(v=>v.toLocaleLowerCase('ko').includes(q)));}
  function summary(){return ['[올파일원 웹스튜디오 / '+cfg.name+' 기능 체험 메모]','※ 아래 데이터는 가상 견본이며 실제 상품·수업·시공 실적, 가격·재고·예약 상태가 아닙니다.','선택한 참고 항목: '+selected.size+'개',...Array.from(selected.values()).map(e=>'• '+e.id+' '+e.title+' / '+e.meta+' / '+e.secondaryNote),'※ 제작 의뢰는 홈페이지 상담서에서 별도 발송해 주세요.'].join('\n');}
  function updateConsult(){
    // Actual selected sample data stays on-device. Only its approved function category is sent via V38 scope.
    const input=document.querySelector('[data-v38-planner] input[name="module"][value="'+cfg.trigger+'"]');
    if(input && selected.size && !input.checked){input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  function renderSelected(){
    chosen.replaceChildren();
    if(!selected.size)chosen.append(elt('p','v43-empty','견본을 골라보면 이곳에 비교 메모가 쌓입니다.'));
    else for(const e of selected.values()){
      const line=elt('div','v43-pick');const text=elt('span','',e.title);
      const remove=elt('button','v43-remove','제외');remove.type='button';remove.setAttribute('aria-label',e.title+' 선택 해제');
      remove.addEventListener('click',()=>{selected.delete(e.id);render();});line.append(text,remove);chosen.append(line);
    }
    $('selected-count').textContent=selected.size+'개 선택';
  }
  function render(){
    const visible=entries.filter(matches);cards.replaceChildren();
    safeText(counter,visible.length+'개 가상 견본');
    if(!visible.length)cards.append(elt('p','v43-empty v43-no-result',common.empty));
    else for(const e of visible){
      const article=elt('article','v43-card');
      const head=elt('div','v43-card-head');head.append(elt('span','v43-id',e.id),elt('span','v43-type',cfg.name+' 체험'));
      const title=elt('h3','',e.title),meta=elt('p','v43-meta',e.meta),note=elt('p','v43-note',e.secondaryNote);
      const desc=elt('p','v43-desc',e.description);
      const button=elt('button','v43-select',selected.has(e.id)?'선택 해제':'비교 메모에 추가');button.type='button';button.setAttribute('aria-pressed',String(selected.has(e.id)));
      button.addEventListener('click',()=>{if(selected.has(e.id))selected.delete(e.id);else selected.set(e.id,e);updateConsult();render();});
      article.append(head,title,meta,note,desc,button);cards.append(article);
    }
    renderSelected();safeText(hint,'이 화면의 항목과 수치는 가상 체험 자료이며 실제 거래·수업·시공 실적이 아닙니다.');
  }
  filter1.addEventListener('change',render);filter2.addEventListener('change',render);query.addEventListener('input',render);
  $('reset').addEventListener('click',()=>{filter1.value='all';filter2.value='all';query.value='';render();});
  $('copy').addEventListener('click',async()=>{
    if(!selected.size){safeText(hint,'복사할 참고 항목을 하나 이상 선택해 주세요.');return;}
    try{await navigator.clipboard.writeText(summary());safeText(hint,'체험 메모를 복사했습니다. 실제 상담은 별도로 발송해 주세요.');}
    catch{safeText(hint,'클립보드 접근이 제한됐습니다. TXT 저장 기능을 이용해 주세요.');}
  });
  $('download').addEventListener('click',()=>{
    if(!selected.size){safeText(hint,'저장할 참고 항목을 하나 이상 선택해 주세요.');return;}
    const blob=new Blob(['\ufeff',summary()],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=elt('a');a.href=url;a.download='AllFileOne_'+industry+'_sample_brief.txt';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),800);
    safeText(hint,'TXT 메모를 저장했습니다. 실제 제작 상담은 직접 신청해 주세요.');
  });
  root.dataset.v43Ready='yes';render();
})();