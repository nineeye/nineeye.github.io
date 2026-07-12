import { fmt } from "../utils/file-utils.js";

export function renderSummaryResult(elements, originalBytes, convertedBytes) {
  const savedBytes = originalBytes - convertedBytes;
  const savingRate = originalBytes ? (savedBytes / originalBytes) * 100 : 0;

  elements.convertedSize.textContent = fmt(convertedBytes);
  elements.savedSize.textContent = savedBytes >= 0 ? fmt(savedBytes) : `+${fmt(-savedBytes)}`;
  elements.compressionRate.textContent = `${savingRate.toFixed(1)}%`;
  elements.savedSize.className = savedBytes >= 0 ? "saving-positive" : "saving-negative";
  elements.compressionRate.className = savingRate >= 0 ? "saving-positive" : "saving-negative";
}

export function renderResultReport(elements, result) {
  elements.reportSuccess.textContent = `${result.success}개`;
  elements.reportFailed.textContent = `${result.failed}개`;
  elements.reportOriginal.textContent = fmt(result.original);
  elements.reportConverted.textContent = fmt(result.converted);

  const savingRate = result.original
    ? ((result.original - result.converted) / result.original) * 100
    : 0;
  const quality = Number(elements.qualityRange.value);
  const grade = getQualityGrade(quality, savingRate, result.failed);
  const stabilityScore = Math.max(0, 100 - result.failed * 18 - (result.time > 30000 ? 10 : 0));

  elements.reportRate.textContent = `${savingRate.toFixed(1)}%`;
  elements.reportTime.textContent = `${(result.time / 1000).toFixed(2)}초`;
  elements.reportQuality.textContent = grade.label;
  elements.reportQuality.className = `quality-grade ${grade.className}`;
  elements.reportStability.textContent = stabilityScore >= 90
    ? "매우 안정"
    : stabilityScore >= 75
      ? "안정"
      : "점검 권장";
  elements.reportSection.hidden = false;
}

export function renderErrors(elements, items = []) {
  if (!elements.errorList) return;
  elements.errorList.replaceChildren();

  for (const item of items) {
    const row = document.createElement("li");
    row.textContent = item;
    elements.errorList.appendChild(row);
  }

  elements.errorList.hidden = items.length === 0;
}

export function updateWorkflow(elements, stage, options = {}) {
  if (!elements.workflowPanel) return;

  const order = ["upload", "settings", "convert", "download"];
  const nodes = [
    elements.workflowUpload,
    elements.workflowSettings,
    elements.workflowConvert,
    elements.workflowDownload,
  ];
  const index = Math.max(0, order.indexOf(stage));

  nodes.forEach((node, nodeIndex) => {
    if (!node) return;
    node.classList.toggle("done", nodeIndex < index);
    node.classList.toggle("active", nodeIndex === index);
  });

  const selectedCount = Number(options.selectedCount || 0);
  const fileCount = Number(options.fileCount || 0);
  const sourceFormat = String(options.sourceFormat || "이미지").toUpperCase();
  const targetFormat = String(options.targetFormat || "결과 파일").toUpperCase();
  const optionLabels = Array.isArray(options.optionLabels) && options.optionLabels.length
    ? options.optionLabels.join("·")
    : "변환 옵션";
  const defaults = {
    upload: `${sourceFormat} 파일을 추가하면 다음 단계로 이동합니다.`,
    settings: `${selectedCount || fileCount}개 파일의 ${optionLabels}을 확인하세요.`,
    convert: `선택 파일을 ${targetFormat}(으)로 변환하고 결과 무결성을 검사합니다.`,
    download: `검증된 ${targetFormat}를 개별 또는 ZIP으로 다운로드하세요.`,
  };

  elements.workflowMessage.textContent = options.message || defaults[stage] || defaults.upload;
}

export function setProgress(elements, percent, message = "") {
  const value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  elements.progressBar.style.width = `${value}%`;
  elements.progressBar.parentElement?.setAttribute("aria-valuenow", String(value));
  if (message) elements.statusText.textContent = message;
}

export function resetProgress(elements) {
  setProgress(elements, 0, "");
}

function getQualityGrade(quality, savingRate, failedCount) {
  const score = quality * 0.62
    + Math.max(0, Math.min(100, savingRate)) * 0.38
    - failedCount * 12;

  if (score >= 86) return { label: "A+ · 전문가급", className: "grade-a" };
  if (score >= 76) return { label: "A · 매우 우수", className: "grade-a" };
  if (score >= 64) return { label: "B · 균형 우수", className: "grade-b" };
  if (score >= 50) return { label: "C · 용량 우선", className: "grade-c" };
  return { label: "D · 재조정 권장", className: "grade-d" };
}
