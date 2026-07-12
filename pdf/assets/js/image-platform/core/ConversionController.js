/**
 * Adaptive conversion pipeline shared by image converters.
 * Owns start/cancel/retry/progress/result collection while the page supplies
 * format-specific settings, naming and UI callbacks.
 */
export function createConversionController({
  mapPool,
  transformWithRetry,
  verifyOutput,
  getAdaptivePlan,
  getFallbackProfile,
  yieldToMainThread,
  getCache,
  getCacheKey,
  getSettings,
  getFileKey,
  buildOutputName,
  uniqueName,
  maxPixels,
  outputMimeType = "image/jpeg",
  preserveAlpha = false,
  maxAttempts = 2,
}) {
  const required = {
    mapPool,
    transformWithRetry,
    verifyOutput,
    getAdaptivePlan,
    getFallbackProfile,
    yieldToMainThread,
    getCache,
    getCacheKey,
    getSettings,
    getFileKey,
    buildOutputName,
    uniqueName,
  };
  for (const [name, value] of Object.entries(required)) {
    if (typeof value !== "function") throw new TypeError(`${name} is required`);
  }

  let running = false;
  let cancelRequested = false;

  function isRunning() {
    return running;
  }

  function requestCancel() {
    cancelRequested = true;
    return running;
  }

  async function buildPlan(files) {
    try {
      return await getAdaptivePlan(files);
    } catch {
      const profile = getFallbackProfile();
      return {
        profile,
        workers: Math.max(1, Number(profile?.workers || 1)),
        batchSize: Math.max(1, Number(profile?.workers || 1) * 2),
        batches: [files],
        heavy: 0,
        totalWeight: files.length,
      };
    }
  }

  async function run(files, hooks = {}) {
    const targets = Array.from(files || []);
    if (running) return { skipped: true, reason: "already-running" };
    if (!targets.length) return { skipped: true, reason: "empty" };

    running = true;
    cancelRequested = false;
    const startedAt = performance.now();
    let done = 0;
    let failed = 0;
    const errors = [];
    const rawResults = new Array(targets.length);

    hooks.onStart?.({ total: targets.length });

    try {
      const plan = await buildPlan(targets);
      const indexMap = new Map(targets.map((file, index) => [getFileKey(file), index]));

      const emitProgress = (batchIndex = 0) => {
        const elapsedSeconds = Math.max(0.001, (performance.now() - startedAt) / 1000);
        const speed = done / elapsedSeconds;
        const remainingSeconds = done ? (targets.length - done) / Math.max(0.01, speed) : null;
        hooks.onProgress?.({
          done,
          total: targets.length,
          percent: Math.round((done / targets.length) * 100),
          speed,
          remainingSeconds,
          workers: plan.workers,
          batchIndex,
          batchNumber: Math.min(batchIndex + 1, plan.batches.length),
          batchCount: plan.batches.length,
          plan,
        });
      };

      hooks.onPlan?.(plan);
      await yieldToMainThread();

      for (let batchIndex = 0; batchIndex < plan.batches.length; batchIndex += 1) {
        if (cancelRequested) break;
        const batch = plan.batches[batchIndex];

        await mapPool(batch, plan.workers, async (file) => {
          if (cancelRequested) return;
          const index = indexMap.get(getFileKey(file));
          try {
            const settings = getSettings(file);
            const cacheKey = getCacheKey(file, settings);
            let blob = getCache(cacheKey);
            if (!blob) {
              blob = await transformWithRetry(file, settings, {
                maxAttempts,
                maxPixels,
                outputMimeType,
              });
            } else {
              await verifyOutput(blob);
            }
            if (!cancelRequested) rawResults[index] = { file, blob, settings };
          } catch (error) {
            failed += 1;
            errors.push(`${file.name}: ${error?.message || "변환 실패"}`);
            hooks.onItemError?.({ file, error });
          } finally {
            done += 1;
            emitProgress(batchIndex);
            await yieldToMainThread();
          }
        });

        if (batchIndex < plan.batches.length - 1 && !cancelRequested) {
          hooks.onBatchComplete?.({ batchIndex, batchCount: plan.batches.length, plan });
          await yieldToMainThread();
          await yieldToMainThread(24);
        }
      }

      const usedNames = [];
      const results = [];
      for (let index = 0; index < rawResults.length; index += 1) {
        const result = rawResults[index];
        if (!result) continue;
        const name = uniqueName(buildOutputName(result.file, index), usedNames);
        usedNames.push(name);
        results.push({ ...result, name });
      }

      const elapsedMs = performance.now() - startedAt;
      const summary = {
        skipped: false,
        cancelled: cancelRequested,
        total: targets.length,
        done,
        failed,
        errors,
        results,
        elapsedMs,
        plan,
      };
      hooks.onComplete?.(summary);
      return summary;
    } finally {
      running = false;
    }
  }

  return { run, requestCancel, isRunning };
}
