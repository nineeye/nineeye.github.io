/* WebStudio V80 — third set of 12 explicitly fictional, working browser-only prototypes.
   No network, accounts, actual bookings, clinical advice, order lookup or auto-notifications. */
(()=>{'use strict';
const D=window.AFO_V80_FIXTURES||{},E=window.AFO_V77_FEATURE_EXTENSION||{},C=window.ALLFILEONE_V28_CATALOG||{};
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function h(t,cls,text){const x=document.createElement(t);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x;}
function choose(items){const s=h('select','v80-input');items.forEach((v,i)=>{const o=h('option','',typeof v==='string'?v:v[0]);o.value=String(i);s.append(o)});return s;}
function field(title,control){const x=h('label','v80-field');x.append(h('span','',title),control);return x;}
function download(filename,text,mime='text/plain;charset=utf-8'){
 const b=new Blob([text],{type:mime}),u=URL.createObjectURL(b),a=h('a');a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);
}
function mount(target,industry){if(!target||!has(D,industry)||!has(E,industry)||!C[industry])return false;
 const d=D[industry],entry=E[industry].extra[d.index];if(!entry||entry.status!=='simulated')return false;
 const box=h('section','v80-widget'),controls=h('div','v80-controls'),out=h('div','v80-result');box.dataset.kind=d.kind;box.dataset.industry=industry;
 box.append(h('span','v80-kicker','INTERACTIVE DEMO / FICTIONAL DATA / V80'),h('h3','',entry.title),h('p','v80-intro',d.intro),controls,out);
 out.setAttribute('role','status');out.setAttribute('aria-live','polite');
 function result(title,detail){out.replaceChildren(h('strong','',title),h('p','',detail));}
 function action(text,callback){const b=h('button','v80-action',text);b.type='button';b.addEventListener('click',callback);return b;}
 if(d.kind==='drawing'){
  const sel=choose(d.items);controls.append(field('가상 부품 형상',sel));const diagram=document.createElementNS('http://www.w3.org/2000/svg','svg');diagram.classList.add('v80-drawing');diagram.setAttribute('viewBox','0 0 240 140');diagram.setAttribute('role','img');diagram.setAttribute('aria-label','가상 직사각형 도면 미리보기');
  const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');rect.setAttribute('x','26');rect.setAttribute('y','22');rect.setAttribute('width','188');rect.setAttribute('height','96');rect.setAttribute('stroke','#195b4e');rect.setAttribute('stroke-width','3');rect.setAttribute('fill','#deefe6');diagram.append(rect);
  function generate(){const row=d.items[Number(sel.value)],w=row[1],height=row[2];result(row[0],`가상 외곽 규격 ${w} × ${height} mm · 파일에는 이 외곽선만 포함합니다.`);out.append(diagram,action('2D 가상 도면 DXF 저장 ↓',()=>{
   const points=[[0,0],[w,0],[w,height],[0,height],[0,0]];let body='0\nSECTION\n2\nENTITIES\n';for(let i=0;i<4;i++){body+='0\nLINE\n8\nSAMPLE\n10\n'+points[i][0]+'\n20\n'+points[i][1]+'\n30\n0\n11\n'+points[i+1][0]+'\n21\n'+points[i+1][1]+'\n31\n0\n';}body+='0\nENDSEC\n0\nEOF\n';download('AFO_FICTIONAL_2D_SAMPLE.dxf',body,'application/dxf');
  }));}sel.addEventListener('change',generate);generate();
 }else if(d.kind==='brochure'){
  const sel=choose(d.items);controls.append(field('가상 소개서 구성',sel));function render(){const row=d.items[Number(sel.value)];result(row[0],row[1]+' · 아래 HTML 파일은 브라우저에서 실제로 열 수 있지만 실제 기업 소개·실적이 아닙니다.');out.append(action('가상 소개서 HTML 저장 ↓',()=>{
   const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
   const html='<!doctype html><html lang="ko"><meta charset="utf-8"><title>가상 회사소개서</title><style>body{font:18px system-ui;max-width:760px;margin:9vh auto;padding:25px;line-height:1.7;color:#203e38}</style><h1>'+esc(row[0])+'</h1><p>'+esc(row[1])+'</p><p><strong>가상 예시 문서 · 사실 정보나 인증 문서가 아닙니다.</strong></p></html>';
   download('AFO_FICTIONAL_COMPANY_BROCHURE.html',html,'text/html;charset=utf-8');
  }));}sel.addEventListener('change',render);render();
 }else if(d.kind==='appointment'){
  const purpose=choose(d.items),date=choose(['2027-02-11','2027-02-18']),time=choose(d.times);controls.append(field('가상 상담·진료 목적',purpose),field('예시 날짜',date),field('가상 시간',time));
  const render=()=>result('접수 전 단계 미리보기',d.items[Number(purpose.value)]+' / '+['2027-02-11','2027-02-18'][Number(date.value)]+' '+d.times[Number(time.value)]+' → 담당자 확인 → 실제 운영 시스템 별도 · **신청되지 않았습니다**');
  [purpose,date,time].forEach(x=>x.addEventListener('change',render));render();
 }else if(d.kind==='progress'){
  const selected=new Set(),list=h('div','v80-list');d.items.forEach((name,i)=>{const l=h('label','v80-check'),c=h('input');c.type='checkbox';c.addEventListener('change',()=>{c.checked?selected.add(i):selected.delete(i);update()});l.append(c,h('span','',name));list.append(l)});controls.append(list);
  function update(){const pct=Math.round(selected.size/d.items.length*100);result('가상 학습 진도 '+pct+'%',selected.size+'/'+d.items.length+'차시 완료 · 새로고침 시 초기화');const meter=h('progress','v80-progress');meter.max=100;meter.value=pct;meter.setAttribute('aria-label','가상 강좌 진도');out.append(meter);}update();
 }else if(d.kind==='materials'){
  const sel=choose(d.items);controls.append(field('마감재 시연 옵션',sel));function render(){const row=d.items[Number(sel.value)];result(row[0]+' · 가상 비교','적용 예시: '+row[1]+' / 관리 유의: '+row[2]+' / 가상 비용감: '+row[3]);}sel.addEventListener('change',render);render();
 }else if(d.kind==='tracking'){
  const sel=choose(d.items);controls.append(field('가상 주문번호 선택',sel));const steps=['주문 확인','상품 준비','배송 진행','전달 예시'];function render(){const i=Number(sel.value),row=d.items[i];result(row[0]+' · '+row[1],row[2]+' / 예시 운송장·실제 구매기록 없음');const ol=h('ol','v80-steps');steps.forEach((s,k)=>{const li=h('li',k<=i?'v80-done':'',s);ol.append(li)});out.append(ol);}sel.addEventListener('change',render);render();
 }else if(d.kind==='eligibility'){
  const checked=new Set(),list=h('div','v80-list');d.items.forEach((name,i)=>{const l=h('label','v80-check'),c=h('input');c.type='checkbox';c.addEventListener('change',()=>{c.checked?checked.add(i):checked.delete(i);render()});l.append(c,h('span','',name));list.append(l)});controls.append(list);
  function render(){result('가상 신청 준비 '+checked.size+'/'+d.items.length+'개 점검',checked.size===d.items.length?'준비 항목을 모두 확인했습니다. 실제 신청 자격 심사는 관할 기관에서 별도 확인하세요.':'실제 공고문·신청 요건·제출처를 반드시 확인해야 합니다.');}render();
 }else if(d.kind==='locations'){
  const sel=choose(d.items),rent=h('input','v80-input'),access=h('input','v80-input');rent.type='number';rent.min='50';rent.max='1000';rent.value=String(d.items[0][1]);access.type='range';access.min='10';access.max='100';access.value=String(d.items[0][2]);
  controls.append(field('가상 입지 후보',sel),field('예시 월 임대료 (만원)',rent),field('접근성 가정치 (10~100)',access));
  function render(){const r=Math.min(1000,Math.max(50,Number(rent.value)||50)),a=Number(access.value),score=Math.max(0,Math.round(a-r/15));result(d.items[Number(sel.value)][0]+' · 비교용 지표 '+score+'점','접근성 '+a+'점 - 임대료 보정 '+Math.round(r/15)+'점. 실제 유동인구·수익성·투자 가치와 무관합니다.');}
  sel.addEventListener('change',()=>{const row=d.items[Number(sel.value)];rent.value=row[1];access.value=row[2];render()});rent.addEventListener('input',render);access.addEventListener('input',render);render();
 }else if(d.kind==='reviews'){
  const facet=choose(['전체','환경','시설']),min=choose(['전체','4점 이상','5점']);controls.append(field('가상 후기 유형',facet),field('가상 평점 필터',min));function render(){let rows=d.items.filter(x=>(facet.value==='0'||x[1]===['전체','환경','시설'][Number(facet.value)])&&(min.value==='0'||x[2]>=([0,4,5][Number(min.value)])));result('허구 후기 '+rows.length+'건','실제 방문자가 작성한 후기가 아닙니다.');const list=h('div','v80-list');rows.forEach(row=>{const card=h('div','v80-review');card.append(h('strong','',row[0]+' · '+row[2]+'점'),h('p','',row[3]));list.append(card)});out.append(list);}facet.addEventListener('change',render);min.addEventListener('change',render);render();
 }else if(d.kind==='trend'){
  const sel=choose(d.items);controls.append(field('가상 지표 유형',sel));function render(){const row=d.items[Number(sel.value)],values=row[1];result(row[0]+' · 허구 상대 지표','실거래가나 시세가 아닌 4개 시점의 가상 지표입니다.');const chart=h('div','v80-chart');chart.setAttribute('role','img');chart.setAttribute('aria-label','가상 막대 그래프: '+values.join(', '));values.forEach((v,i)=>{const bar=h('div','v80-bar');bar.style.height=(v/120*130)+'px';bar.append(h('span','',String(v)));chart.append(bar)});out.append(chart);}sel.addEventListener('change',render);render();
 }else if(d.kind==='calendar'){
  const sel=choose(d.items);controls.append(field('가상 오픈 일정',sel));function render(){const row=d.items[Number(sel.value)];result(row[0],row[1]+' '+row[2]+' KST · 예시 일정입니다. 실제 예매나 알림 전송이 아닙니다.');out.append(action('가상 일정 .ics 저장 ↓',()=>{
   const hh=Number(row[2].slice(0,2)),utc=String((hh+24-9)%24).padStart(2,'0'),stamp=row[1].replaceAll('-','');const start=stamp+'T'+utc+'0000Z';const end=stamp+'T'+String((hh+24-8)%24).padStart(2,'0')+'0000Z';
   const ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ALLFILEONE//FICTIONAL DEMO//KO\r\nBEGIN:VEVENT\r\nUID:demo-v80-'+sel.value+'@allfileone.invalid\r\nDTSTAMP:20261109T000000Z\r\nDTSTART:'+start+'\r\nDTEND:'+end+'\r\nSUMMARY:AFO Fictional ticket opening demo\r\nDESCRIPTION:Fictional calendar demo, no booking, no real alert sending\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';download('AFO_FICTIONAL_TICKET_OPEN.ics',ics,'text/calendar;charset=utf-8');
  }));}sel.addEventListener('change',render);render();
 }else return false;
 box.append(h('p','v80-caution','가상 데이터 · 실제 운영 미연동 · 고객정보 저장/전송 없음 · 예약·구매·신청 확정 불가'));target.replaceChildren(box);return true;
}
window.AFO_V80_SIMULATOR=Object.freeze({mount,keys:Object.freeze(Object.keys(D)),indexFor:sector=>D[sector]?.index??-1,version:'V80-20261109'});
})();