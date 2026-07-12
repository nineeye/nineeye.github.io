
const FEATURED_IDS=["png-jpg","png-webp","png-pdf","jpg-png","pdf-merge","pdf-split","pdf-png","pdf-jpg","png-ico","png-gif","png-zip","pdf-txt"];
const LEVEL_NAMES={free:"FREE",professional:"PROFESSIONAL",pro:"PRO",business:"BUSINESS"};
export async function initHomeCatalog(onOpen=()=>{}){
 const grid=document.getElementById("homePopularGrid"); if(!grid)return;
 try{const r=await fetch("./data/tools.json",{cache:"no-cache"});if(!r.ok)throw new Error(`목록 요청 실패 (${r.status})`);const all=await r.json();const map=new Map(all.map(t=>[t.id,t]));const list=FEATURED_IDS.map(id=>map.get(id)).filter(t=>t&&t.status==="ready"&&t.path&&t.accessLevel==="free");grid.innerHTML=list.map(card).join("");grid.querySelectorAll("[data-tool-id]").forEach(a=>a.addEventListener("click",()=>{const t=map.get(a.dataset.toolId);if(t)onOpen(t)}));document.getElementById("homePopularMeta").textContent=`인기 무료 도구 ${list.length}개만 선별했습니다.`;}catch(e){grid.innerHTML='<div class="catalog-empty">인기 도구를 불러오지 못했습니다.</div>';console.error(e)}}
function card(t){return `<a class="catalog-card" href="${escAttr(t.path)}" data-tool-id="${escAttr(t.id)}"><div class="catalog-card-top"><span class="level-badge free">FREE</span><span class="category-badge">${String(t.id).startsWith("pdf-")?"PDF":"이미지"}</span></div><h3>${esc(t.title)}</h3><p>${esc(t.description||"파일 변환 도구")}</p><span class="catalog-open">바로 사용 →</span></a>`}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}function escAttr(v){return esc(v).replace(/`/g,"&#096;")}
