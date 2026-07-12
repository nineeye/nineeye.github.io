// =====================================
// Converter Mall
// Quality / Volume Prediction Engine
// Learns from completed browser-side conversions and uses those observations
// to improve future output-size estimates without uploading user files.
// =====================================

const STORAGE_KEY = "converterMall.qualityVolumePredictor.v1";
const MAX_BUCKET_SAMPLES = 80;

export class QualityVolumePredictor {
    constructor({ storageKey = STORAGE_KEY } = {}) {
        this.storageKey = storageKey;
        this.model = this.#read();
    }

    predict({ sourceFormat, targetFormat, totalBytes, quality, resizeScale = 1, photoScore = 0.5, transparencyRatio = 0 } = {}) {
        const source = normalizeFormat(sourceFormat);
        const target = normalizeFormat(targetFormat);
        const safeBytes = Math.max(0, Number(totalBytes) || 0);
        const safeQuality = clamp(Number(quality ?? defaultQuality(target)), 1, 100);
        const safeScale = clamp(Number(resizeScale) || 1, 0.02, 1);
        const visualBucket = photoScore >= 0.68 ? "photo" : photoScore <= 0.42 ? "graphic" : "mixed";
        const bucketKey = makeBucketKey(source, target, safeQuality, safeScale, visualBucket);
        const learned = this.model.buckets[bucketKey];
        const baselineRatio = estimateBaselineRatio({ source, target, quality: safeQuality, resizeScale: safeScale, photoScore, transparencyRatio });
        const learnedRatio = learned?.count ? learned.meanRatio : null;
        const weight = learned ? clamp(learned.count / 12, 0, 0.82) : 0;
        const ratio = clamp(baselineRatio * (1 - weight) + (learnedRatio ?? baselineRatio) * weight, 0.015, 3.5);
        const predictedBytes = Math.max(target === "PNG" ? 64 : 32, Math.round(safeBytes * ratio));
        const savingRate = safeBytes ? (1 - predictedBytes / safeBytes) * 100 : 0;
        const confidence = Math.round(clamp(52 + (learned?.count || 0) * 4 + (safeBytes > 0 ? 8 : 0), 45, 96));

        const audit = learned?.audit || null;
        const avgErrorRate = audit?.count ? audit.meanAbsolutePercentageError * 100 : null;
        const accuracyScore = avgErrorRate == null ? null : Math.round(clamp(100 - avgErrorRate, 0, 100));

        return {
            predictedBytes,
            savingRate,
            ratio,
            confidence,
            calibratedSamples: learned?.count || 0,
            calibrated: Boolean(learned?.count),
            auditedSamples: audit?.count || 0,
            avgErrorRate,
            accuracyScore,
            biasRate: audit?.count ? audit.meanSignedPercentageError * 100 : null,
            bucketKey
        };
    }

    recordBatch({ sourceFormat, targetFormat, results = [] } = {}) {
        const source = normalizeFormat(sourceFormat);
        const target = normalizeFormat(targetFormat);
        let recorded = 0;

        for (const result of results) {
            const originalBytes = Number(result?.file?.size || 0);
            const outputBytes = Number(result?.blob?.size || 0);
            if (!originalBytes || !outputBytes) continue;
            const settings = result?.settings || {};
            const quality = clamp(Math.round(Number(settings.quality ?? defaultQuality(target)) * (Number(settings.quality) <= 1 ? 100 : 1)), 1, 100);
            const resizeScale = inferResizeScale(settings);
            const visualBucket = "mixed";
            const key = makeBucketKey(source, target, quality, resizeScale, visualBucket);
            const ratio = clamp(outputBytes / originalBytes, 0.005, 5);
            const before = this.predict({
                sourceFormat: source,
                targetFormat: target,
                totalBytes: originalBytes,
                quality,
                resizeScale,
                photoScore: 0.5,
                transparencyRatio: 0
            });
            const absolutePercentageError = Math.abs(before.predictedBytes - outputBytes) / Math.max(1, outputBytes);
            const signedPercentageError = (before.predictedBytes - outputBytes) / Math.max(1, outputBytes);
            const previous = this.model.buckets[key] || { count: 0, meanRatio: ratio, m2: 0, updatedAt: 0, audit: createAudit() };
            const nextCount = Math.min(MAX_BUCKET_SAMPLES, previous.count + 1);
            const effectiveCount = previous.count >= MAX_BUCKET_SAMPLES ? MAX_BUCKET_SAMPLES - 1 : previous.count;
            const delta = ratio - previous.meanRatio;
            const meanRatio = previous.meanRatio + delta / Math.max(1, effectiveCount + 1);
            const m2 = Math.max(0, previous.m2 + delta * (ratio - meanRatio));
            const audit = updateAudit(previous.audit, absolutePercentageError, signedPercentageError);
            this.model.buckets[key] = { count: nextCount, meanRatio, m2, audit, updatedAt: Date.now() };
            recorded += 1;
        }

        if (recorded) {
            this.model.updatedAt = Date.now();
            this.model.totalSamples = Number(this.model.totalSamples || 0) + recorded;
            this.#prune();
            this.#write();
        }
        return recorded;
    }

    getStats() {
        const audits = Object.values(this.model.buckets || {})
            .map(bucket => bucket?.audit)
            .filter(audit => audit?.count);
        const auditedSamples = audits.reduce((sum, audit) => sum + audit.count, 0);
        const weightedError = audits.reduce((sum, audit) => sum + audit.meanAbsolutePercentageError * audit.count, 0);
        const avgErrorRate = auditedSamples ? weightedError / auditedSamples * 100 : null;
        return {
            totalSamples: Number(this.model.totalSamples || 0),
            bucketCount: Object.keys(this.model.buckets || {}).length,
            auditedSamples,
            avgErrorRate,
            accuracyScore: avgErrorRate == null ? null : Math.round(clamp(100 - avgErrorRate, 0, 100)),
            updatedAt: Number(this.model.updatedAt || 0)
        };
    }

    resetLearning() {
        const stats = this.getStats();
        this.model = { version: 1, totalSamples: 0, updatedAt: Date.now(), buckets: {} };
        this.#write();
        return stats;
    }

    exportLearning() {
        return JSON.parse(JSON.stringify(this.model));
    }

    importLearning(payload, { mode = "replace" } = {}) {
        if (!payload || typeof payload !== "object" || typeof payload.buckets !== "object") {
            throw new TypeError("예측 학습 백업 형식이 올바르지 않습니다.");
        }
        const incoming = {
            version: 1,
            totalSamples: Math.max(0, Number(payload.totalSamples || 0)),
            updatedAt: Number(payload.updatedAt || Date.now()),
            buckets: payload.buckets || {}
        };
        if (mode === "merge") {
            this.model = {
                version: 1,
                totalSamples: Number(this.model.totalSamples || 0) + incoming.totalSamples,
                updatedAt: Date.now(),
                buckets: { ...(this.model.buckets || {}), ...incoming.buckets }
            };
        } else {
            this.model = incoming;
        }
        this.#prune();
        this.#write();
        return this.getStats();
    }

    #read() {
        try {
            const parsed = JSON.parse(localStorage.getItem(this.storageKey) || "null");
            if (parsed && typeof parsed === "object" && parsed.buckets) return parsed;
        } catch {
            // Storage may be blocked. The predictor still works with its baseline model.
        }
        return { version: 1, totalSamples: 0, updatedAt: 0, buckets: {} };
    }

    #write() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.model));
        } catch {
            // Ignore storage failures and keep the in-memory model for this session.
        }
    }

    #prune() {
        const entries = Object.entries(this.model.buckets || {});
        if (entries.length <= 96) return;
        entries.sort((a, b) => Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0));
        this.model.buckets = Object.fromEntries(entries.slice(0, 96));
    }
}

function estimateBaselineRatio({ source, target, quality, resizeScale, photoScore, transparencyRatio }) {
    const pixelScale = Math.max(0.02, resizeScale * resizeScale);
    let ratio;

    if (target === "PNG") {
        ratio = source === "PNG" ? 0.98 : photoScore >= 0.6 ? 2.1 : 1.35;
    } else if (target === "WEBP") {
        ratio = source === "PNG" ? 0.30 : source === "JPG" ? 0.72 : 0.9;
        ratio *= 0.58 + quality / 170;
        if (transparencyRatio > 0) ratio *= 1.12;
        if (photoScore < 0.45) ratio *= 0.9;
    } else {
        ratio = source === "PNG" ? 0.26 : source === "WEBP" ? 1.18 : 0.94;
        ratio *= 0.54 + quality / 150;
        if (photoScore < 0.45) ratio *= 1.08;
        if (transparencyRatio > 0) ratio *= 1.04;
    }

    return ratio * pixelScale;
}

function inferResizeScale(settings = {}) {
    const mode = String(settings.resizeMode || "original");
    if (mode === "percent") return clamp(Number(settings.resizeValue || 100) / 100, 0.02, 1);
    if (mode === "original") return 1;
    // Width-based settings do not include the source width here, so use a conservative bucket.
    return 0.72;
}

function makeBucketKey(source, target, quality, resizeScale, visualBucket) {
    const qualityBucket = Math.round(quality / 10) * 10;
    const resizeBucket = resizeScale >= 0.9 ? "full" : resizeScale >= 0.6 ? "medium" : "small";
    return `${source}>${target}|q${qualityBucket}|${resizeBucket}|${visualBucket}`;
}

function defaultQuality(target) {
    return normalizeFormat(target) === "PNG" ? 100 : 88;
}

function normalizeFormat(value) {
    const normalized = String(value || "UNKNOWN").replace(/^\./, "").trim().toUpperCase();
    return normalized === "JPEG" ? "JPG" : normalized;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function createAudit() {
    return { count: 0, meanAbsolutePercentageError: 0, meanSignedPercentageError: 0 };
}

function updateAudit(previous, absoluteError, signedError) {
    const audit = previous && Number.isFinite(previous.count) ? previous : createAudit();
    const count = Math.min(MAX_BUCKET_SAMPLES, audit.count + 1);
    const baseCount = audit.count >= MAX_BUCKET_SAMPLES ? MAX_BUCKET_SAMPLES - 1 : audit.count;
    return {
        count,
        meanAbsolutePercentageError: audit.meanAbsolutePercentageError + (absoluteError - audit.meanAbsolutePercentageError) / Math.max(1, baseCount + 1),
        meanSignedPercentageError: audit.meanSignedPercentageError + (signedError - audit.meanSignedPercentageError) / Math.max(1, baseCount + 1)
    };
}
