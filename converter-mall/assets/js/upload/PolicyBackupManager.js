// =====================================
// Converter Mall
// Policy Backup Manager
// Exports and restores recommendation policies and prediction learning data.
// The backup contains only settings/statistics; image contents and filenames
// are never included.
// =====================================

const BACKUP_SCHEMA = "converter-mall-policy-backup";
const BACKUP_VERSION = 1;

export class PolicyBackupManager {
    constructor({ planner } = {}) {
        if (!planner) throw new TypeError("PolicyBackupManager requires a planner.");
        this.planner = planner;
    }

    createBackup() {
        return {
            schema: BACKUP_SCHEMA,
            version: BACKUP_VERSION,
            createdAt: new Date().toISOString(),
            appVersion: "0.75.0-rc",
            recommendationPolicies: this.planner.exportPolicyState(),
            predictionLearning: this.planner.exportPredictionLearning(),
            privacy: {
                includesImageData: false,
                includesFileNames: false,
                includesOnlySettingsAndStatistics: true
            }
        };
    }

    downloadBackup(filename = "converter-mall-policy-backup.json") {
        const json = JSON.stringify(this.createBackup(), null, 2);
        const blob = new Blob([json], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = sanitizeFilename(filename);
        anchor.hidden = true;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1200);
        return blob.size;
    }

    async importFile(file, { mode = "replace" } = {}) {
        if (!file) throw new TypeError("백업 파일을 선택해 주세요.");
        if (file.size > 5 * 1024 * 1024) throw new RangeError("백업 파일은 5MB 이하여야 합니다.");
        const text = await file.text();
        let payload;
        try {
            payload = JSON.parse(text);
        } catch {
            throw new TypeError("올바른 JSON 백업 파일이 아닙니다.");
        }
        return this.restoreBackup(payload, { mode });
    }

    restoreBackup(payload, { mode = "replace" } = {}) {
        validateBackup(payload);
        const policyResult = this.planner.importPolicyState(payload.recommendationPolicies, { mode });
        const learningResult = this.planner.importPredictionLearning(payload.predictionLearning, { mode });
        return {
            policies: Number(policyResult?.policyCount || 0),
            history: Number(policyResult?.historyCount || 0),
            learningSamples: Number(learningResult?.totalSamples || 0),
            buckets: Number(learningResult?.bucketCount || 0),
            mode
        };
    }
}

function validateBackup(payload) {
    if (!payload || typeof payload !== "object") throw new TypeError("백업 데이터가 비어 있습니다.");
    if (payload.schema !== BACKUP_SCHEMA) throw new TypeError("Converter Mall 정책 백업 파일이 아닙니다.");
    if (Number(payload.version) !== BACKUP_VERSION) throw new TypeError("지원하지 않는 백업 버전입니다.");
    if (!payload.recommendationPolicies || !payload.predictionLearning) {
        throw new TypeError("정책 또는 학습 데이터가 누락되었습니다.");
    }
}

function sanitizeFilename(value) {
    const safe = String(value || "converter-mall-policy-backup.json")
        .replace(/[\\/:*?"<>|]+/g, "-")
        .replace(/[. ]+$/g, "")
        .slice(0, 160);
    return safe.toLowerCase().endsWith(".json") ? safe : `${safe}.json`;
}
