// =====================================
// Converter Mall
// Smart Conversion Planner
// Analyzes image dimensions, file size, transparency and visual complexity
// entirely in the browser, then recommends an output format and settings.
// =====================================

import { QualityVolumePredictor } from "./QualityVolumePredictor.js";
import { PredictionCorrectionPolicy } from "./PredictionCorrectionPolicy.js";
import { RecommendationStabilityEngine } from "./RecommendationStabilityEngine.js";

const IMAGE_FORMATS = new Set(["PNG", "JPG", "WEBP"]);
const DEFAULT_MAX_ANALYSIS_FILES = 12;
const DEFAULT_SAMPLE_SIZE = 96;

export class SmartConversionPlanner {
    constructor({ maxFiles = DEFAULT_MAX_ANALYSIS_FILES, sampleSize = DEFAULT_SAMPLE_SIZE } = {}) {
        this.maxFiles = Math.max(1, Number(maxFiles) || DEFAULT_MAX_ANALYSIS_FILES);
        this.sampleSize = Math.max(24, Math.min(160, Number(sampleSize) || DEFAULT_SAMPLE_SIZE));
        this.predictor = new QualityVolumePredictor();
        this.correctionPolicy = new PredictionCorrectionPolicy();
        this.stabilityEngine = new RecommendationStabilityEngine();
    }

    async analyzeGroups(groups = [], registry = []) {
        const imageGroups = groups.filter(group => IMAGE_FORMATS.has(group.format));
        const plans = [];

        for (const group of imageGroups) {
            const analysis = await this.analyzeFiles(group.files, group.format);
            const candidates = registry.filter(tool =>
                tool.status === "ready" &&
                tool.path &&
                normalizeFormat(tool.sourceFormat) === group.format
            );
            plans.push(this.buildPlan(group, analysis, candidates));
        }

        return plans;
    }

    getPolicyDashboard() {
        return {
            stability: this.stabilityEngine.getDashboard(),
            prediction: this.predictor.getStats()
        };
    }

    rollbackPolicy(sourceFormat, targetFormat) {
        return this.stabilityEngine.manualRollback(sourceFormat, targetFormat);
    }

    resetPolicies() {
        return this.stabilityEngine.resetAll();
    }

    clearPolicyHistory() {
        return this.stabilityEngine.clearHistory();
    }

    resetPredictionLearning() {
        return this.predictor.resetLearning();
    }

    exportPolicyState() {
        return this.stabilityEngine.exportState();
    }

    importPolicyState(payload, options) {
        return this.stabilityEngine.importState(payload, options);
    }

    exportPredictionLearning() {
        return this.predictor.exportLearning();
    }

    importPredictionLearning(payload, options) {
        return this.predictor.importLearning(payload, options);
    }

    async analyzeFiles(files = [], sourceFormat = "UNKNOWN") {
        const list = Array.from(files || []).slice(0, this.maxFiles);
        const results = await Promise.all(list.map(file => this.analyzeFile(file).catch(() => fallbackResult(file))));
        const valid = results.filter(Boolean);
        const totalBytes = files.reduce((sum, file) => sum + Number(file?.size || 0), 0);
        const analyzedBytes = valid.reduce((sum, item) => sum + Number(item.size || 0), 0);
        const maxWidth = Math.max(0, ...valid.map(item => item.width || 0));
        const maxHeight = Math.max(0, ...valid.map(item => item.height || 0));
        const maxPixels = Math.max(0, ...valid.map(item => item.pixels || 0));
        const averagePixels = valid.length
            ? valid.reduce((sum, item) => sum + item.pixels, 0) / valid.length
            : 0;
        const transparentCount = valid.filter(item => item.hasTransparency).length;
        const photoLikeCount = valid.filter(item => item.photoScore >= 0.58).length;
        const graphicLikeCount = valid.filter(item => item.photoScore < 0.58).length;
        const averagePhotoScore = valid.length
            ? valid.reduce((sum, item) => sum + item.photoScore, 0) / valid.length
            : 0;

        return {
            sourceFormat,
            fileCount: files.length,
            analyzedCount: valid.length,
            sampled: files.length > list.length,
            totalBytes,
            analyzedBytes,
            maxWidth,
            maxHeight,
            maxPixels,
            averagePixels,
            transparentCount,
            transparencyRatio: valid.length ? transparentCount / valid.length : 0,
            photoLikeCount,
            graphicLikeCount,
            averagePhotoScore,
            veryLargeCount: valid.filter(item => item.pixels >= 24_000_000 || item.size >= 20 * 1024 * 1024).length,
            files: valid
        };
    }

    async analyzeFile(file) {
        if (!file || !String(file.type || "").startsWith("image/")) return fallbackResult(file);
        const source = await decodeImage(file);
        try {
            const width = Number(source.width || source.naturalWidth || 0);
            const height = Number(source.height || source.naturalHeight || 0);
            const canvas = document.createElement("canvas");
            const ratio = Math.min(1, this.sampleSize / Math.max(width, height, 1));
            canvas.width = Math.max(1, Math.round(width * ratio));
            canvas.height = Math.max(1, Math.round(height * ratio));
            const context = canvas.getContext("2d", { willReadFrequently: true, alpha: true });
            context.drawImage(source, 0, 0, canvas.width, canvas.height);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
            const metrics = inspectPixels(pixels);

            return {
                name: String(file.name || "image"),
                size: Number(file.size || 0),
                width,
                height,
                pixels: width * height,
                hasTransparency: metrics.transparentRatio > 0.002,
                transparentRatio: metrics.transparentRatio,
                colorVariance: metrics.colorVariance,
                edgeRatio: metrics.edgeRatio,
                uniqueColorRatio: metrics.uniqueColorRatio,
                photoScore: calculatePhotoScore(metrics)
            };
        } finally {
            source.close?.();
        }
    }

    buildPlan(group, analysis, candidates) {
        const source = group.format;
        const preferredTarget = choosePreferredTarget(source, analysis, candidates);
        const preferredTool = candidates.find(tool => normalizeFormat(tool.targetFormat) === preferredTarget)
            || candidates[0]
            || null;
        const initialResize = recommendResize(analysis);
        const initialQuality = recommendQuality(preferredTarget, analysis);
        const initialPrediction = this.predictor.predict({
            sourceFormat: source,
            targetFormat: preferredTarget,
            totalBytes: analysis.totalBytes,
            quality: initialQuality,
            resizeScale: estimateResizeScale(initialResize, analysis),
            photoScore: analysis.averagePhotoScore,
            transparencyRatio: analysis.transparencyRatio
        });
        const correction = this.correctionPolicy.apply({
            targetFormat: preferredTarget,
            quality: initialQuality,
            resize: initialResize,
            prediction: initialPrediction,
            analysis
        });
        const stability = this.stabilityEngine.stabilize({
            sourceFormat: source,
            targetFormat: preferredTarget,
            baseQuality: initialQuality,
            baseResize: initialResize,
            correction,
            prediction: initialPrediction
        });
        const resize = stability.resize;
        const quality = stability.quality;
        const background = analysis.transparentCount > 0 && preferredTarget === "JPG" ? "white" : null;
        const resizeScale = estimateResizeScale(resize, analysis);
        const prediction = this.predictor.predict({
            sourceFormat: source,
            targetFormat: preferredTarget,
            totalBytes: analysis.totalBytes,
            quality,
            resizeScale,
            photoScore: analysis.averagePhotoScore,
            transparencyRatio: analysis.transparencyRatio
        });
        const reasons = buildReasons(source, preferredTarget, analysis, resize);
        reasons.push(`예상 결과 ${formatBytes(prediction.predictedBytes)} · 절감률 ${prediction.savingRate.toFixed(1)}%입니다.`);
        if (prediction.calibrated) reasons.push(`이 브라우저의 실제 변환 ${prediction.calibratedSamples}건으로 예측을 자동 보정했습니다.`);
        const score = scorePlan(preferredTarget, analysis, preferredTool);

        return {
            sourceFormat: source,
            preferredTarget,
            preferredTool,
            score,
            quality,
            resize,
            background,
            prediction,
            correction,
            stability,
            reasons,
            analysis,
            alternatives: candidates
                .filter(tool => tool !== preferredTool)
                .map(tool => ({
                    tool,
                    target: normalizeFormat(tool.targetFormat),
                    score: scorePlan(normalizeFormat(tool.targetFormat), analysis, tool)
                }))
                .sort((a, b) => b.score - a.score)
        };
    }
}

function choosePreferredTarget(source, analysis, candidates) {
    const available = new Set(candidates.map(tool => normalizeFormat(tool.targetFormat)));
    const hasAlpha = analysis.transparencyRatio > 0;
    const mostlyPhoto = analysis.averagePhotoScore >= 0.58;

    if (hasAlpha && available.has("WEBP")) return "WEBP";
    if (hasAlpha && available.has("PNG")) return "PNG";
    if (mostlyPhoto && available.has("WEBP")) return "WEBP";
    if (mostlyPhoto && available.has("JPG")) return "JPG";
    if (source === "JPG" && available.has("WEBP")) return "WEBP";
    if (source === "WEBP" && available.has("JPG") && !hasAlpha) return "JPG";
    if (available.has("WEBP")) return "WEBP";
    if (available.has("JPG")) return "JPG";
    if (available.has("PNG")) return "PNG";
    return candidates[0] ? normalizeFormat(candidates[0].targetFormat) : "UNKNOWN";
}

function recommendQuality(target, analysis) {
    if (target === "PNG") return null;
    if (analysis.averagePhotoScore >= 0.72) return 84;
    if (analysis.averagePhotoScore >= 0.52) return 88;
    return analysis.transparencyRatio > 0 ? 90 : 92;
}

function recommendResize(analysis) {
    const longest = Math.max(analysis.maxWidth, analysis.maxHeight);
    if (longest >= 8000 || analysis.maxPixels >= 40_000_000) return { mode: "width", value: 2400, label: "최대 2400px" };
    if (longest >= 4000 || analysis.averagePixels >= 12_000_000) return { mode: "width", value: 1920, label: "최대 1920px" };
    if (longest >= 2560) return { mode: "width", value: 1600, label: "최대 1600px" };
    return { mode: "original", value: longest || 0, label: "원본 해상도 유지" };
}

function buildReasons(source, target, analysis, resize) {
    const reasons = [];
    if (analysis.transparentCount > 0) {
        reasons.push(target === "WEBP" || target === "PNG"
            ? `투명 배경 ${analysis.transparentCount}개를 보존할 수 있습니다.`
            : `투명 배경 ${analysis.transparentCount}개는 흰색 배경으로 합성됩니다.`);
    }
    if (analysis.averagePhotoScore >= 0.58) reasons.push("사진형 이미지 비중이 높아 손실 압축 형식이 효율적입니다.");
    else reasons.push("그래픽·아이콘형 이미지가 많아 선명도 보존을 우선했습니다.");
    if (resize.mode !== "original") reasons.push(`초고해상도 파일이 있어 ${resize.label}을 권장합니다.`);
    if (analysis.totalBytes >= 20 * 1024 * 1024) reasons.push("전체 용량이 커서 웹 최적화 효과가 큽니다.");
    if (source === target) reasons.push("현재 형식 유지가 가장 적합합니다.");
    return reasons;
}

function scorePlan(target, analysis, tool) {
    let score = 70 + Math.min(12, Number(tool?.priority || 0) / 10);
    const hasAlpha = analysis.transparencyRatio > 0;
    const photo = analysis.averagePhotoScore >= 0.58;
    if (target === "WEBP") score += photo ? 18 : 12;
    if (target === "PNG") score += hasAlpha ? 18 : (photo ? -12 : 8);
    if (target === "JPG") score += photo ? 15 : 2;
    if (hasAlpha && target === "JPG") score -= 20;
    return Math.max(0, Math.min(100, Math.round(score)));
}

function inspectPixels(data) {
    const count = Math.max(1, data.length / 4);
    let transparent = 0;
    let sum = 0;
    let sumSquare = 0;
    let edges = 0;
    const colors = new Set();
    let previousLuma = null;

    for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const alpha = data[index + 3];
        if (alpha < 250) transparent += 1;
        const luma = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        sum += luma;
        sumSquare += luma * luma;
        if (previousLuma !== null && Math.abs(luma - previousLuma) > 32) edges += 1;
        previousLuma = luma;
        colors.add(`${red >> 4}${green >> 4}${blue >> 4}`);
    }

    const mean = sum / count;
    const variance = Math.max(0, sumSquare / count - mean * mean);
    return {
        transparentRatio: transparent / count,
        colorVariance: Math.min(1, variance / 4500),
        edgeRatio: Math.min(1, edges / count),
        uniqueColorRatio: Math.min(1, colors.size / Math.min(count, 4096))
    };
}

function calculatePhotoScore(metrics) {
    return clamp(
        metrics.colorVariance * 0.42 +
        metrics.uniqueColorRatio * 0.38 +
        (1 - Math.min(1, metrics.edgeRatio * 2.4)) * 0.20,
        0,
        1
    );
}

async function decodeImage(file) {
    if ("createImageBitmap" in globalThis) return createImageBitmap(file);
    return new Promise((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("이미지 분석에 실패했습니다."));
        };
        image.src = url;
    });
}

function fallbackResult(file) {
    return {
        name: String(file?.name || "image"),
        size: Number(file?.size || 0),
        width: 0,
        height: 0,
        pixels: 0,
        hasTransparency: false,
        transparentRatio: 0,
        colorVariance: 0.5,
        edgeRatio: 0.5,
        uniqueColorRatio: 0.5,
        photoScore: 0.5
    };
}

function normalizeFormat(value) {
    const normalized = String(value || "UNKNOWN").replace(/^\./, "").trim().toUpperCase();
    return normalized === "JPEG" ? "JPG" : normalized;
}

function estimateResizeScale(resize, analysis) {
    if (!resize || resize.mode === "original") return 1;
    const longest = Math.max(1, analysis.maxWidth, analysis.maxHeight);
    return clamp(Number(resize.value || longest) / longest, 0.02, 1);
}

function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (!value) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    return `${(value / (1024 ** index)).toFixed(index ? 2 : 0)} ${units[index]}`;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
