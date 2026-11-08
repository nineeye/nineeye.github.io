/* AllFileOne WebStudio V60 — six-sector acceptance / delivery scope briefing.
   Original, standard-browser code. No network, tracking, accounts, payments or localStorage.
   All entries are review DRAFTS, never contract promises. */
(() => {
 'use strict';
 const KEY='afo.webstudio.v60.scope',VERSION=60,TTL=15*60*1000;
 const DATA=Object.freeze({
  manufacturing:{label:'제조·도매',path:'for-manufacturing.html',items:[['catalog','제품군·규격별 탐색'],['rfq','품목·수량 견적 요청'],['files','도면·카탈로그 배포 범위'],['moq','MOQ·납기 정보 고지'],['rights','제조사·고객 도면 권리'],['updates','상품 데이터 갱신 책임'],['testing','규격 필터·첨부파일 테스트']]},
  academy:{label:'학원·교육',path:'for-academy.html',items:[['courses','과정·수강 대상 구분'],['calendar','반별 시간표·휴강 안내'],['consult','상담 신청 연결'],['fees','수강료·환불 고지'],['privacy','학생·학부모 정보 최소 수집'],['updates','학사 일정 갱신 담당'],['testing','모바일 시간표·상담 흐름 테스트']]},
  interior:{label:'인테리어·시공',path:'for-interior.html',items:[['portfolio','시공 사례·공간별 필터'],['comparison','시공 전후 이미지 비교'],['brief','지역·면적 견적 준비서'],['rights','현장·인물·사진 공개 허락'],['process','공정·상담 단계 안내'],['updates','시공 사례 추가 담당'],['testing','모바일 갤러리·견적 동선 테스트']]},
  restaurant:{label:'음식점·카페',path:'for-restaurant.html',items:[['menu','메뉴·가격·옵션 표시'],['hours','영업·브레이크타임·휴무'],['visit','지도·주차·방문 문의'],['group','단체 방문·행사 문의'],['allergen','원산지·알레르기 고지 검토'],['updates','메뉴 변경·품절 갱신 주체'],['testing','모바일 메뉴·문의 흐름 테스트']]},
  beauty:{label:'뷰티·미용',path:'for-beauty.html',items:[['services','시술 메뉴·참고 가격'],['duration','소요시간·주의사항'],['gallery','스타일 사례·사진 동의'],['booking','외부 예약 링크·운영 주체'],['policy','변경·취소 규정 고지'],['updates','담당 디자이너·가격 갱신'],['testing','시술 선택·모바일 상담 동선 테스트']]},
  logistics:{label:'물류·운송',path:'for-logistics.html',items:[['services','운송 권역·취급 서비스'],['dimensions','규격·실중량·부피무게 기준'],['rfq','월 물량·상품 정보 견적 문의'],['dispatch','출고·반품·파손 절차'],['tracking','실제 배송 조회 연동 여부'],['rights','고객사 로고·사례 공개 권한'],['testing','규격 계산·CSV 저장 테스트']]}
 });
 const STATUSES=Object.freeze({review:'검토 필요',request:'포함 요청',separate:'별도 협의',exclude:'이번 범위 제외'});
 const TERMS=Object.freeze({
  type:{label:'제작 유형',choices:{undecided:'협의 전',basic:'소개 중심',industry:'업종 맞춤',workflow:'업무 기능 검토'}},
  pages:{label:'페이지 수',choices:{undecided:'미정',small:'1~5쪽 검토',medium:'6~15쪽 검토',large:'16쪽 이상 협의'}},
  revision:{label:'시안 수정 횟수',choices:{undecided:'미정·계약 때 확정',one:'1회 검토',two:'2회 검토',other:'별도 협의'}},
  domain:{label:'도메인·호스팅 명의',choices:{undecided:'미정·협의',customer:'고객 명의 우선',studio:'제작사 관리 방식 검토'}},
  delivery:{label:'납품물 형태',choices:{undecided:'미정·협의',source:'소스 코드 포함 협의',deploy:'배포본·접근권한 인계 협의',both:'소스·배포·인수 문서 협의'}},
  maintenance:{label:'오픈 후 관리',choices:{undecided:'미정·협의',self:'고객 직접 관리 검토',studio:'제작사 유지보수 별도 협의',hybrid:'역할 분리 협의'}},
  extra:{label:'별도 비용·연동',choices:{undecided:'서비스별 비용 확인 전',noapi:'외부 유료 기능 없이 검토',integration:'유료 서비스·연동 별도 견적'}},
  privacy:{label:'개인정보 처리',choices:{undecided:'별도 검토 필요',noform:'정보 수집 없이 안내·메일 연결',backend:'저장·접수 기능 별도 심사·설계'}}
 });
 const $=id=>document.getElementById(id);
 const form=$('v60-form'), sectors=$('v60-sectors'), options=$('v60-features'), terms=$('v60-terms'), preview=$('v60-preview'), status=$('v60-status');
 if(!form||!sectors||!options||!terms||!preview||!status)return;
 const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k), sanitize=(x,n)=>String(x??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
 const state={industry:'manufacturing',choices:Object.fromEntries(Object.keys(DATA).map(id=>[id,Object.fromEntries(DATA[id].items.map(([key])=>[key,'review']))]))};
 const query=new URLSearchParams(location.search).get('industry');if(has(DATA,query))state.industry=query;
 function node(tag,text,attrs={}){const el=document.createElement(tag);if(text!==null)el.textContent=text;for(const [k,v] of Object.entries(attrs)){if(k==='class')el.className=v;else el.setAttribute(k,v)}return el}
 function drawSectors(){sectors.replaceChildren();for(const [id,data] of Object.entries(DATA)){
  const b=node('button',data.label,{'type':'button','aria-pressed':String(state.industry===id),'data-industry':id});
  b.addEventListener('click',()=>{state.industry=id;render();msg('업종별 선택 내용을 화면 안에서만 유지합니다. 다른 업종의 선택과 섞지 않습니다.')});sectors.append(b);
 }}
 function drawFeatures(){options.replaceChildren();const d=DATA[state.industry];$('v60-industry-name').textContent=d.label;
  $('v60-sales-link').href='./'+d.path;
  for(const [id,label] of d.items){const row=node('div',null,{class:'v60-feature'});row.append(node('div',null,{class:'v60-feature-name'}));row.firstChild.append(node('strong',label),node('small','계약 전 검토 항목'));
   const wrap=node('label',null);wrap.append(node('span','선택 상태'));const sel=node('select',null,{'aria-label':label+' 선택 상태','data-feature':id});
   for(const [key,value] of Object.entries(STATUSES)){const opt=node('option',value);opt.value=key;sel.append(opt)}sel.value=state.choices[state.industry][id];
   sel.addEventListener('change',()=>{if(has(STATUSES,sel.value)){state.choices[state.industry][id]=sel.value;renderPreview()}});wrap.append(sel);row.append(wrap);options.append(row);
  }
 }
 function drawTerms(){terms.replaceChildren();for(const [id,term] of Object.entries(TERMS)){
  const label=node('label',null,{class:'v60-term'});label.append(node('span',term.label));const sel=node('select',null,{'name':id,'aria-label':term.label});
  for(const [key,value] of Object.entries(term.choices)){const option=node('option',value);option.value=key;sel.append(option)}sel.value='undecided';sel.addEventListener('change',renderPreview);label.append(sel);terms.append(label);
 }}
 function current(){const d=DATA[state.industry],rows=d.items.map(([id,label])=>({id,label,status:state.choices[state.industry][id]}));const selectedTerms={};
  for(const [id,v] of Object.entries(TERMS)){const e=form.elements.namedItem(id),value=e?.value;selectedTerms[id]=has(v.choices,value)?value:'undecided';}
  return {v:VERSION,ts:Date.now(),industry:state.industry,rows:rows.map(x=>[x.id,x.status]),terms:selectedTerms};
 }
 function lines(){const c=current(),d=DATA[c.industry];const result=[
  '올파일원 웹스튜디오 | 업종별 납품 범위 협의서 (V60 · 초안)',
  '업종: '+d.label,
  '작성 구분: 고객 요구 정리용 초안. 계약·견적·납기·기능 보증 아님.',
  '', '■ 업종별 기능 요청 및 제외 범위'];
  for(const [key,title] of d.items)result.push('- '+title+': '+STATUSES[state.choices[state.industry][key]]);
  result.push('','■ 제작·납품·운영 협의 기준');
  for(const [id,term] of Object.entries(TERMS))result.push('- '+term.label+': '+term.choices[c.terms[id]]);
  result.push('','■ 실제 계약 전 반드시 확정할 사항',
  '1. 전체 페이지/기능별 포함·제외 범위와 테스트 가능한 인수 조건',
  '2. 최종 견적·부가세·외부 서비스/API/도메인/호스팅 비용과 결제 주체',
  '3. 초안·수정 횟수·고객 자료 제공 일정·변경 요청 처리 기준',
  '4. 최종 산출물·소스/계정·도메인 소유권 및 인계 방법',
  '5. 접근성·반응형·링크·폼·데이터 저장·보안 테스트 책임',
  '6. 고객 제공 사진·로고·도면·개인정보의 권리·동의 검토',
  '7. 오픈 전 승인 기준·장애 대응·유지보수 범위·지원 기간',
  '', '※ 예약 확정, 결제, 관리자, 고객 데이터베이스, 배송 조회는 시연만으로 제공을 확약하지 않습니다.',
  '※ 이 화면은 자동으로 접수되지 않습니다. 실제 상담서에서 이메일을 직접 발송해 주세요.',
  '제작 문의: https://allfileone-webstudio.pages.dev/quick-inquiry.html?industry='+c.industry);
  return result.join('\n')+'\n';
 }
 function renderPreview(){const raw=lines();preview.textContent=raw;$('v60-count').textContent=Object.values(state.choices[state.industry]).filter(x=>x==='request').length+'개 포함 요청 · '+DATA[state.industry].items.length+'개 검토 항목';}
 function render(){drawSectors();drawFeatures();renderPreview()}
 function msg(t){status.textContent=t}
 async function copy(){const value=lines();try{if(typeof navigator.clipboard?.writeText!=='function')throw Error('clipboard');await navigator.clipboard.writeText(value);msg('초안 전체를 복사했습니다. 실제 발송이나 계약 체결은 아닙니다.');}catch(_){preview.focus();msg('자동 복사가 제한됩니다. 아래 초안을 선택하여 복사하거나 TXT로 저장하세요.')}}
 function download(){const b=new Blob(['\ufeff',lines()],{type:'text/plain;charset=utf-8'}),u=URL.createObjectURL(b),a=node('a',null);a.href=u;a.download='AllFileOne_V60_Scope_'+state.industry+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);msg('TXT 초안을 저장했습니다. 계약서나 발송 완료 증명이 아닙니다.')}
 function handoff(){const c=current(),key=KEY;try{sessionStorage.setItem(key,JSON.stringify(c));location.href='./contact.html?source=scopev60&industry='+encodeURIComponent(c.industry)+'&theme=modern'}catch(_){msg('브라우저 임시 인계가 차단됐습니다. 초안을 TXT로 저장하거나 복사해 상세 상담서에 붙여넣어 주세요.')}}
 form.addEventListener('submit',e=>e.preventDefault());$('v60-copy').addEventListener('click',copy);$('v60-save').addEventListener('click',download);$('v60-print').addEventListener('click',()=>window.print());$('v60-to-contact').addEventListener('click',handoff);
 drawTerms();render();
 window.AFO_V60_SCOPE={schema:VERSION,industries:Object.keys(DATA).length};
})();
