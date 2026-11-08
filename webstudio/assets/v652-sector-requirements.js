/* AllFileOne WebStudio V65.2 - 12 tailored sector decision briefs / 36 sample pages.
   Original first-party code. No APIs, tracking, cookies, data transmission or customer files.
   This document is a live frontend requirement selector, NOT an operating reservation/payment backend. */
(() => {
'use strict';
const DATA = Object.freeze({"manufacturing":{"name":"제조·도매","customer":"구매·설계 담당자","scope":["제품 1~20종","제품 21~100종","제품 101종 이상"],"items":[["규격·재질·형번으로 제품 찾기","제품군/재질 필터와 상세 규격을 실제 클릭하여 비교","시연","0"],["MOQ·수량별 가격과 납기 검토","최소주문수량 산출은 가능, 실제 재고·납기는 별도 시스템","연동","1"],["도면·카탈로그·기술사양 자료 제공","샘플 소재·사양 비교 체험; 실제 문서 게시·권한 제어는 별도 구축","연동","2"],["담당자에게 품목별 견적 요청","고객 입력 저장, 알림, 견적 이력은 서버가 필요","연동","3"]]},"corporate":{"name":"기업·회사","customer":"기업 구매·협업 담당자","scope":["소개 1~5쪽","사업부·사례 6~15쪽","다국어/대형 16쪽 이상"],"items":[["사업 분야·솔루션 검색","실제 서비스별 필터와 소개 콘텐츠","시연","0"],["프로젝트·인증·납품사례 소개","사진·상표 사용권과 실적 증빙 검토","연동","2"],["채용·공지·보도자료 관리","게시물 등록·수정·승인에는 관리 권한 필요","연동","3"],["다국어·기업제휴 문의","번역 검수와 문의 접수/스팸 방지 설계","연동","1"]]},"clinic":{"name":"병원·의원","customer":"진료 안내를 찾는 방문객","scope":["진료 분야 1~3개","진료 분야 4~8개","여러 의료진·지점"],"items":[["진료과목·의료진·운영시간 찾기","실제 진료시간은 병원이 제공한 정보로 운영","연동","0"],["휴진·방문 준비·주차 안내","공지·휴진일 수정 기능과 지도 접근성","연동","1"],["초진·재진 안내 동선","환자 증상·진료정보는 데모에서 수집하지 않음","시연","3"],["예약·검진 문의 연결","실제 예약 확정은 병원 승인 또는 예약 서비스 연동 필요","연동","2"]]},"academy":{"name":"학원·교육","customer":"학부모·수강생","scope":["강좌 1~5개","강좌 6~20개","여러 반·캠퍼스"],"items":[["학년·과목별 강좌 검색","수준·대상·정원 분류와 강좌 비교","시연","0"],["강좌 시간표와 중복 확인","요일·시간 중복을 실제 계산하고 변경 이력 설계","시연","1"],["수강료·등록 기간 계산","예시 계산과 실제 할인·결제 조건 구분","시연","2"],["수강 상담·신청·공지 관리","실제 신청, 학생정보, 결제는 관리자/서버 필요","연동","3"]]},"interior":{"name":"인테리어·시공","customer":"공사 의뢰인","scope":["시공사례 1~10건","시공사례 11~30건","여러 공종·지점"],"items":[["공간별 전후 사진·시공 사례","고객 동의·촬영권과 공사 범위를 분리 표시","연동","0"],["면적·공종별 견적 기초 계산","가상 단가만 사용, 현장 실측 후 최종 견적","시연","1"],["자재·마감재 옵션 비교","공간에 맞는 마감재 선택·유지관리 조건","시연","2"],["현장 방문·상담 접수","주소·연락처 안전 수집은 별도 서버 기능","연동","3"]]},"commerce":{"name":"쇼핑몰·브랜드","customer":"상품 구매자","scope":["상품 1~20개","상품 21~200개","다품목·여러 판매채널"],"items":[["상품 필터·옵션·상세 정보","가상 상품 검색과 비교를 현재 화면에서 체험","시연","0"],["장바구니 수량·합계 계산","수량 변경·금액 합계를 실제 계산, 주문은 미접수","시연","1"],["배송비·교환·반품 안내","예시 배송비 계산, 실제 정책은 판매자가 확정","시연","2"],["결제·주문·재고·배송 관리","실거래는 검증된 결제·관리 시스템 연동 필요","연동","3"]]},"professional":{"name":"법률·세무·회계","customer":"전문 상담 의뢰인","scope":["업무 분야 1~3개","업무 분야 4~8개","다수 전문가·사무소"],"items":[["상담 분야 및 담당자 찾기","분야별 업무 안내와 자격 표시 검증","시연","0"],["상담 목적별 준비 안내","전문 판단을 대신하지 않는 경로 안내","시연","1"],["필요 서류 체크리스트","데모는 민감 문서 업로드를 요구하지 않음","시연","2"],["예약·보안 문서 제출","실제 예약과 문서 보호·접근기록은 서버 필요","연동","3"]]},"association":{"name":"협회·단체","customer":"회원·행사 참여자","scope":["회원 100명 이하","회원 101~1000명","여러 지부·대규모"],"items":[["공지·자료실 검색","자료 유형·공개 권한별 필터 설계","시연","0"],["세미나·행사 일정 확인","행사 시간표와 참석 동선 안내","시연","1"],["회원 가입·등급별 권한","실제 가입·승인·회비·로그인에는 서버 필요","연동","2"],["회비·공지·회원 관리자","관리자 권한, 납부 내역, 감사 로그 필요","연동","3"]]},"franchise":{"name":"프랜차이즈","customer":"창업 희망자","scope":["매장 1~10개","매장 11~100개","다지역 가맹망"],"items":[["브랜드·점포·상권 소개","매장 현황·조건·위치 실자료 검증","연동","0"],["창업비·운영자금 계산","가상 비용 합산으로 기본 항목 파악","시연","1"],["가맹 절차·준비 목록","정보공개서 및 계약 검토는 별도 공식자료 필요","시연","2"],["가맹 문의·지역별 담당자 배정","문의 이력과 담당자 라우팅은 서버 필요","연동","3"]]},"stay":{"name":"숙박·펜션","customer":"객실 예약 검토자","scope":["객실 1~5개","객실 6~20개","다지점·채널 연동"],"items":[["객실 유형·시설·정원 비교","객실 크기·편의시설 필터와 규정 안내","시연","0"],["숙박 날짜·인원별 요금 계산","실제 가용 객실·시즌 요금과 별개인 예시","시연","1"],["객실별 이용 규칙·환불 안내","환불조건과 예약정책은 운영자가 확정","시연","3"],["실시간 객실 재고·예약·결제","중복 예약 방지용 서버/채널 매니저 연동 필요","연동","2"]]},"realestate":{"name":"부동산·분양","customer":"매물 탐색자","scope":["매물 1~20건","매물 21~200건","다중 중개사·분양 현장"],"items":[["지역·매물 종류·가격 검색","현재는 가상 매물 필터, 실제 매물 검증 필요","시연","0"],["매물 비교·사진·평면도","매물 권리·중개표시·사진 사용권 검토","연동","1"],["현장 방문 확인표","채광·주차·관리비·등기 등 체크항목","시연","3"],["매물 등록·수정·방문 예약","실물 매물 등록·문의 이력·예약 저장 서버 필요","연동","2"]]},"event":{"name":"행사·캠페인","customer":"행사 참가자·주최자","scope":["세션 1~5개","세션 6~30개","대형·다회차 행사"],"items":[["세션·연사·장소별 프로그램 찾기","가상 프로그램 검색과 일정 구성","시연","0"],["선택 일정 충돌 확인","동시간대 프로그램을 실제 계산·표시","시연","1"],["관심 일정 캘린더 저장","ICS 일정 다운로드는 참석 신청과 다름","시연","3"],["참가 신청·티켓·출입 관리","실제 발권·중복신청·QR 검표는 서버 필요","연동","2"]]}});
const KEY = 'afo.webstudio.v652.industry-brief';
const TTL = 15 * 60 * 1000;
const STYLES = new Set(['modern','premium','editorial']);
const DAYS = Object.freeze([['soon','1개월 내 협의'],['quarter','1~3개월 검토'],['unknown','미정·협의']]);
const has = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const str = x => String(x == null ? '' : x);
const safe = (s,n=120) => str(s).replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
function lineText(d,ids,scale,when,style) {
  const lines = ['[36개 업종별 디자인 시연에서 작성한 제작 요구]',
    '업종: ' + d.name,
    '고객 대상: ' + d.customer,
    '디자인: ' + ({modern:'모던',premium:'프리미엄',editorial:'에디토리얼'}[style] || '모던'),
    '자료·운영 규모: ' + d.scope[scale],
    '희망 시기: ' + (DAYS.find(x=>x[0]===when) || DAYS[2])[1], '',
    '선택한 업무 요구:'];
  ids.forEach(i => { const a=d.items[i]; lines.push('• '+a[0]+' ['+(a[2]==='연동'?'실운영 연동·구축 필요':'현재 시연으로 체험 가능')+']'); });
  lines.push('', '※ 실제 수주·예약·결제·견적 확정이 아닙니다. 서버/외부 시스템 구축과 요금은 상담으로 확정합니다.');
  return lines.join('\n');
}
function textButton(name, onClick, cls) {
  const el=document.createElement('button');el.type='button';el.textContent=name;el.className=cls||'';el.addEventListener('click',onClick);return el;
}
function demo() {
  const b=document.body, id=b?.dataset.industry, style=b?.dataset.v13Style || 'modern';
  const d=DATA[id], main=document.querySelector('main');
  if(!d || !STYLES.has(style) || !main || document.getElementById('v652-demand'))return;
  const section=document.createElement('section');
  section.id='v652-demand';section.className='v652-demand';section.dataset.industry=id;
  section.setAttribute('aria-labelledby','v652-title');
  const frame=document.createElement('div');frame.className='v652-wrap';
  const top=document.createElement('div');top.className='v652-head';
  const eyebrow=document.createElement('span');eyebrow.className='v652-eyebrow';eyebrow.textContent='REAL-WORLD REQUIREMENTS / '+id.toUpperCase();
  const h=document.createElement('h2');h.id='v652-title';h.textContent=d.name+' 고객들이 자주 요청하는 기능';
  const p=document.createElement('p');p.textContent='단순 디자인 전시를 넘어 필요한 기능을 직접 체험하고, 실제 제작에 필요한 추가 연동을 구분해 상담 준비서로 연결합니다.';
  top.append(eyebrow,h,p);
  const badges=document.createElement('p');badges.className='v652-badges';badges.textContent='36개 디자인 공통 연결 · 업종별 4개 요구사항 · 시연/실운영 구분';
  const cards=document.createElement('div');cards.className='v652-grid';
  const checked=new Set([0]);
  const checkboxes=[];
  const preview=document.createElement('pre');preview.className='v652-preview';preview.id='v652-preview';preview.setAttribute('role','status');preview.setAttribute('aria-live','polite');
  const size=document.createElement('select');size.id='v652-scale';size.setAttribute('aria-label','예상 자료·운영 규모');
  d.scope.forEach((s,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=s;size.append(o);});
  const when=document.createElement('select');when.id='v652-when';when.setAttribute('aria-label','희망 제작 시기');
  DAYS.forEach(row=>{const o=document.createElement('option');o.value=row[0];o.textContent=row[1];when.append(o);});when.value='unknown';
  const status=document.createElement('p');status.id='v652-status';status.className='v652-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  function selected(){return [...checked].sort((a,b)=>a-b);}
  function render(){preview.textContent=lineText(d,selected(),Number(size.value),when.value,style);status.textContent='';}
  d.items.forEach((item,i)=>{
    const c=document.createElement('article');c.className='v652-card';
    const bar=document.createElement('div');bar.className='v652-cardtop';
    const k=document.createElement('span');k.textContent='0'+(i+1)+' / '+(item[2]==='연동'?'PRODUCTION INTEGRATION':'LIVE DEMO');
    const tag=document.createElement('span');tag.textContent=item[2]==='연동'?'실운영 시 구축 필요':'브라우저에서 체험 가능';tag.className='v652-tag'+(item[2]==='연동'?' v652-tag-ops':'');
    bar.append(k,tag);
    const title=document.createElement('h3');title.textContent=item[0];
    const detail=document.createElement('p');detail.textContent=item[1];
    const controls=document.createElement('div');controls.className='v652-controls';
    const label=document.createElement('label');label.className='v652-check';
    const ch=document.createElement('input');ch.type='checkbox';ch.value=String(i);ch.checked=i===0;
    ch.dataset.v652Item=String(i);ch.addEventListener('change',()=>{ch.checked?checked.add(i):checked.delete(i);render();});
    checkboxes.push(ch);
    const span=document.createElement('span');span.textContent='제작 요청서에 포함';label.append(ch,span);
    const action=textButton('연관 기능 체험 ↗',()=>{
      const tab=document.getElementById('v28-tab-'+item[3]);const target=document.getElementById('v28-tools');
      if(!tab||!target){status.textContent='기능을 준비하는 중입니다. 브라우저 새로고침 후 다시 선택해 주세요.';return;}
      tab.click();target.scrollIntoView({behavior:'smooth',block:'start'});status.textContent=item[0]+' 관련 실사용 시연 화면을 열었습니다.';
    },'v652-try');
    controls.append(label,action);c.append(bar,title,detail,controls);cards.append(c);
  });
  const bottom=document.createElement('div');bottom.className='v652-bottom';
  const form=document.createElement('div');form.className='v652-form';
  const fl1=document.createElement('label');fl1.textContent='자료·운영 규모';fl1.append(size);
  const fl2=document.createElement('label');fl2.textContent='희망 제작 시기';fl2.append(when);
  form.append(fl1,fl2);
  size.addEventListener('change',render);when.addEventListener('change',render);
  const actions=document.createElement('div');actions.className='v652-actions';
  const copy=textButton('요구사항 복사',async()=>{
    if(!checked.size){status.textContent='원하는 기능을 1개 이상 선택해 주세요.';return;}
    try{if(!navigator.clipboard?.writeText)throw Error('blocked');await navigator.clipboard.writeText(preview.textContent);
    status.textContent='요구사항을 복사했습니다. 전송이나 접수는 하지 않았습니다.';}
    catch(_){status.textContent='복사 권한이 차단되었습니다. 아래 텍스트를 직접 선택해 복사하거나 TXT로 저장하세요.';preview.focus();}
  },'v652-secondary');
  const save=textButton('TXT 저장',()=>{
    if(!checked.size){status.textContent='원하는 기능을 1개 이상 선택해 주세요.';return;}
    const blob=new Blob(['\ufeff',preview.textContent],{type:'text/plain;charset=utf-8'});
    const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;
    a.download='AllFileOne_'+id+'_V65_2_Requirements.txt';document.body.append(a);a.click();a.remove();
    window.setTimeout(()=>URL.revokeObjectURL(u),2000);status.textContent='요구사항 TXT 저장을 요청했습니다. 실제 상담 접수는 아닙니다.';
  },'v652-secondary');
  const go=textButton('선택한 기능으로 상세 제작 상담서 작성 ↗',()=>{
    if(!checked.size){status.textContent='원하는 기능을 1개 이상 선택해 주세요.';return;}
    const data={v:652,industry:id,style,ids:selected(),scale:Number(size.value),when:when.value,ts:Date.now()};
    try{sessionStorage.setItem(KEY,JSON.stringify(data));}
    catch(_){status.textContent='브라우저 임시 저장이 차단됐습니다. TXT 저장으로 직접 전달해 주세요.';return;}
    const qs=new URLSearchParams({source:'demo-v652',industry:id,theme:style});
    window.location.assign('../../../contact.html?'+qs.toString());
  },'v652-primary');
  actions.append(copy,save,go);
  const explanation=document.createElement('p');explanation.className='v652-legal';
  explanation.textContent='※ 현재 시연의 계산·검색·시간표는 가상 자료로만 작동합니다. 예약·회원·결제·관리자·실시간 재고 등은 고객별 운영 시스템 구축·연동이 필요하며 이 화면만으로 주문·상담은 접수되지 않습니다.';
  bottom.append(form,preview,actions,status,explanation);
  frame.append(top,badges,cards,bottom);section.append(frame);
  (document.getElementById('v28-tools')||document.getElementById('v23-workflow')||main.querySelector('.services')||main.lastElementChild).insertAdjacentElement('afterend',section);
  const nav=document.getElementById('demo-nav');
  if(nav&&!nav.querySelector('a[href="#v652-demand"]')){
    const link=document.createElement('a');link.href='#v652-demand';link.textContent='필수 기능·제작 문의';
    nav.insertBefore(link,nav.querySelector('a[href="#contact"]'));
  }
  b.dataset.v652Ready='true';preview.tabIndex=0;render();
}
function contact() {
  const form=document.getElementById('brief-form');if(!form||document.getElementById('v652-import'))return;
  const q=new URLSearchParams(location.search);
  if(q.get('source')!=='demo-v652')return;
  let serialized;
  try{serialized=sessionStorage.getItem(KEY);sessionStorage.removeItem(KEY);}catch(_){return;}
  if(!serialized||serialized.length>1200)return;
  let data;try{data=JSON.parse(serialized);}catch(_){return;}
  if(!data||data.v!==652||!Number.isSafeInteger(data.ts)||data.ts>Date.now()+60000||Date.now()-data.ts>TTL||
    !has(DATA,data.industry)||!STYLES.has(data.style)||data.industry!==q.get('industry')||data.style!==q.get('theme')||
    !Array.isArray(data.ids)||data.ids.length<1||data.ids.length>4||new Set(data.ids).size!==data.ids.length||
    !data.ids.every(x=>Number.isInteger(x)&&x>=0&&x<4)||
    !Number.isInteger(data.scale)||data.scale<0||data.scale>2||
    !DAYS.some(x=>x[0]===data.when))return;
  const ind=form.elements.namedItem('industry'),theme=form.elements.namedItem('theme'),details=form.elements.namedItem('details');
  if(!ind||!details)return;
  ind.value=data.industry;if(theme)theme.value=data.style;
  const full=lineText(DATA[data.industry],data.ids,data.scale,data.when,data.style);
  const before=safe(details.value,700);
  const combined=(before?before+'\n\n':'')+full;
  const cap=details.maxLength>0?details.maxLength:700;
  details.value=combined.length<=cap?combined:combined.slice(0,Math.max(0,cap-31))+'\n[전체 요구사항은 위에서 확인]';
  const panel=document.createElement('aside');panel.id='v652-import';panel.className='v652-import';panel.setAttribute('aria-label','가상 업종별 예제사이트의 제작 요구사항');
  const title=document.createElement('strong');title.textContent='예제사이트에서 선택한 제작 요구사항을 가져왔습니다';
  const note=document.createElement('p');note.textContent='선택한 업종·디자인·규모·요구 기능을 이어받았습니다. 이 단계에서 자동 전송 또는 실제 접수는 이뤄지지 않았습니다.';
  const pre=document.createElement('pre');pre.id='v652-full-brief';pre.textContent=full;pre.tabIndex=0;
  const btn=textButton('가져온 전체 요구사항 복사',async()=>{
    try{if(!navigator.clipboard?.writeText)throw Error('blocked');await navigator.clipboard.writeText(full);result.textContent='복사했습니다. 이메일을 직접 발송해야 접수됩니다.';}
    catch(_){result.textContent='복사 권한이 차단됐습니다. 위 문안을 선택해 복사해 주세요.';}
  },'v652-secondary');
  const result=document.createElement('p');result.setAttribute('role','status');result.setAttribute('aria-live','polite');
  panel.append(title,note,pre,btn,result);
  if(combined.length>cap){const warn=document.createElement('p');warn.textContent='상담서 글자 수 제한으로 일부 축약됐습니다. 위에서 전체 내용을 복사해 이메일에 추가하세요.';panel.append(warn);}
  (document.querySelector('#brief .workspace')||form).before(panel);
  form.dispatchEvent(new Event('input',{bubbles:true}));
  document.body.dataset.v652Imported='true';
}
function init(){demo();contact();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.ALLFILEONE_V652_CAPABILITY_COUNT=Object.keys(DATA).length*4;
})();
