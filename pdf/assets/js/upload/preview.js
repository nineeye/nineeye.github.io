// =====================================
// Converter Mall
// Upload Preview
// =====================================

import { formatBytes, escapeHTML } from "./utils.js";

export function renderPreview(files, preview) {

    if (!preview) return;

    preview.innerHTML = "";

    if (!files || files.length === 0) {

        return;

    }

    const list = [...files];

    list.forEach((file, index) => {

        preview.insertAdjacentHTML(

            "beforeend",

            createCard(file, index)

        );

    });

    list.forEach((file, index) => {

        if (!file.type.startsWith("image/")) return;

        const img = preview.querySelector(

            `[data-preview="${index}"]`

        );

        if (!img) return;

        const reader = new FileReader();

        reader.onload = e => {

            img.src = e.target.result;

        };

        reader.readAsDataURL(file);

    });

}

function createCard(file, index) {

    const isImage =
        file.type.startsWith("image/");

    return `

<div class="upload-card">

    ${
        isImage
        ? `<img
                class="upload-thumb"
                data-preview="${index}"
                alt=""
           >`
        : `<div class="upload-icon">📄</div>`
    }

    <div class="upload-info">

        <div class="upload-name">

            ${escapeHTML(file.name)}

        </div>

        <div class="upload-size">

            ${formatBytes(file.size)}

        </div>

        <div class="upload-type">

            ${file.type || "Unknown"}

        </div>

    </div>

</div>

`;

}