/* AllFileOne WebStudio V65.3: fictional-demo requirement -> transparent example-price
   -> contract-preflight -> owner-initiated consultation.
   First party original source. No external libraries, network, cookies, PII or mail sending. */
(()=>{
'use strict';
const OFFER_KEY='afo.webstudio.v653.offer', CONTACT_KEY='afo.webstudio.v653.contact';
const TTL=15*60*1000;
const CATALOG=window.AFO_V652_REQUIREMENTS||{};
const MODEL=window.WEBSTUDIO_ESTIMATE_MODEL;
const THEMES=Object.freeze({modern:'모던',premium:'프리미엄',editorial:'에디토리얼'});
const WHEN=Object.freeze({soon:'1개월 내 협의',quarter:'1~3개월 검토',unknown:'미정·협의'});
const TERMS=Object.freeze([
 ['materials','원고·사진·상표 및 사용 권리','콘텐츠 원본·촬영 동의·로고 사용권'],
 ['pages','페이지 수와 메뉴 구성','실제 납품 페이지 개수와 모바일 범위'],
 ['revision','디자인 수정·반영 횟수','1차 시안, 수정 회차 및 추가 작업 단가'],
 ['ownership','도메인·호스팅·계정 명의','고객 명의 계정과 접근 권한 인계'],
 ['source','소스 코드·라이선스·인계 문서','저작권·제3자 자료·인도 방식'],
 ['privacy','개인정보·관리자·보안 책임','서버 저장·접근권한·보존·삭제 정책'],
 ['operations','외부 결제·예약·호스팅 비용','월간 서비스 요금, 정산 수수료, 운영자 지정'],
 ['acceptance','일정·실제 검수·유지보수','테스트 기준, 납품 승인, 오류 보수 기간']
]);
const STATUSES=Object.freeze({unknown:'미정 · 상담 필요',ready:'자료 준비',discuss:'별도 협의'});
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const timeOk=t=>Number.isSafeInteger(t)&&t<=Date.now()+60000&&Date.now()-t>=0&&Date.now()-t<=TTL;
const safe=v=>String(v==null?'':v).replace(/[\u0000-\u001f\u007f]/g,' ').trim();
const canIndex=(o,n)=>Number.isInteger(n)&&n>=0&&n<o;
function validReq(req){
 return req && has(CATALOG,req.industry) && has(THEMES,req.style) &&
  Array.isArray(req.ids)&&req.ids.length>=1&&req.ids.length<=4&&
  req.ids.every(i=>canIndex(4,i))&&new Set(req.ids).size===req.ids.length&&
  canIndex(3,req.scale)&&has(WHEN,req.when);
}
function readOnce(key){
 let raw=null;
 try{raw=sessionStorage.getItem(key);sessionStorage.removeItem(key);}catch(_){return null;}
 if(!raw||raw.length>1800)return null;
 try{return JSON.parse(raw);}catch(_){return null;}
}
function control(text,fn,cls){
 const n=document.createElement('button');n.type='button';n.textContent=text;n.className=cls||'';n.addEventListener('click',fn);return n;
}
function create(tag,cls,txt){
 const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;
}
function importedLines(req){
 if(!validReq(req))return [];
 const d=CATALOG[req.industry];
 return ['예제사이트 선택 업종: '+d.name,
    '선호 디자인: '+THEMES[req.style],
    '자료·운영 규모: '+d.scope[req.scale],
    '희망 제작 시기: '+WHEN[req.when],
    '선택한 업종별 요구사항:',
    ...req.ids.map(i=>' • '+d.items[i][0]+' ['+(d.items[i][2]==='연동'?'운영 시스템 연동 별도 협의':'가상 브라우저 시연 가능')+']')];
}
function packageLines(offer){
 if(!MODEL)return [];
 const q=MODEL.calculate(offer.plan,offer.addons);
 if(!q)return [];
 const money=n=>new Intl.NumberFormat('ko-KR').format(n)+'원';
 return ['제작 상품: '+MODEL.planLabels[q.plan],
   '예시 기본 제작비: '+money(MODEL.plans[q.plan]),
   '예시 가격표에 포함해 계산한 추가 선택: '+(q.addons.length?q.addons.map(k=>MODEL.addonLabels[k]+' (+'+money(MODEL.addons[k])+')').join(', '):'없음'),
   '예시 가격표 항목의 계산 합계: '+money(q.total),
   '※ 이 금액에 아래 업종별 요구 기능이 전부 포함된다는 뜻이 아닙니다.'];
}
function plan(){
 const form=document.getElementById('pg-form');
 if(!form||document.getElementById('v653-buyer'))return;
 const q=new URLSearchParams(location.search);
 let imported=null;
 if(q.get('source')==='demo-v653'){
   const raw=readOnce(OFFER_KEY);
   if(raw&&raw.v===653&&timeOk(raw.ts)&&validReq(raw)&&raw.industry===q.get('industry')&&raw.style===q.get('theme')){
     imported={industry:raw.industry,style:raw.style,ids:raw.ids,scale:raw.scale,when:raw.when};
     form.elements.namedItem('industry').value=raw.industry;
     form.elements.namedItem('theme').value=raw.style;
     form.dispatchEvent(new Event('change',{bubbles:true}));
   }
 }
 const section=create('section','v653-buyer');section.id='v653-buyer';
 section.setAttribute('aria-labelledby','v653-heading');
 const shell=create('div','v653-shell');
 const eyebrow=create('p','v653-eyebrow','BUYER JOURNEY / BEFORE A CONTRACT');
 const title=create('h2','', '예제 체험부터 제작 상담까지, 필요한 조건을 남겨두세요.');
 title.id='v653-heading';
 const intro=create('p','v653-lead','위 제작 상품은 예시 시작가입니다. 업종별 운영 기능이 포함된 확정 금액이 아닙니다. 실제 구현 범위·운영비·검수 조건을 구분해서 상담 요청서를 만들 수 있습니다.');
 shell.append(eyebrow,title,intro);
 const compare=create('div','v653-compare');compare.id='v653-requirements';
 const compareTitle=create('strong','v653-title',imported?'예제사이트에서 선택한 기능을 이어받았습니다':'업종별 기능을 확인하고 제작 상품을 골라보세요');
 const compareLead=create('p','',imported?'업종별 요구사항은 예시 금액에 자동으로 가산하지 않습니다. 실운영 연동은 반드시 별도 범위를 확정해야 합니다.':'36개 예제에서 먼저 기능을 선택하면 이곳에 업종·디자인·규모가 전달됩니다. 아래 상품 비교 계산기는 독립적으로도 사용할 수 있습니다.');
 const reqList=create('ul','v653-requirements-list');reqList.id='v653-requirements-list';
 if(imported){
   const d=CATALOG[imported.industry];
   imported.ids.forEach(i=>{
     const li=create('li','',d.items[i][0]+' — '+(d.items[i][2]==='연동'?'실제 운영 연동·개발비는 별도 협의':'가상 시연으로 체험 가능'));
     reqList.append(li);
   });
   const details=create('p','v653-metadata','선택: '+d.name+' · '+THEMES[imported.style]+' · '+d.scope[imported.scale]+' · '+WHEN[imported.when]);
   compare.append(compareTitle,compareLead,details,reqList);
 }else{
   const more=create('a','v653-textlink','36개 업종별 예제사이트에서 기능 선택하기 ↗');
   more.href='./design-gallery-v13.html';compare.append(compareTitle,compareLead,more);
   if(q.get('source')==='demo-v653'){
     const warning=create('p','v653-warning','이전 선택 내용을 확인할 수 없습니다. 같은 탭에서 15분 이내에 다시 이동하거나 현재 화면에서 직접 업종과 상품을 선택해 주세요.');
     compare.append(warning);
   }
 }
 const itemwrap=create('div','v653-checklist');const label=create('h3','', '계약 전에 확인할 8가지 실무 조건');
 const explanation=create('p','', '현재 상태를 선택해 보세요. 이 항목들이 자동으로 계약에 포함되거나 법률상 효력을 갖지는 않습니다.');
 const items=create('div','v653-items');items.id='v653-items';const selectors=[];
 TERMS.forEach(([key,name,detail],i)=>{
   const row=create('div','v653-item');
   const left=create('label','v653-label',name);const help=create('small','',detail);
   const id='v653-term-'+key;const select=create('select','v653-status');select.id=id;select.dataset.v653Term=key;
   left.htmlFor=id;
   Object.entries(STATUSES).forEach(([value,title])=>{const option=create('option','',title);option.value=value;select.append(option);});
   select.value='unknown';
   selectors.push(select);left.append(help);row.append(left,select);items.append(row);
 });
 const count=create('p','v653-count','8개 조건 모두 확인 전');count.id='v653-ready-count';
 itemwrap.append(label,explanation,items,count);
 const results=create('div','v653-results');
 const resultTitle=create('h3','', '제작 범위·예시 비용 정리');
 const resultIntro=create('p','', '기존 가격 계산기는 유지하며, 업종별 운영·외부 서비스 비용은 포함된 것으로 계산하지 않습니다.');
 const preview=create('pre','v653-output','');preview.id='v653-output';preview.tabIndex=0;preview.setAttribute('role','status');preview.setAttribute('aria-live','polite');
 const actions=create('div','v653-actions');
 const status=create('p','v653-feedback','');status.id='v653-feedback';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const legal=create('p','v653-disclaimer','이 문서는 제작 상담 전의 확인 자료입니다. 계약서·최종 견적·납품 확약·실제 이메일 접수를 대신하지 않습니다. 서버 저장·자동 발송·결제는 발생하지 않습니다.');
 function getQuote(){
   if(!MODEL)return null;
   const plan=form.elements.namedItem('plan')?.value;
   const extras=[...form.querySelectorAll('input[name="addon"]:checked')].map(e=>e.value);
   return MODEL.calculate(plan,extras);
 }
 function getOffer(){
   const industry=form.elements.namedItem('industry')?.value, theme=form.elements.namedItem('theme')?.value;
   const price=getQuote();
   if(!has(CATALOG,industry)&&!['restaurant','beauty','logistics'].includes(industry))return null;
   if(!has(THEMES,theme)||!price)return null;
   return {v:653,ts:Date.now(),industry,theme,plan:price.plan,addons:price.addons,
       req:imported&&imported.industry===industry&&imported.style===theme?imported:null,
       terms:selectors.map(x=>x.value)};
 }
 function reportText(){
   const offer=getOffer();
   if(!offer)return '업종과 제작 상품을 선택하면 계약 전 검토 초안이 완성됩니다.';
   const name=has(CATALOG,offer.industry)?CATALOG[offer.industry].name:form.elements.namedItem('industry')?.selectedOptions?.[0]?.textContent;
   const lines=['[올파일원 웹스튜디오 · 계약 전 제작 범위 협의 초안]','업종: '+safe(name),'선호 디자인: '+THEMES[offer.theme],
      ...packageLines(offer),''];
   if(offer.req){lines.push(...importedLines(offer.req),'');}
   lines.push('계약 전 확인 조건(고객이 고른 준비 상태):');
   selectors.forEach((s,i)=>lines.push(' • '+TERMS[i][1]+': '+STATUSES[s.value]));
   const separate=offer.req?offer.req.ids.filter(i=>CATALOG[offer.industry].items[i][2]==='연동').length:0;
   lines.push('','업종별 실운영 연동 별도 협의: '+separate+'건'+(separate?' (가격표 예시 합계에 포함되지 않음)':''));
   lines.push('별도 확인: 부가세·외부 API·도메인·호스팅·보안·운영/유지보수·실데이터 연동·실제 검수');
   lines.push('※ 최종 가격·작업 범위·페이지 수·계약 조건은 제작사와 서면으로 합의해야 합니다.');
   lines.push('※ 이 결과는 접수, 결제, 주문, 계약이 아닙니다. 고객이 직접 이메일을 보내야 문의가 전달됩니다.');
   return lines.join('\n');
 }
 function refresh(){
   const ready=selectors.filter(x=>x.value==='ready').length;
   count.textContent='확인 자료 준비 '+ready+'/'+TERMS.length+' · 나머지는 계약 전 협의 필요';
   preview.textContent=reportText();status.textContent='';
 }
 selectors.forEach(x=>x.addEventListener('change',refresh));
 form.addEventListener('input',refresh);
 form.addEventListener('change',refresh);
 form.addEventListener('reset',()=>{imported=null;setTimeout(()=>{selectors.forEach(x=>x.value='unknown');reqList.replaceChildren();compareTitle.textContent='상품을 다시 선택해 주세요';compareLead.textContent='이전 예제 선택 연결을 초기화했습니다. 상세한 기능은 예제에서 다시 선택할 수 있습니다.';refresh();},0);});
 const copy=control('준비서 전체 복사',async()=>{
   const offer=getOffer();
   if(!offer){status.textContent='먼저 업종과 상품을 선택해 주세요.';return;}
   try{if(typeof navigator.clipboard?.writeText!=='function')throw Error('clipboard');await navigator.clipboard.writeText(reportText());status.textContent='준비서를 복사했습니다. 상담은 아직 접수되지 않았습니다.';}
   catch(_){status.textContent='자동 복사 불가: 위 문안을 선택하거나 TXT 저장을 이용해 주세요.';preview.focus();}
 },'v653-outline');
 const save=control('준비서 TXT 저장',()=>{
   const offer=getOffer();
   if(!offer){status.textContent='먼저 업종과 상품을 선택해 주세요.';return;}
   const blob=new Blob(['\ufeff',reportText()],{type:'text/plain;charset=utf-8'});
   const url=URL.createObjectURL(blob),a=create('a');
   a.download='AllFileOne_Buyer_PreContract_V65_3.txt';a.href=url;document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),4000);status.textContent='TXT 저장을 요청했습니다. 실제 접수는 아닙니다.';
 },'v653-outline');
 const contact=control('이 조건으로 실제 제작 상담 준비서 열기 ↗',()=>{
   const offer=getOffer();
   if(!offer){status.textContent='먼저 업종과 제작 상품을 선택해 주세요.';return;}
   try{sessionStorage.setItem(CONTACT_KEY,JSON.stringify(offer));}
   catch(_){status.textContent='브라우저 임시 저장이 차단되었습니다. 위 TXT 파일을 저장해 이메일에 직접 첨부해 주세요.';return;}
   const query=new URLSearchParams({source:'planv653',industry:offer.industry,theme:offer.theme});
   location.assign('./contact.html?'+query.toString()+'#brief');
 },'v653-primary');
 actions.append(copy,save,contact);results.append(resultTitle,resultIntro,preview,actions,status,legal);
 shell.append(compare,itemwrap,results);section.append(shell);
 const planner=document.getElementById('planner');planner.before(section);
 document.body.dataset.v653PlanReady='true';refresh();
 if(location.hash==='#v653-buyer')requestAnimationFrame(()=>section.scrollIntoView({block:'start',behavior:'auto'}));
}
function contact(){
 const form=document.getElementById('brief-form');
 if(!form||document.getElementById('v653-import'))return;
 const q=new URLSearchParams(location.search);
 if(q.get('source')!=='planv653')return;
 const r=readOnce(CONTACT_KEY);
 if(!r||r.v!==653||!timeOk(r.ts)||!has(CATALOG,r.industry) && !['restaurant','beauty','logistics'].includes(r.industry) ||
    !has(THEMES,r.theme)||r.industry!==q.get('industry')||r.theme!==q.get('theme')||
    !MODEL||!MODEL.calculate(r.plan,r.addons)||
    !Array.isArray(r.terms)||r.terms.length!==TERMS.length||!r.terms.every(x=>has(STATUSES,x))||
    !(r.req===null||(validReq(r.req)&&r.req.industry===r.industry&&r.req.style===r.theme)))return;
 const industry=form.elements.namedItem('industry'),theme=form.elements.namedItem('theme'),details=form.elements.namedItem('details');
 if(!industry||!details)return;
 industry.value=r.industry;if(theme)theme.value=r.theme;
 const source=r.req?importedLines(r.req):[];
 const lines=['[제작 상품·계약 전 확인표에서 이어쓰기]','업종: '+(has(CATALOG,r.industry)?CATALOG[r.industry].name:r.industry),'디자인: '+THEMES[r.theme],
   ...packageLines(r),'',...source,'','계약 전 8개 확인 조건:',
   ...TERMS.map((term,i)=>'• '+term[1]+' — '+STATUSES[r.terms[i]]),
   '※ 실제 계약·결제·예약 접수가 아닙니다. 이메일은 직접 보내야 합니다.'];
 const full=lines.join('\n');
 const max=details.maxLength>0?details.maxLength:700;
 const old=safe(details.value);
 const merged=(old?old+'\n\n':'')+full;
 details.value=merged.length<=max?merged:merged.slice(0,Math.max(0,max-35))+'\n[전체 내용은 위에서 복사해 발송]';
 const panel=create('aside','v653-import');panel.id='v653-import';panel.setAttribute('aria-label','제작 상품과 계약 전 확인 사항');
 const title=create('strong','', '상품 비교·계약 준비서의 선택 내용을 가져왔습니다');
 const info=create('p','', '가상 예시 계산을 상담서에 이어받았습니다. 실제 기능 개발·외부 비용·보수 범위를 서면으로 다시 확인해 주세요. 아직 메일이 발송되지 않았습니다.');
 const pre=create('pre','v653-import-pre',full);pre.id='v653-full-brief';pre.tabIndex=0;
 const status=create('p','v653-feedback');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const copy=control('전체 상담 준비서 복사',async()=>{
   try{if(!navigator.clipboard?.writeText)throw Error('blocked');await navigator.clipboard.writeText(full);status.textContent='내용을 복사했습니다. 이메일에서 직접 발송해 주세요.';}
   catch(_){status.textContent='복사가 차단됐습니다. 위 내용을 직접 선택하거나 TXT 저장을 이용해 주세요.';}
 },'v653-primary');
 panel.append(title,info,pre,copy,status);
 if(merged.length>max)panel.append(create('p','v653-warning','상담서 입력 글자 수로 인해 일부 요약되었습니다. 위의 전체 내용을 복사하여 메일에 붙여넣으세요.'));
 (document.querySelector('#brief .workspace')||form).before(panel);
 form.dispatchEvent(new Event('input',{bubbles:true}));
 document.body.dataset.v653Imported='true';
}
function init(){plan();contact();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.AFO_V653_TERMS_COUNT=TERMS.length;
})();
