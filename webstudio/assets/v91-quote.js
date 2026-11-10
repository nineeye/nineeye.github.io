/* WebStudio V91 first-party browser-only draft. No fetch, storage, POST or customer PII. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const keys=['manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event'];
 const sectors=['제조·도매','기업·회사','병원·의원','학원·교육','인테리어·시공','쇼핑몰·브랜드','법률·세무·회계','협회·단체','프랜차이즈','숙박·펜션','부동산·분양','행사·캠페인'];
 const styles={modern:'모던',premium:'프리미엄',editorial:'에디토리얼'};
 const plans={basic:'기본 소개형 (29만원~ 참고 예시)',business:'업종 맞춤형 (59만원~ 참고 예시)',advanced:'업무 기능형 (99만원~ 참고 예시)'};
 const labels={catalog:'제품·서비스 목록',estimate:'문의·견적서 준비',search:'사이트 내 검색',lang:'다국어 화면',reservation:'실제 예약 연동 (별도 구축)',payment:'실제 결제 연동 (별도 구축)',member:'회원·개인정보 관리 (별도 구축)',backend:'재고·CRM·외부 API (별도 구축)'};
 const schedule={pending:'협의 필요',lt1:'1개월 이내 검토',m2:'약 2개월 검토',m3:'3개월 이상 검토'};
 const vat={pending:'협의 필요',included:'부가세 포함 여부 협의안',excluded:'부가세 별도 여부 협의안'};
 const payment={pending:'협의 필요',milestone:'착수·중간·납품 단계별 협의',delivery:'납품 기준 협의'};
 const revisions={pending:'협의 필요',one:'1회 검토안',two:'2회 검토안',three:'3회 검토안'};
 const hosting={pending:'협의 필요',buyer:'고객 부담 검토',agency:'제작사 부담 검토',separate:'별도 산정 검토'};
 const rights={pending:'협의 필요',customer:'고객 인계 조건 협의',licensed:'사용권·라이선스 별도 협의'};
 const maintenance={pending:'협의 필요',separate:'별도 계약 검토',included:'포함 범위·기간 별도 협의'};
 const fields=['v91-industry','v91-style','v91-plan','v91-pages','v91-schedule','v91-cost','v91-vat','v91-payment','v91-revisions','v91-hosting','v91-rights','v91-maintenance','v91-notes'];
 const featureInputs=[...document.querySelectorAll('#v91-features input')];
 const query=new URLSearchParams(location.search);
 const defaultValue={industry:keys.includes(query.get('industry'))?query.get('industry'):'manufacturing',style:Object.hasOwn(styles,query.get('style'))?query.get('style'):'modern',plan:Object.hasOwn(plans,query.get('plan'))?query.get('plan'):'business'};
 $('v91-industry').value=defaultValue.industry;$('v91-style').value=defaultValue.style;$('v91-plan').value=defaultValue.plan;
 let report='';
 const money=n=>new Intl.NumberFormat('ko-KR').format(n)+'원 (협의 초안 · 확정가 아님)';
 const cleanNotes=s=>s.replace(/\r/g,' ').replace(/\u0000/g,'').slice(0,550);
 const selection=()=>{
   const sector=$('v91-industry').value,style=$('v91-style').value,plan=$('v91-plan').value;
   const rawPages=$('v91-pages').value,rawCost=$('v91-cost').value;
   const numPages=rawPages!==''?Number(rawPages):null;
   const numCost=rawCost!==''?Number(rawCost):null;
   const pages=numPages!==null&&Number.isInteger(numPages)&&numPages>=1&&numPages<=100?String(numPages)+'쪽':'협의 필요';
   const cost=numCost!==null&&Number.isFinite(numCost)&&numCost>=0&&numCost<=1e12?money(numCost):'협의 필요';
   return {sector,style,plan,pages,cost,features:featureInputs.filter(x=>x.checked).map(x=>x.value),
     schedule:schedule[$('v91-schedule').value],vat:vat[$('v91-vat').value],payment:payment[$('v91-payment').value],
     revisions:revisions[$('v91-revisions').value],hosting:hosting[$('v91-hosting').value],rights:rights[$('v91-rights').value],maintenance:maintenance[$('v91-maintenance').value],
     notes:cleanNotes($('v91-notes').value.trim())};
 };
 function compile(s){
   const name=sectors[keys.indexOf(s.sector)], fs=s.features.length?s.features.map(x=>labels[x]).join(', '):'선택하지 않음 (협의 필요)';
   const rows=[['업종',name],['디자인',styles[s.style]],['상품',plans[s.plan]],['제작 페이지 수',s.pages],['희망 기능',fs],
    ['제작 기간',s.schedule],['제작 협의금액',s.cost],['VAT 표기',s.vat],['지급 시점',s.payment],['수정 회차',s.revisions],
    ['도메인·호스팅 비용',s.hosting],['소스·관리 계정 인계',s.rights],['유지보수·하자 보수',s.maintenance],['추가 확인 사항',s.notes||'협의 필요']];
   const ready=[s.pages!=='협의 필요',s.features.length>0,s.schedule!=='협의 필요',s.cost!=='협의 필요',s.vat!=='협의 필요',s.payment!=='협의 필요',s.revisions!=='협의 필요',s.hosting!=='협의 필요',s.rights!=='협의 필요',s.maintenance!=='협의 필요'].filter(Boolean).length;
   const text=['올파일원 웹스튜디오 V91 제작 범위·비용 협의 준비서','상태: 합의 전 초안 / 확정 견적·계약서 아님','',...rows.map(([k,v])=>k+': '+v),
    '','[필수 확인]','시안에 등장하는 브랜드·리뷰·상품·기능은 가상 데이터입니다. 실운영 기능은 추가 개발·검증이 필요합니다.',
    '29/59/99만원은 참고 시작가이며, 선택 기능은 어떤 상품 금액에도 자동 포함되지 않습니다.',
    'VAT·총액·일정·수정·소스 권리·도메인·호스팅·하자 보수는 서면 계약으로 확정합니다.',
    '이 문서는 브라우저에서만 생성됐으며 서버 저장·자동 이메일 발송·결제·서명 기능은 없습니다.',
    '요청서는 직접 발송하고 실제 수신·회신을 확인해야 합니다.',''];
   return {rows,ready,text:text.join('\n'),name,fs};
 }
 function show(){
   const s=selection(),c=compile(s);report=c.text;
   $('v91-sector-label').textContent=c.name;
   $('v91-ready').textContent=String(c.ready);
   const root=$('v91-summary');root.replaceChildren();const dl=document.createElement('dl');
   for(const [k,v] of c.rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;if(v==='협의 필요'||v.startsWith('선택하지 않음'))dd.className='pending';dl.append(dt,dd)}root.append(dl);
   $('v91-demo').href='./experience-v85.html?'+new URLSearchParams({industry:s.sector,style:s.style});
   const body=['올파일원 웹스튜디오 홈페이지 제작 범위 상담','업종: '+c.name,'디자인: '+styles[s.style],'상품: '+plans[s.plan],
     '희망 기능: '+c.fs.slice(0,330),'','이 내용은 협의 초안이며 확정 견적·계약서가 아닙니다.',
     '전체 내용을 TXT 첨부하거나 메일 본문에 붙여 넣겠습니다.','메일 앱에서 직접 보내기 버튼을 눌러야 접수됩니다.'].join('\n');
   $('v91-mail').href='mailto:nineeyes@naver.com?subject='+encodeURIComponent('홈페이지 제작 범위 상담 · '+c.name)+'&body='+encodeURIComponent(body);
   // Share only non-sensitive controlled enumerations. Never store notes, amount or client data in the URL.
   if(location.protocol==='http:'||location.protocol==='https:'){
     const u=new URL(location.href);['industry','style','plan'].forEach(k=>u.searchParams.set(k,s[k]));
     for(const k of [...u.searchParams.keys()])if(!['industry','style','plan'].includes(k))u.searchParams.delete(k);
     history.replaceState(null,'',u.href);
   }
 }
 fields.forEach(id=>$(id).addEventListener(id.includes('notes')||id.includes('cost')||id.includes('pages')?'input':'change',show));
 featureInputs.forEach(x=>x.addEventListener('change',show));
 $('v91-save').addEventListener('click',()=>{const b=new Blob(['\ufeff'+report.replace(/\n/g,'\r\n')],{type:'text/plain;charset=utf-8'});const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='AllFileOne_V91_scope_draft_'+$('v91-industry').value+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);$('v91-feedback').textContent='협의 초안 TXT를 저장했습니다. 메일은 발송되지 않았습니다.'});
 $('v91-copy').addEventListener('click',async()=>{try{if(!navigator.clipboard?.writeText)throw Error('clipboard');await navigator.clipboard.writeText(report);$('v91-fallback').hidden=true;$('v91-feedback').textContent='초안을 복사했습니다. 직접 상담 메일에 붙여넣어야 전달됩니다.'}catch(_){$('v91-fallback').hidden=false;$('v91-fallback-text').value=report;$('v91-fallback-text').focus();$('v91-fallback-text').select();$('v91-feedback').textContent='복사 권한이 차단됐습니다. 선택된 텍스트를 직접 복사하세요.'}});
 $('v91-print').addEventListener('click',()=>window.print());
 $('v91-reset').addEventListener('click',()=>{for(const id of fields){if(id==='v91-industry')$(id).value='manufacturing';else if(id==='v91-style')$(id).value='modern';else if(id==='v91-plan')$(id).value='business';else if(['v91-pages','v91-cost','v91-notes'].includes(id))$(id).value='';else $(id).value='pending'}featureInputs.forEach(x=>x.checked=false);$('v91-fallback').hidden=true;show();$('v91-feedback').textContent='모든 입력을 기본 상태로 초기화했습니다.'});
 $('v91-mail').addEventListener('click',()=>{$('v91-feedback').textContent='메일 앱에서 직접 전송하고, 실제 수신·회신을 별도로 확인하세요.'});
 show();window.AFO_V91_QUOTE_READY='V91-20261110';window.AFO_V91_DRAFT=()=>report;
})();
