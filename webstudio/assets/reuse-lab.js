/* AllFileOne WebStudio — recovered industry workflows from V18/V20/V21.
 * Redesigned as isolated, fictional browser-only interactions.
 * No network, cookies, tracking, real appointments or billing.
 */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const form = $('feature-form');
  const result = $('feature-result');
  const status = $('result-status');
  const money = n => new Intl.NumberFormat('ko-KR').format(Math.round(n)) + '원';
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
  const integer = (v, min, max) => { const n = Number(v); return Number.isSafeInteger(n) && n>=min && n<=max ? n : null; };
  const positive = (v,min,max) => { const n=Number(v); return Number.isFinite(n) && n>=min && n<=max ? n : null; };
  const get = name => form.elements.namedItem(name)?.value ?? '';
  const options = {
    restaurant: {
      title: '음식점·카페', summary: '메뉴에서 방문 계획까지',
      features: [
        {title:'메뉴 검색·분류',desc:'가상의 메뉴를 종류·가격별로 탐색합니다.',fields:[['category','분류','select',['전체','식사','음료','디저트']],['price','최대 가격','select',['전체','10000','15000','20000']]],kind:'restaurantMenu'},
        {title:'방문 계획 미리보기',desc:'가상 방문 계획을 작성합니다. 실제 좌석 예약이 아닙니다.',fields:[['date','희망 방문일','date'],['time','희망 시간','select',['11:00','12:00','13:00','18:00','19:00']],['guests','인원','number','1','12','2']],kind:'restaurantVisit'},
        {title:'식사 예산 계산',desc:'메뉴 가격과 주문 수량을 곱한 참고 금액입니다.',fields:[['item','메뉴','select',['샘플 파스타','샘플 브런치','샘플 커피']],['qty','수량','number','1','30','2']],kind:'restaurantBudget'},
        {title:'방문 준비 체크',desc:'알레르기·이동 편의 등 사전 문의 내용을 정리합니다.',fields:[['diet','식단 관련 확인','select',['해당 없음','알레르기 성분 문의','채식 메뉴 문의']],['access','이동·좌석','select',['일반 좌석 문의','휠체어 접근 문의','유아 동반 문의']]],kind:'restaurantChecklist'}
      ]
    },
    beauty: {
      title:'뷰티·미용',summary:'시술 선택에서 상담 준비까지',
      features:[
        {title:'시술 카테고리 탐색',desc:'가상의 시술 메뉴를 분야별로 찾아봅니다.',fields:[['category','시술 분야','select',['전체','헤어','네일','피부']]],kind:'beautySearch'},
        {title:'시술 합계·시간',desc:'복합 시술의 참고 금액과 예상 소요시간을 계산합니다.',fields:[['service','시술','select',['커트','컬러','젤 네일','기초 피부관리']],['people','이용 인원','number','1','4','1']],kind:'beautyBudget'},
        {title:'시술 옵션 비교',desc:'참고 시술 2종을 시간·가격 기준으로 비교합니다.',fields:[['first','첫 번째','select',['커트','컬러','젤 네일','기초 피부관리']],['second','두 번째','select',['커트','컬러','젤 네일','기초 피부관리']]],kind:'beautyCompare'},
        {title:'상담 전 준비하기',desc:'원하는 일정과 상담 목적을 정리합니다.',fields:[['date','희망 날짜','date'],['goal','상담 목적','select',['스타일 상담','서비스 가격 확인','시술 전 주의사항 문의']]],kind:'beautyConsult'}
      ]
    },
    logistics: {
      title:'물류·운송',summary:'화물 규격에서 발송 준비까지',
      features:[
        {title:'부피무게 계산',desc:'이전 V18의 가상 화물 계산을 복원했습니다. 실제 운임과 무관합니다.',fields:[['w','가로 (cm)','number','1','500','30'],['d','세로 (cm)','number','1','500','25'],['h','높이 (cm)','number','1','500','20'],['kg','실제 무게 (kg)','number','1','10000','5']],kind:'logisticsVolume'},
        {title:'가상 운송비 견적',desc:'화물 수량·배송 지역에 따라 임의 단가를 계산합니다.',fields:[['boxes','박스 수량','number','1','500','5'],['zone','운송 구간','select',['수도권 예시','지역권 예시','도서 산간 예시']]],kind:'logisticsQuote'},
        {title:'포장 준비 체크',desc:'화물 종류별 발송 전 준비사항을 정리합니다.',fields:[['type','화물 유형','select',['일반 상자','파손주의','저온·특수화물']],['label','송장 상태','select',['라벨 준비 완료','라벨 발급 필요']]],kind:'logisticsCheck'},
        {title:'가상 배송 상태 확인',desc:'실제 택배사·배송 서버와 연결되지 않은 상태 시연입니다.',fields:[['reference','시연 운송장','select',['DEMO-1001','DEMO-1002','DEMO-1003']]],kind:'logisticsTracking'}
      ]
    }
  };
  const menu = [['샘플 파스타','식사',16000],['샘플 브런치','식사',13000],['샘플 커피','음료',5500],['샘플 티','음료',4800],['샘플 타르트','디저트',7500]];
  const services = {'커트':[26000,40,'헤어'],'컬러':[85000,100,'헤어'],'젤 네일':[48000,70,'네일'],'기초 피부관리':[59000,60,'피부']};
  const sampleStatus = {'DEMO-1001':'가상: 상품 준비','DEMO-1002':'가상: 물류센터 이동','DEMO-1003':'가상: 배송 완료'};
  let currentIndustry = 'restaurant'; let currentFeature = 0; let exportable = '';
  const fail = message => { exportable=''; result.textContent=message; status.textContent='입력 확인 필요'; $('export-result').disabled=true; $('copy-result').disabled=true; };
  const done = message => { const disclaimer='\n\n※ 자체 개발한 가상 시연입니다. 실제 예약·계약·접수·결제가 이루어지지 않습니다.';exportable=`[올파일원 웹스튜디오 가상 기능 시연]\n업종: ${options[currentIndustry].title}\n기능: ${options[currentIndustry].features[currentFeature].title}\n\n${message}${disclaimer}`;result.textContent=message+disclaimer;status.textContent='시연 계산 완료';$('export-result').disabled=false;$('copy-result').disabled=false; };
  function run(){
    const type=options[currentIndustry].features[currentFeature].kind;
    if(type==='restaurantMenu'){
      const cat=get('category'),max=get('price')==='전체'?Infinity:Number(get('price'));
      const rows=menu.filter(r=>(cat==='전체'||r[1]===cat)&&r[2]<=max);
      return done(rows.length?rows.map(r=>`${r[0]} · ${r[1]} · ${money(r[2])}`).join('\n'):'조건에 맞는 가상 메뉴가 없습니다.');
    }
    if(type==='restaurantVisit'){
      const guests=integer(get('guests'),1,12); if(!guests||!get('date')||get('date')<today())return fail('오늘 이후 날짜와 1~12명 인원을 입력하세요.');
      return done(`희망 방문: ${get('date')} ${get('time')} / ${guests}명\n매장 수신 또는 좌석 확보: 수행되지 않음`);
    }
    if(type==='restaurantBudget'){
      const item=menu.find(r=>r[0]===get('item')),qty=integer(get('qty'),1,30);if(!item||!qty)return fail('1~30개 범위의 수량을 입력하세요.');
      return done(`${item[0]} ${qty}개 × ${money(item[2])} = ${money(item[2]*qty)}\n봉사료·세금·할인 미반영, 참고용 가격`);
    }
    if(type==='restaurantChecklist')return done(`방문 전 확인 목록\n• ${get('diet')}\n• ${get('access')}\n• 실제 재료·알레르기와 접근 가능 여부는 매장에 직접 확인하세요.`);
    if(type==='beautySearch'){
      const cat=get('category');const rows=Object.entries(services).filter(([,s])=>cat==='전체'||s[2]===cat);
      return done(rows.map(([n,s])=>`${n}: ${money(s[0])}, 약 ${s[1]}분 (${s[2]})`).join('\n'));
    }
    if(type==='beautyBudget'){
      const s=services[get('service')],people=integer(get('people'),1,4);if(!s||!people)return fail('1~4명 인원을 선택하세요.');
      return done(`${get('service')} × ${people}명\n가상 합계: ${money(s[0]*people)}\n개인별 시간 합계: 약 ${s[1]*people}분 (동시 진행 미반영)`);
    }
    if(type==='beautyCompare'){
      const a=services[get('first')],b=services[get('second')];if(!a||!b)return fail('비교할 시술을 선택하세요.');
      return done(`${get('first')}: ${money(a[0])} / ${a[1]}분\n${get('second')}: ${money(b[0])} / ${b[1]}분\n실제 시술 적합성 및 의료적 판단은 제공하지 않습니다.`);
    }
    if(type==='beautyConsult'){
      if(!get('date')||get('date')<today())return fail('희망 날짜를 오늘 이후로 선택하세요.');
      return done(`상담 희망일: ${get('date')}\n목적: ${get('goal')}\n실제 예약 확정 또는 시술 가능 여부를 보장하지 않습니다.`);
    }
    if(type==='logisticsVolume'){
      const v=['w','d','h'].map(k=>positive(get(k),1,500)),kg=positive(get('kg'),1,10000);
      if(v.some(n=>n===null)||kg===null)return fail('가로·세로·높이 1~500cm, 실제 중량 1~10000kg 범위의 양수를 입력하세요.');
      const volume=v[0]*v[1]*v[2]/5000;
      return done(`체적중량: ${volume.toFixed(2)}kg\n실제 무게: ${kg.toFixed(2)}kg\n시연 계산중량: ${Math.max(volume,kg).toFixed(2)}kg\n※ 5000 계수는 가상 예시입니다. 실제 운송사 기준은 다릅니다.`);
    }
    if(type==='logisticsQuote'){
      const qty=integer(get('boxes'),1,500);if(!qty)return fail('박스 수량은 1~500 정수를 입력하세요.');
      const price={'수도권 예시':3900,'지역권 예시':5200,'도서 산간 예시':8700}[get('zone')];
      return done(`운송 구간: ${get('zone')}\n박스: ${qty}개\n임의 참고 단가: ${money(price)}\n시연 합계: ${money(price*qty)}\n실제 운송요금·VAT·보험·계약과 무관합니다.`);
    }
    if(type==='logisticsCheck')return done(`포장 준비 목록\n• 유형: ${get('type')}\n• ${get('label')}\n• 무게·외형 치수 확인\n• 파손·온도 및 위험물 규정은 실제 운송사에 확인`);
    if(type==='logisticsTracking')return done(`가상 운송장: ${get('reference')}\n${sampleStatus[get('reference')]||'데이터 없음'}\n외부 운송사 조회/실제 배송 정보: 연결되지 않음`);
    fail('이 기능을 찾을 수 없습니다.');
  }
  function buildForm(){
    const feature=options[currentIndustry].features[currentFeature];form.replaceChildren();
    for(const [name,label,type,a,b,c] of feature.fields){
      const wrapper=document.createElement('div');wrapper.className='field';
      const lab=document.createElement('label');lab.textContent=label;lab.htmlFor='field-'+name;
      const control=document.createElement(type==='select'?'select':'input');control.id='field-'+name;control.name=name;
      if(type==='select')for(const item of a){const op=document.createElement('option');op.textContent=item;op.value=item;control.append(op);}
      else if(type==='number'){control.type='number';control.step='1';control.min=a;control.max=b;control.value=c;}
      else if(type==='date'){control.type='date';control.min=today();control.value=today();}
      wrapper.append(lab,control);form.append(wrapper);
    }
    const submit=document.createElement('button');submit.className='form-action';submit.type='submit';submit.textContent='시연 기능 실행 ↗';form.append(submit);
    $('feature-title').textContent=feature.title;$('feature-description').textContent=feature.desc;
    $('feature-number').textContent='FUNCTION '+pad(currentFeature+1)+' / 04';
    $('industry-title').textContent=options[currentIndustry].title;$('industry-copy').textContent=options[currentIndustry].summary;
    $('consult-link').href='contact.html?industry='+encodeURIComponent(currentIndustry);
    exportable='';result.textContent='입력 항목을 선택하고 실행해 보세요.';status.textContent='선택해 주세요';$('export-result').disabled=true;$('copy-result').disabled=true;
    document.querySelectorAll('[data-industry]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.industry===currentIndustry)));
    const tabs=$('feature-tabs');tabs.replaceChildren();
    options[currentIndustry].features.forEach((f,i)=>{const b=document.createElement('button');b.type='button';b.role='tab';b.textContent=pad(i+1)+' '+f.title;b.dataset.feature=String(i);b.setAttribute('aria-selected',String(i===currentFeature));b.addEventListener('click',()=>{currentFeature=i;buildForm();});tabs.append(b);});
  }
  form.addEventListener('submit',e=>{e.preventDefault();run();});
  document.querySelectorAll('[data-industry]').forEach(b=>b.addEventListener('click',()=>{currentIndustry=b.dataset.industry;currentFeature=0;buildForm();}));
  $('export-result').addEventListener('click',()=>{
    if(!exportable)return;const blob=new Blob(['\ufeff'+exportable],{type:'text/plain;charset=utf-8'});const u=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=u;a.download='AllFileOne_ReuseLab_'+currentIndustry+'_'+(currentFeature+1)+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);
    status.textContent='TXT 파일 생성 · 서버 전송 없음';
  });
  $('copy-result').addEventListener('click',async()=>{if(!exportable)return;try{await navigator.clipboard.writeText(exportable);status.textContent='결과 복사 완료';}catch{status.textContent='복사 실패 · TXT 저장을 이용하세요';}});
  const requested=new URLSearchParams(location.search).get('industry');if(Object.prototype.hasOwnProperty.call(options,requested))currentIndustry=requested;
  buildForm();
  document.body.dataset.reuseReady='true';
})();
