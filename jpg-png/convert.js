import { escapeHtml, formatBytes } from "./utils.js";

export async function renderPreviewList(files, els) {
    els.previewList.innerHTML = "";

    for (const file of files) {
        await addPreviewCard(file, els);
    }
}

async function addPreviewCard(file, els) {
    const url = URL.createObjectURL(file);
    const size = await getImageSize(url);

    const card = document.createElement("div");
    card.className = "file-card";

    card.innerHTML = `
        <img src="${url}" alt="${escapeHtml(file.name)}">

        <div class="file-card-body">
            <div class="file-name">${escapeHtml(file.name)}</div>
            <div>용량 : ${formatBytes(file.size)}</div>
            <div>크기 : ${size.width} × ${size.height}</div>
            <span class="badge">PNG</span>
        </div>
    `;

    els.previewList.appendChild(card);
}

function getImageSize(url) {
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };

        img.onerror = () => {
            resolve({
                width: "-",
                height: "-"
            });
        };

        img.src = url;
    });
}