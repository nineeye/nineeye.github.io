const CACHE_VERSION = "converter-mall-v1.44.0";
const CORE_CACHE = `${CACHE_VERSION}-core`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const USER_OFFLINE_CACHE = `${CACHE_VERSION}-user-offline`;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./site.webmanifest",
  "./assets/icons/converter-mall.svg",
  "./assets/icons/converter-mall-192.png",
  "./assets/icons/converter-mall-512.png",
  "./assets/css/main.css",
  "./assets/css/upload.css",
  "./assets/css/toast.css",
  "./assets/css/image-converter-page.css",
  "./assets/css/png-special-tool.css",
  "./assets/js/app.js",
  "./assets/js/pwa-register.js",
  "./assets/js/image-platform/ImageConverterApp.js",
  "./assets/js/png-tools/PngSpecialToolApp.js",
  "./assets/js/png-tools/encoders.js",
  "./assets/js/image-platform/templates/ConverterPageTemplate.js",
  "./data/tools.json",
  "./data/image-converters.json",
  "./sitemap.xml",
  "./data/seo-pages.json",
  "./assets/js/page-foundation.js",
  "./assets/js/pdf-tools/PDFRuntimeLoader.js",
  "./assets/js/pdf-tools/PDFToolApp.js",
  "./assets/css/pdf-tool.css",
  "./assets/css/pdf-runtime-check.css",
  "./pdf-runtime-check/",
  "./assets/js/pdf-tools/PDFRuntimeDiagnostics.js",
  "./assets/js/reviews/ReviewService.js",
  "./assets/css/foundation-seo.css"
];

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function classifyCacheError(error) {
  const message = String(error?.message || error || "unknown");
  const name = String(error?.name || "Error");
  const lower = `${name} ${message}`.toLowerCase();
  if (lower.includes("quota") || lower.includes("storage")) return "storage-full";
  if (lower.includes("abort") || lower.includes("timeout")) return "timeout";
  if (lower.includes("network") || lower.includes("fetch")) return "network";
  return "unknown";
}

async function fetchWithTimeout(request, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(request, { signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

async function cacheAssetList(cacheName, urls, { replace = false, retries = 2, timeoutMs = 12000 } = {}) {
  if (replace) await caches.delete(cacheName);
  const cache = await caches.open(cacheName);
  const failures = [];
  let cached = 0;
  let recovered = 0;
  for (const url of urls) {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const request = new Request(url, { cache: "reload" });
        const response = await fetchWithTimeout(request, timeoutMs);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await cache.put(request, response.clone());
        cached += 1;
        if (attempt > 0) recovered += 1;
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < retries) await sleep(300 * (attempt + 1));
      }
    }
    if (lastError) failures.push({ url, error: String(lastError?.message || lastError), type: classifyCacheError(lastError) });
  }
  return { cacheName, requested: urls.length, cached, recovered, failures, complete: failures.length === 0 };
}


async function trimCache(cacheName, keepUrls = [], maxEntries = 24) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const keep = new Set(keepUrls.map(url => new URL(url, self.location).href));
  let removed = 0;
  for (const request of keys) {
    if (keys.length - removed <= maxEntries) break;
    if (keep.has(request.url)) continue;
    if (await cache.delete(request)) removed += 1;
  }
  return { cacheName, before: keys.length, removed, remaining: Math.max(0, keys.length - removed) };
}

async function recoverStoragePressure({ usage = null, quota = null, targetRatio = 0.72 } = {}) {
  const report = { usage, quota, targetRatio, ratioBefore: null, actions: [], ratioAfter: null };
  if (Number.isFinite(usage) && Number.isFinite(quota) && quota > 0) report.ratioBefore = usage / quota;

  const runtimeDeleted = await caches.delete(RUNTIME_CACHE);
  report.actions.push({ type: 'delete-runtime-cache', deleted: runtimeDeleted });

  const trim = await trimCache(USER_OFFLINE_CACHE, ['./', './offline.html',
  './converters/pdf-heading-outline-report/index.html',
  './converters/pdf-duplicate-page-report/index.html',
  './converters/pdf-language-script-report/index.html',
  './converters/pdf-sensitive-pattern-report/index.html',
  './converters/pdf-keyword-frequency-report/index.html'], 18);
  report.actions.push({ type: 'trim-user-offline-cache', ...trim });

  if (self.navigator?.storage?.estimate) {
    try {
      const estimate = await self.navigator.storage.estimate();
      report.usageAfter = estimate.usage ?? null;
      report.quotaAfter = estimate.quota ?? null;
      if (Number.isFinite(report.usageAfter) && Number.isFinite(report.quotaAfter) && report.quotaAfter > 0) {
        report.ratioAfter = report.usageAfter / report.quotaAfter;
      }
    } catch {}
  }
  return report;
}


async function prioritizeOfflineConverters(entries = [], { maxConverters = 4 } = {}) {
  const normalized = Array.isArray(entries) ? entries
    .filter(item => item && typeof item.url === "string")
    .map(item => ({
      url: item.url,
      id: String(item.id || ""),
      score: Number(item.score) || 0,
      lastUsed: Number(item.lastUsed) || 0,
      patternScore: Number(item.patternScore) || 0,
      hourAffinity: Number(item.hourAffinity) || 0,
      weekdayAffinity: Number(item.weekdayAffinity) || 0,
      predictionReliability: Number(item.predictionReliability) || 1,
      auditSamples: Number(item.auditSamples) || 0,
      patternRefinementMode: String(item.patternRefinementMode || "exact"),
      patternHourFactor: Number(item.patternHourFactor) || 1,
      patternWindowHours: Array.isArray(item.patternWindowHours) ? item.patternWindowHours.map(Number).filter(Number.isFinite) : []
    }))
    .sort((a, b) => b.score - a.score || b.patternScore - a.patternScore || b.lastUsed - a.lastUsed) : [];
  const selected = normalized.slice(0, Math.max(1, maxConverters));
  const urls = ["./", "./offline.html", ...selected.map(item => item.url)];
  const result = await cacheAssetList(USER_OFFLINE_CACHE, urls, { replace: true, retries: 2, timeoutMs: 15000 });
  return { ...result, selected, excluded: normalized.slice(selected.length), policy: "refined-audited-predictive-time-day-decayed-priority" };
}

async function inspectCaches() {
  const names = await caches.keys();
  const cachesInfo = [];
  for (const name of names) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    cachesInfo.push({ name, entries: keys.length });
  }
  const missingCore = [];
  for (const url of CORE_ASSETS) {
    const request = new Request(url);
    if (!(await caches.match(request))) missingCore.push(url);
  }
  return {
    version: CACHE_VERSION,
    names,
    caches: cachesInfo,
    missingCore,
    coreHealthy: missingCore.length === 0
  };
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const result = await cacheAssetList(CORE_CACHE, CORE_ASSETS, { replace: true });
    if (result.failures.length) {
      console.warn("Converter Mall core cache partial install", result.failures);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const keep = new Set([CORE_CACHE, RUNTIME_CACHE, USER_OFFLINE_CACHE]);
    await Promise.all(keys
      .filter(key => key.startsWith("converter-mall-") && !keep.has(key))
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  const type = event.data?.type;
  if (type === "SKIP_WAITING") self.skipWaiting();
  if (type === "CLEAR_RUNTIME_CACHE") {
    event.waitUntil((async () => {
      const deleted = await caches.delete(RUNTIME_CACHE);
      event.source?.postMessage({ type: "RUNTIME_CACHE_CLEARED", deleted });
    })());
  }
  if (type === "GET_CACHE_STATUS") {
    event.waitUntil((async () => {
      event.source?.postMessage({ type: "CACHE_STATUS", ...(await inspectCaches()) });
    })());
  }
  if (type === "REPAIR_CORE_CACHE") {
    event.waitUntil((async () => {
      const result = await cacheAssetList(CORE_CACHE, CORE_ASSETS, { replace: true });
      event.source?.postMessage({ type: "CORE_CACHE_REPAIRED", result, status: await inspectCaches() });
    })());
  }
  if (type === "WARM_OFFLINE_URLS") {
    event.waitUntil((async () => {
      const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
      const result = await cacheAssetList(USER_OFFLINE_CACHE, urls, { replace: false });
      event.source?.postMessage({ type: "OFFLINE_URLS_WARMED", result });
    })());
  }
  if (type === "PRIORITIZE_OFFLINE_CONVERTERS") {
    event.waitUntil((async () => {
      const entries = Array.isArray(event.data.entries) ? event.data.entries : [];
      const maxConverters = Number(event.data.maxConverters) || 4;
      const result = await prioritizeOfflineConverters(entries, { maxConverters });
      event.source?.postMessage({ type: "OFFLINE_CONVERTERS_PRIORITIZED", result });
    })());
  }

  if (type === "AUTO_RECOVER_STORAGE") {
    event.waitUntil((async () => {
      const result = await recoverStoragePressure(event.data || {});
      event.source?.postMessage({ type: "STORAGE_RECOVERY_COMPLETED", result, status: await inspectCaches() });
    })());
  }
  if (type === "RETRY_FAILED_URLS") {
    event.waitUntil((async () => {
      const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
      const cacheName = event.data.cacheName || USER_OFFLINE_CACHE;
      const result = await cacheAssetList(cacheName, urls, { replace: false, retries: 3, timeoutMs: 15000 });
      event.source?.postMessage({ type: "FAILED_URLS_RETRIED", result });
    })());
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(request, response.clone());
        return response;
      } catch {
        return (await caches.match(request)) || (await caches.match("./offline.html"));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) {
      event.waitUntil((async () => {
        try {
          const fresh = await fetch(request);
          if (fresh.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            await cache.put(request, fresh.clone());
          }
        } catch {}
      })());
      return cached;
    }
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response("오프라인 상태에서 이 리소스를 불러올 수 없습니다.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  })());
});
