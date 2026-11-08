/* V52: original, offline fictional industrial catalog and RFQ draft. No transmission. */
(()=>{'use strict';
const parts=[
{id:'MF-101',name:'육각 볼트 M8×30',group:'fastener',material:'steel',spec:'SUS304 / M8 × 30',moq:100,note:'체결 부품'},
{id:'MF-102',name:'육각 볼트 M10×40',group:'fastener',material:'carbon',spec:'탄소강 / M10 × 40',moq:200,note:'방청 처리 별도'},
{id:'MF-103',name:'플랜지 25A',group:'pipe',material:'steel',spec:'SUS304 / 25A',moq:20,note:'압력 등급 확인 필요'},
{id:'MF-104',name:'이음관 15A',group:'pipe',material:'carbon',spec:'탄소강 / 15A',moq:50,note:'연결 규격 확인'},
{id:'MF-105',name:'L형 브래킷 40',group:'mount',material:'aluminum',spec:'AL6061 / 40×40',moq:50,note:'홀 위치 확인'},
{id:'MF-106',name:'프로파일 고정판',group:'mount',material:'steel',spec:'SUS304 / 80×60',moq:30,note:'설치 방향 확인'},
{id:'MF-107',name:'커플링 20A',group:'pipe',material:'aluminum',spec:'AL6061 / 20A',moq:30,note:'적합성 검토 필요'},
{id:'MF-108',name:'나사형 스페이서 M6',group:'fastener',material:'aluminum',spec:'AL6061 / M6',moq:100,note:'길이별 규격 확인'}];
const $=id=>document.getElementById(id);if(!$('m-results'))return;
const picked=new Map(),labels={fastener:'체결 부품',pipe:'배관 부품',mount:'설치 부품'};
const mk=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e};
const safe=s=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,80);
function render(){const group=$('m-group').value,mat=$('m-material').value,q=safe($('m-search').value).toLocaleLowerCase('ko'),target=$('m-results');target.replaceChildren();let n=0;
 for(const p of parts){if(group!=='all'&&p.group!==group||mat!=='all'&&p.material!==mat||q&&!`${p.id} ${p.name} ${p.spec}`.toLocaleLowerCase('ko').includes(q))continue;n++;
 const card=mk('article','m-product');card.append(mk('small','m-product-id',p.id+' / '+labels[p.group]),mk('h3','',p.name),mk('p','m-spec',p.spec),mk('p','m-product-note',p.note));
 const foot=mk('div','m-product-foot');foot.append(mk('span','','예시 MOQ '+p.moq+'개'));
 const btn=mk('button','',picked.has(p.id)?'✓ 견적에서 제외':'＋ 견적에 담기');btn.type='button';btn.setAttribute('aria-pressed',String(picked.has(p.id)));
 btn.addEventListener('click',()=>{picked.has(p.id)?picked.delete(p.id):picked.set(p.id,p.moq);render();renderPicked();$('m-status').textContent='견적 준비 목록을 갱신했습니다. 실제 전송은 하지 않습니다.'});foot.append(btn);card.append(foot);target.append(card)}
 $('m-count').textContent=n+'개 제품';if(!n)target.append(mk('p','m-empty','해당 조건의 가상 부품이 없습니다. 필터를 바꿔 보세요.'))}
function renderPicked(){const target=$('m-selected');target.replaceChildren();$('m-selected-count').textContent=picked.size+'개 선택';if(!picked.size){target.textContent='관심 품목에서 「견적에 담기」를 선택하세요.';return;}
 for(const [id,qty] of picked){const p=parts.find(x=>x.id===id),row=mk('div','m-selected-row'),head=mk('div','m-selected-desc');head.append(mk('strong','',p.name),mk('small','',p.spec));const label=mk('label','','수량 '),input=mk('input');input.type='number';input.min=String(p.moq);input.max='100000';input.step='1';input.value=String(qty);input.dataset.mQty=id;label.append(input);row.append(head,label);target.append(row);
 input.addEventListener('change',()=>{const v=Number(input.value);if(!Number.isSafeInteger(v)||v<p.moq||v>100000){input.setCustomValidity('MOQ 이상 100,000개 이하의 정수만 입력할 수 있습니다.');input.reportValidity();return;}input.setCustomValidity('');picked.set(id,v);$('m-status').textContent='수량을 수정했습니다.'});}}
function packet(){if(!picked.size)return null;for(const input of document.querySelectorAll('[data-m-qty]')){const v=Number(input.value),id=input.dataset.mQty,p=parts.find(x=>x.id===id);if(!p||!Number.isSafeInteger(v)||v<p.moq||v>100000)return null;picked.set(id,v)}const lines=['[가상 제조·도매 견적 준비서]','※ 실제 견적·주문·재고 확인이 아닙니다.',''];for(const [id,qty] of picked){const p=parts.find(x=>x.id===id);if(!Number.isSafeInteger(qty)||qty<p.moq||qty>100000)return null;lines.push(`${p.id} | ${p.name} | ${p.spec} | ${qty}개`)}return lines.concat(['','희망 납품 조건: '+(safe($('m-delivery').value)||'상담 시 협의'),'실제 발주·견적 접수는 이루어지지 않았습니다.']).join('\n')+'\n'}
function download(txt){const u=URL.createObjectURL(new Blob(['\ufeff'+txt],{type:'text/plain;charset=utf-8'}));const a=mk('a');a.href=u;a.download='AllFileOne_Manufacturing_RFQ_Demo.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
for(const id of ['m-group','m-material'])$(id).addEventListener('change',render);$('m-search').addEventListener('input',render);$('m-reset').addEventListener('click',()=>{$('m-group').value='all';$('m-material').value='all';$('m-search').value='';render()});
$('m-clear').addEventListener('click',()=>{picked.clear();render();renderPicked();$('m-status').textContent='선택 품목을 모두 비웠습니다.'});
$('m-download').addEventListener('click',()=>{const s=packet();if(!s){$('m-status').textContent='품목을 선택하고 MOQ 이상 유효 수량을 입력해 주세요.';return}download(s);$('m-status').textContent='TXT 저장 완료. 견적 요청은 전송되지 않았습니다.'});
$('m-copy').addEventListener('click',async()=>{const s=packet();if(!s){$('m-status').textContent='먼저 품목·유효 수량을 확인하세요.';return;}try{await navigator.clipboard.writeText(s);$('m-status').textContent='목록을 복사했습니다. 실제 제출은 아닙니다.';}catch{$('m-status').textContent='복사가 차단되었습니다. TXT 저장을 이용하세요.';}});
render();renderPicked();})();
