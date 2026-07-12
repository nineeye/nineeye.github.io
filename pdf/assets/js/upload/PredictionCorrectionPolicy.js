// =====================================
// Converter Mall
// Prediction Correction Policy Engine
// Converts prediction-audit statistics into conservative recommendation
// adjustments. All decisions stay inside the browser.
// =====================================

export class PredictionCorrectionPolicy {
    constructor({ minSamples = 5, warningErrorRate = 18, criticalErrorRate = 32 } = {}) {
        this.minSamples = Math.max(1, Number(minSamples) || 5);
        this.warningErrorRate = Math.max(5, Number(warningErrorRate) || 18);
        this.criticalErrorRate = Math.max(this.warningErrorRate + 1, Number(criticalErrorRate) || 32);
    }

    apply({ targetFormat, quality, resize, prediction, analysis } = {}) {
        const target = normalizeFormat(targetFormat);
        const auditedSamples = Number(prediction?.auditedSamples || 0);
        const avgErrorRate = Number(prediction?.avgErrorRate);
        const biasRate = Number(prediction?.biasRate);
        const originalQuality = quality == null ? null : clamp(Math.round(Number(quality) || 0), 1, 100);
        const originalResize = normalizeResize(resize);

        const result = {
            applied: false,
            severity: "stable",
            quality: originalQuality,
            resize: originalResize,
            reason: "예측 데이터가 안정적입니다.",
            auditedSamples,
            avgErrorRate: Number.isFinite(avgErrorRate) ? avgErrorRate : null,
            biasRate: Number.isFinite(biasRate) ? biasRate : null,
            safeguards: []
        };

        if (auditedSamples < this.minSamples || !Number.isFinite(avgErrorRate)) {
            result.severity = "learning";
            result.reason = `교정 판단을 위해 실제 결과 ${Math.max(0, this.minSamples - auditedSamples)}건이 더 필요합니다.`;
            return result;
        }

        if (avgErrorRate < this.warningErrorRate) {
            result.reason = `평균 오차 ${avgErrorRate.toFixed(1)}%로 추천값을 유지합니다.`;
            return result;
        }

        const underPredicting = Number.isFinite(biasRate) && biasRate < -6;
        const overPredicting = Number.isFinite(biasRate) && biasRate > 6;
        const critical = avgErrorRate >= this.criticalErrorRate;
        result.severity = critical ? "critical" : "warning";

        // 실제 결과가 예상보다 크게 나오는 구간은 용량 폭증을 막기 위해
        // 품질과 해상도를 한 단계 보수적으로 조정합니다.
        if (underPredicting) {
            if (target !== "PNG" && originalQuality != null) {
                const reduction = critical ? 8 : 4;
                result.quality = clamp(originalQuality - reduction, 45, 96);
                result.safeguards.push(`품질 ${originalQuality}% → ${result.quality}%`);
            }

            const largeImage = Number(analysis?.maxPixels || 0) >= 12_000_000
                || Math.max(Number(analysis?.maxWidth || 0), Number(analysis?.maxHeight || 0)) >= 4000;
            if (largeImage) {
                const saferResize = chooseSaferResize(originalResize, critical ? 1600 : 1920);
                if (saferResize.label !== originalResize.label) {
                    result.resize = saferResize;
                    result.safeguards.push(`${originalResize.label} → ${saferResize.label}`);
                }
            }

            result.applied = result.safeguards.length > 0;
            result.reason = result.applied
                ? `실제 결과가 예측보다 평균 ${Math.abs(biasRate).toFixed(1)}% 커서 안전한 설정으로 자동 교정했습니다.`
                : `실제 결과가 예측보다 평균 ${Math.abs(biasRate).toFixed(1)}% 커서 용량을 보수적으로 안내합니다.`;
            return result;
        }

        // 실제 결과가 예상보다 작게 나오는 경우에는 품질을 무리하게 낮추지 않고
        // 사용자 화질을 우선해 기존 설정을 유지합니다.
        if (overPredicting) {
            result.reason = `실제 결과가 예측보다 평균 ${Math.abs(biasRate).toFixed(1)}% 작아 화질 우선 설정을 유지합니다.`;
            return result;
        }

        // 방향성은 없지만 오차가 큰 구간은 급격한 자동 변경 대신 중간값으로 안정화합니다.
        if (target !== "PNG" && originalQuality != null && critical) {
            const stabilized = clamp(Math.round((originalQuality + 84) / 2), 55, 94);
            if (stabilized !== originalQuality) {
                result.quality = stabilized;
                result.applied = true;
                result.safeguards.push(`품질 ${originalQuality}% → ${stabilized}%`);
            }
        }
        result.reason = result.applied
            ? `예측 오차가 ${avgErrorRate.toFixed(1)}%로 높아 안정 구간 설정으로 자동 교정했습니다.`
            : `예측 오차가 ${avgErrorRate.toFixed(1)}%로 높아 결과 용량을 여유 있게 안내합니다.`;
        return result;
    }
}

function chooseSaferResize(resize, maxWidth) {
    if (resize.mode === "width" && Number(resize.value || 0) <= maxWidth) return resize;
    return { mode: "width", value: maxWidth, label: `최대 ${maxWidth}px` };
}

function normalizeResize(resize) {
    if (!resize || typeof resize !== "object") {
        return { mode: "original", value: 0, label: "원본 해상도 유지" };
    }
    return {
        mode: String(resize.mode || "original"),
        value: Number(resize.value || 0),
        label: String(resize.label || (resize.mode === "original" ? "원본 해상도 유지" : "해상도 조절"))
    };
}

function normalizeFormat(value) {
    const normalized = String(value || "UNKNOWN").replace(/^\./, "").trim().toUpperCase();
    return normalized === "JPEG" ? "JPG" : normalized;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
