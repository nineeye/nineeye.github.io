/* WebStudio V79: twelve additional fictional, offline, working prototypes. */
(()=>{'use strict';
const D=window.AFO_V79_FIXTURES||{}, C=window.ALLFILEONE_V28_CATALOG||{}, E=window.AFO_V77_FEATURE_EXTENSION||{};
const own=(a,k)=>Object.prototype.hasOwnProperty.call(a,k);
function e(tag,cls,content){const x=document.createElement(tag);if(cls)x.className=cls;if(content!==undefined)x.textContent=String(content);return x;}
function select(values){const s=e('select','v79-select');values.forEach(v=>{const o=e('option','',v);o.value=v;s.append(o)});return s;}
function wrap(label,control){const l=e('label','v79-field');l.append(e('span','',label),control);return l;}
const krw=num=>Math.round(num).toLocaleString('ko-KR')+'원';
function mount(target,sector){
 if(!target||!own(D,sector)||!C[sector]||!E[sector])return false;
 const d=D[sector],f=E[sector].extra[d.index];if(!f||f.status!=='simulated')return false;
 const box=e('section','v79-widget'),inputs=e('div','v79-controls'),output=e('div','v79-output');
 box.dataset.industry=sector;box.dataset.kind=d.kind;box.setAttribute('aria-label',f.title+' 가상 기능');
 output.setAttribute('role','status');output.setAttribute('aria-live','polite');
 box.append(e('span','v79-overline','WORKING PROTOTYPE / FICTIONAL DATA'),e('h3','',f.title+' — 체험'),e('p','v79-disclose',d.intro),inputs,output);
 function search(){
  const q=e('input','v79-search');q.type='search';q.placeholder='이름·설명 검색';q.setAttribute('aria-label','가상 목록 검색');
  const facet=select(['전체',...new Set(d.items.map(i=>i[1]))]);inputs.append(wrap('검색어',q),wrap(d.facet+' 선택',facet));
  function render(){const text=q.value.trim().toLocaleLowerCase('ko');const rows=d.items.filter(r=>(facet.value==='전체'||facet.value===r[1])&&r.join(' ').toLocaleLowerCase('ko').includes(text));output.replaceChildren(e('strong','v79-count','가상 결과 '+rows.length+'건'));const list=e('div','v79-list');rows.forEach(r=>{const card=e('article','v79-card');card.append(e('small','',r[1]),e('strong','',r[0]),e('p','',r[2]));list.append(card)});if(!rows.length)list.append(e('p','', '일치하는 가상 정보가 없습니다.'));output.append(list);}
  q.addEventListener('input',render);facet.addEventListener('change',render);render();
 }
 function bulk(){
  const t=e('textarea','v79-area');t.rows=4;t.value='M-101,20\nM-205,10\nS-111,5';t.setAttribute('aria-label','형번,수량 CSV 예시 입력');inputs.append(wrap('형번,수량 · 줄마다 하나씩 입력',t));
  const map=new Map(d.items.map(r=>[r[0],r]));function calc(){let total=0,valid=0,issues=[];const list=e('div','v79-list');
   t.value.split(/\r?\n/).slice(0,30).filter(x=>x.trim()).forEach((raw,i)=>{const p=raw.trim().split(','),sku=p[0]?.trim(),qty=Number(p[1]?.trim());const rec=map.get(sku);if(!rec||!Number.isInteger(qty)||qty<1||qty>10000){issues.push('줄 '+(i+1)+': 형번 또는 수량 오류');return;}
    if(qty<rec[2]){issues.push('줄 '+(i+1)+': '+sku+' 가상 MOQ '+rec[2]+' 미달');return;}
    const subtotal=rec[1]*qty;total+=subtotal;valid++;const x=e('article','v79-card');x.append(e('strong','',sku+' × '+qty),e('p','',krw(subtotal)+' · 가상 단가 '+krw(rec[1])));list.append(x)});
   output.replaceChildren(e('strong','v79-count','유효 '+valid+'건 · 가상 합계 '+krw(total)),list);
   if(issues.length){const ul=e('ul','v79-errors');issues.forEach(x=>ul.append(e('li','',x)));output.append(ul)}
   output.append(e('small','', '실제 견적 접수·재고 확인·세금 계산은 수행하지 않습니다.'));
  }t.addEventListener('input',calc);calc();
 }
 function detail(){const sel=select(d.items.map(x=>x[0]));inputs.append(wrap('가상 프로젝트 사례',sel));function render(){const row=d.items.find(x=>x[0]===sel.value)||d.items[0];output.replaceChildren(e('strong','v79-count',row[0]));['검토할 문제','가상 진행 순서','성과 확인 지표'].forEach((name,i)=>{const c=e('article','v79-card');c.append(e('small','',name),e('p','',row[i+1]));output.append(c)});}sel.addEventListener('change',render);render();}
 function stateList(mode){const selected=new Set();const list=e('div','v79-list');const summary=e('strong','v79-count');function render(){list.replaceChildren();d.items.forEach((item,i)=>{const c=e('article','v79-card');c.append(e('small','',item[1]),e('strong','',item[0]),e('p','',item[2]));const b=e('button','v79-choose',selected.has(i)?'✓ 선택 해제':'＋ 관심 항목 담기');b.type='button';b.setAttribute('aria-pressed',String(selected.has(i)));b.addEventListener('click',()=>{selected.has(i)?selected.delete(i):selected.add(i);render()});c.append(b);list.append(c)});summary.textContent='가상 관심 목록 '+selected.size+'개';if(mode==='watchlist')info.textContent=selected.size?'변경 알림 예시: '+[...selected].map(i=>d.items[i][0]).join(', ')+' · 실제 알림은 발송되지 않습니다.':'관심 항목을 선택하면 화면에 가상 변경 알림 내용을 표시합니다.';}
  const info=e('p','v79-status');output.append(summary,list,info);render();
 }
 function compare(){const sel=select(d.items.map(r=>r[0])),slider=e('input','v79-range');slider.type='range';slider.min='0';slider.max='100';slider.step='100';slider.value='0';inputs.append(wrap('가상 공간',sel),wrap('비교 보기 (0=전, 100=후)',slider));function render(){const row=d.items.find(x=>x[0]===sel.value)||d.items[0];const after=Number(slider.value)===100;output.replaceChildren(e('strong','v79-count',row[0]+' / '+(after?'가상 시공 후':'가상 시공 전')));const item=e('div','v79-floor');item.append(e('div','v79-floor-symbol',after?'▤  ☐  ▰':'▥  ▨  ◧'),e('p','',after?row[2]:row[1]));output.append(item,e('small','',row[3]+' · 실제 시공 사진이 아니라 텍스트 도식입니다.'));}sel.addEventListener('change',render);slider.addEventListener('input',render);render();}
 function seats(){const chosen=new Set(),grid=e('div','v79-seats'),summary=e('strong','v79-count');grid.setAttribute('role','group');grid.setAttribute('aria-label','가상 좌석 12개');for(let r=0;r<d.rows;r++)for(let c=0;c<d.cols;c++){const seat=String.fromCharCode(65+r)+String(c+1),btn=e('button','v79-seat',seat);btn.type='button';btn.setAttribute('aria-label','가상 좌석 '+seat);btn.setAttribute('aria-pressed','false');btn.addEventListener('click',()=>{chosen.has(seat)?chosen.delete(seat):chosen.add(seat);btn.setAttribute('aria-pressed',String(chosen.has(seat)));render()});grid.append(btn)}
 function render(){let total=0;chosen.forEach(seat=>{total+=d.prices[seat.charCodeAt(0)-65]||0});summary.textContent=chosen.size+'석 · 가상 합계 '+krw(total);}
 inputs.append(e('p','', 'A열 45,000원 / B열 35,000원 / C열 25,000원 · 모두 가상'));output.append(grid,summary,e('small','', '실제 좌석 재고 확인·좌석 점유·티켓 발권·결제 없음'));render();
 }
 if(['search','faq'].includes(d.kind))search();else if(d.kind==='bulk')bulk();else if(d.kind==='detail')detail();else if(d.kind==='favorites'||d.kind==='watchlist')stateList(d.kind);else if(d.kind==='compare')compare();else if(d.kind==='seats')seats();else return false;
 box.append(e('p','v79-disclaimer','모든 목록·가격·인물·날짜·좌석은 허구입니다. 사용자 정보를 서버에 보내지 않으며 실서비스 신청·계약·예약은 이뤄지지 않습니다.'));
 target.replaceChildren(box);return true;
}
window.AFO_V79_SIMULATOR=Object.freeze({mount,keys:Object.freeze(Object.keys(D)),indexFor:k=>D[k]?.index??-1,version:'V79-20261109'});
})();