/* AllFileOne WebStudio V78 — Twelve original, interactive, fictional industry demos.
 * Strictly offline. No fetch/XHR/POST/cookies/storage, no booking confirmation, no real pricing.
 * Public API: AFO_V78_SIMULATOR.mount(element, industry)
 */
(()=>{'use strict';
const F=window.AFO_V78_FIXTURES||{};
const C=window.ALLFILEONE_V28_CATALOG||{};
const E=window.AFO_V77_FEATURE_EXTENSION||{};
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function n(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e;}
const won=x=>Math.round(x).toLocaleString('ko-KR')+'원';
const bounded=(e,min,max)=>{const v=Number(e.value);return Number.isFinite(v)?Math.max(min,Math.min(max,v)):min};
function field(label,control){const l=n('label','v78-field');l.append(n('span','',label),control);return l;}
function choose(values,cls){const s=n('select',cls);values.forEach(value=>{const o=n('option','',value);o.value=value;s.append(o)});return s;}
function mount(where,sector){
 if(!where||!own(F,sector)||!C[sector]||!E[sector])return false;
 const d=F[sector],index=d.index,feature=E[sector].extra[index];
 if(!feature||feature.status!=='simulated')return false;
 const root=n('section','v78-widget');root.dataset.industry=sector;root.dataset.kind=d.type;root.setAttribute('aria-label',feature.title+' 가상 시연');
 root.append(n('span','v78-eyebrow','REAL INTERACTION · FICTIONAL DATA / '+C[sector].name),n('h3','',feature.title+' — 가상 시연'),n('p','v78-disclosure',d.lead));
 const controls=n('div','v78-controls'),results=n('div','v78-results');results.setAttribute('role','status');results.setAttribute('aria-live','polite');
 root.append(controls,results);
 if(d.type==='stock'){
  const item=choose(d.records.map(x=>x.name),'v78-select');
  const qty=n('input','v78-number');qty.type='number';qty.min='1';qty.max='10000';qty.value='5';qty.step='1';
  controls.append(field('가상 형번 선택',item),field('필요 수량 (1~10,000)',qty));
  const calculate=()=>{
   const x=d.records.find(x=>x.name===item.value)||d.records[0],q=Math.round(bounded(qty,1,10000));
   results.replaceChildren(n('strong','',x.sku+' · 예시 재고 '+x.stock+'개'),
    n('p','',q<=x.stock?'입력 수량 '+q+'개는 가상 재고 범위에 있습니다.':'입력 수량 '+q+'개 중 예시 재고가 '+Math.max(0,q-x.stock)+'개 부족합니다.'),
    n('small','','가상 출하 준비 예상: '+x.lead+'영업일 (실제 재고·납기 미연동)'));
  };item.addEventListener('change',calculate);qty.addEventListener('input',calculate);calculate();
 }else if(d.type==='list'){
  const q=n('input','v78-search');q.type='search';q.placeholder='제목·설명 키워드';q.setAttribute('aria-label',C[sector].name+' 가상 정보 검색');
  const categories=['전체',...new Set(d.items.map(x=>x[1]))],category=choose(categories,'v78-select');
  controls.append(field('키워드 검색',q),field(d.facet+' 선택',category));
  if(d.map){const m=n('div','v78-mini-map');m.setAttribute('aria-label','가상 권역 선택 도식 · 실제 지도 아님');m.append(n('small','', '도식형 가상 구역도 · 실제 지도 아님'));
   categories.slice(1).forEach((zone,i)=>{const b=n('button','v78-zone','⌖ '+zone);b.type='button';b.style.gridColumn=String((i%3)+1);b.addEventListener('click',()=>{category.value=zone;update();});m.append(b)});controls.append(m);}
  function update(){const term=q.value.trim().toLocaleLowerCase('ko');const entries=d.items.filter(row=>(category.value==='전체'||row[1]===category.value)&&row.join(' ').toLocaleLowerCase('ko').includes(term));
   results.replaceChildren(n('strong','v78-count','가상 정보 '+entries.length+'건'));const grid=n('div','v78-list');
   entries.forEach(row=>{const card=n('article','v78-list-item');card.append(n('small','',row[1]),n('strong','',row[0]),n('p','',row[2]));grid.append(card)});
   if(!entries.length)grid.append(n('p','v78-empty','조건에 맞는 예시 항목이 없습니다.'));results.append(grid);
  };q.addEventListener('input',update);category.addEventListener('change',update);update();
 }else if(d.type==='calc'){
  const input=n('input','v78-number');input.type='number';input.step='1';input.min=d.mode==='discount'?'0':'5';input.max=d.mode==='discount'?'10000000':'500';input.value=d.mode==='discount'?'78000':'45';
  const choices=choose(Object.keys(d.mode==='discount'?d.discount:d.unit),'v78-select');
  controls.append(field(d.mode==='discount'?'가상 상품 합계 (원)':'예시 면적 (㎡)',input),field(d.mode==='discount'?'쿠폰·회원 등급':'공사·매장 유형',choices));
  const calculate=()=>{const x=bounded(input,d.mode==='discount'?0:5,d.mode==='discount'?10000000:500),mode=choices.value;
   if(d.mode==='discount'){
    const rate=d.discount[mode],discount=Math.round(x*rate/100);results.replaceChildren(n('strong','',won(x-discount)),n('p','',mode+' · 가상 할인 '+rate+'% 적용 · 절감액 '+won(discount)),n('small','', '실제 회원 적립·쿠폰 발급·결제와 무관합니다.'));
   }else{const amount=x*d.unit[mode]+(d.mode==='startup'?18000000:0),min=Math.round(amount*.85),max=Math.round(amount*1.2);results.replaceChildren(n('strong','',won(min)+' ~ '+won(max)),n('p','',mode+' · '+x+'㎡ · 시연용 가정 단가 계산'),n('small','',d.mode==='startup'?'실제 가맹본부 비용·수익·상권 자료와 무관합니다.':'실제 시공 계약·현장 견적·품질 보증과 무관합니다.'));}
  };input.addEventListener('input',calculate);choices.addEventListener('change',calculate);calculate();
 }else if(d.type==='stay'){
  const day=n('input','v78-date');day.type='date';const now=new Date();const yy=now.getFullYear(),mm=String(now.getMonth()+1).padStart(2,'0'),dd=String(now.getDate()).padStart(2,'0');day.value=yy+'-'+mm+'-'+dd;
  const guests=n('input','v78-number');guests.type='number';guests.min='1';guests.max='6';guests.value='2';
  controls.append(field('조회할 날짜 (가상)',day),field('인원 (1~6명)',guests));
  const update=()=>{const count=Math.round(bounded(guests,1,6)),date=String(day.value||'');const dayNum=/^\d{4}-\d{2}-\d{2}$/.test(date)?Number(date.slice(-2)):0;
   results.replaceChildren(n('strong','',date+' · 가상 객실 조건 조회'));const grid=n('div','v78-list');
   d.rooms.forEach((room,i)=>{const eligible=count<=room.capacity,virtualStock=(dayNum+i)%4!==0;
    const card=n('article','v78-list-item');card.append(n('strong','',room.name+' · 최대 '+room.capacity+'명'),n('p','',eligible?(virtualStock?'가상 시연 기준 선택 가능':'가상 시연 기준 잔여 객실 없음'):'인원 초과 (선택 불가)'),n('small','',won(room.base)+' / 가상 1박 예시'));grid.append(card);
   });results.append(grid,n('small','','실시간 예약·재고 연동 없음 · 실제 예약 불가'));
  };day.addEventListener('change',update);guests.addEventListener('input',update);update();
 }else return false;
 const footer=n('p','v78-footnote','이 화면은 프로토타입입니다. 조회·계산 결과는 모두 허구이며 주문·예약·신청·결제가 접수되지 않습니다.');root.append(footer);where.replaceChildren(root);return true;
}
window.AFO_V78_SIMULATOR=Object.freeze({mount,keys:Object.freeze(Object.keys(F)),indexFor:sector=>F[sector]?.index??-1,version:'V78-20261109'});
function bootStandalone(){const target=document.getElementById('v78-standalone');if(!target)return;const params=new URLSearchParams(location.search),sector=params.get('industry');const select=document.getElementById('v78-industry');if(select){Object.keys(F).forEach(k=>{const opt=n('option','',C[k]?.name||k);opt.value=k;select.append(opt)});select.value=own(F,sector)?sector:Object.keys(F)[0];select.addEventListener('change',()=>{mount(target,select.value);const link=document.getElementById('v78-back');if(link)link.href='./industry-features-v77.html?industry='+encodeURIComponent(select.value);});select.dispatchEvent(new Event('change'));}
 else mount(target,own(F,sector)?sector:Object.keys(F)[0]);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootStandalone,{once:true});else bootStandalone();
})();