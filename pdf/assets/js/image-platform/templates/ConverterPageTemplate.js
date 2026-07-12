import { applyFormatSpecialization } from "../core/FormatSpecialization.js";

const PAGE_TEMPLATE = String.raw`<a class="skip-link" href="#mainContent">본문으로 바로가기</a>
<header class="converter-header"><div class="container"><div class="header-row"><div><a class="back-link" href="../../index.html">← Converter Mall</a><h1>{{TITLE}} 전문가 변환기 <span style="font-size:14px;background:#2563eb;padding:5px 9px;border-radius:999px;vertical-align:middle">⚡ TURBO</span></h1><p id="converterPurposeText">각 출력 형식의 특성과 제약에 맞춰 최적 설정으로 변환합니다.</p><span class="release-badge" title="Release Candidate {{VERSION}}">✓ {{STAGE_LABEL}} Release Candidate</span></div><div class="header-actions"><button id="themeToggleBtn" class="header-btn" type="button" aria-pressed="false">🌙 다크모드</button><button id="systemCheckBtn" class="header-btn" type="button">🧪 환경 점검</button><button id="shortcutBtn" class="header-btn" type="button" aria-keyshortcuts="?">⌨ 단축키</button><button id="helpBtn" class="header-btn" type="button">❔ 사용 가이드</button></div></div></div></header>
<main id="mainContent" class="converter-page" tabindex="-1"><div class="container">
<section><div id="dropZone" class="upload-box" tabindex="0" role="button" aria-label="{{SOURCE_FORMAT}} 파일 업로드 영역"><input type="file" id="fileInput" accept="{{ACCEPT}}" multiple hidden><div class="upload-icon">🖼️</div><h2>{{SOURCE_FORMAT}} 파일 업로드</h2><p>파일을 드래그하거나 <button type="button" id="selectFileBtn" class="text-button" aria-keyshortcuts="Control+O Meta+O">파일 선택</button>을 눌러 업로드하세요.</p><small>지원 형식: {{SOURCE_FORMAT}} · 최대 100개 · 파일당 100MB · 브라우저 내부 처리</small><div class="privacy-note">🔒 파일은 서버에 업로드되지 않고 현재 브라우저 안에서만 처리됩니다.</div><div class="trust-strip" aria-label="변환 신뢰 안내"><div class="trust-item"><strong>🔒 로컬 처리</strong><span>이미지가 외부 서버로 업로드되지 않습니다.</span></div><div class="trust-item"><strong>⚡ 적응형 터보</strong><span>기기 성능과 이미지 크기에 맞춰 처리량을 자동 조절합니다.</span></div><div class="trust-item"><strong>✅ 결과 검증</strong><span>{{TARGET_FORMAT}} 구조와 다운로드 파일을 변환 후 다시 검사합니다.</span></div><div class="trust-item"><strong>🧹 메모리 보호</strong><span>대량 작업 후 임시 데이터와 미리보기를 안전하게 정리합니다.</span></div></div><div class="shortcut-strip" aria-label="빠른 단축키"><span><kbd>Ctrl</kbd>+<kbd>O</kbd> 파일 열기</span><span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> 변환</span><span><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> ZIP 저장</span><span><kbd>?</kbd> 전체 보기</span></div></div></section>
<section id="workflowPanel" class="workflow-panel" aria-label="작업 진행 단계"><div class="workflow-head"><h2>작업 진행 상태</h2><span id="workflowMessage" class="workflow-message">{{SOURCE_FORMAT}} 파일을 추가하면 단계별 상태를 안내합니다.</span></div><div class="workflow-steps"><div id="workflowUpload" class="workflow-step active"><b>1</b><div><strong>파일 선택</strong><small>{{SOURCE_FORMAT}} 업로드</small></div></div><div id="workflowSettings" class="workflow-step"><b>2</b><div><strong>설정 확인</strong><small>품질·배경·크기</small></div></div><div id="workflowConvert" class="workflow-step"><b>3</b><div><strong>변환·검증</strong><small>{{TARGET_FORMAT}} 생성</small></div></div><div id="workflowDownload" class="workflow-step"><b>4</b><div><strong>다운로드</strong><small>개별·ZIP</small></div></div></div><div id="lastDownloadReceipt" class="download-receipt">아직 다운로드 기록이 없습니다.</div><div class="session-summary" aria-label="현재 세션 요약"><div class="session-chip"><span>세션 시작</span><strong id="sessionStarted">-</strong></div><div class="session-chip"><span>업로드</span><strong id="sessionUploaded">0개</strong></div><div class="session-chip"><span>변환 성공</span><strong id="sessionConverted">0개</strong></div><div class="session-chip"><span>다운로드</span><strong id="sessionDownloaded">0개</strong></div><div class="session-chip"><span>누적 절감</span><strong id="sessionSaved">0 B</strong></div><div class="session-chip"><span>현재 상태</span><strong id="sessionState">대기</strong></div></div></section>
<section id="summarySection" class="summary" hidden><div class="summary-grid">
<div class="summary-card"><span>파일 개수</span><strong id="totalCount">0개</strong></div><div class="summary-card"><span>원본 총 용량</span><strong id="totalSize">-</strong></div><div class="summary-card"><span>변경 후 용량</span><strong id="convertedSize">-</strong></div><div class="summary-card"><span>절감 용량</span><strong id="savedSize">-</strong></div><div class="summary-card"><span>압축률</span><strong id="compressionRate">-</strong></div><div class="summary-card"><span>변환 성공</span><strong id="successCount">0개</strong></div><div class="summary-card"><span>변환 상태</span><strong id="convertStatus">대기중</strong></div>
</div></section>
<section id="optionSection" class="panel" hidden><div class="options-grid">
<div id="qualityOptionGroup" class="option-group" data-feature="quality"><h3>{{TARGET_FORMAT}} 품질</h3><div class="quality-row"><input type="range" id="qualityRange" min="1" max="100" value="92"><strong id="qualityValue">92%</strong></div><div class="quality-presets"><button class="preset-btn" data-quality="90">고화질 90%</button><button class="preset-btn" data-quality="75">균형 75%</button><button class="preset-btn" data-quality="50">용량 절약 50%</button><button class="preset-btn" data-quality="30">최소 용량 30%</button></div></div>
<div id="backgroundOptionGroup" class="option-group" data-feature="transparencyHandling"><h3>투명 배경 처리</h3><div class="field"><label for="backgroundMode">{{TARGET_FORMAT}} 배경</label><select id="backgroundMode"><option value="white">흰색</option><option value="black">검은색</option><option value="custom">사용자 지정</option></select></div><div class="field color-row" id="customColorWrap" hidden><label for="backgroundColor">배경색</label><input type="color" id="backgroundColor" value="#ffffff"><span id="backgroundColorText">#ffffff</span></div><small>{{TARGET_FORMAT}}는 투명도를 지원하지 않으므로 선택한 색으로 채웁니다.</small></div>
<div id="resizeOptionGroup" class="option-group" data-feature="resize"><h3>해상도 조절</h3><div class="field"><label for="resizeMode">크기 방식</label><select id="resizeMode"><option value="original">원본 유지</option><option value="percent">비율 축소</option><option value="width">가로 기준</option></select></div><div class="field" id="resizeValueWrap" hidden><label for="resizeValue">값</label><input type="number" id="resizeValue" min="1" value="80"><small id="resizeUnit">%</small></div><div class="resize-presets"><button class="chip-btn" data-resize-mode="original">원본</button><button class="chip-btn" data-resize-mode="percent" data-resize-value="75">75%</button><button class="chip-btn" data-resize-mode="percent" data-resize-value="50">50%</button><button class="chip-btn" data-resize-mode="width" data-resize-value="1920">1920px</button><button class="chip-btn" data-resize-mode="width" data-resize-value="1280">1280px</button><button class="chip-btn" data-resize-mode="width" data-resize-value="800">800px</button></div></div><div class="option-group"><h3>다운로드 파일명</h3><div class="field"><label for="filenameMode">이름 규칙</label><select id="filenameMode"><option value="original">원본 파일명 유지</option><option value="suffix">접미사 추가</option><option value="prefix">접두사 추가</option><option value="sequence">일련번호</option></select></div><div class="field" id="filenameTextWrap" hidden><label for="filenameText">추가 문구</label><input id="filenameText" type="text" value="-converted" maxlength="40" placeholder="예: -converted"></div><div class="field"><label for="zipName">ZIP 파일명</label><input id="zipName" type="text" value="converter-mall" maxlength="60"></div><small>금지 문자는 자동 제거되고 중복 이름은 번호가 붙습니다.</small></div>
</div><div id="formatSettingsPanel" class="format-settings-panel" hidden></div><div id="purposePresetGroup" class="option-group" data-feature="purposePresets" style="grid-column:1/-1"><h3>용도별 원클릭 프리셋</h3><div id="purposePresets" class="purpose-presets"><button class="purpose-btn" type="button" data-purpose="shopping"><strong>🛍️ 쇼핑몰 상품</strong><small>품질 88% · 최대 1600px · 흰 배경</small></button><button class="purpose-btn" type="button" data-purpose="blog"><strong>📝 블로그·웹</strong><small>품질 82% · 최대 1280px · 빠른 로딩</small></button><button class="purpose-btn" type="button" data-purpose="social"><strong>📱 SNS 업로드</strong><small>품질 85% · 최대 1080px · 모바일 최적화</small></button><button class="purpose-btn" type="button" data-purpose="archive"><strong>🖼️ 원본 보존</strong><small>품질 95% · 원본 해상도 유지</small></button></div></div></div><div id="smartPanel" class="smart-panel" data-feature="smartOptimization"><h3>🧠 스마트 최적화 추천</h3><p id="smartSummary">파일을 분석하면 용도에 맞는 무료 자동 추천을 제공합니다.</p><ul id="smartList"><li>이미지 크기·용량·투명 배경을 브라우저에서 분석합니다.</li></ul><div class="balance-card"><div class="balance-head"><strong>화질·용량 균형 점수</strong><strong id="balanceScore">-</strong></div><div class="balance-meter" aria-hidden="true"><span id="balanceMeter"></span></div><div id="balanceMeta" class="balance-meta">파일을 선택하면 현재 설정을 평가합니다.</div></div><div class="smart-actions"><button id="analyzeBtn" class="primary-btn" type="button">스마트 분석</button><button id="applySmartBtn" class="secondary-btn" type="button" disabled>추천 설정 적용</button></div><div id="diagnosticPanel" class="diagnostic-panel"><div class="diagnostic-head"><div><h3 style="margin:0">🩺 파일 진단·성능 튜닝</h3><small>변환 전 위험 요소와 현재 기기에 맞는 처리 전략을 자동 점검합니다.</small></div><button id="diagnoseBtn" class="ghost-btn" type="button">다시 진단</button></div><div class="diagnostic-grid"><div class="diagnostic-item"><span>기기 성능 등급</span><strong id="deviceGrade">분석 대기</strong></div><div class="diagnostic-item"><span>권장 병렬 처리</span><strong id="recommendedWorkers">-</strong></div><div class="diagnostic-item"><span>고위험 파일</span><strong id="highRiskCount">0개</strong></div><div class="diagnostic-item"><span>예상 안정성</span><strong id="stabilityScore">-</strong></div></div><ul id="riskList" class="risk-list"><li>파일을 선택하면 자동으로 진단합니다.</li></ul></div></section>
<section id="previewSection" class="preview-section" hidden><h2>미리보기 및 개별 설정</h2><div class="preview-toolbar"><div class="toolbar-controls"><label><input type="checkbox" id="selectAllCheckbox"> 전체 선택</label><label for="sortMode" class="sr-only">파일 정렬</label><select id="sortMode"><option value="original">업로드 순서</option><option value="name-asc">이름 오름차순</option><option value="name-desc">이름 내림차순</option><option value="size-desc">원본 용량 큰 순</option><option value="size-asc">원본 용량 작은 순</option><option value="estimate-desc">예상 {{TARGET_FORMAT}} 큰 순</option><option value="saving-desc">절감률 높은 순</option><option value="pixels-desc">해상도 큰 순</option></select></div><div class="selection-actions"><strong id="selectedCount">0개 선택</strong><button id="deleteSelectedBtn" class="danger-btn" type="button" disabled>선택 삭제</button></div></div><div id="previewList" class="preview-list"></div></section>
<section id="actionSection" class="action-section" hidden><button id="convertBtn" class="primary-btn" aria-keyshortcuts="Control+Enter Meta+Enter">선택 파일 변환</button><button id="cancelBtn" class="cancel-btn" hidden>변환 취소</button><button id="downloadBtn" class="secondary-btn" disabled>개별 다운로드</button><button id="zipDownloadBtn" class="secondary-btn" aria-keyshortcuts="Control+Shift+S Meta+Shift+S" disabled>전체 ZIP 다운로드</button><button id="zipCancelBtn" class="cancel-btn" type="button" hidden>ZIP 생성 취소</button><button id="csvDownloadBtn" class="ghost-btn" disabled>CSV 리포트</button><button id="verifyReportBtn" class="ghost-btn" disabled>검증 리포트</button><button id="releaseResultsBtn" class="ghost-btn" type="button" disabled>결과 메모리 정리</button><button id="recoverBtn" class="ghost-btn" type="button" hidden>이전 작업 복구</button><label class="auto-cleanup" title="다운로드 요청 후 15초 뒤 변환 결과 메모리를 자동 정리합니다."><input id="autoCleanup" type="checkbox"> 다운로드 후 자동 정리</label><span id="memoryStatus" class="memory-status">메모리 사용 최소</span><span id="downloadNote" class="download-note"></span><button id="resetBtn" class="ghost-btn">다시 선택</button></section>
<section id="statusSection" class="status-section" hidden aria-live="polite"><p id="statusText">대기중</p><div class="progress-wrap" role="progressbar" aria-label="변환 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="progressBar" class="progress-bar"></div></div><ul id="errorList" class="error-list" hidden></ul></section>
<section id="reportSection" class="report-section" hidden><h2>변환 결과 리포트</h2><div class="report-grid"><div class="report-item"><span>성공</span><strong id="reportSuccess">0개</strong></div><div class="report-item"><span>실패</span><strong id="reportFailed">0개</strong></div><div class="report-item"><span>원본 용량</span><strong id="reportOriginal">-</strong></div><div class="report-item"><span>결과 용량</span><strong id="reportConverted">-</strong></div><div class="report-item"><span>절감률</span><strong id="reportRate">-</strong></div><div class="report-item"><span>처리 시간</span><strong id="reportTime">-</strong></div><div class="report-item"><span>결과 품질 등급</span><strong id="reportQuality" class="quality-grade">-</strong></div><div class="report-item"><span>안정성</span><strong id="reportStability">-</strong></div></div></section><section id="historySection" class="panel"><div class="preview-toolbar"><div><h2 style="margin:0">최근 변환 이력</h2><small>파일 자체는 저장하지 않고 결과 요약만 이 브라우저에 최대 10개 보관합니다.</small></div><button id="clearHistoryBtn" class="ghost-btn" type="button">이력 지우기</button></div><div id="historyList" class="history-list"><p>아직 변환 이력이 없습니다.</p></div></section>
</div></main>
<footer class="converter-footer"><div class="container"><p>© 2026 Converter Mall</p><p>모든 변환은 브라우저에서 처리되며 파일은 서버로 전송되지 않습니다.</p><p style="font-size:12px;color:#94a3b8">{{STAGE_LABEL}} · Shared Image Platform · 공통 이미지 변환 플랫폼</p></div></footer>
<div id="systemCheckModal" class="modal" hidden><div class="modal-card" style="width:min(760px,96vw)"><div class="modal-head"><h2>브라우저 환경 자가점검</h2><button id="closeSystemCheckBtn" class="ghost-btn" type="button">닫기</button></div><p class="system-check-meta">현재 브라우저에서 변환·다운로드·검증 기능을 사용할 수 있는지 즉시 확인합니다. 파일은 전송하지 않습니다.</p><div id="systemCheckSummary" class="privacy-note">점검을 시작합니다.</div><div id="systemCheckList" class="system-check-list"></div><div class="smart-actions"><button id="rerunSystemCheckBtn" class="primary-btn" type="button">다시 점검</button><button id="downloadSystemReportBtn" class="ghost-btn" type="button">진단 리포트 저장</button></div></div></div>
<div id="shortcutModal" class="modal" hidden><div class="modal-card" style="width:min(720px,96vw)"><div class="modal-head"><h2>키보드 단축키</h2><button id="closeShortcutBtn" class="ghost-btn" type="button">닫기</button></div><p class="system-check-meta">입력창을 편집하는 동안에는 단축키가 작동하지 않습니다. Windows는 Ctrl, macOS는 Command를 사용합니다.</p><div class="shortcut-grid"><div class="shortcut-item"><span>{{SOURCE_FORMAT}} 파일 선택창 열기</span><span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>O</kbd></span></div><div class="shortcut-item"><span>선택 파일 변환 시작</span><span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>Enter</kbd></span></div><div class="shortcut-item"><span>전체 ZIP 다운로드</span><span class="shortcut-keys"><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>S</kbd></span></div><div class="shortcut-item"><span>다크·라이트 모드 전환</span><span class="shortcut-keys"><kbd>Alt</kbd><kbd>D</kbd></span></div><div class="shortcut-item"><span>단축키 창 열기</span><span class="shortcut-keys"><kbd>?</kbd></span></div><div class="shortcut-item"><span>열린 창 닫기</span><span class="shortcut-keys"><kbd>Esc</kbd></span></div></div></div></div>
<div id="helpModal" class="modal" hidden><div class="modal-card"><div class="modal-head"><h2>{{TITLE}} 사용 가이드</h2><button id="closeHelpBtn" class="ghost-btn" type="button">닫기</button></div><p id="formatHelpIntro" class="system-check-meta"></p><div class="help-grid"><div class="help-card"><h3>1. 파일 선택</h3><p>{{SOURCE_FORMAT}} 파일을 드래그하거나 파일 선택 버튼으로 최대 100개까지 추가합니다.</p></div><div class="help-card"><h3>2. 품질 설정</h3><p>사진은 75~90%, 단순 그래픽은 60~80%가 일반적으로 균형이 좋습니다.</p></div><div class="help-card"><h3>3. 투명 배경</h3><p>{{TARGET_FORMAT}}는 투명을 지원하지 않으므로 흰색·검은색·사용자 색상 중 하나로 채웁니다.</p></div><div class="help-card"><h3>4. 해상도</h3><p>웹 게시용은 1280px 또는 1920px, 썸네일은 800px을 권장합니다.</p></div><div class="help-card"><h3>5. 전후 비교</h3><p>각 파일의 비교 버튼으로 품질과 예상 용량을 변환 전에 확인합니다.</p></div><div class="help-card"><h3>6. 다운로드</h3><p>개별 다운로드 또는 ZIP 일괄 다운로드를 선택할 수 있습니다.</p></div></div></div></div>
<div id="compareModal" class="modal" hidden><div class="modal-card"><div class="modal-head"><h2 id="compareTitle">전후 비교</h2><button id="closeCompareBtn" class="ghost-btn">닫기</button></div><div class="compare-toolbar"><button id="compareZoomOut" class="ghost-btn" type="button">− 축소</button><button id="compareZoomReset" class="ghost-btn" type="button">100%</button><button id="compareZoomIn" class="ghost-btn" type="button">＋ 확대</button><span id="compareZoomLabel" class="compare-hint">확대율 100% · 두 화면 동기화</span></div><div class="compare-grid"><div class="compare-pane"><h3>원본 {{SOURCE_FORMAT}}</h3><div class="compare-stage"><img id="originalCompareImage" alt="원본 미리보기"></div><div id="originalCompareMeta" class="compare-meta"></div></div><div class="compare-pane"><h3>예상 {{TARGET_FORMAT}}</h3><div class="compare-stage"><img id="convertedCompareImage" alt="변환 미리보기"></div><div id="convertedCompareMeta" class="compare-meta"></div></div></div></div></div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>`;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function replaceTokens(template, values) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => escapeHtml(values[key] ?? ""));
}

function applyFeatureFlags(definition) {
  const features = {
    quality: true,
    transparencyHandling: true,
    preserveAlpha: false,
    resize: true,
    purposePresets: true,
    smartOptimization: true,
    perFileSettings: true,
    comparison: true,
    reports: true,
    ...(definition.features || {}),
  };
  document.querySelectorAll("[data-feature]").forEach(node => {
    const enabled = features[node.dataset.feature] !== false;
    node.hidden = !enabled;
    node.setAttribute("aria-hidden", String(!enabled));
  });
  document.body.dataset.preserveAlpha = String(Boolean(features.preserveAlpha));
  document.body.dataset.featureFlags = Object.entries(features).filter(([, enabled]) => enabled).map(([name]) => name).join(",");

  const workflowSettings = document.querySelector("#workflowSettings small");
  if (workflowSettings) {
    const labels = [];
    if (features.quality) labels.push("품질");
    if (features.transparencyHandling) labels.push("배경");
    if (features.resize) labels.push("크기");
    workflowSettings.textContent = labels.join("·") || "변환 옵션";
  }

  const backgroundHelp = [...document.querySelectorAll("#helpModal .help-card")].find(card => card.querySelector("h3")?.textContent.includes("투명 배경"));
  if (backgroundHelp) backgroundHelp.hidden = !features.transparencyHandling;
}

export function mountConverterPage(definition) {
  if (!definition?.source || !definition?.target) {
    throw new TypeError("유효한 Converter Definition이 필요합니다.");
  }
  const sourceFormat = definition.source.format;
  const targetFormat = definition.target.format;
  const accept = [...(definition.source.mimeTypes || []), ...(definition.source.extensions || []).map(ext => `.${ext}`)].join(",");
  const values = {
    TITLE: definition.title || `${sourceFormat} → ${targetFormat}`,
    SOURCE_FORMAT: sourceFormat,
    TARGET_FORMAT: targetFormat,
    SOURCE_MIME: definition.source.mimeTypes?.[0] || "",
    ACCEPT: accept,
    STAGE_LABEL: `Stage ${definition.stage}`,
    RUNTIME_VERSION: definition.runtimeVersion || `stage${definition.stage}`,
    VERSION: definition.version || "",
  };
  document.documentElement.lang = "ko";
  document.title = `${values.TITLE} 변환기 | Converter Mall`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = `브라우저에서 안전하게 ${definition.description || values.TITLE}`;
  document.body.innerHTML = replaceTokens(PAGE_TEMPLATE, values);
  document.body.dataset.converterId = definition.id || "image-converter";
  document.body.dataset.converterStage = String(definition.stage || "");
  applyFeatureFlags(definition);
  applyFormatSpecialization(definition);
}

export function getConverterTemplateIds() {
  return [...PAGE_TEMPLATE.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
}
