
import { initUpload } from "./upload/index.js";
import { initTheme } from "./theme.js";
import { initHomeCatalog } from "./home-catalog.js";
document.addEventListener("DOMContentLoaded",()=>{initTheme();initUpload();restoreRecent();restoreFavorite();initHomeCatalog(saveRecentTool);});
function saveRecentTool(tool){const normalized={title:tool.title||tool.id||"변환기",href:tool.path||tool.href||""};let list=JSON.parse(localStorage.getItem("recentTools")||"[]");list=list.filter(x=>x.href!==normalized.href);list.unshift(normalized);localStorage.setItem("recentTools",JSON.stringify(list.slice(0,10)));}
function restoreRecent(){const box=document.getElementById("recentTools");if(!box)return;const list=JSON.parse(localStorage.getItem("recentTools")||"[]");box.innerHTML=list.length?list.map(x=>`<a href="${x.href}" class="recent-item">🕘 ${x.title}</a>`).join(""):"최근 사용한 변환기가 없습니다.";}
function restoreFavorite(){const box=document.getElementById("favoriteTools");if(!box)return;const list=JSON.parse(localStorage.getItem("favoriteTools")||"[]");box.innerHTML=list.length?list.map(x=>`<a href="${x.href}" class="favorite-item">⭐ ${x.title}</a>`).join(""):"즐겨찾기가 없습니다.";}
window.App={refreshRecent:restoreRecent,refreshFavorite:restoreFavorite};
