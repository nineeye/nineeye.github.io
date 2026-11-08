/* AllFileOne WebStudio V44: self-contained, zero-network client-side launch kit. */
(()=>{'use strict';
const DATA={
 manufacturing:{label:'제조 · 도매',title:'제조·도매 홈페이지 준비자료',intro:'제품 규격과 견적 문의 동선을 먼저 설계합니다.',items:[
 ['제품군·대표 품목 목록','기본','대분류·모델명·대표 사진의 사용 권한을 정리합니다.'],
 ['재질·규격·품번 정보','기본','구매자가 실제로 비교할 수 있는 필드와 단위를 확인합니다.'],
 ['견적 문의에 필요한 항목','기본','희망 수량·납품지·연락 방법·사용 목적을 구분합니다.'],
 ['대표 연락처·영업 지역','기본','사용 가능한 공개 연락 방법·사업장 정보를 확정합니다.'],
 ['회사 소개·보유 역량','기본','실제로 증명 가능한 제조·납품 역량만 정리합니다.'],
 ['제품 사진·도면의 사용 권한','권장','고객사 도면·상표·제3자 사진은 공개 허락을 확인합니다.'],
 ['인증·시험 자료의 유효성','권장','표시할 인증 번호·기간·대상 제품을 사전 검토합니다.'],
 ['카탈로그 PDF·다운로드 정책','권장','고객 공개 범위와 최신 버전을 구분합니다.'],
 ['MOQ·납기·배송 안내 기준','권장','확정되지 않은 가격·재고·납기는 고정 수치로 약속하지 않습니다.'],
 ['상품 정보 갱신 담당자','권장','변경 요청·검수·반영 책임자를 정합니다.']]},
 academy:{label:'학원 · 교육',title:'학원·교육 홈페이지 준비자료',intro:'강좌 탐색부터 상담·방문 흐름을 설계합니다.',items:[
 ['교육 대상·과정 구성','기본','초등·중등·성인 등 실제 제공 과정을 명확히 구분합니다.'],
 ['요일·시간·수강 가능 여부','기본','운영 중인 일정과 변경 관리 방법을 정합니다.'],
 ['상담·체험 수업 요청 항목','기본','학년·과목·희망 시간 등 최소 정보만 수집하도록 설계합니다.'],
 ['운영 장소·문의 연락처','기본','실제 운영하는 위치와 연락 경로를 명시합니다.'],
 ['학원의 차별화 교육 방식','기본','과장된 합격률·성적 향상 보증 표현을 배제합니다.'],
 ['강사 소개·프로필 사용 동의','권장','강사 사진·약력 공개에 필요한 동의를 확인합니다.'],
 ['수강료·환불 안내의 근거','권장','공개 가격 및 환불 조건은 적용 법규와 실제 운영 기준으로 검토합니다.'],
 ['공지·휴강·일정 변경 방식','권장','관리 담당자와 최신 공지 반영 방법을 정합니다.'],
 ['학부모·학생 개인정보 처리','권장','연령·정보 유형에 따라 수집·보관·동의 범위를 별도로 확정합니다.'],
 ['후기·성적 사례 사용 동의','권장','식별 가능한 정보·사진·성과 표시는 사전 승인을 확인합니다.']]},
 interior:{label:'인테리어 · 시공',title:'인테리어·시공 홈페이지 준비자료',intro:'포트폴리오 신뢰와 현장 견적 요청 흐름을 설계합니다.',items:[
 ['주력 시공 분야·공간 유형','기본','주거·상업·사무실 등 실제 서비스 범위를 구분합니다.'],
 ['공개 가능한 시공 사진','기본','고객 공간·상호·위치·인물 공개 허락을 확인합니다.'],
 ['상담·견적 요청 필수 항목','기본','지역·공간·평형·예산 범위 등을 단계적으로 받도록 설계합니다.'],
 ['영업 지역·상담 연락처','기본','방문 가능한 지역과 연락 가능한 경로를 정합니다.'],
 ['현장 진행 과정 소개','기본','상담·실측·설계·시공·사후 관리의 실제 단계를 정리합니다.'],
 ['시공 사례별 설명 데이터','권장','유형·면적·범위·자재를 과장 없이 기재합니다.'],
 ['비용 안내·변동 조건','권장','견적은 현장 상태·자재·공정에 따라 달라짐을 명확히 합니다.'],
 ['시공 사진 라이선스·저작권','권장','촬영자 저작권과 고객 공개 동의를 별도로 확인합니다.'],
 ['디자인 스타일·브랜드 자료','권장','로고·톤앤매너·참고 스타일 사용 허락을 확인합니다.'],
 ['고객 리뷰·A/S 안내 기준','권장','실제 후기 사용 허락 및 보증 범위를 문서화합니다.']]}
};
const $=id=>document.getElementById(id);const sectorButtons=[...document.querySelectorAll('[data-sector]')];const checks={manufacturing:new Set(),academy:new Set(),interior:new Set()};
const urlSector=new URLSearchParams(location.search).get('industry');let sector=Object.hasOwn(DATA,urlSector)?urlSector:'manufacturing';
function clean(s){return String(s||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim()}
function selected(){return checks[sector]}
function render(){const info=DATA[sector];sectorButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sector===sector)));$('sectorTitle').textContent=info.title;$('sectorIntro').textContent=info.intro;$('summarySector').textContent=info.label;
const list=$('checklist');list.replaceChildren();info.items.forEach(([name,priority,desc],idx)=>{const row=document.createElement('label');row.className='check-row';const input=document.createElement('input');input.type='checkbox';input.checked=selected().has(idx);input.dataset.index=String(idx);input.setAttribute('aria-label',name+' 준비 완료');const wrap=document.createElement('span');wrap.className='check-text';const top=document.createElement('span');top.className='check-top';const bold=document.createElement('b');bold.textContent=name;const tag=document.createElement('i');tag.className='tag';tag.textContent=priority;const detail=document.createElement('span');detail.className='check-desc';detail.textContent=desc;top.append(bold,tag);wrap.append(top,detail);row.append(input,wrap);list.append(row)});
$('contactLink').href='./contact.html?source=sector&industry='+encodeURIComponent(sector)+'&theme=modern';refresh();}
function refresh(){const count=selected().size;const total=DATA[sector].items.length;const percent=Math.round(100*count/total);$('percent').replaceChildren(document.createTextNode(String(percent)));const sp=document.createElement('small');sp.textContent='%';$('percent').append(sp);$('progress').setAttribute('aria-valuenow',String(percent));$('progressFill').style.width=percent+'%';$('progressLabel').textContent=count+' / '+total+'개 준비 완료 체크';const missing=$('missingList');missing.replaceChildren();DATA[sector].items.forEach(([name],idx)=>{if(!selected().has(idx)){const li=document.createElement('li');li.textContent=name;missing.append(li)}});$('readyNote').hidden=count!==total;missing.hidden=count===total;}
function report(){const d=DATA[sector],line=['올파일원 웹스튜디오 · 홈페이지 제작 준비서 (V44)','업종: '+d.label,'프로젝트: '+(clean($('projectName').value)||'미입력'),'우선 목표: '+(clean($('projectGoal').value)||'미입력'),'추가 요청: '+(clean($('projectMemo').value)||'없음'),'','자료 준비 상태: '+selected().size+' / '+d.items.length+'개 (고객 자체 체크)',''];d.items.forEach(([name,priority,desc],idx)=>{line.push((selected().has(idx)?'[준비] ':'[미준비] ')+name+' ('+priority+')');line.push('  확인사항: '+desc)});line.push('','안내: 해당 항목은 고객 자체 체크입니다. 내용의 진위·권리·법률 준수·실제 수집/서버 개발은 별도 검토 대상입니다.','이 도구는 서버에 정보를 전송하거나 상담 메일을 자동 발송하지 않습니다.','제작 상담: https://allfileone-webstudio.pages.dev/contact.html?source=sector&industry='+encodeURIComponent(sector)+'&theme=modern');return line.join('\r\n')+'\r\n'}
function status(msg){$('notice').textContent=msg}
sectorButtons.forEach(b=>b.addEventListener('click',()=>{sector=b.dataset.sector;render();status('업종을 바꿨습니다. 업종별 체크 내용은 이 화면에서만 유지됩니다.')}));
$('checklist').addEventListener('change',e=>{if(!(e.target instanceof HTMLInputElement)||e.target.type!=='checkbox')return;const idx=Number(e.target.dataset.index);if(!Number.isInteger(idx)||idx<0||idx>=DATA[sector].items.length)return;e.target.checked?selected().add(idx):selected().delete(idx);refresh();status('현재 준비 상태가 업데이트됐습니다.')});
$('clearChecks').addEventListener('click',()=>{selected().clear();render();status('현재 업종의 체크 항목만 초기화했습니다.')});
$('downloadTxt').addEventListener('click',()=>{const blob=new Blob(['\ufeff',report()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='AllFileOne_Project_StartKit_'+sector+'_V44.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status('TXT 파일을 다운로드했습니다. 파일은 사용 중인 기기의 다운로드 폴더를 확인하세요.')});
$('copyText').addEventListener('click',async()=>{const value=report();try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);status('준비서 내용을 클립보드에 복사했습니다.')}else throw new Error('clipboard not available')}catch(_){const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.top='10px';ta.style.left='10px';ta.style.width='min(90vw,500px)';ta.style.height='180px';ta.setAttribute('aria-label','수동 복사용 준비서');document.body.append(ta);ta.focus();ta.select();status('자동 복사가 제한되었습니다. 열린 텍스트 영역에서 Ctrl+C로 복사한 뒤 닫으세요.');ta.addEventListener('blur',()=>ta.remove(),{once:true})}});
$('printPage').addEventListener('click',()=>{status('인쇄 창에서 PDF로 저장을 선택할 수 있습니다.');window.print()});
render();})();
