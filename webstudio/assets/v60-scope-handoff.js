/* AllFileOne WebStudio V60 -- one-time, same-tab, allowlisted consultation handoff.
 * Read-only validation of public enumeration values, no network/API/PII URL or tracking.
 */
(()=>{'use strict';
const KEY='afo.webstudio.v60.scope',TTL=15*60*1000;
const DATA={
 manufacturing:{label:'제조·도매',ids:['catalog','rfq','files','moq','rights','updates','testing']},
 academy:{label:'학원·교육',ids:['courses','calendar','consult','fees','privacy','updates','testing']},
 interior:{label:'인테리어·시공',ids:['portfolio','comparison','brief','rights','process','updates','testing']},
 restaurant:{label:'음식점·카페',ids:['menu','hours','visit','group','allergen','updates','testing']},
 beauty:{label:'뷰티·미용',ids:['services','duration','gallery','booking','policy','updates','testing']},
 logistics:{label:'물류·운송',ids:['services','dimensions','rfq','dispatch','tracking','rights','testing']}
};
const TERMS={type:['undecided','basic','industry','workflow'],pages:['undecided','small','medium','large'],revision:['undecided','one','two','other'],domain:['undecided','customer','studio'],delivery:['undecided','source','deploy','both'],maintenance:['undecided','self','studio','hybrid'],extra:['undecided','noapi','integration'],privacy:['undecided','noform','backend']};
const LABELS={review:'검토 필요',request:'포함 요청',separate:'별도 협의',exclude:'이번 범위 제외'};
const FEATURE_NAMES={
 manufacturing:['제품군·규격별 탐색','품목·수량 견적 요청','도면·카탈로그 배포 범위','MOQ·납기 정보 고지','제조사·고객 도면 권리','상품 데이터 갱신 책임','규격 필터·첨부파일 테스트'],
 academy:['과정·수강 대상 구분','반별 시간표·휴강 안내','상담 신청 연결','수강료·환불 고지','학생·학부모 정보 최소 수집','학사 일정 갱신 담당','모바일 시간표·상담 흐름 테스트'],
 interior:['시공 사례·공간별 필터','시공 전후 이미지 비교','지역·면적 견적 준비서','현장·인물·사진 공개 허락','공정·상담 단계 안내','시공 사례 추가 담당','모바일 갤러리·견적 동선 테스트'],
 restaurant:['메뉴·가격·옵션 표시','영업·브레이크타임·휴무','지도·주차·방문 문의','단체 방문·행사 문의','원산지·알레르기 고지 검토','메뉴 변경·품절 갱신 주체','모바일 메뉴·문의 흐름 테스트'],
 beauty:['시술 메뉴·참고 가격','소요시간·주의사항','스타일 사례·사진 동의','외부 예약 링크·운영 주체','변경·취소 규정 고지','담당 디자이너·가격 갱신','시술 선택·모바일 상담 동선 테스트'],
 logistics:['운송 권역·취급 서비스','규격·실중량·부피무게 기준','월 물량·상품 정보 견적 문의','출고·반품·파손 절차','실제 배송 조회 연동 여부','고객사 로고·사례 공개 권한','규격 계산·CSV 저장 테스트']
};

const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function init(){const form=document.getElementById('brief-form');if(!form)return;
 const q=new URLSearchParams(location.search);if(q.get('source')!=='scopev60')return;
 let raw;try{raw=sessionStorage.getItem(KEY);sessionStorage.removeItem(KEY)}catch(_){return}
 if(!raw||raw.length>2400)return;
 let c;try{c=JSON.parse(raw)}catch(_){return}
 if(!c||c.v!==60||!Number.isSafeInteger(c.ts)||c.ts>Date.now()+60000||Date.now()-c.ts>TTL||!has(DATA,c.industry)||c.industry!==q.get('industry'))return;
 const data=DATA[c.industry];
 if(!Array.isArray(c.rows)||c.rows.length!==7||!c.rows.every((x,i)=>Array.isArray(x)&&x.length===2&&x[0]===data.ids[i]&&has(LABELS,x[1])))return;
 if(!c.terms||typeof c.terms!=='object'||Object.keys(c.terms).length!==Object.keys(TERMS).length||!Object.entries(TERMS).every(([k,vals])=>has(c.terms,k)&&vals.includes(c.terms[k])))return;
 const names={type:'제작 유형',pages:'페이지 수',revision:'수정 횟수',domain:'도메인·호스팅 명의',delivery:'납품물',maintenance:'운영·유지보수',extra:'추가 비용',privacy:'개인정보 처리'};
 const vals={type:['협의 전','소개 중심','업종 맞춤','업무 기능 검토'],pages:['미정','1~5쪽 검토','6~15쪽 검토','16쪽 이상 협의'],revision:['미정','1회 검토','2회 검토','별도 협의'],domain:['미정','고객 명의 우선','제작사 관리 검토'],delivery:['미정','소스 포함 협의','배포·계정 인계 협의','소스·배포·문서 협의'],maintenance:['미정','고객 직접 관리','제작사 유지보수 협의','역할 분리'],extra:['미정','외부 유료 기능 제외 검토','유료 연동 별도 견적'],privacy:['미정','정보 저장 없이 연결','저장·접수 별도 심사']};
 const lines=['[V60 업종별 제작 범위 협의 초안]','업종: '+data.label,
  '포함 요청: '+c.rows.filter(x=>x[1]==='request').length+'개 / 7개'];
 for(const [k,v] of Object.entries(c.terms))lines.push(names[k]+': '+vals[k][TERMS[k].indexOf(v)]);
 const detailed=c.rows.map((x,i)=>FEATURE_NAMES[c.industry][i]+' · '+LABELS[x[1]]);
 lines.push('요청 상태: '+detailed.join(' / '),'※ 초안만 전달되었습니다. 견적·계약·실제 접수는 아닙니다.');
 const full=lines.join('\n');
 const industry=form.elements.namedItem('industry');if(industry)industry.value=c.industry;
 const details=form.elements.namedItem('details');if(!details)return;
 const existing=String(details.value||'').trim(),capacity=details.maxLength>0?details.maxLength:700;
 const summary=lines.slice(0,11).join('\n');const merged=(existing?existing+'\n\n':'')+summary;
 details.value=merged.length<=capacity?merged:merged.slice(0,Math.max(0,capacity-29))+'\n[전체 초안을 아래에서 복사]';
 const panel=document.createElement('aside');panel.id='v60-import';panel.setAttribute('aria-label','제작 범위 협의 초안 인계');panel.className='v60-import';
 const heading=document.createElement('strong');heading.textContent='제작 범위 초안을 이어받았습니다.';
 const note=document.createElement('p');note.textContent='정보는 같은 탭에서 한 번만 전달했고 임시 저장값은 즉시 지웠습니다. 내용과 제외 범위를 확인한 뒤 이메일을 직접 발송해야 합니다.';
 const pre=document.createElement('pre');pre.textContent=full;pre.tabIndex=0;
 const copy=document.createElement('button');copy.type='button';copy.textContent='전체 초안 복사';
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 copy.addEventListener('click',async()=>{try{if(typeof navigator.clipboard?.writeText!=='function')throw Error('blocked');await navigator.clipboard.writeText(full);status.textContent='전체 초안을 복사했습니다. 자동 전송되지 않았습니다.'}catch(_){status.textContent='자동 복사가 차단됐습니다. 위 내용을 선택해 복사하세요.'}});
 panel.append(heading,note,pre,copy,status);
 if(merged.length>capacity){const caution=document.createElement('p');caution.textContent='상담서 글자 수 제한으로 요약했습니다. 위 전체 내용을 별도 복사하여 발송해 주세요.';panel.append(caution)}
 (document.querySelector('#brief .workspace')||form).before(panel);
 form.dispatchEvent(new Event('input',{bubbles:true}));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
