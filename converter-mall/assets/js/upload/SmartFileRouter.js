// =====================================
// Converter Mall
// Smart File Router
// Detects uploaded formats and recommends only compatible converters.
// =====================================

import { UploadManager } from "./UploadManager.js";
import { SmartConversionPlanner } from "./SmartConversionPlanner.js";
import { PolicyBackupManager } from "./PolicyBackupManager.js";

const FORMAT_ALIASES = Object.freeze({
    JPEG: "JPG",
    JPE: "JPG"
});

export class SmartFileRouter {
    constructor({
        registryUrl = "./data/image-converters.json",
        workspace,
        recommend,
        onNotice = defaultNotice
    } = {}) {
        this.registryUrl = registryUrl;
        this.workspace = resolveElement(workspace, "#workspace");
        this.recommend = resolveElement(recommend, "#recommendContainer");
        this.onNotice = typeof onNotice === "function" ? onNotice : defaultNotice;
        this.registry = [];
        this.registryPromise = null;
        this.planner = new SmartConversionPlanner();
        this.policyBackup = new PolicyBackupManager({ planner: this.planner });
        this.plans = [];
    }

    async route(files = []) {
        const list = Array.from(files || []).filter(Boolean);
        if (!list.length) {
            this.renderEmpty();
            return { files: [], groups: [], recommendations: [] };
        }

        const registry = await this.loadRegistry();
        const groups = groupFilesByFormat(list);
        this.plans = await this.planner.analyzeGroups(groups, registry);
        const planBySource = new Map(this.plans.map(plan => [plan.sourceFormat, plan]));
        const recommendations = groups.flatMap(group => {
            const tools = registry
                .filter(tool => tool.status === "ready" && tool.path && normalizeFormat(tool.sourceFormat) === group.format)
                .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0));
            const plan = planBySource.get(group.format);
            return tools.map(tool => ({
                tool,
                group,
                plan,
                isPreferred: plan?.preferredTool?.id === tool.id
            })).sort((a, b) => Number(b.isPreferred) - Number(a.isPreferred));
        });

        this.renderWorkspace(list, groups, this.plans, recommendations);
        this.renderRecommendations(recommendations, groups, this.plans);
        this.syncHubFilters(groups);

        window.dispatchEvent(new CustomEvent("smart-file-router:update", {
            detail: {
                files: list,
                groups: groups.map(group => ({ format: group.format, count: group.files.length })),
                recommendations: recommendations.map(item => item.tool.id)
            }
        }));

        return { files: list, groups, recommendations };
    }

    async loadRegistry() {
        if (this.registry.length) return this.registry;
        if (!this.registryPromise) {
            this.registryPromise = fetch(this.registryUrl, {
                headers: { Accept: "application/json" },
                cache: "no-cache"
            }).then(async response => {
                if (!response.ok) throw new Error(`변환기 목록 요청 실패 (${response.status})`);
                const data = await response.json();
                if (!Array.isArray(data)) throw new TypeError("변환기 목록 형식이 올바르지 않습니다.");
                this.registry = data;
                return data;
            }).catch(error => {
                this.registryPromise = null;
                console.error("[SmartFileRouter] registry load failed", error);
                return [];
            });
        }
        return this.registryPromise;
    }

    renderEmpty() {
        if (this.workspace) this.workspace.textContent = "파일을 올리면 형식을 자동 감지하고 가능한 작업을 표시합니다.";
        if (this.recommend) this.recommend.textContent = "파일을 업로드하면 호환되는 변환기만 추천됩니다.";
    }

    renderWorkspace(files, groups, plans = [], recommendations = []) {
        if (!this.workspace) return;
        const totalSize = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
        const formatSummary = groups
            .map(group => `${group.format} ${group.files.length}개`)
            .join(" · ");

        this.workspace.innerHTML = `
            <div class="smart-route-summary">
                <div class="smart-route-summary-icon" aria-hidden="true">🧭</div>
                <div>
                    <strong>${files.length}개 파일 자동 분석 완료</strong>
                    <p>${escapeHtml(formatSummary)} · 총 ${formatBytes(totalSize)}</p>
                </div>
                <span class="smart-route-ready">호환 도구 탐색 완료</span>
            </div>
            <div class="smart-format-groups">
                ${groups.map(group => `
                    <div class="smart-format-chip">
                        <strong>${escapeHtml(group.format)}</strong>
                        <span>${group.files.length}개</span>
                    </div>
                `).join("")}
            </div>
            ${plannerSummaryTemplate(plans, this.planner.getPolicyDashboard(), recommendations)}`;
        this.bindPolicyControls(groups);
        this.workspace.querySelectorAll("[data-smart-tool]").forEach(link => {
            link.addEventListener("click", event => this.handleNavigation(event, link, groups, plans));
        });
    }

    bindPolicyControls(groups = []) {
        const root = this.workspace?.querySelector("[data-policy-center]");
        if (!root) return;
        root.querySelector("[data-policy-reset]")?.addEventListener("click", () => {
            const count = this.planner.resetPolicies();
            this.onNotice(`추천 정책 ${count}개를 초기화했습니다.`);
            this.route(groups.flatMap(group => group.files));
        });
        root.querySelector("[data-learning-reset]")?.addEventListener("click", () => {
            const stats = this.planner.resetPredictionLearning();
            this.onNotice(`학습값 ${stats.totalSamples}건을 초기화했습니다.`);
            this.route(groups.flatMap(group => group.files));
        });
        root.querySelector("[data-history-clear]")?.addEventListener("click", () => {
            const count = this.planner.clearPolicyHistory();
            this.onNotice(`정책 변경 이력 ${count}건을 삭제했습니다.`);
            this.route(groups.flatMap(group => group.files));
        });
        root.querySelectorAll("[data-policy-rollback]").forEach(button => button.addEventListener("click", () => {
            const [source, target] = String(button.dataset.policyRollback || "").split(">");
            const result = this.planner.rollbackPolicy(source, target);
            this.onNotice(result ? `${source} → ${target} 정책을 이전 안정 설정으로 복구했습니다.` : "복구할 이전 설정이 없습니다.");
            this.route(groups.flatMap(group => group.files));
        }));
        root.querySelector("[data-policy-export]")?.addEventListener("click", () => {
            const bytes = this.policyBackup.downloadBackup();
            this.onNotice(`추천 정책·학습 백업을 저장했습니다. (${formatBytes(bytes)})`);
        });
        const importInput = root.querySelector("[data-policy-import-input]");
        root.querySelector("[data-policy-import]")?.addEventListener("click", () => importInput?.click());
        importInput?.addEventListener("change", async () => {
            const file = importInput.files?.[0];
            importInput.value = "";
            if (!file) return;
            try {
                const result = await this.policyBackup.importFile(file, { mode: "replace" });
                this.onNotice(`백업 복원 완료: 정책 ${result.policies}개 · 학습 ${result.learningSamples}건`);
                await this.route(groups.flatMap(group => group.files));
            } catch (error) {
                console.error("[SmartFileRouter] policy backup import failed", error);
                this.onNotice(error?.message || "백업을 복원하지 못했습니다.");
            }
        });
    }

    renderRecommendations(recommendations, groups, plans = []) {
        if (!this.recommend) return;

        if (!recommendations.length) {
            const unsupported = groups.map(group => group.format).join(", ");
            this.recommend.innerHTML = `
                <div class="workspace-empty">
                    <strong>${escapeHtml(unsupported)} 형식을 감지했습니다.</strong>
                    <p>현재 바로 연결할 수 있는 변환기를 준비 중입니다.</p>
                </div>`;
            return;
        }

        this.recommend.innerHTML = `
            <div class="smart-recommend-header">
                <div>
                    <strong>파일에 맞는 변환기 ${recommendations.length}개</strong>
                    <p>카드를 누르면 해당 형식 파일만 안전하게 선별해 전달합니다.</p>
                </div>
            </div>
            <div class="smart-recommend-grid">
                ${recommendations.map(({ tool, group, plan, isPreferred }, index) => cardTemplate(tool, group, isPreferred || index === 0, plan)).join("")}
            </div>`;

        this.recommend.querySelectorAll("[data-smart-tool]").forEach(link => {
            link.addEventListener("click", event => this.handleNavigation(event, link, groups, plans));
        });
    }

    async handleNavigation(event, link, groups, plans = []) {
        event.preventDefault();
        const sourceFormat = normalizeFormat(link.dataset.sourceFormat);
        const group = groups.find(item => item.format === sourceFormat);
        const selectedFiles = group?.files || [];
        const totalCount = groups.reduce((sum, item) => sum + item.files.length, 0);

        if (!selectedFiles.length) {
            this.onNotice(`${sourceFormat} 파일을 찾지 못했습니다.`);
            return;
        }

        try {
            await UploadManager.set(selectedFiles);
            const plan = plans.find(item => item.sourceFormat === sourceFormat);
            storePlannerHandoff(plan, link.dataset.targetFormat);
            const excludedCount = Math.max(0, totalCount - selectedFiles.length);
            const targetFormat = normalizeFormat(link.dataset.targetFormat);
            const message = excludedCount > 0
                ? `${sourceFormat} 파일 ${selectedFiles.length}개만 가져왔습니다. 다른 형식 ${excludedCount}개는 제외했습니다.`
                : `${sourceFormat} 파일 ${selectedFiles.length}개를 ${targetFormat} 변환기로 가져왔습니다.`;
            this.onNotice(message);

            // 토스트를 읽을 시간을 아주 짧게 준 뒤 이동합니다.
            window.setTimeout(() => {
                window.location.href = link.href;
            }, 220);
        } catch (error) {
            console.error("[SmartFileRouter] file handoff failed", error);
            this.onNotice("선택한 파일을 변환기로 전달하지 못했습니다. 다시 시도해 주세요.");
        }
    }

    syncHubFilters(groups) {
        const imageGroups = groups.filter(group => ["PNG", "JPG", "WEBP"].includes(group.format));
        if (!imageGroups.length) return;

        const dominant = [...imageGroups].sort((a, b) => b.files.length - a.files.length)[0];
        const sourceFilter = document.getElementById("imageSourceFilter");
        if (sourceFilter && [...sourceFilter.options].some(option => option.value === dominant.format)) {
            sourceFilter.value = dominant.format;
            sourceFilter.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }
}

function cardTemplate(tool, group, primary, plan) {
    const insight = recommendationInsight(tool, group, plan);
    const target = normalizeFormat(tool.targetFormat);
    return `<a class="workspace-tool-card smart-tool-card${primary ? " is-primary" : ""}"
        href="${escapeAttribute(tool.path)}"
        data-smart-tool="${escapeAttribute(tool.id)}"
        data-source-format="${escapeAttribute(tool.sourceFormat)}"
        data-target-format="${escapeAttribute(tool.targetFormat)}">
        <span class="smart-tool-head">
            <span class="smart-format-icon is-${escapeAttribute(iconTone(target))}" aria-hidden="true">${formatIconSvg(target)}</span>
            <span class="smart-tool-title-wrap">
                <strong>${escapeHtml(tool.title)}</strong>
                ${primary ? '<em class="smart-best-badge">최적 추천</em>' : ''}
            </span>
        </span>
        <span class="smart-tool-copy">
            <small class="smart-tool-purpose">${escapeHtml(insight.purpose)}</small>
            <small class="smart-setting-line">${escapeHtml(insight.setting)}</small>
            <small class="smart-tool-note ${insight.tone ? `is-${escapeAttribute(insight.tone)}` : ""}">${escapeHtml(insight.note)}</small>
        </span>
        <span class="smart-tool-action">${primary ? '추천 설정으로 열기' : '변환기 열기'} →</span>
    </a>`;
}

function iconTone(format) {
    const target = normalizeFormat(format);
    if (["PDF"].includes(target)) return "pdf";
    if (["BASE64", "HTML", "XBM", "PNM", "PPM", "PGM", "PBM", "PAM", "ZIP"].includes(target)) return "developer";
    if (["DDS", "PSD", "TIFF", "TGA", "PCX", "ICO", "CUR"].includes(target)) return "professional";
    return "image";
}

function formatIconSvg(format) {
    const target = normalizeFormat(format);
    const attrs = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"';
    const icons = {
        WEBP: `<svg ${attrs}><path d="M4 5.5h16v13H4z"/><path d="m7 15 3-3 2.2 2.2L15.5 11 20 15.5"/><circle cx="8" cy="9" r="1.2"/><path d="M17.5 4v3M16 5.5h3"/></svg>`,
        JPG: `<svg ${attrs}><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="9" r="1.4"/><path d="m5.5 17 4.3-4.3 2.8 2.8 2.4-2.4 3.5 3.9"/></svg>`,
        JPEG: `<svg ${attrs}><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M7 8h4M7 11h7M7 14h5"/><path d="M17 8v7"/></svg>`,
        JFIF: `<svg ${attrs}><path d="M6 3.5h8l4 4V20H6z"/><path d="M14 3.5V8h4"/><path d="M8.5 13h7M8.5 16h5"/></svg>`,
        PDF: `<svg ${attrs}><path d="M6 3.5h8l4 4V20H6z"/><path d="M14 3.5V8h4"/><path d="M8.5 12.5h7M8.5 15.5h7"/></svg>`,
        ICO: `<svg ${attrs}><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>`,
        CUR: `<svg ${attrs}><path d="m5 3 11 10-5 .8 3 5-2.4 1.2-2.7-5-3.9 3z"/></svg>`,
        GIF: `<svg ${attrs}><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7 5v14M17 5v14M3.5 9h3.5M17 9h3.5M3.5 15h3.5M17 15h3.5"/><path d="m9.5 15 2.3-2.3 1.7 1.7 2-2"/></svg>`,
        BMP: `<svg ${attrs}><path d="M4 4h16v16H4z"/><path d="M8 4v16M12 4v16M16 4v16M4 8h16M4 12h16M4 16h16"/></svg>`,
        AVIF: `<svg ${attrs}><path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2z"/><path d="m8 15 2.5-3 2 2 2.5-3 2 4"/></svg>`,
        TIFF: `<svg ${attrs}><path d="M6 3.5h8l4 4V20H6z"/><path d="M14 3.5V8h4"/><path d="M9 11h6M12 11v6"/></svg>`,
        DDS: `<svg ${attrs}><path d="m12 3 8 4-8 4-8-4z"/><path d="m4 7 8 4 8-4v10l-8 4-8-4z"/><path d="M12 11v10"/></svg>`,
        PSD: `<svg ${attrs}><rect x="5" y="4" width="14" height="10" rx="1.5"/><rect x="3" y="8" width="14" height="10" rx="1.5"/><rect x="7" y="12" width="14" height="8" rx="1.5"/></svg>`,
        TGA: `<svg ${attrs}><path d="M4 18 12 4l8 14z"/><path d="M8 14h8"/></svg>`,
        PCX: `<svg ${attrs}><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M7 9h10M7 12h7M7 15h5"/></svg>`,
        BASE64: `<svg ${attrs}><path d="M8 7 4 12l4 5M16 7l4 5-4 5M14 4l-4 16"/></svg>`,
        HTML: `<svg ${attrs}><path d="M4 5h16v14H4z"/><path d="M4 8h16M8 12l-2 2 2 2M16 12l2 2-2 2M13.5 11l-3 6"/></svg>`,
        ZIP: `<svg ${attrs}><path d="M6 3.5h8l4 4V20H6z"/><path d="M14 3.5V8h4M10 4h3M10 7h3M10 10h3M10 13h3"/><rect x="9.5" y="15" width="4" height="3" rx=".5"/></svg>`,
        PNM: `<svg ${attrs}><path d="M5 5h14v14H5z"/><circle cx="9" cy="9" r="1"/><path d="m7 16 3-3 2 2 2-2 3 3"/></svg>`,
        PPM: `<svg ${attrs}><circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><circle cx="12" cy="8" r="4"/></svg>`,
        PGM: `<svg ${attrs}><path d="M4 5h16v14H4z"/><path d="M7 16h2V8H7zm4 0h2v-5h-2zm4 0h2v-2h-2z"/></svg>`,
        PBM: `<svg ${attrs}><path d="M4 4h16v16H4z"/><path d="M4 4h8v8H4zm8 8h8v8h-8z" fill="currentColor" stroke="none"/></svg>`,
        PAM: `<svg ${attrs}><path d="M4 5h16v14H4z"/><path d="M8 8v8M12 8v8M16 8v8"/><path d="M6 10h12M6 14h12"/></svg>`,
        XBM: `<svg ${attrs}><path d="M4 4h16v16H4z"/><path d="M7 7l10 10M17 7 7 17"/></svg>`
    };
    return icons[target] || `<svg ${attrs}><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m7 15 3-3 2 2 3-4 2 5"/><circle cx="9" cy="9" r="1"/></svg>`;
}

function recommendationInsight(tool, group, plan) {
    const target = normalizeFormat(tool.targetFormat);
    const source = normalizeFormat(tool.sourceFormat || group.format);
    const a = plan?.analysis || {};
    const count = Number(group?.files?.length || 0);
    const transparent = Number(a.transparentCount || 0);
    const photoLike = Number(a.averagePhotoScore || 0) >= .58;
    const settings = settingLine(plan || {}, target) || "권장 설정 자동 적용";
    const common = {
        purpose: `${source} ${count}개를 ${target} 작업에 맞게 전달`,
        setting: settings,
        note: "형식별 옵션을 확인한 뒤 변환하세요.",
        tone: "info"
    };
    const map = {
        WEBP: {
            purpose: transparent ? `투명 이미지 ${transparent}개를 유지하며 웹 용량 절감` : "웹사이트·쇼핑몰용으로 용량을 줄이기 좋음",
            setting: `웹 균형 · ${transparent ? "알파 유지" : "사진 최적화"} · ${settings}`,
            note: plan?.prediction ? `예상 ${formatBytes(plan.prediction.predictedBytes)} · 약 ${Math.max(0, plan.prediction.savingRate).toFixed(1)}% 절감` : "품질과 용량의 균형을 우선합니다.",
            tone: "success"
        },
        JPG: {
            purpose: photoLike ? "사진 공유와 높은 호환성에 적합" : "대부분의 앱·웹 서비스에서 쉽게 열리는 형식",
            setting: `흰 배경 합성 · ${settings}`,
            note: transparent ? `주의: 투명 이미지 ${transparent}개의 배경이 평탄화됩니다.` : "사진형 콘텐츠에 효율적입니다.",
            tone: transparent ? "warning" : "info"
        },
        JPEG: {
            purpose: "JPG와 같은 JPEG 계열 확장자로 저장",
            setting: `흰 배경 합성 · ${settings}`,
            note: transparent ? "투명 영역은 선택한 배경색으로 바뀝니다." : "업로드 규격이 .jpeg를 요구할 때 사용하세요.",
            tone: transparent ? "warning" : "info"
        },
        JFIF: {
            purpose: "레거시 시스템의 JFIF/JPEG 규격 대응",
            setting: `호환성 우선 · ${settings}`,
            note: "일반 공유용이라면 JPG가 더 익숙합니다.",
            tone: "info"
        },
        PDF: {
            purpose: `이미지 ${count}개를 순서대로 문서 페이지로 구성`,
            setting: `페이지당 1장 · 순서 변경 가능 · ${count}페이지 예상`,
            note: "A4·여백·페이지 수를 변환기에서 조정할 수 있습니다.",
            tone: "success"
        },
        ICO: {
            purpose: "Windows 앱 아이콘과 파비콘 제작",
            setting: "16·32·48·256px 다중 크기 · 투명도 유지",
            note: "작은 정사각형 로고·아이콘에 특히 적합합니다.",
            tone: "success"
        },
        CUR: {
            purpose: "Windows 마우스 커서 파일 제작",
            setting: "다중 크기 · 핫스팟 좌표 설정",
            note: "클릭 지점인 핫스팟을 반드시 확인하세요.",
            tone: "warning"
        },
        GIF: {
            purpose: "레거시 웹용 정지 GIF로 변환",
            setting: "256색 팔레트 · 투명색 1개 지원",
            note: "현재 도구는 애니메이션 GIF를 만들지 않습니다.",
            tone: "warning"
        },
        BMP: {
            purpose: "Windows·레거시 프로그램용 비트맵 생성",
            setting: "24비트 RGB 또는 32비트 RGBA",
            note: "압축률이 낮아 결과 용량이 커질 수 있습니다.",
            tone: "warning"
        },
        AVIF: {
            purpose: "차세대 고효율 이미지로 용량 최소화",
            setting: `고효율 압축 · ${transparent ? "알파 유지" : "사진 최적화"}`,
            note: "브라우저의 AVIF 인코딩 지원 여부를 먼저 확인합니다.",
            tone: "info"
        },
        TIFF: {
            purpose: "인쇄·스캔·장기 보관용 전문 이미지",
            setting: "DPI·색상 모드·무손실 압축 설정",
            note: "고해상도에서는 파일 용량이 크게 증가할 수 있습니다.",
            tone: "warning"
        },
        DDS: {
            purpose: "게임 엔진·3D 텍스처 작업",
            setting: "BGRA8 · 알파 · 밉맵 · 2의 거듭제곱",
            note: "대상 엔진의 텍스처 규격을 확인하세요.",
            tone: "info"
        },
        PSD: {
            purpose: "Photoshop 편집 파이프라인으로 전달",
            setting: "RGB/그레이스케일 · 알파 · RLE",
            note: "현재 결과는 레이어 없는 단일 합성 이미지입니다.",
            tone: "warning"
        },
        TGA: {
            purpose: "게임·3D 그래픽용 알파 텍스처 교환",
            setting: "24/32비트 · RLE · 원점 방향 선택",
            note: "게임 도구의 원점 방향 설정을 맞춰 주세요.",
            tone: "info"
        },
        PCX: {
            purpose: "레거시 그래픽·출판 프로그램 호환",
            setting: "24비트 또는 8비트 회색 · RLE",
            note: "최신 프로그램에서는 지원 여부를 확인하세요.",
            tone: "warning"
        },
        BASE64: {
            purpose: "웹·앱 코드에 이미지를 텍스트로 삽입",
            setting: "Data URL·순수 Base64·CSS·JS·JSON",
            note: "Base64는 원본보다 약 33% 커질 수 있습니다.",
            tone: "warning"
        },
        HTML: {
            purpose: `이미지 ${count}개가 내장된 독립 HTML 갤러리`,
            setting: "반응형 3열 · 캡션 · 지연 로딩",
            note: "별도 이미지 파일 없이 HTML 하나로 열립니다.",
            tone: "success"
        },
        ZIP: {
            purpose: `PNG 원본 ${count}개를 업무용 묶음으로 패키징`,
            setting: "재인코딩 없음 · 파일명 규칙 · manifest 선택",
            note: "PNG는 이미 압축되어 ZIP 용량 감소가 작을 수 있습니다.",
            tone: "info"
        },
        PNM: {
            purpose: "Netpbm 개발·연구 파이프라인용 교환",
            setting: "PPM·PGM·PBM · ASCII/바이너리",
            note: "일반 사용자보다 개발·연구 도구에 적합합니다.",
            tone: "info"
        },
        PPM: { purpose: "무손실 RGB 픽셀 데이터 교환", setting: "P6 바이너리 또는 P3 ASCII", note: "원본에 가까운 대신 용량이 큽니다.", tone: "info" },
        PGM: { purpose: "그레이스케일 분석·영상 처리", setting: "P5 바이너리 또는 P2 ASCII", note: "색상 정보는 회색조로 변환됩니다.", tone: "info" },
        PBM: { purpose: "1비트 흑백 문서·마스크 생성", setting: "임계값·디더링·반전", note: "사진은 디더링 사용 여부에 따라 결과가 크게 달라집니다.", tone: "warning" },
        PAM: { purpose: "RGBA 등 채널 구조를 명확히 보존", setting: "RGB/RGBA/Gray/Gray+Alpha", note: "Netpbm 호환 개발 도구에서 사용하세요.", tone: "info" },
        XBM: { purpose: "C 소스·임베디드용 1비트 비트맵", setting: "심볼명·임계값·배열 줄 길이", note: "일반 이미지 공유용이 아닌 개발자 형식입니다.", tone: "info" }
    };
    return { ...common, ...(map[target] || {}) };
}

function plannerSummaryTemplate(plans = [], dashboard = {}, recommendations = []) {
    if (!plans.length) return "";
    const strategyCards = buildPlannerStrategyCards(plans, recommendations);
    return `<div class="smart-planner-panel">
        <div class="smart-planner-head">
            <div><strong>🧠 스마트 변환 플래너</strong><p>파일 특징을 분석해 목적이 다른 추천 3가지를 비교했습니다.</p></div>
            <span>외부 전송 없음</span>
        </div>
        <div class="smart-plan-grid">${strategyCards.map(card => {
            const insight = recommendationInsight(card.tool, card.group, card.plan);
            const a = card.plan.analysis || {};
            const detail = [
                a.maxWidth && a.maxHeight ? `최대 ${a.maxWidth}×${a.maxHeight}` : "해상도 확인",
                a.transparentCount ? `투명 ${a.transparentCount}개` : "투명 없음",
                a.averagePhotoScore >= .58 ? "사진형" : "그래픽형"
            ].join(" · ");
            return `<a class="smart-plan-card is-actionable" href="${escapeAttribute(card.tool.path)}"
                data-smart-tool="${escapeAttribute(card.tool.id)}"
                data-source-format="${escapeAttribute(card.tool.sourceFormat)}"
                data-target-format="${escapeAttribute(card.tool.targetFormat)}">
                <div class="smart-plan-card-head">
                    <span class="smart-format-icon is-${escapeAttribute(iconTone(card.tool.targetFormat))}" aria-hidden="true">${formatIconSvg(card.tool.targetFormat)}</span>
                    <div>
                        <div class="smart-plan-kicker">${escapeHtml(card.label)}</div>
                        <div class="smart-plan-title"><strong>${escapeHtml(card.tool.title)}</strong><span>${card.score}점</span></div>
                    </div>
                </div>
                <p>${escapeHtml(insight.purpose)}</p>
                <small class="smart-plan-analysis">${escapeHtml(detail)}</small>
                <div class="smart-plan-settings">${escapeHtml(insight.setting)}</div>
                <div class="smart-plan-result is-${escapeAttribute(insight.tone || "info")}">${escapeHtml(insight.note)}</div>
                <span class="smart-plan-open">이 설정으로 열기 →</span>
            </a>`;
        }).join("")}</div>
        ${policyCenterTemplate(dashboard)}
    </div>`;
}

function buildPlannerStrategyCards(plans = [], recommendations = []) {
    const cards = [];
    for (const plan of plans) {
        const candidates = recommendations.filter(item => item.plan === plan);
        const deduped = [];
        const families = new Set();
        for (const item of candidates) {
            const target = normalizeFormat(item.tool.targetFormat);
            const family = ["JPG", "JPEG", "JFIF"].includes(target) ? "JPEG" : target;
            if (families.has(family)) continue;
            families.add(family);
            deduped.push(item);
        }
        const preferred = deduped.find(item => item.isPreferred) || deduped[0];
        const compact = deduped.find(item => ["AVIF", "WEBP", "JPG"].includes(normalizeFormat(item.tool.targetFormat)) && item !== preferred);
        const purpose = deduped.find(item => ["PDF", "ICO", "BASE64", "HTML", "ZIP", "TIFF", "DDS", "PSD"].includes(normalizeFormat(item.tool.targetFormat)) && item !== preferred && item !== compact);
        const selected = [preferred, compact, purpose].filter(Boolean);
        for (const item of deduped) {
            if (selected.length >= 3) break;
            if (!selected.includes(item)) selected.push(item);
        }
        const labels = ["최적 균형", "용량·호환 대안", "목적별 추천"];
        selected.slice(0, 3).forEach((item, index) => cards.push({
            ...item,
            label: labels[index],
            score: Math.max(70, Number(plan.score || 80) - index * 4)
        }));
    }
    return cards.slice(0, 6);
}


function stabilityTitle(status) {
    const labels = {
        "holding": "추천 안정화 유지",
        "confirming": "추천 교차 확인",
        "applied": "안정 추천 적용",
        "critical-applied": "긴급 안전 설정 적용",
        "rolled-back": "자동 롤백 완료",
        "stable": "안정 구간 유지",
        "baseline": "기본 추천 유지"
    };
    return labels[status] || "추천 안정화";
}

function settingLine(plan, targetFormat) {
    const target = normalizeFormat(targetFormat);
    const parts = [];
    if (target !== "PNG" && plan.quality) parts.push(`품질 ${plan.quality}%`);
    parts.push(plan.resize?.label || "원본 해상도");
    if (plan.background && target === "JPG") parts.push("흰 배경");
    return parts.join(" · ");
}

function storePlannerHandoff(plan, requestedTarget) {
    if (!plan || !globalThis.sessionStorage) return;
    const target = normalizeFormat(requestedTarget);
    const payload = {
        sourceFormat: plan.sourceFormat,
        targetFormat: target,
        quality: target === "PNG" ? null : plan.quality,
        resizeMode: plan.resize?.mode || "original",
        resizeValue: plan.resize?.value || 1920,
        backgroundMode: plan.background === "white" ? "white" : undefined,
        score: plan.score,
        createdAt: Date.now()
    };
    try {
        sessionStorage.setItem("converterMall.smartPlanner.handoff", JSON.stringify(payload));
    } catch {
        // 저장소가 차단된 환경에서도 파일 전달은 계속 진행합니다.
    }
}

export function detectFileFormat(file) {
    const mime = String(file?.type || "").toLowerCase();
    const extension = getExtension(file?.name || "");

    const mimeMap = {
        "image/png": "PNG",
        "image/jpeg": "JPG",
        "image/webp": "WEBP",
        "image/heic": "HEIC",
        "image/heif": "HEIC",
        "application/pdf": "PDF",
        "text/csv": "CSV",
        "application/json": "JSON",
        "text/plain": "TXT"
    };

    return normalizeFormat(mimeMap[mime] || extension || "UNKNOWN");
}

function groupFilesByFormat(files) {
    const map = new Map();
    files.forEach(file => {
        const format = detectFileFormat(file);
        if (!map.has(format)) map.set(format, []);
        map.get(format).push(file);
    });
    return [...map.entries()]
        .map(([format, groupedFiles]) => ({ format, files: groupedFiles }))
        .sort((a, b) => b.files.length - a.files.length || a.format.localeCompare(b.format, "ko"));
}

function normalizeFormat(value) {
    const normalized = String(value || "UNKNOWN").replace(/^\./, "").trim().toUpperCase();
    return FORMAT_ALIASES[normalized] || normalized;
}

function getExtension(name) {
    const clean = String(name || "").trim().toLowerCase();
    const index = clean.lastIndexOf(".");
    return index >= 0 ? clean.slice(index + 1) : "";
}

function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (!value) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const amount = value / (1024 ** index);
    return `${amount.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function resolveElement(value, fallbackSelector) {
    if (typeof value === "string") return document.querySelector(value);
    return value || document.querySelector(fallbackSelector);
}

function defaultNotice(message) {
    if (typeof window.showSiteNotice === "function") {
        window.showSiteNotice(message);
        return;
    }
    alert(message);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
}

function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
}

function policyCenterTemplate(dashboard = {}) {
    const stability = dashboard.stability || {};
    const prediction = dashboard.prediction || {};
    const policies = Array.isArray(stability.policies) ? stability.policies : [];
    const history = Array.isArray(stability.history) ? stability.history.slice(0, 6) : [];
    return `<section class="policy-center" data-policy-center>
        <div class="policy-center-head">
            <div><strong>🛡️ 추천 정책 제어센터</strong><p>자동 추천 상태·학습값·롤백 이력을 직접 관리합니다.</p></div>
            <div class="policy-center-actions">
                <button type="button" data-policy-export>백업 저장</button>
                <button type="button" data-policy-import>백업 복원</button>
                <input type="file" accept="application/json,.json" data-policy-import-input hidden>
                <button type="button" data-policy-reset>정책 초기화</button>
                <button type="button" data-learning-reset>학습값 초기화</button>
                <button type="button" data-history-clear>이력 삭제</button>
            </div>
        </div>
        <div class="policy-metrics">
            <span><b>${Number(stability.activeCount || 0)}</b> 활성 정책</span>
            <span><b>${Number(stability.pendingCount || 0)}</b> 확인 중</span>
            <span><b>${Number(stability.rollbackCount || 0)}</b> 롤백</span>
            <span><b>${Number(prediction.totalSamples || 0)}</b> 학습 샘플</span>
            <span><b>${prediction.accuracyScore == null ? "-" : prediction.accuracyScore}</b> 예측 정확도</span>
        </div>
        ${policies.length ? `<div class="policy-list">${policies.map(item => `<div class="policy-row"><div><strong>${escapeHtml(item.key)}</strong><small>${item.active ? `품질 ${item.active.quality ?? "-"}% · ${escapeHtml(item.active.resize?.label || "원본 유지")}` : "기본 추천 사용"}</small></div><button type="button" data-policy-rollback="${escapeAttribute(item.key)}" ${item.previous ? "" : "disabled"}>이전 설정 복구</button></div>`).join("")}</div>` : `<p class="policy-empty">아직 저장된 안정 정책이 없습니다.</p>`}
        ${history.length ? `<details class="policy-history"><summary>최근 정책 변경 이력 ${history.length}건</summary><ol>${history.map(item => `<li><strong>${escapeHtml(item.key)}</strong> · ${escapeHtml(policyEventLabel(item.type))}<small>${new Date(item.at).toLocaleString("ko-KR")}</small></li>`).join("")}</ol></details>` : ""}
    </section>`;
}

function policyEventLabel(type) {
    return ({
        applied: "안정 추천 적용",
        "critical-applied": "긴급 안전 설정 적용",
        "auto-rollback": "자동 롤백",
        "manual-rollback": "수동 롤백",
        "policy-reset": "정책 초기화",
        "all-policies-reset": "전체 정책 초기화"
    })[type] || String(type || "정책 변경");
}
