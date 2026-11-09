/* AllFileOne WebStudio V66 - distinct 3 visual identities + industry-first conversion.
   Original first-party script shared across 36 existing demos. Existing V28 functionality
   remains the real implementation; this layer makes it immediately visible and usable.
   No remote services, logins, PII, fabricated portfolio or real orders.
*/
(() => {
'use strict';
const STYLES={modern:'실용적인 모던',premium:'프리미엄 브랜드',editorial:'스토리 중심 에디토리얼'};
const INDUSTRIES={
 manufacturing:{name:'제조 · 도매',tag:'INDUSTRIAL / B2B',targets:['규격으로 제품을 좁히기','수량과 MOQ를 계산하기','자재 성능을 비교하기','견적 준비 항목 모으기'],
   headlines:['정확한 규격으로 찾고,\n빠르게 견적을 준비합니다.','정밀한 제조 역량을\n신뢰의 경험으로.','부품 하나의 규격부터\n거래의 확신까지.'],lead:'구매 담당자가 원하는 것은 화려한 문구보다 정확한 규격과 일관된 견적 흐름입니다.'},
 corporate:{name:'기업 · 회사',tag:'CORPORATE / SOLUTIONS',targets:['사업 분야별 솔루션 탐색','고객 문제에 맞는 서비스 찾기','프로젝트 과정 확인','회사소개서 구성 정리'],
   headlines:['사업과 솔루션을\n명확하게 보여줍니다.','브랜드의 신뢰를\n디지털 공간으로.','우리가 일하는 방식의\n기록과 증명.'],lead:'사업영역, 프로젝트, 인증과 협업 문의를 서로 연결하는 기업용 정보 구조입니다.'},
 clinic:{name:'병원 · 의원',tag:'CLINIC / VISIT GUIDE',targets:['진료과목과 의료진 찾기','진료시간·휴진 안내 확인','진료 전 준비 목록','예약 연결 절차 확인'],
   headlines:['찾기 쉬운 진료 안내,\n편안한 첫 방문.','환자의 시간을 존중하는\n안심 의료 안내.','방문 전 알아야 할\n모든 이야기.'],lead:'환자가 진료 내용과 운영시간, 내원 준비를 혼동하지 않게 안내합니다. 진료·예약 확정은 제공하지 않습니다.'},
 academy:{name:'학원 · 교육',tag:'EDUCATION / ENROLLMENT',targets:['학년·과목별 강좌 탐색','반별 시간 충돌 확인','수강료·기간 비교','수강 상담 준비'],
   headlines:['우리 아이에게 맞는 수업,\n시간표부터 확인하세요.','배움의 가치를 전하는\n명확한 교육 브랜드.','한 사람의 성장을 위한\n시간표의 설계.'],lead:'학부모가 수업 대상과 요일, 비용을 비교한 다음 상담 준비까지 이어갈 수 있습니다.'},
 interior:{name:'인테리어 · 시공',tag:'SPACES / PORTFOLIO',targets:['공간별 시공 사례 필터','면적별 작업량 계산','자재·마감재 비교','현장 상담 목록 정리'],
   headlines:['공간에 맞는 사례를 찾고\n시공 범위를 계산합니다.','공간의 가능성을\n하나의 작품으로.','집과 공간을 바꾸는\n디테일의 기록.'],lead:'시공 사진의 매력과 함께 면적·공종·재료·방문 상담을 구조화합니다. 사진과 가격은 가상입니다.'},
 commerce:{name:'쇼핑몰 · 브랜드',tag:'COMMERCE / BUYING',targets:['상품 속성으로 필터','수량과 장바구니 합계','배송비 규칙 계산','구매 전 확인사항'],
   headlines:['원하는 상품을 빠르게 찾고\n합계를 바로 확인하세요.','매력적인 상품 경험,\n신중한 구매 결정.','한 제품을 선택하는\n취향의 장면들.'],lead:'제품 검색·가격 계산·배송 조건이 이어지는 판매 동선을 체험합니다. 실제 주문·결제는 이루어지지 않습니다.'},
 professional:{name:'법률 · 세무 · 회계',tag:'PROFESSIONAL / ADVISORY',targets:['상담 전문분야 찾기','상담 목적 분류','준비 서류 체크','상담 단계 확인'],
   headlines:['필요한 전문가와 상담 분야,\n차근차근 선택합니다.','전문성에 걸맞은\n차분하고 분명한 신뢰.','어려운 문제를 풀기 전\n준비해야 할 질문들.'],lead:'민감한 서류를 수집하지 않고 업무 분야와 준비 절차를 안내합니다. 전문 자문을 대신하지 않습니다.'},
 association:{name:'협회 · 단체',tag:'MEMBERS / EVENTS',targets:['공지·자료 검색','행사 일정 확인','회원 안내 절차','회비·관리 범위 확인'],
   headlines:['공지부터 행사까지,\n회원이 찾기 쉽게.','커뮤니티의 신뢰를\n하나의 창구로.','사람과 정보를 잇는\n공동체의 기록.'],lead:'자료 공개 범위와 행사 안내를 구분합니다. 회원 로그인·회비 납부는 실제 서비스가 아닙니다.'},
 franchise:{name:'프랜차이즈',tag:'FRANCHISE / PARTNERS',targets:['브랜드와 매장 검색','가상 창업비 계산','가맹 절차 체크','가맹 상담 준비'],
   headlines:['창업 조건을 이해하고\n가맹 절차를 준비합니다.','하나의 브랜드,\n일관된 매장 경험.','하나의 매장이 시작되는\n실질적인 질문들.'],lead:'브랜드 소개와 가상의 창업비 구성, 가맹 문의 준비를 한 흐름으로 엮습니다.'},
 stay:{name:'숙박 · 펜션',tag:'STAY / ROOMS',targets:['객실 조건 검색','날짜별 예시 숙박비','객실 규정 비교','예약 가능 여부 구분'],
   headlines:['날짜와 인원에 맞는 객실,\n먼저 비교하세요.','머무는 시간까지\n브랜드가 되는 공간.','여행의 첫 장면부터\n숙소의 작은 디테일까지.'],lead:'객실 조건과 날짜·인원별 예시 금액을 체험합니다. 객실 재고나 실제 예약은 처리하지 않습니다.'},
 realestate:{name:'부동산 · 분양',tag:'PROPERTY / DISCOVERY',targets:['지역·가격별 매물 필터','매물 조건 비교','현장 방문 체크','매물 상담 준비'],
   headlines:['조건에 맞는 매물과\n확인할 내용을 한눈에.','좋은 공간을 고르는\n신뢰의 탐색 경험.','하나의 공간을 선택하기\n전에 살펴볼 것들.'],lead:'가상 매물 검색과 비교·현장 방문 확인표가 이어집니다. 실제 중개와 매물 등록이 아닙니다.'},
 event:{name:'행사 · 캠페인',tag:'EVENTS / SESSIONS',targets:['세션과 연사 찾기','중복 시간 확인','관심 일정 저장','참가 절차 미리보기'],
   headlines:['프로그램을 찾고\n겹치는 시간을 확인하세요.','참여하고 싶은 행사를\n특별한 경험으로.','하나의 행사를 이루는\n순간과 사람들.'],lead:'참가자가 일정 충돌을 피하고 캘린더에 관심 세션을 저장합니다. 티켓 발권은 별도 연동입니다.'}
};
function node(tag,cls,txt){
 const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;
}
function init(){
 const body=document.body,id=body?.dataset.v13Industry,style=body?.dataset.v13Style,
       row=INDUSTRIES[id],main=document.querySelector('main');
 if(!row||!STYLES[style]||!main||document.getElementById('v66-sector-first'))return;
 const heading=document.querySelector('.hero h1');
 if(heading)heading.textContent=row.headlines[['modern','premium','editorial'].indexOf(style)];
 const sub=document.querySelector('.hero p:not(.premium-index)');
 if(sub)sub.textContent=row.lead;
 const eyebrow=document.querySelector('.hero .eyebrow');
 if(eyebrow)eyebrow.textContent=row.tag+' / '+style.toUpperCase();
 const serviceTitle=document.querySelector('.sec-heading h2');
 if(serviceTitle)serviceTitle.textContent=row.name+'의 고객이 실제로 찾는 것';
 const serviceDesc=document.querySelector('.sec-heading>p');
 if(serviceDesc)serviceDesc.textContent='설명이 아니라 클릭 가능한 핵심 업무 흐름으로 보여드립니다.';
 const statement=document.querySelector('.statement h2');
 if(statement)statement.textContent=style==='premium'?'신뢰는 작은 사용 경험에서 시작됩니다.':style==='editorial'?'고객의 질문부터 읽는 홈페이지.':'필요한 정보를 먼저, 정확하게.';
 const spotlight=node('section','v66-sector-first');spotlight.id='v66-sector-first';
 spotlight.dataset.style=style;spotlight.dataset.industry=id;
 spotlight.setAttribute('aria-labelledby','v66-first-title');
 const wrap=node('div','v66-sector-shell');
 const over=node('div','v66-sector-over');
 const mark=node('span','v66-sector-mark',row.tag);
 const edition=node('span','v66-sector-edition',STYLES[style]+' / 핵심 기능 4가지');
 over.append(mark,edition);
 const title=node('h2','',row.name+'에서 가장 중요한 기능을 바로 체험하세요.');
 title.id='v66-first-title';
 const desc=node('p','v66-first-lead',row.lead+' 아래 각 항목을 누르면 해당 기능이 실제로 열립니다.');
 const grid=node('div','v66-sector-grid');
 row.targets.forEach((text,i)=>{
   const item=node('button','v66-sector-card');item.type='button';item.dataset.v66Feature=String(i);
   const num=node('span','v66-sector-num',String(i+1).padStart(2,'0')+' / 04');
   const name=node('strong','',text);
   const description=node('span','v66-sector-description','실제 동작하는 업종별 도구 열기');
   const arrow=node('span','v66-sector-arrow','↗');
   item.append(num,name,description,arrow);
   item.addEventListener('click',()=>{
     const tab=document.getElementById('v28-tab-'+i);
     if(tab){
       tab.click();
       document.getElementById('v28-tools')?.scrollIntoView({block:'start',behavior:'instant'});
     }else{
       // Full route fallback uses V28's existing strict allowlisted feature query.
       const target=new URL(location.href);
       target.searchParams.set('feature',String(i));target.hash='v28-tools';
       location.assign(target.href);
     }
   });
   grid.append(item);
 });
 const note=node('p','v66-sector-disclaimer','가상 자료로 작동하는 직접 체험입니다. 실제 예약·상담·결제·진료·주문 접수 또는 실시간 데이터 연동은 제공하지 않습니다.');
 wrap.append(over,title,desc,grid,note);spotlight.append(wrap);
 const rail=main.querySelector('.v13-brand-rail');
 if(rail)rail.insertAdjacentElement('afterend',spotlight);
 else main.prepend(spotlight);
 const nav=document.querySelector('#demo-nav');
 if(nav && !nav.querySelector('[href="#v66-sector-first"]')){
   const link=node('a','', '업종 핵심');link.href='#v66-sector-first';
   nav.insertBefore(link,nav.querySelector('a[href="#contact"]')||null);
 }
 // Keep the original four fully functional V28 tabs, their input validation and TXT exports.
 // All 36 HTML pages share these same code enhancements without editing templates.
 body.dataset.v66Ready='true';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.AFO_V66_SECTOR_COUNT=Object.keys(INDUSTRIES).length;
})();
