/**
 * Conversion preview engine shared by image converters.
 * Owns debounced size estimation, preview result caching and comparison output.
 */
export function createPreviewEstimator({
  mapPool,
  transformImage,
  transformWithRetry,
  resultCache,
  getFiles,
  getSelectedKeys,
  getFileKey,
  getSettings,
  getCacheKey,
  findCard,
  formatSize,
  renderSummary,
  updateBalance,
  concurrency = 2,
  maxPixels,
  outputMimeType = "image/jpeg",
  preserveAlpha = false,
  debounceMs = 120,
}) {
  const required = {
    mapPool,
    transformImage,
    transformWithRetry,
    getFiles,
    getSelectedKeys,
    getFileKey,
    getSettings,
    getCacheKey,
    findCard,
    formatSize,
    renderSummary,
    updateBalance,
  };
  for (const [name, value] of Object.entries(required)) {
    if (typeof value !== "function") throw new TypeError(`${name} is required`);
  }
  if (!resultCache || typeof resultCache.get !== "function" || typeof resultCache.set !== "function") {
    throw new TypeError("resultCache is required");
  }

  const estimates = new Map();
  let timer = null;
  let sequence = 0;

  function cancel() {
    clearTimeout(timer);
    timer = null;
    sequence += 1;
  }

  function clear() {
    cancel();
    estimates.clear();
  }

  function deleteFile(file) {
    estimates.delete(getFileKey(file));
  }

  function schedule(elements) {
    clearTimeout(timer);
    const current = ++sequence;
    if (elements?.convertedSize) elements.convertedSize.textContent = "계산중...";
    timer = setTimeout(() => run(elements, current), debounceMs);
  }

  async function run(elements, current = ++sequence) {
    estimates.clear();
    let originalBytes = 0;
    let convertedBytes = 0;
    let completed = 0;
    const files = Array.from(getFiles() || []);
    const selected = getSelectedKeys();
    const targets = files.filter(file => selected.has(getFileKey(file)));

    for (const file of files) {
      if (selected.has(getFileKey(file))) continue;
      const card = findCard(elements, file);
      const sizeNode = card?.querySelector(".est-size");
      const savingNode = card?.querySelector(".est-save");
      if (sizeNode) sizeNode.textContent = "계산 제외";
      if (savingNode) savingNode.textContent = "파일을 선택하면 계산됩니다.";
    }

    await mapPool(targets, concurrency, async file => {
      if (current !== sequence) return;
      const card = findCard(elements, file);
      const sizeNode = card?.querySelector(".est-size");
      const savingNode = card?.querySelector(".est-save");
      const settings = getSettings(file, elements);
      const cacheKey = getCacheKey(file, settings);

      try {
        let blob = resultCache.get(cacheKey);
        if (!blob) {
          blob = await transformImage(file, settings, { maxPixels, outputMimeType, preserveAlpha });
          if (current !== sequence) return;
          resultCache.set(cacheKey, blob);
        }
        if (current !== sequence) return;

        estimates.set(getFileKey(file), blob.size);
        originalBytes += file.size;
        convertedBytes += blob.size;
        completed += 1;

        if (sizeNode) sizeNode.textContent = formatSize(blob.size);
        const saved = file.size - blob.size;
        const rate = file.size ? (saved / file.size) * 100 : 0;
        if (savingNode) {
          savingNode.textContent = saved >= 0
            ? `${formatSize(saved)} 절감 · ${rate.toFixed(1)}%`
            : `${formatSize(-saved)} 증가`;
          savingNode.className = `est-save ${saved >= 0 ? "saving-positive" : "saving-negative"}`;
        }
      } catch {
        if (sizeNode) sizeNode.textContent = "계산 실패";
        if (savingNode) savingNode.textContent = "이미지를 확인해 주세요.";
      }
    });

    if (current !== sequence) return null;
    if (!completed) {
      if (elements?.convertedSize) elements.convertedSize.textContent = "-";
      if (elements?.savedSize) elements.savedSize.textContent = "-";
      if (elements?.compressionRate) elements.compressionRate.textContent = "-";
      updateBalance(elements, 0, 0);
      return { originalBytes: 0, convertedBytes: 0, completed: 0 };
    }

    renderSummary(elements, originalBytes, convertedBytes);
    updateBalance(elements, originalBytes, convertedBytes);
    return { originalBytes, convertedBytes, completed };
  }

  async function createComparison(file, elements, attempts = 2) {
    const settings = getSettings(file, elements);
    const cacheKey = getCacheKey(file, settings);
    let blob = resultCache.get(cacheKey);
    if (!blob) {
      blob = await transformWithRetry(file, settings, {
        maxAttempts: attempts,
        maxPixels,
        outputMimeType,
        preserveAlpha,
      });
      resultCache.set(cacheKey, blob);
    }
    return { blob, settings };
  }

  return {
    estimates,
    schedule,
    run,
    cancel,
    clear,
    deleteFile,
    createComparison,
  };
}
