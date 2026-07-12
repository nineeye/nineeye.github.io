/**
 * Creates the shared runtime services for an image converter page.
 * Converter-specific behavior is injected, so later tools can reuse the same
 * state, persistence, download, workspace, and optimization infrastructure.
 */
export function createConverterApp(options = {}) {
  const {
    definition = {},
    storage = globalThis.localStorage,
    sessionStorage = globalThis.sessionStorage,
    navigatorObject = globalThis.navigator ?? {},
    createJsonStore,
    createConverterState,
    createOptimizationAdvisor,
    createDownloadManager,
    createSessionManager,
    createWorkspaceController,
    createFileWorkspaceView,
    createOptimizationView,
    createResultCache,
    keyOf,
    mapPool,
    sum,
    formatSize,
    renderWorkflow,
    saveBlob,
    makeZipFromBlobs,
    verifyZipBlob,
    verifyOutput,
    escapeHtml,
    showToast,
    limits = {},
    storageKeys = {},
  } = options;

  const required = {
    createJsonStore,
    createConverterState,
    createOptimizationAdvisor,
    createDownloadManager,
    createSessionManager,
    createWorkspaceController,
    createFileWorkspaceView,
    createOptimizationView,
    createResultCache,
    keyOf,
    mapPool,
    sum,
    formatSize,
    renderWorkflow,
    saveBlob,
    makeZipFromBlobs,
    verifyZipBlob,
    verifyOutput,
    escapeHtml,
    showToast,
  };

  for (const [name, value] of Object.entries(required)) {
    if (typeof value !== "function") {
      throw new TypeError(`createConverterApp: ${name} is required.`);
    }
  }

  const cpuCount = Math.max(2, Number(navigatorObject.hardwareConcurrency) || 4);
  const definitionLimits = definition.limits ?? {};
  const definitionStorageKeys = definition.storageKeys ?? {};
  const config = Object.freeze({
    maxFiles: limits.maxFiles ?? definitionLimits.maxFiles ?? 100,
    maxFileSize: limits.maxFileSize ?? definitionLimits.maxFileSize ?? 100 * 1024 * 1024,
    maxPixels: limits.maxPixels ?? definitionLimits.maxPixels ?? 80_000_000,
    maxEstimateCacheBytes: limits.maxEstimateCacheBytes ?? definitionLimits.maxEstimateCacheBytes ?? 180 * 1024 * 1024,
    cpuCount,
    estimateConcurrency: limits.estimateConcurrency ?? Math.min(3, Math.max(1, Math.floor(cpuCount / 3))),
    convertConcurrency: limits.convertConcurrency ?? Math.min(6, Math.max(2, Math.floor(cpuCount / 2))),
  });

  const keys = Object.freeze({
    settings: storageKeys.settings ?? definitionStorageKeys.settings ?? "converterMall.pngJpg.settings.v5",
    history: storageKeys.history ?? definitionStorageKeys.history ?? "converterMall.pngJpg.history.v1",
    session: storageKeys.session ?? definitionStorageKeys.session ?? "converterMall.pngJpg.session.v1",
    theme: storageKeys.theme ?? definitionStorageKeys.theme ?? "converterMall.theme",
    downloadReceipt: storageKeys.downloadReceipt ?? definitionStorageKeys.downloadReceipt ?? "converterMall.pngJpg.lastDownload.v1",
  });

  const settingsStore = createJsonStore(storage, keys.settings, () => ({}));
  const historyStore = createJsonStore(storage, keys.history, () => []);
  const themeStore = createJsonStore(storage, keys.theme, () => "light");
  const downloadReceiptStore = createJsonStore(storage, keys.downloadReceipt, () => null);
  const sessionStore = createJsonStore(sessionStorage, keys.session, () => ({
    startedAt: new Date().toISOString(),
    uploaded: 0,
    converted: 0,
    downloaded: 0,
    saved: 0,
    state: "대기",
  }));

  const converterState = createConverterState(keyOf);
  const estimateCache = createResultCache(config.maxEstimateCacheBytes);
  const optimizationAdvisor = createOptimizationAdvisor({ mapPool, sum });
  const downloadManager = createDownloadManager({
    saveBlob,
    makeZipFromBlobs,
    verifyZipBlob,
    verifyOutput,
    fmt: formatSize,
    sum,
    target: definition.target ?? {},
  });
  const sessionManager = createSessionManager({
    historyStore,
    sessionStore,
    downloadReceiptStore,
    formatSize,
    renderWorkflow,
  });
  const workspaceController = createWorkspaceController({ sum, formatSize });
  const fileWorkspaceView = createFileWorkspaceView({
    keyOf,
    formatSize,
    sum,
    concurrency: Math.min(6, cpuCount),
    sourceFormat: definition.source?.format ?? "FILE",
    targetFormat: definition.target?.format ?? "OUTPUT",
    features: definition.features ?? {},
  });
  const optimizationView = createOptimizationView({
    advisor: optimizationAdvisor,
    escapeHtml,
    showToast,
  });

  return Object.freeze({
    definition:Object.freeze({ ...definition }),
    config,
    keys,
    stores: Object.freeze({
      settingsStore,
      historyStore,
      themeStore,
      downloadReceiptStore,
      sessionStore,
    }),
    services: Object.freeze({
      converterState,
      estimateCache,
      optimizationAdvisor,
      downloadManager,
      sessionManager,
      workspaceController,
      fileWorkspaceView,
      optimizationView,
    }),
  });
}
