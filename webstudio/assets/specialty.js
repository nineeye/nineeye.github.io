/* V5 functional specialty demos; strictly static browser-side data; no server requests */
'use strict';
(()=>{
const root=document.querySelector('[data-demo-mode]');if(!root)return;
const mode=root.dataset.demoMode;const result=document.getElementById('result');const form=document.getElementById('feature-form');form?.addEventListener('submit',e=>e.preventDefault());
const money=n=>new Intl.NumberFormat('ko-KR').format(n)+'원';
const val=id=>document.getElementById(id)?.value??'';
const say=t=>{result.textContent=t;};let exportText='';
const safeInt=(id,min,max,defaultValue)=>{const n=Number(val(id));return Number.isFinite(n)&&Number.isInteger(n)&&n>=min&&n<=max?n:defaultValue;};
const save=(text,filename)=>{const blob=new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);};
const bind=(id,fn)=>document.getElementById(id)?.addEventListener('click',fn);
function exportCurrent(){if(!exportText){say('먼저 체험 기능을 실행해 주세요.');return;}save(exportText,'allfileone-'+mode+'-demo.txt');}
bind('download',exportCurrent);
if(mode==='wholesale'){
 const products={sensor:['산업용 센서',42000],motor:['스텝 모터',89000],cable:['산업용 케이블',18000]};const discount={retail:1,partner:.88,vip:.80};const items=[];const list=document.getElementById('added');
 function render(){list.replaceChildren();let total=0;for(const item of items){total+=item.total;const el=document.createElement('div');el.className='list-item';const label=document.createElement('span');label.textContent=item.name+' × '+item.qty+' / '+item.tier;const amount=document.createElement('strong');amount.textContent=money(item.total);el.append(label,amount);list.append(el);}exportText='[B2B 도매몰 가상 견적서]\n'+items.map(i=>i.name+' × '+i.qty+' / '+i.tier+': '+money(i.total)).join('\n')+'\n총액(VAT·운송비 제외): '+money(total)+'\n* 실제 판매·견적·주문이 아닌 기능 시연용입니다.';say('선택 품목 '+items.length+'종 · 공급가 합계 '+money(total)+' (예시, 부가세·운송비 별도)');}
 bind('add',()=>{const id=val('product'),qty=safeInt('quantity',1,500,0),tier=val('tier');if(!qty){say('수량은 1~500 사이의 정수로 입력하세요.');return;}const p=products[id];if(!p)return;let total=Math.round(p[1]*discount[tier]*qty);if(val('delivery')==='urgent')total+=30000;items.push({name:p[0],qty,tier,total});render();});say('거래처 등급과 제품·수량을 선택해 견적을 담아보세요. 할인율은 가상의 예시입니다.');
}else if(mode==='academybooking'){
 const today=new Date();const toLocalDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const d=document.getElementById('day');d.min=toLocalDate(today);d.value=toLocalDate(today);
 bind('calculate',()=>{const day=val('day'),time=val('time'),program=document.querySelector('#class option:checked')?.textContent||'',people=safeInt('people',1,8,0);if(!day||day<d.min||!people){say('오늘 이후의 날짜와 1~8명 인원을 선택해 주세요.');exportText='';return;}exportText='[학원 예약 요청서 체험]\n프로그램: '+program+'\n희망일: '+day+'\n희망시간: '+time+'\n인원: '+people+'명\n* 시연으로, 실제 예약·알림·결제와 연동되지 않습니다.';say(exportText);});say('강좌와 희망 날짜를 선택한 뒤 예약 요청 내용을 미리보기 할 수 있습니다.');
}else if(mode==='renovation'){
 const rates={home:340000,office:270000,store:390000};const multipliers={basic:.75,standard:1,premium:1.45};
 bind('calculate',()=>{const area=Number(val('area'));if(!Number.isFinite(area)||area<5||area>500){say('면적은 5~500㎡ 범위로 입력해 주세요.');exportText='';return;}const total=Math.round((rates[val('space')]*area*multipliers[val('finish')]+Number(val('removal')))/10000)*10000;exportText='[가상 시공비 계산 결과]\n공간: '+document.querySelector('#space option:checked').textContent+'\n면적: '+area+'㎡\n마감: '+document.querySelector('#finish option:checked').textContent+'\n예시 금액: '+money(total)+'\n* 가상의 단가로 계산한 UX 시연입니다. 실제 견적·계약가·시공 가능 여부가 아닙니다.';say(exportText);});say('공간 유형, 면적과 마감 수준을 입력해 예상 비용 흐름을 시연합니다.');
}else if(mode==='staybooking'){
 const today=new Date();const local=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const toDate=s=>new Date(s+'T12:00:00');document.getElementById('checkin').value=local(today);const tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+1);document.getElementById('checkout').value=local(tomorrow);document.getElementById('checkin').min=local(today);document.getElementById('checkout').min=local(tomorrow);
 const base={standard:120000,garden:190000,villa:290000};const cap={standard:2,garden:4,villa:6};
 bind('calculate',()=>{const inn=val('checkin'),out=val('checkout'),guests=safeInt('guests',1,10,0);const nights=Math.round((toDate(out)-toDate(inn))/86400000);if(!inn||!out||!Number.isFinite(nights)||nights<1||nights>30||!guests||guests>cap[val('room')]){say('정상적인 입·퇴실 날짜(1~30박)와 객실 정원 이내 인원을 선택해 주세요.');exportText='';return;}const total=nights*base[val('room')];exportText='[가상 객실 검색 결과]\n객실: '+document.querySelector('#room option:checked').textContent+'\n입실: '+inn+' / 퇴실: '+out+'\n인원: '+guests+'명, '+nights+'박\n총 요금 예시: '+money(total)+'\n* 실제 객실 재고·예약·결제와 연결되지 않습니다.';say(exportText);});say('객실을 선택해 숙박일수와 요금 계산을 시연합니다. 실시간 예약 가능 여부는 확인하지 않습니다.');
}else if(mode==='memberboard'){
 let filter='전체';let query='';let records=[{kind:'공지',title:'정기총회 개최 안내'},{kind:'자료실',title:'연간 활동보고서(샘플)'},{kind:'행사',title:'하반기 회원 교육 세미나'},{kind:'공지',title:'회원 정보 변경 안내'}];const list=document.getElementById('board');
 const visible=()=>records.filter(r=>(filter==='전체'||r.kind===filter)&&r.title.toLocaleLowerCase('ko').includes(query));
 function render(){list.replaceChildren();const resultSet=visible();for(const r of resultSet){const line=document.createElement('div');line.className='list-item';const t=document.createElement('span');t.textContent='['+r.kind+'] '+r.title;const b=document.createElement('button');b.textContent='삭제';b.type='button';b.setAttribute('aria-label',r.title+' 삭제');b.addEventListener('click',()=>{records=records.filter(v=>v!==r);render();});line.append(t,b);list.append(line);}say(resultSet.length+'건 표시 · 이 목록은 브라우저 안에서만 존재하며 서버에 저장되지 않습니다.');}
 document.getElementById('query').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('ko');render();});document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.kind;document.querySelectorAll('[data-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();}));
 bind('add',()=>{const t=val('newtitle').trim().slice(0,70);if(!t){say('제목을 입력해 주세요.');return;}records.unshift({kind:val('newkind'),title:t});document.getElementById('newtitle').value='';render();});
 bind('download',()=>{const fields=[['분류','제목'],...visible().map(x=>[x.kind,x.title])];const csv=fields.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download='allfileone-board-demo.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);});render();
}else if(mode==='multiclinic'){
 const schedules=[['중앙점','내과','월·수·금','09:00~17:00'],['서부점','내과','화·목','10:00~16:00'],['동부점','건강검진','월·목','09:00~12:00'],['중앙점','가정의학과','화·목','09:00~18:00'],['서부점','건강검진','월·수·금','08:30~12:00']];
 bind('calculate',()=>{const branch=val('branch'),dept=val('department'),wd=val('weekday'),query=val('query').trim().toLocaleLowerCase('ko');const matches=schedules.filter(r=>(branch==='all'||r[0]===branch)&&(dept==='all'||r[1]===dept)&&(wd==='all'||r[2].includes(wd))&&r.join(' ').toLocaleLowerCase('ko').includes(query));exportText='[가상 진료 일정 안내]\n'+(matches.map(r=>r.join(' · ')).join('\n')||'조건에 맞는 일정 없음')+'\n* 진료 시간은 예시이며 실제 의료기관 정보가 아닙니다.';say(exportText);});say('지점·진료과목·요일을 선택해 가상 진료 일정을 필터링하세요.');
}
})();
