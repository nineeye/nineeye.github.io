
import { UploadManager } from "./upload/UploadManager.js";

// =====================================
// Converter-Mall/assets/js/upload.js
// Universal Upload Module
// =====================================

export function initUpload(options = {}) {
    const dropZone = getElement(options.dropZone, "#dropZone");
    const input = getElement(options.input, "#fileInput");
    const preview = getElement(options.preview, "#preview");


    if (!dropZone || !input) return;

    bindClick(dropZone, input);
    bindDrag(dropZone);
    bindInput(input, preview);
}

// -----------------------------
// Click Upload
// -----------------------------

function bindClick(dropZone, input) {
    dropZone.addEventListener("click", () => {
        input.click();
    });
}

// -----------------------------
// Input Change
// -----------------------------

function bindInput(input, preview) {
    input.addEventListener("change", async () => {
        await handleFiles([...input.files], preview);
    });
}

// -----------------------------
// Drag & Drop
// -----------------------------

function bindDrag(dropZone) {
    ["dragenter", "dragover"].forEach(event => {
        dropZone.addEventListener(event, e => {
            e.preventDefault();
            dropZone.classList.add("drag-over");
        });
    });

    ["dragleave", "drop"].forEach(event => {
        dropZone.addEventListener(event, e => {
            e.preventDefault();
            dropZone.classList.remove("drag-over");
        });
    });

    dropZone.addEventListener("drop", async e => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");

        const preview = document.getElementById("preview");

        await handleFiles([...e.dataTransfer.files], preview);
    });
}

// -----------------------------
// Main File Handler
// -----------------------------

async function handleFiles(files, preview) {
    if (!files || files.length === 0) return;

    const result = splitPngFiles(files);

    if (result.validFiles.length === 0) {
        showInvalidFileMessage(result.invalidFiles);
        return;
    }

    if (result.invalidFiles.length > 0) {
        alert(
            `PNG 파일 ${result.validFiles.length}개만 불러옵니다.\n\n` +
            `지원하지 않는 파일 ${result.invalidFiles.length}개는 제외했습니다.`
        );
    }

    await UploadManager.set(result.validFiles);

    renderFiles(result.validFiles, preview);


    dispatch(result.validFiles);

    if (
        window.workspaceEngine &&
        result.validFiles.length
    ) {
        window.workspaceEngine.load(result.validFiles[0]);
    }
}

// -----------------------------
// File Type Check
// -----------------------------

function splitPngFiles(files) {
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
        if (isPngFile(file)) {
            validFiles.push(file);
        } else {
            invalidFiles.push(file);
        }
    });

    return {
        validFiles,
        invalidFiles
    };
}

function isPngFile(file) {
    return file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
}

function showInvalidFileMessage(files) {
    const firstFile = files[0];
    const extension = getExtension(firstFile.name);

    if (extension === "jpg" || extension === "jpeg") {
        alert(
            "이 변환기는 PNG → JPG 전용입니다.\n\n" +
            "방금 올린 파일은 이미 JPG 형식입니다.\n\n" +
            "JPG 파일은 변환보다 'JPG 압축' 기능을 이용하는 것이 좋습니다."
        );
        return;
    }

    if (extension === "webp") {
        alert(
            "이 변환기는 PNG → JPG 전용입니다.\n\n" +
            "방금 올린 파일은 WEBP 형식입니다.\n\n" +
            "WEBP 파일은 나중에 'WEBP → JPG 변환기'에서 처리할 수 있게 만들겠습니다."
        );
        return;
    }

    if (extension === "pdf") {
        alert(
            "이 변환기는 PNG → JPG 전용입니다.\n\n" +
            "방금 올린 파일은 PDF 형식입니다.\n\n" +
            "PDF 파일은 나중에 'PDF → JPG 변환기'에서 처리할 수 있게 만들겠습니다."
        );
        return;
    }

    alert(
        "지원하지 않는 파일 형식입니다.\n\n" +
        "현재 변환기 : PNG → JPG\n" +
        "지원 형식 : .png"
    );
}

function getExtension(fileName) {
    const parts = fileName.toLowerCase().split(".");

    if (parts.length <= 1) {
        return "";
    }

    return parts.pop();
}

// -----------------------------
// Preview
// -----------------------------

function renderFiles(files, preview) {
    if (!preview) return;

    if (!files || files.length === 0) {
        preview.innerHTML = "";
        return;
    }

    createCard.index = 0;

    const html = [];

    files.forEach(file => {
        html.push(createCard(file));
    });

    preview.innerHTML = html.join("");

    files.forEach((file, index) => {
        if (!file.type.startsWith("image/")) return;

        const img = preview.querySelector(`[data-preview="${index}"]`);

        if (!img) return;

        const reader = new FileReader();

        reader.onload = e => {
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    });
}

// -----------------------------
// File Card
// -----------------------------

function createCard(file) {
    const image = file.type.startsWith("image/");

    return `
<div class="upload-card">

    ${
        image
            ? `<img data-preview="${createCard.index++}" class="upload-thumb">`
            : `<div class="upload-icon">📄</div>`
    }

    <div class="upload-info">

        <div class="upload-name">
            ${escapeHtml(file.name)}
        </div>

        <div class="upload-size">
            ${formatBytes(file.size)}
        </div>

    </div>

</div>
`;
}

createCard.index = 0;

// -----------------------------
// Dispatch Event
// -----------------------------

function dispatch(files) {

    window.dispatchEvent(
        new CustomEvent("converter-upload", {
            detail: {
                files: [...files]
            }
        })
    );
}

// -----------------------------
// Utils
// -----------------------------

function getElement(custom, fallback) {
    if (custom) {
        return typeof custom === "string"
            ? document.querySelector(custom)
            : custom;
    }

    return document.querySelector(fallback);
}

function formatBytes(bytes) {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];

    const i = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    return (
        bytes / Math.pow(1024, i)
    ).toFixed(2) + " " + units[i];
}

function escapeHtml(text) {
    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

// -----------------------------
// Global API
// -----------------------------

window.Upload = {
    clear() {
        const preview = document.getElementById("preview");
        const input = document.getElementById("fileInput");

        if (preview) preview.innerHTML = "";
        if (input) input.value = "";

        createCard.index = 0;
    }
};
