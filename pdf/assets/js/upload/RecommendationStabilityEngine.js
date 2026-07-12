// =====================================
// Converter Mall
// Recommendation Stability Engine
// Prevents smart recommendations from oscillating between runs by applying
// hysteresis, minimum hold periods, gradual setting changes and safe rollback.
// All state is stored locally in the user's browser.
// =====================================

const DEFAULT_STORAGE_KEY = "converterMall.recommendationStability.v2";
const MAX_HISTORY = 120;
const DAY = 24 * 60 * 60 * 1000;

export class RecommendationStabilityEngine {
    constructor({
        storageKey = DEFAULT_STORAGE_KEY,
        confirmationRuns = 2,
        minHoldMs = 3 * DAY,
        rollbackMinSamples = 4,
        rollbackAccuracyDrop = 12,
        maxQualityStep = 6
    } = {}) {
        this.storageKey = storageKey;
        this.confirmationRuns = Math.max(1, Number(confirmationRuns) || 2);
        this.minHoldMs = Math.max(0, Number(minHoldMs) || 0);
        this.rollbackMinSamples = Math.max(1, Number(rollbackMinSamples) || 4);
        this.rollbackAccuracyDrop = Math.max(1, Number(rollbackAccuracyDrop) || 12);
        this.maxQualityStep = Math.max(1, Number(maxQualityStep) || 6);
        this.state = this.#read();
    }

    stabilize({ sourceFormat, targetFormat, baseQuality, baseResize, correction, prediction } = {}) {
        const key = `${normalizeFormat(sourceFormat)}>${normalizeFormat(targetFormat)}`;
        const now = Date.now();
        const base = {
            quality: normalizeQuality(baseQuality),
            resize: normalizeResize(baseResize)
        };
        const candidate = {
            quality: normalizeQuality(correction?.quality ?? base.quality),
            resize: normalizeResize(correction?.resize ?? base.resize)
        };
        const record = this.state.policies[key] || createPolicyRecord();
        const candidateSignature = signature(candidate);
        const activeSignature = record.active ? signature(record.active) : "";
        const critical = correction?.severity === "critical";

        const rollback = this.#evaluateRollback(record, prediction, base, now);
        if (rollback) {
            this.state.policies[key] = rollback.record;
            this.#recordHistory(key, "auto-rollback", rollback.settings, rollback.reason);
            this.#write();
            return {
                ...rollback.settings,
                applied: false,
                status: "rolled-back",
                severity: "warning",
                reason: rollback.reason,
                holdRemainingMs: 0,
                confirmationProgress: 0,
                confirmationRequired: this.confirmationRuns
            };
        }

        // No correction is currently needed. Keep an active recommendation only
        // during its minimum hold window; afterwards return to the new baseline.
        if (!correction?.applied) {
            if (record.active && now - record.active.appliedAt < this.minHoldMs) {
                const holdRemainingMs = this.minHoldMs - (now - record.active.appliedAt);
                record.pending = null;
                record.lastSeenAt = now;
                this.state.policies[key] = record;
                this.#write();
                return {
                    quality: record.active.quality,
                    resize: normalizeResize(record.active.resize),
                    applied: true,
                    status: "holding",
                    severity: "stable",
                    reason: `추천이 자주 바뀌지 않도록 기존 설정을 ${formatDuration(holdRemainingMs)} 더 유지합니다.`,
                    holdRemainingMs,
                    confirmationProgress: 0,
                    confirmationRequired: this.confirmationRuns
                };
            }

            record.previous = record.active || record.previous;
            record.active = null;
            record.pending = null;
            record.lastSeenAt = now;
            this.state.policies[key] = record;
            this.#write();
            return {
                ...base,
                applied: false,
                status: "baseline",
                severity: correction?.severity || "stable",
                reason: correction?.reason || "추천 설정이 안정 구간에 있습니다.",
                holdRemainingMs: 0,
                confirmationProgress: 0,
                confirmationRequired: this.confirmationRuns
            };
        }

        // Existing active setting is still the same candidate.
        if (record.active && activeSignature === candidateSignature) {
            record.pending = null;
            record.lastSeenAt = now;
            this.state.policies[key] = record;
            this.#write();
            return {
                quality: record.active.quality,
                resize: normalizeResize(record.active.resize),
                applied: true,
                status: "stable",
                severity: correction.severity,
                reason: "검증된 추천 설정을 안정적으로 유지합니다.",
                holdRemainingMs: Math.max(0, this.minHoldMs - (now - record.active.appliedAt)),
                confirmationProgress: this.confirmationRuns,
                confirmationRequired: this.confirmationRuns
            };
        }

        // Hysteresis: do not switch away from an active recommendation too soon,
        // except for a critical correction.
        if (record.active && !critical && now - record.active.appliedAt < this.minHoldMs) {
            const holdRemainingMs = this.minHoldMs - (now - record.active.appliedAt);
            this.#trackPending(record, candidate, candidateSignature, now);
            this.state.policies[key] = record;
            this.#write();
            return {
                quality: record.active.quality,
                resize: normalizeResize(record.active.resize),
                applied: true,
                status: "holding",
                severity: correction.severity,
                reason: `새 추천이 감지됐지만 급격한 변화를 막기 위해 기존 설정을 ${formatDuration(holdRemainingMs)} 더 유지합니다.`,
                holdRemainingMs,
                confirmationProgress: record.pending?.count || 0,
                confirmationRequired: this.confirmationRuns
            };
        }

        this.#trackPending(record, candidate, candidateSignature, now);
        const confirmed = critical || (record.pending?.count || 0) >= this.confirmationRuns;

        if (!confirmed) {
            const fallback = record.active || base;
            this.state.policies[key] = record;
            this.#write();
            return {
                quality: fallback.quality,
                resize: normalizeResize(fallback.resize),
                applied: Boolean(record.active),
                status: "confirming",
                severity: correction.severity,
                reason: `추천 급변을 막기 위해 동일한 교정 신호를 ${this.confirmationRuns}회 확인한 뒤 적용합니다.`,
                holdRemainingMs: 0,
                confirmationProgress: record.pending?.count || 0,
                confirmationRequired: this.confirmationRuns
            };
        }

        const reference = record.active || base;
        const gradual = limitChange(reference, candidate, this.maxQualityStep);
        record.previous = record.active || { ...base, appliedAt: now };
        record.active = {
            quality: gradual.quality,
            resize: gradual.resize,
            appliedAt: now,
            baselineAccuracy: finiteOrNull(prediction?.accuracyScore),
            auditSamples: Number(prediction?.auditedSamples || 0),
            sourceReason: String(correction?.reason || "")
        };
        record.pending = null;
        record.lastSeenAt = now;
        this.state.policies[key] = record;
        this.#recordHistory(key, critical ? "critical-applied" : "applied", record.active, correction?.reason || "");
        this.#write();

        return {
            quality: gradual.quality,
            resize: gradual.resize,
            applied: true,
            status: critical ? "critical-applied" : "applied",
            severity: correction.severity,
            reason: gradual.limited
                ? "추천을 한 번에 크게 바꾸지 않고 안전한 범위 안에서 단계적으로 적용했습니다."
                : "반복 확인된 추천을 안정 설정으로 적용했습니다.",
            holdRemainingMs: this.minHoldMs,
            confirmationProgress: this.confirmationRuns,
            confirmationRequired: this.confirmationRuns
        };
    }

    reset(sourceFormat, targetFormat) {
        const key = `${normalizeFormat(sourceFormat)}>${normalizeFormat(targetFormat)}`;
        const previous = this.state.policies[key]?.active || null;
        delete this.state.policies[key];
        this.#recordHistory(key, "policy-reset", previous, "사용자가 추천 정책을 초기화했습니다.");
        this.#write();
    }

    resetAll() {
        const count = Object.keys(this.state.policies || {}).length;
        this.state.policies = {};
        this.#recordHistory("ALL", "all-policies-reset", null, `${count}개 추천 정책을 초기화했습니다.`);
        this.#write();
        return count;
    }

    manualRollback(sourceFormat, targetFormat) {
        const key = `${normalizeFormat(sourceFormat)}>${normalizeFormat(targetFormat)}`;
        const record = this.state.policies[key];
        if (!record?.previous) return null;
        const current = record.active;
        record.active = {
            ...record.previous,
            appliedAt: Date.now(),
            sourceReason: "manual rollback"
        };
        record.previous = current;
        record.pending = null;
        record.lastSeenAt = Date.now();
        record.rollbackCount = Number(record.rollbackCount || 0) + 1;
        this.state.policies[key] = record;
        this.#recordHistory(key, "manual-rollback", record.active, "사용자가 이전 안정 설정으로 되돌렸습니다.");
        this.#write();
        return { ...record.active, key };
    }

    getDashboard() {
        const policies = Object.entries(this.state.policies || {}).map(([key, record]) => ({
            key,
            active: record.active || null,
            previous: record.previous || null,
            pending: record.pending || null,
            rollbackCount: Number(record.rollbackCount || 0),
            lastSeenAt: Number(record.lastSeenAt || 0)
        }));
        return {
            policyCount: policies.length,
            activeCount: policies.filter(item => item.active).length,
            pendingCount: policies.filter(item => item.pending).length,
            rollbackCount: policies.reduce((sum, item) => sum + item.rollbackCount, 0),
            updatedAt: Number(this.state.updatedAt || 0),
            policies,
            history: this.getHistory(20)
        };
    }

    getHistory(limit = 20) {
        return [...(this.state.history || [])].slice(0, Math.max(1, Number(limit) || 20));
    }

    clearHistory() {
        const count = (this.state.history || []).length;
        this.state.history = [];
        this.#write();
        return count;
    }

    exportState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    importState(payload, { mode = "replace" } = {}) {
        if (!payload || typeof payload !== "object" || typeof payload.policies !== "object") {
            throw new TypeError("추천 정책 백업 형식이 올바르지 않습니다.");
        }
        const incoming = {
            version: 2,
            policies: payload.policies || {},
            history: Array.isArray(payload.history) ? payload.history.slice(0, MAX_HISTORY) : [],
            updatedAt: Number(payload.updatedAt || Date.now())
        };
        if (mode === "merge") {
            this.state = {
                version: 2,
                policies: { ...(this.state.policies || {}), ...incoming.policies },
                history: [...incoming.history, ...(this.state.history || [])].slice(0, MAX_HISTORY),
                updatedAt: Date.now()
            };
        } else {
            this.state = incoming;
        }
        this.#write();
        return {
            policyCount: Object.keys(this.state.policies || {}).length,
            historyCount: (this.state.history || []).length
        };
    }

    #recordHistory(key, type, settings, reason) {
        const entry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            at: Date.now(),
            key,
            type,
            settings: settings ? {
                quality: normalizeQuality(settings.quality),
                resize: normalizeResize(settings.resize)
            } : null,
            reason: String(reason || "")
        };
        this.state.history = [entry, ...(this.state.history || [])].slice(0, MAX_HISTORY);
    }

    #trackPending(record, candidate, candidateSignature, now) {
        if (record.pending?.signature === candidateSignature) {
            record.pending.count += 1;
            record.pending.lastSeenAt = now;
        } else {
            record.pending = {
                signature: candidateSignature,
                quality: candidate.quality,
                resize: candidate.resize,
                count: 1,
                firstSeenAt: now,
                lastSeenAt: now
            };
        }
    }

    #evaluateRollback(record, prediction, base, now) {
        if (!record.active) return null;
        const baselineAccuracy = finiteOrNull(record.active.baselineAccuracy);
        const currentAccuracy = finiteOrNull(prediction?.accuracyScore);
        const currentSamples = Number(prediction?.auditedSamples || 0);
        const sampleGain = currentSamples - Number(record.active.auditSamples || 0);
        if (baselineAccuracy == null || currentAccuracy == null) return null;
        if (sampleGain < this.rollbackMinSamples) return null;
        if (baselineAccuracy - currentAccuracy < this.rollbackAccuracyDrop) return null;

        const previous = record.previous || base;
        const nextRecord = {
            ...record,
            active: previous ? {
                quality: normalizeQuality(previous.quality),
                resize: normalizeResize(previous.resize),
                appliedAt: now,
                baselineAccuracy: currentAccuracy,
                auditSamples: currentSamples,
                sourceReason: "automatic rollback"
            } : null,
            previous: record.active,
            pending: null,
            lastSeenAt: now,
            rollbackCount: Number(record.rollbackCount || 0) + 1
        };

        return {
            record: nextRecord,
            settings: nextRecord.active || base,
            reason: `새 추천 적용 후 예측 정확도가 ${Math.abs(baselineAccuracy - currentAccuracy).toFixed(0)}점 낮아져 이전 안정 설정으로 자동 복구했습니다.`
        };
    }

    #read() {
        try {
            const parsed = JSON.parse(globalThis.localStorage?.getItem(this.storageKey) || "null");
            if (parsed?.policies && typeof parsed.policies === "object") {
                return { version: 2, policies: parsed.policies, history: Array.isArray(parsed.history) ? parsed.history : [], updatedAt: Number(parsed.updatedAt || 0) };
            }
        } catch {
            // Storage may be blocked. Continue with in-memory state.
        }
        return { version: 2, policies: {}, history: [], updatedAt: 0 };
    }

    #write() {
        this.state.updatedAt = Date.now();
        try {
            globalThis.localStorage?.setItem(this.storageKey, JSON.stringify(this.state));
        } catch {
            // Keep the in-memory policy when persistent storage is unavailable.
        }
    }
}

function createPolicyRecord() {
    return { active: null, previous: null, pending: null, lastSeenAt: 0, rollbackCount: 0 };
}

function limitChange(reference, candidate, maxQualityStep) {
    const referenceQuality = normalizeQuality(reference?.quality);
    const candidateQuality = normalizeQuality(candidate?.quality);
    let quality = candidateQuality;
    let limited = false;
    if (referenceQuality != null && candidateQuality != null) {
        const delta = candidateQuality - referenceQuality;
        if (Math.abs(delta) > maxQualityStep) {
            quality = referenceQuality + Math.sign(delta) * maxQualityStep;
            limited = true;
        }
    }

    const resize = limitResizeStep(normalizeResize(reference?.resize), normalizeResize(candidate?.resize));
    limited ||= resize.label !== normalizeResize(candidate?.resize).label;
    return { quality, resize, limited };
}

function limitResizeStep(reference, candidate) {
    const tiers = [0, 800, 1080, 1280, 1600, 1920, 2400, Infinity];
    const refValue = resizeComparable(reference);
    const candidateValue = resizeComparable(candidate);
    const refIndex = nearestTierIndex(refValue, tiers);
    const candidateIndex = nearestTierIndex(candidateValue, tiers);
    if (Math.abs(candidateIndex - refIndex) <= 1) return candidate;
    const nextIndex = refIndex + Math.sign(candidateIndex - refIndex);
    const nextValue = tiers[nextIndex];
    return Number.isFinite(nextValue)
        ? { mode: "width", value: nextValue, label: `최대 ${nextValue}px` }
        : { mode: "original", value: 0, label: "원본 해상도 유지" };
}

function resizeComparable(resize) {
    return resize.mode === "width" && Number(resize.value) > 0 ? Number(resize.value) : Infinity;
}

function nearestTierIndex(value, tiers) {
    if (!Number.isFinite(value)) return tiers.length - 1;
    let best = 0;
    let distance = Infinity;
    tiers.forEach((tier, index) => {
        if (!Number.isFinite(tier)) return;
        const next = Math.abs(tier - value);
        if (next < distance) {
            best = index;
            distance = next;
        }
    });
    return best;
}

function signature(settings) {
    const resize = normalizeResize(settings?.resize);
    return `${settings?.quality ?? "none"}|${resize.mode}|${resize.value}`;
}

function normalizeQuality(value) {
    if (value == null || value === "") return null;
    return clamp(Math.round(Number(value) || 0), 1, 100);
}

function normalizeResize(resize) {
    if (!resize || typeof resize !== "object") {
        return { mode: "original", value: 0, label: "원본 해상도 유지" };
    }
    const mode = String(resize.mode || "original");
    const value = Math.max(0, Number(resize.value || 0));
    return {
        mode,
        value,
        label: String(resize.label || (mode === "original" ? "원본 해상도 유지" : "해상도 조절"))
    };
}

function normalizeFormat(value) {
    const normalized = String(value || "UNKNOWN").replace(/^\./, "").trim().toUpperCase();
    return normalized === "JPEG" ? "JPG" : normalized;
}

function finiteOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function formatDuration(ms) {
    if (ms >= DAY) return `${Math.max(1, Math.ceil(ms / DAY))}일`;
    const hours = Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
    return `${hours}시간`;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
