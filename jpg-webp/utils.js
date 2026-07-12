export function formatBytes(bytes) {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

export function sumSize(files) {
    return files.reduce((sum, file) => sum + file.size, 0);
}

export function changeExtension(fileName, extension) {
    return fileName.replace(/\.[^/.]+$/, `.${extension}`);
}

export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function updateProgress(els, current, total) {
    const percent = total === 0 ? 0 : Math.round((current / total) * 100);
    els.progressBar.style.width = `${percent}%`;
}