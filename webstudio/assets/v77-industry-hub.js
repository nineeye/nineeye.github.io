/* WebStudio V78: 12 industries / 4 V28+1 V78 simulated /3 unbuilt planned; no PII or remote backend. */
(()=>{'use strict';const C=window.ALLFILEONE_V28_CATALOG||{},E=window.AFO_V77_FEATURE_EXTENSION||{},S=window.AFO_V78_SIMULATOR;
const keys=Object.keys(E).filter(k=>C[k]?.features?.length===4&&E[k].extra?.length===4&&S?.indexFor(k)>=0);
const get=id=>document.getElementById(id),buttons=get('sector-buttons'),grid=get('sector-features'),styleInput=get('style-select'),save=get('save-plan');if(!buttons||!grid||keys.length!==12)return;
const initial=new URLSearchParams(location.search).get('industry');let sector=keys.includes(initial)?initial:keys[0];const selected=new Set();
const n=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
const counts=()=>{get('selected-count').textContent='미구현 제작 옵션 '+selected.size+'/3개 선택 · 이 브라우저에서만 선택';save.disabled=selected.size===0;};
function render(){get('industry-name').textContent=C[sector].name;get('industry-desc').textContent=C[sector].audience+' · 5개는 가상 시연, 3개는 제작 협의 옵션';
 buttons.replaceChildren();keys.forEach((key,i)=>{const b=n('button','sector-pill',String(i+1).padStart(2,'0')+' '+C[key].name);b.type='button';b.setAttribute('aria-pressed',String(key===sector));b.addEventListener('click',()=>{sector=key;selected.clear();render();const u=new URL(document.baseURI);u.searchParams.set('industry',sector);if(/^https?:$/.test(location.protocol))history.replaceState(null,'',u.href)});buttons.append(b)});
 grid.replaceChildren();C[sector].features.forEach((f,i)=>{const card=n('article','feature-card live');card.dataset.status='live';card.append(n('span','number','0'+(i+1)+' · 가상 시연'),n('h3','',f.title),n('p','',f.desc));const a=n('a','action','가상 데이터로 체험하기 ↗');const u=new URL('./demo/'+sector+'/'+styleInput.value+'/index.html',document.baseURI);u.searchParams.set('feature',String(i));u.hash='v28-tools';a.href=u.href;a.target='_blank';a.rel='noopener';card.append(a);grid.append(card)});
 E[sector].extra.forEach((f,i)=>{
  if(f.status==='simulated'){
   const card=n('article','feature-card v78-demo');card.dataset.status='live';card.dataset.v78New='true';card.append(n('span','number','0'+(i+5)+' · 추가 가상 시연'),n('h3','',f.title),n('p','',f.desc));
   const a=n('a','action','새 기능 조작하기 ↗');const u=new URL('./feature-lab-v78.html',document.baseURI);u.searchParams.set('industry',sector);a.href=u.href;a.target='_blank';a.rel='noopener';card.append(a);grid.append(card);
  }else{
   const card=n('article','feature-card plan');card.dataset.status='planned';card.append(n('span','number','0'+(i+5)+' · 제작 검토'),n('h3','',f.title),n('p','',f.desc));const b=n('button','action','＋ 제작 희망 목록에 담기');b.type='button';const sync=()=>{b.textContent=selected.has(i)?'✓ 선택됨 · 해제':'＋ 제작 희망 목록에 담기';b.setAttribute('aria-pressed',String(selected.has(i)));card.classList.toggle('chosen',selected.has(i))};b.addEventListener('click',()=>{selected.has(i)?selected.delete(i):selected.add(i);sync();counts()});sync();card.append(b);grid.append(card);
  }
 });
 get('source-link').href=E[sector].referenceUrl;get('source-link').textContent=E[sector].reference+' 공식 기능 참고 ↗';get('source-note').textContent=E[sector].evidence;
 get('comparison-link').href='./design-compare-live.html?'+new URLSearchParams({industry:sector,style:styleInput.value}).toString();get('contact-link').href='./contact.html?'+new URLSearchParams({source:'demo',industry:sector,theme:styleInput.value}).toString();counts();}
styleInput.addEventListener('change',render);
save.addEventListener('click',()=>{if(!selected.size)return;const index=S.indexFor(sector);
const lines=['올파일원 웹스튜디오 / 업종별 8개 기능 기획 초안','업종: '+C[sector].name,'선택 디자인: '+styleInput.value,'','기존 가상 데이터 시연 4개:',...C[sector].features.map((f,i)=>String(i+1)+'. '+f.title),'',
 '신규 가상 시연 1개:',E[sector].extra[index].title+' (실제 운영 연동 없음)','',
 '제작 검토 기능(미구현):',...E[sector].extra.filter((f,i)=>selected.has(i)).map(f=>'◇ '+f.title+' — '+f.desc),'','실제 연동 범위·납기·비용은 별도 상담 후 확정됩니다.'];
 const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=n('a');a.href=url;a.download='AllFileOne_'+sector+'_8features_scope.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);get('selected-count').textContent=selected.size+'개 제작 옵션을 TXT로 저장했습니다. 실제 발송은 되지 않았습니다.';});
render();window.AFO_V78_HUB_READY=true;
})();