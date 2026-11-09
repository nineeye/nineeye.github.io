/* V80 lab: three genuinely working fictional add-ons for each industry. */
(()=>{'use strict';
const E=window.AFO_V77_FEATURE_EXTENSION||{},C=window.ALLFILEONE_V28_CATALOG||{},A=window.AFO_V78_SIMULATOR,B=window.AFO_V79_SIMULATOR,D=window.AFO_V80_SIMULATOR;
const sectorInput=document.getElementById('v80-industry'),featureInput=document.getElementById('v80-feature'),root=document.getElementById('v80-standalone'),hint=document.getElementById('v80-status');
if(!sectorInput||!featureInput||!root||!A||!B||!D)return;
const params=new URLSearchParams(location.search),keys=Object.keys(E).filter(k=>C[k]?.features?.length===4&&A.indexFor(k)>=0&&B.indexFor(k)>=0&&D.indexFor(k)>=0);
keys.forEach(k=>{const op=document.createElement('option');op.value=k;op.textContent=C[k].name;sectorInput.append(op)});
sectorInput.value=keys.includes(params.get('industry'))?params.get('industry'):keys[0];
function redrawFeatures(preferred){const k=sectorInput.value;featureInput.replaceChildren();[A.indexFor(k),B.indexFor(k),D.indexFor(k)].forEach(i=>{const op=document.createElement('option');op.value=String(i);op.textContent=E[k].extra[i].title;featureInput.append(op)});if([...featureInput.options].some(x=>x.value===preferred))featureInput.value=preferred;render();}
function render(){const k=sectorInput.value,i=Number(featureInput.value),engine=i===A.indexFor(k)?A:i===B.indexFor(k)?B:i===D.indexFor(k)?D:null;const ok=!!engine&&engine.mount(root,k);hint.textContent=ok?'가상 데이터 시연입니다. 실제 예약·결제·사례가 아니며 회원정보를 저장하지 않습니다.':'시연 구성을 찾을 수 없습니다.';
 const link=document.getElementById('v80-back');if(link)link.href='./industry-features-v77.html?industry='+encodeURIComponent(k);}
sectorInput.addEventListener('change',()=>redrawFeatures(''));
featureInput.addEventListener('change',render);
redrawFeatures(params.get('feature')||'');window.AFO_V80_LAB_READY=true;
})();