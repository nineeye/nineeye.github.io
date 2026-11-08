/* V52: fictional vector-art interior portfolio, comparison range and offline brief. */
(()=>{'use strict';const $=id=>document.getElementById(id);if(!$('i-projects'))return;
const entries=[
{name:'햇살이 머무는 거실',type:'residential',area:'주거 · 84㎡',theme:'i-p1',detail:'채광과 수납의 균형을 생각한 거실'},
{name:'작은 집, 넓은 생활',type:'residential',area:'주거 · 58㎡',theme:'i-p2',detail:'다용도 가구로 공간 활용도를 높이는 구성'},
{name:'감각적인 커피바',type:'commercial',area:'상업 · 45㎡',theme:'i-p3',detail:'동선·진열·조명을 통합한 브랜드 공간'},
{name:'쇼룸의 첫인상',type:'commercial',area:'상업 · 90㎡',theme:'i-p4',detail:'전시 방식과 고객 흐름을 함께 고려'},
{name:'집중과 교류의 사이',type:'office',area:'오피스 · 120㎡',theme:'i-p5',detail:'집중 공간과 회의 공간을 분리'},
{name:'차분한 작은 사무실',type:'office',area:'오피스 · 64㎡',theme:'i-p6',detail:'편안한 조명과 모듈 가구의 조화'}];
const mk=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e};let filter='all';
function render(){const root=$('i-projects');root.replaceChildren();entries.forEach((p,index)=>{if(filter!=='all'&&p.type!==filter)return;const article=mk('article','i-card');const visual=mk('div','i-project-visual '+p.theme),shape=mk('div','i-project-shape');visual.append(shape,mk('span','','CONCEPT '+String(index+1).padStart(2,'0')));const body=mk('div','i-project-body');body.append(mk('small','',p.area),mk('h3','',p.name),mk('p','',p.detail));article.append(visual,body);root.append(article)})}
for(const b of document.querySelectorAll('[data-i-filter]'))b.addEventListener('click',()=>{filter=b.dataset.iFilter;for(const peer of document.querySelectorAll('[data-i-filter]'))peer.setAttribute('aria-pressed',String(peer===b));render()});
const slider=$('i-range');slider.addEventListener('input',()=>{const n=Math.min(100,Math.max(0,Number(slider.value)||0));$('i-compare-art').style.setProperty('--reveal',n+'%');$('i-percent').textContent=n+'%'});
const safe=(v,n)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);function valid(){const area=Number($('i-area').value);if(!Number.isSafeInteger(area)||area<5||area>500){$('i-status').textContent='면적은 5~500㎡의 정수로 입력해 주세요.';$('i-area').setCustomValidity('면적은 5~500㎡의 정수만 가능합니다.');$('i-area').reportValidity();return false}$('i-area').setCustomValidity('');return true;}
function brief(){return ['[가상 인테리어 공간 상담 준비 메모]','공간 유형: '+$('i-type').value,'공사 범위: '+$('i-scope').value,'예상 면적: '+$('i-area').value+'㎡','추가 요청: '+(safe($('i-note').value,240)||'상담 시 협의'),'','※ 실제 견적·시공 상담이 자동 접수되지 않습니다.','※ 그림은 가상 공간 콘셉트이며 실제 시공 실적이 아닙니다.'].join('\n')+'\n'}function preview(){$('i-area').setCustomValidity('');$('i-summary-text').textContent=brief();}
for(const id of ['i-type','i-scope','i-area','i-note'])$(id).addEventListener('input',()=>{preview();$('i-status').textContent=''});
$('i-download').addEventListener('click',()=>{if(!valid())return;const u=URL.createObjectURL(new Blob(['\ufeff'+brief()],{type:'text/plain;charset=utf-8'})),a=mk('a');a.href=u;a.download='AllFileOne_Interior_Brief_Demo.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);$('i-status').textContent='TXT 저장 완료. 실제 견적 접수는 아닙니다.'});
$('i-copy').addEventListener('click',async()=>{if(!valid())return;try{await navigator.clipboard.writeText(brief());$('i-status').textContent='메모 복사 완료. 실제 문의 접수는 아닙니다.'}catch{$('i-status').textContent='복사가 제한됐습니다. TXT 저장을 이용하세요.'}});
render();preview()})();
