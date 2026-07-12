/** Shared file and display helpers for image converters. */
export function saveBlob(blob, filename) {
  const anchor = document.createElement("a");
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function changeExt(name, extension) {
  return name.replace(/\.[^.]+$/, "") + "." + extension;
}

export function uniqueName(name, usedNames) {
  const used = new Set(Array.from(usedNames || [], value => String(value).toLowerCase()));
  const original = String(name || "file");
  if (!used.has(original.toLowerCase())) return original;

  const dot = original.lastIndexOf(".");
  const hasExtension = dot > 0 && dot < original.length - 1;
  const stem = hasExtension ? original.slice(0, dot) : original;
  const extension = hasExtension ? original.slice(dot) : "";
  let sequence = 2;
  let candidate = `${stem}-${sequence}${extension}`;
  while (used.has(candidate.toLowerCase())) {
    sequence += 1;
    candidate = `${stem}-${sequence}${extension}`;
  }
  return candidate;
}

export function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

export function fmt(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

export function esc(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);
}
