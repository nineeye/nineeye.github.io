/* V70 - Buyer conversion from the actual 12-sector, 3-style comparison page.
 * Requirement source of truth: V65.2. Handoff contract: V65.3 one-time, 15min,
 * same-tab sessionStorage, no PII, no API, no auto email or real order.
 */
(()=>{'use strict';
const REQUIREMENTS=window.AFO_V652_REQUIREMENTS||{};
const STYLES=Object.freeze({modern:'모던',premium:'프리미엄',editorial:'에디토리얼'});
const WHEN=Object.freeze({soon:'1개월 내 협의',quarter:'1~3개월 검토',unknown:'미정·협의'});
const CONTAINER=document.getElementById('v70-buyer');
if(!CONTAINER)return;
const $=id=>document.getElementById(id);
const roots={options:$('v70-requirements'),scale:$('v70-scale'),when:$('v70-when'),label:$('v70-current-selection'),summary:$('v70-summary'),count:$('v70-count'),next:$('v70-to-plan'),save:$('v70-save'),manual:$('v70-manual'),feedback:$('v70-feedback')};
if(Object.values(roots).some(v=>!v))return;
const allowSector=id=>Object.prototype.hasOwnProperty.call(REQUIREMENTS,id)&&Array.isArray(REQUIREMENTS[id].items)&&REQUIREMENTS[id].items.length===4;
const drafts=new Map();
let industry='',style='',selected=new Set([0]);
const defaults=()=>({ids:[0],scale:0,when:'unknown'});
function snapshot(){if(industry)drafts.set(industry,{ids:[...selected],scale:Number(roots.scale.value),when:roots.when.value});}
function refreshSummary(){
 const d=REQUIREMENTS[industry];if(!d)return;
 const ids=[...selected].sort((a,b)=>a-b);
 const size=d.scope[Number(roots.scale.value)]||d.scope[0];
 const lines=[d.name+' / '+STYLES[style],size+' / '+WHEN[roots.when.value],...ids.map(i=>'✓ '+d.items[i][0])];
 roots.label.textContent=d.name+' · '+STYLES[style];roots.summary.textContent=lines.join('\n');
 roots.count.textContent=ids.length+'/4';
 roots.next.disabled=ids.length===0;
 roots.feedback.textContent=ids.length?'선택하신 기능은 다음 화면의 제작 범위·예시 비용 확인으로 전달됩니다.':'제작할 기능을 1개 이상 선택해 주세요.';
 roots.manual.href='./plan-guide.html?industry='+encodeURIComponent(industry)+'&theme='+encodeURIComponent(style)+'#planner';
}
function draw(){
 const d=REQUIREMENTS[industry];if(!d)return;
 const keep=drafts.get(industry)||defaults();
 selected=new Set(keep.ids.filter(i=>Number.isInteger(i)&&i>=0&&i<4));
 roots.scale.replaceChildren();d.scope.forEach((name,i)=>{
  const option=document.createElement('option');option.value=String(i);option.textContent=name;roots.scale.append(option);
 });
 roots.scale.value=String(keep.scale);
 roots.when.value=keep.when;
 roots.options.replaceChildren();
 d.items.forEach((entry,i)=>{
  const label=document.createElement('label');label.className='v70-option'+(entry[2]==='연동'?' is-integration':'');
  const input=document.createElement('input');input.type='checkbox';input.value=String(i);input.checked=selected.has(i);input.dataset.v70Requirement=String(i);
  input.addEventListener('change',()=>{input.checked?selected.add(i):selected.delete(i);snapshot();refreshSummary();});
  const copy=document.createElement('span');copy.className='v70-option-copy';
  const title=document.createElement('strong');title.textContent=entry[0];
  const desc=document.createElement('small');desc.textContent=entry[1];
  const flag=document.createElement('em');flag.textContent=entry[2]==='연동'?'실제 운영 연결은 별도 협의':'브라우저 시연으로 미리 확인';
  copy.append(title,desc,flag);label.append(input,copy);roots.options.append(label);
 });
 refreshSummary();
}
function sync(){
 const q=new URLSearchParams(location.search);const nextIndustry=q.get('industry');const nextStyle=q.get('style');
 if(!allowSector(nextIndustry)||!Object.prototype.hasOwnProperty.call(STYLES,nextStyle))return;
 if(industry===nextIndustry&&style===nextStyle)return;
 if(industry&&industry!==nextIndustry)snapshot();
 const changed=industry!==nextIndustry;industry=nextIndustry;style=nextStyle;
 if(changed)draw();else refreshSummary();
}
roots.scale.addEventListener('change',()=>{snapshot();refreshSummary()});
roots.when.addEventListener('change',()=>{snapshot();refreshSummary()});
window.addEventListener('afo:v70-selection',sync);
window.addEventListener('popstate',()=>queueMicrotask(sync));
function textLines(){
 const d=REQUIREMENTS[industry];const ids=[...selected].sort((a,b)=>a-b);
 return ['올파일원 웹스튜디오 제작 상담 준비용 (자동 접수되지 않음)','업종: '+d.name,'디자인: '+STYLES[style],
  '자료·운영 규모: '+d.scope[Number(roots.scale.value)],'희망 제작 시기: '+WHEN[roots.when.value],'',
  '요청 기능:',...ids.map(i=>String(i+1)+'. '+d.items[i][0]+' / '+d.items[i][2]+' / '+d.items[i][1]),'',
  '가상 시연과 실제 운영 서비스는 다릅니다. 실제 고객 데이터 저장·예약·결제·관리자 기능은 별도 협의가 필요합니다.',
  '견적·계약은 제공 범위 및 외부 서비스 요금 확인 후 별도로 확정합니다.'].join('\r\n');
}
roots.save.addEventListener('click',()=>{
 if(!selected.size){roots.feedback.textContent='저장할 기능을 1개 이상 선택해 주세요.';return;}
 const blob=new Blob(['\ufeff',textLines()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='AFO_V70_'+industry+'_'+style+'_buyer_brief.txt';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 roots.feedback.textContent='TXT 다운로드를 요청했습니다. 실제 상담 접수나 메일 전송은 아닙니다.';
});
roots.next.addEventListener('click',()=>{
 if(!selected.size||!allowSector(industry))return;
 const ids=[...selected].sort((a,b)=>a-b);
 const payload={v:653,ts:Date.now(),industry,style,ids,scale:Number(roots.scale.value),when:roots.when.value};
 if(ids.length<1||ids.length>4||!ids.every(i=>Number.isInteger(i)&&i>=0&&i<4)||
    ![0,1,2].includes(payload.scale)||!Object.prototype.hasOwnProperty.call(WHEN,payload.when))return;
 try{sessionStorage.setItem('afo.webstudio.v653.offer',JSON.stringify(payload));}
 catch(_){roots.feedback.textContent='브라우저 임시저장이 차단됐습니다. TXT를 저장한 후 아래 「기능 없이 가격부터 보기」에서 직접 선택해 주세요.';return;}
 const url=new URL('./plan-guide.html',location.href);
 url.searchParams.set('source','demo-v653');url.searchParams.set('industry',industry);url.searchParams.set('theme',style);url.hash='v653-buyer';
 location.assign(url.href);
});
// First-page initialization: V67 initializes before this file due to defer ordering.
sync();
window.AFO_V70_BUYER_READY=true;
})();