// =====================================
// Converter Mall
// Upload Utils
// =====================================

export function formatBytes(bytes = 0) {

    if (!bytes) return "0 B";

    const units = [

        "B",
        "KB",
        "MB",
        "GB",
        "TB"

    ];

    const index = Math.floor(

        Math.log(bytes) / Math.log(1024)

    );

    const value =

        bytes / Math.pow(1024, index);

    return `${value.toFixed(2)} ${units[index]}`;

}

export function escapeHTML(text = "") {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}

export function isImage(file) {

    return file?.type?.startsWith("image/");

}

export function isPNG(file) {

    return file?.type === "image/png";

}

export function isJPEG(file) {

    return file?.type === "image/jpeg";

}

export function isWebP(file) {

    return file?.type === "image/webp";

}

export function isPDF(file) {

    return file?.type === "application/pdf";

}

export function isCSV(file) {

    return file?.type === "text/csv" ||

           file?.name?.toLowerCase().endsWith(".csv");

}

export function isJSON(file) {

    return file?.type === "application/json" ||

           file?.name?.toLowerCase().endsWith(".json");

}

export function readAsDataURL(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = reject;

        reader.readAsDataURL(file);

    });

}

export function readAsText(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = reject;

        reader.readAsText(file);

    });

}

export function readAsArrayBuffer(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = reject;

        reader.readAsArrayBuffer(file);

    });

}

export function uuid() {

    if (crypto.randomUUID) {

        return crypto.randomUUID();

    }

    return Date.now().toString(36) +

           Math.random().toString(36).slice(2);

}

export function sleep(ms) {

    return new Promise(resolve => {

        setTimeout(resolve, ms);

    });

}