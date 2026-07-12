/**
 * FileController
 * 파일 형식 검증, 중복 제거, 선택 삭제, 정렬을 담당한다.
 * UI와 저장소 구현에 의존하지 않아 다른 이미지 변환기에서도 재사용할 수 있다.
 */
export function fileKey(file) {
  return [file?.name || "", Number(file?.size || 0), Number(file?.lastModified || 0), file?.type || ""].join("::");
}

export function matchesAcceptedFile(file, { mimeTypes = [], extensions = [] } = {}) {
  if (!file) return false;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const normalizedExtensions = extensions.map(ext => String(ext).toLowerCase().replace(/^\./, ""));
  return mimeTypes.map(value => String(value).toLowerCase()).includes(type) ||
    normalizedExtensions.some(ext => name.endsWith(`.${ext}`));
}

export function isPngFile(file) {
  return matchesAcceptedFile(file, { mimeTypes: ["image/png"], extensions: ["png"] });
}

export function validateIncomingFiles(incoming, {
  currentCount = 0,
  maxFiles = 100,
  maxFileSize = 100 * 1024 * 1024,
  accepts = isPngFile,
  formatLabel = "지원 형식",
} = {}) {
  const rejected = [];
  const valid = [];

  for (const file of Array.from(incoming || [])) {
    if (!accepts(file)) rejected.push(`${file?.name || "이름 없는 파일"}: ${formatLabel}이 아닙니다.`);
    else if (file.size > maxFileSize) rejected.push(`${file.name}: ${Math.round(maxFileSize / 1024 / 1024)}MB를 초과했습니다.`);
    else valid.push(file);
  }

  const room = Math.max(0, maxFiles - currentCount);
  if (valid.length > room) {
    rejected.push(`최대 ${maxFiles}개까지만 추가할 수 있어 ${valid.length - room}개를 제외했습니다.`);
  }

  return { accepted: valid.slice(0, room), rejected };
}

export function mergeUniqueFiles(currentFiles, incomingFiles) {
  const merged = [...currentFiles];
  const seen = new Set(currentFiles.map(fileKey));
  const added = [];

  for (const file of incomingFiles) {
    const key = fileKey(file);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(file);
    added.push(file);
  }

  return { files: merged, added };
}

export function removeSelectedFiles(files, selectedKeys) {
  const selected = selectedKeys instanceof Set ? selectedKeys : new Set(selectedKeys || []);
  return files.filter(file => !selected.has(fileKey(file)));
}

export async function sortFileList(files, mode, {
  originalOrder = [],
  estimates = new Map(),
  getDimensions = async () => ({ w: 0, h: 0 }),
} = {}) {
  const sorted = [...files];
  const savingRate = file => {
    const resultSize = estimates.get(fileKey(file));
    return Number.isFinite(resultSize) && file.size ? (file.size - resultSize) / file.size : -Infinity;
  };

  if (mode === "pixels-desc") {
    const dimensions = new Map();
    await Promise.all(sorted.map(async file => dimensions.set(fileKey(file), await getDimensions(file))));
    sorted.sort((a, b) => {
      const da = dimensions.get(fileKey(a)) || {};
      const db = dimensions.get(fileKey(b)) || {};
      return Number(db.w || 0) * Number(db.h || 0) - Number(da.w || 0) * Number(da.h || 0);
    });
    return sorted;
  }

  const comparators = {
    original: (a, b) => originalOrder.indexOf(fileKey(a)) - originalOrder.indexOf(fileKey(b)),
    "name-asc": (a, b) => a.name.localeCompare(b.name, "ko"),
    "name-desc": (a, b) => b.name.localeCompare(a.name, "ko"),
    "size-desc": (a, b) => b.size - a.size,
    "size-asc": (a, b) => a.size - b.size,
    "estimate-desc": (a, b) => (estimates.get(fileKey(b)) ?? -1) - (estimates.get(fileKey(a)) ?? -1),
    "saving-desc": (a, b) => savingRate(b) - savingRate(a),
  };

  sorted.sort(comparators[mode] || comparators.original);
  return sorted;
}
