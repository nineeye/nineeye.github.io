import { mapPool } from "../core/TaskScheduler.js";

export async function renderFileCards(options){
 const {files,container,concurrency=4}=options;
 container.replaceChildren();
 const cards=await mapPool(files,concurrency,(file)=>createFileCard(file,options));
 const fragment=document.createDocumentFragment();
 cards.forEach(card=>fragment.appendChild(card));
 container.appendChild(fragment);
 return cards;
}

export async function createFileCard(file,options){
 const {keyOf,isSelected,getConfig,dimensions,formatSize,escapeHtml,registerPreviewUrl,onSelectionChange,onDelete,onConfigChange,onCompare,sourceFormat="FILE",targetFormat="OUTPUT",features={}}=options;
 const dim=await dimensions(file);
 const url=URL.createObjectURL(file);
 registerPreviewUrl?.(url);
 const card=document.createElement("article");
 const config=getConfig(file)||{};
 card.className="file-card";
 card.dataset.fileKey=keyOf(file);
 const qualityField=features.quality===false?"":`<div class="field"><label>개별 품질 (%)</label><input class="q" type="number" min="1" max="100" placeholder="전체 설정" value="${config.quality??""}"></div>`;
 const resizeField=features.resize===false?"":`<div class="field"><label>가로 크기(px)</label><input class="w" type="number" min="1" placeholder="전체 설정" value="${config.width??""}"></div>`;
 const settingsAvailable=Boolean(qualityField||resizeField);
 card.innerHTML=`<label class="file-select-control"><input class="sel" type="checkbox" ${isSelected(file)?"checked":""}> 선택</label><img src="${url}" alt="${escapeHtml(file.name)}" loading="lazy" decoding="async"><div class="file-card-body"><div class="file-name">${escapeHtml(file.name)}</div><div>용량: ${formatSize(file.size)}</div><div>크기: ${dim.w} × ${dim.h}</div><span class="badge">${escapeHtml(sourceFormat)}</span><div class="estimate-box"><div>예상 ${escapeHtml(targetFormat)}: <strong class="est-size">계산중...</strong></div><div class="est-save">분석 중</div></div><div class="card-actions"><button class="compare ghost-btn" type="button">전후 비교</button>${settingsAvailable?'<button class="settings ghost-btn" type="button" aria-expanded="false">개별 설정</button>':''}</div>${settingsAvailable?`<div class="card-settings" hidden>${qualityField}${resizeField}</div>`:''}<button class="delete danger-btn" type="button" style="width:100%;margin-top:10px">삭제</button></div>`;
 const image=card.querySelector("img");
 const releaseUrl=()=>URL.revokeObjectURL(url);
 image.addEventListener("load",releaseUrl,{once:true});
 image.addEventListener("error",releaseUrl,{once:true});
 card.querySelector(".sel").addEventListener("change",event=>onSelectionChange?.(file,event.target.checked));
 card.querySelector(".delete").addEventListener("click",()=>onDelete?.(file));
 const settingsButton=card.querySelector(".settings");
 const settingsPanel=card.querySelector(".card-settings");
 settingsButton?.addEventListener("click",()=>{settingsPanel.hidden=!settingsPanel.hidden;settingsButton.setAttribute("aria-expanded",String(!settingsPanel.hidden))});
 const saveConfig=()=>onConfigChange?.(file,{quality:Number(card.querySelector(".q")?.value)||null,width:Number(card.querySelector(".w")?.value)||null});
 card.querySelector(".q")?.addEventListener("input",saveConfig);
 card.querySelector(".w")?.addEventListener("input",saveConfig);
 card.querySelector(".compare").addEventListener("click",()=>onCompare?.(file));
 return card;
}
