function assertFile(file) {
  if (!(file instanceof Blob)) throw new TypeError("A File or Blob is required.");
}

export function getExtension(name = "") {
  const clean = String(name).split(/[?#]/)[0];
  const index = clean.lastIndexOf(".");
  return index > -1 ? clean.slice(index + 1).toLowerCase() : "";
}

export function formatBytes(bytes, decimals = 2) {
  const value = Number(bytes) || 0;
  if (value === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(Math.max(0, decimals))} ${units[index]}`;
}

export class FileManager {
  static metadata(file) {
    assertFile(file);
    return Object.freeze({
      name: file.name || "blob",
      size: file.size,
      type: file.type || "application/octet-stream",
      extension: getExtension(file.name || ""),
      lastModified: file.lastModified || null
    });
  }

  static async readAsArrayBuffer(file) { assertFile(file); return file.arrayBuffer(); }
  static async readAsText(file, encoding = "utf-8") {
    assertFile(file);
    if (typeof TextDecoder === "undefined") return file.text();
    return new TextDecoder(encoding).decode(await file.arrayBuffer());
  }
  static objectURL(file) { assertFile(file); return URL.createObjectURL(file); }
  static revokeObjectURL(url) { if (url) URL.revokeObjectURL(url); }
  static async sha256(file) {
    assertFile(file);
    if (!globalThis.crypto?.subtle) throw new Error("Web Crypto API is unavailable.");
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  }
  static download(blob, filename = "download") {
    assertFile(blob);
    if (typeof document === "undefined") throw new Error("Download requires a browser document.");
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export default FileManager;
