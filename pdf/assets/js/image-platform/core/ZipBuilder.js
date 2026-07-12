/** Dependency-free ZIP writer used by browser-local converters. */
let crcTable = null;

export async function makeZipFromBlobs(items, onProgress, options = {}) {
  if (!Array.isArray(items)) throw new TypeError("ZIP 항목 배열이 필요합니다");
  if (items.length > 0xffff) throw new RangeError("ZIP 파일 개수는 65,535개를 초과할 수 없습니다");
  const signal = options?.signal;
  throwIfAborted(signal);
  const encoder = new TextEncoder();
  const parts = [];
  const centralEntries = [];
  let offset = 0;

  for (let index = 0; index < items.length; index += 1) {
    throwIfAborted(signal);
    const item = items[index];
    const name = encoder.encode(item.name);
    const data = new Uint8Array(await item.blob.arrayBuffer());
    throwIfAborted(signal);
    const crc = crc32(data);
    const time = dosTime();
    const date = dosDate();

    const header = new Uint8Array(30 + name.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, time, true);
    view.setUint16(12, date, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, name.length, true);
    view.setUint16(28, 0, true);
    header.set(name, 30);
    parts.push(header, data);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, date, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centralEntries.push(central);

    offset += header.length + data.length;
    onProgress?.(index + 1, items.length);
    if (index % 2 === 1) await new Promise(resolve => setTimeout(resolve, 0));
    throwIfAborted(signal);
  }

  throwIfAborted(signal);
  const centralSize = totalLength(centralEntries);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, items.length, true);
  endView.setUint16(10, items.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...parts, ...centralEntries, end], { type: "application/zip" });
}

export async function verifyZipBlob(blob, expectedCount) {
  if (!blob || blob.size < 22) throw new Error("ZIP 결과가 비어 있습니다");
  const tail = new Uint8Array(await blob.slice(-22).arrayBuffer());
  const view = new DataView(tail.buffer);
  if (view.getUint32(0, true) !== 0x06054b50) throw new Error("ZIP 끝 레코드 무결성 검사 실패");
  if (view.getUint16(10, true) !== expectedCount) throw new Error("ZIP 파일 개수 검증 실패");
  return true;
}

export function makeZip(entries) {
  if (!Array.isArray(entries)) throw new TypeError("ZIP 항목 배열이 필요합니다");
  if (entries.length > 0xffff) throw new RangeError("ZIP 파일 개수는 65,535개를 초과할 수 없습니다");
  const encoder = new TextEncoder();
  const localEntries = [];
  const centralEntries = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const time = dosTime();
    const date = dosDate();
    const local = new Uint8Array(30 + name.length + entry.data.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, time, true);
    localView.setUint16(12, date, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, entry.data.length, true);
    localView.setUint32(22, entry.data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);
    local.set(entry.data, 30 + name.length);
    localEntries.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, time, true);
    centralView.setUint16(14, date, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, entry.data.length, true);
    centralView.setUint32(24, entry.data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);
    centralEntries.push(central);
    offset += local.length;
  }

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, totalLength(centralEntries), true);
  endView.setUint32(16, offset, true);
  return new Blob([...localEntries, ...centralEntries, end], { type: "application/zip" });
}

function throwIfAborted(signal) {
  if (!signal?.aborted) return;
  if (signal.reason instanceof Error) throw signal.reason;
  const error = new Error("ZIP 생성이 취소되었습니다");
  error.name = "AbortError";
  throw error;
}

function totalLength(chunks) {
  return chunks.reduce((total, chunk) => total + chunk.length, 0);
}

function crc32(data) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let value = 0; value < 256; value += 1) {
      let current = value;
      for (let bit = 0; bit < 8; bit += 1) current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
      crcTable[value] = current >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosTime() {
  const date = new Date();
  return (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
}

function dosDate() {
  const date = new Date();
  return ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
}
