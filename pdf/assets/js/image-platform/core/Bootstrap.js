export function collectConverterElements(root = document) {
  const id = value => root.getElementById(value);
  return {dropZone:id("dropZone"),fileInput:id("fileInput"),selectFileBtn:id("selectFileBtn"),summarySection:id("summarySection"),totalCount:id("totalCount"),totalSize:id("totalSize"),convertedSize:id("convertedSize"),savedSize:id("savedSize"),compressionRate:id("compressionRate"),successCount:id("successCount"),convertStatus:id("convertStatus"),optionSection:id("optionSection"),qualityRange:id("qualityRange"),qualityValue:id("qualityValue"),presetButtons:[...document.querySelectorAll(".preset-btn")],backgroundMode:id("backgroundMode"),backgroundColor:id("backgroundColor"),backgroundColorText:id("backgroundColorText"),customColorWrap:id("customColorWrap"),resizeMode:id("resizeMode"),resizeValue:id("resizeValue"),resizeValueWrap:id("resizeValueWrap"),resizeUnit:id("resizeUnit"),resizeButtons:[...document.querySelectorAll(".chip-btn")],previewSection:id("previewSection"),previewList:id("previewList"),selectAllCheckbox:id("selectAllCheckbox"),selectedCount:id("selectedCount"),deleteSelectedBtn:id("deleteSelectedBtn"),actionSection:id("actionSection"),convertBtn:id("convertBtn"),downloadBtn:id("downloadBtn"),zipDownloadBtn:id("zipDownloadBtn"),zipCancelBtn:id("zipCancelBtn"),cancelBtn:id("cancelBtn"),resetBtn:id("resetBtn"),recoverBtn:id("recoverBtn"),releaseResultsBtn:id("releaseResultsBtn"),autoCleanup:id("autoCleanup"),memoryStatus:id("memoryStatus"),statusSection:id("statusSection"),statusText:id("statusText"),progressBar:id("progressBar"),errorList:id("errorList"),reportSection:id("reportSection"),reportSuccess:id("reportSuccess"),reportFailed:id("reportFailed"),reportOriginal:id("reportOriginal"),reportConverted:id("reportConverted"),reportRate:id("reportRate"),reportTime:id("reportTime"),compareModal:id("compareModal"),compareTitle:id("compareTitle"),closeCompareBtn:id("closeCompareBtn"),compareZoomOut:id("compareZoomOut"),compareZoomReset:id("compareZoomReset"),compareZoomIn:id("compareZoomIn"),compareZoomLabel:id("compareZoomLabel"),originalCompareImage:id("originalCompareImage"),convertedCompareImage:id("convertedCompareImage"),originalCompareMeta:id("originalCompareMeta"),convertedCompareMeta:id("convertedCompareMeta"),filenameMode:id("filenameMode"),filenameText:id("filenameText"),filenameTextWrap:id("filenameTextWrap"),zipName:id("zipName"),sortMode:id("sortMode"),analyzeBtn:id("analyzeBtn"),applySmartBtn:id("applySmartBtn"),smartSummary:id("smartSummary"),smartList:id("smartList"),smartPanel:id("smartPanel"),csvDownloadBtn:id("csvDownloadBtn"),verifyReportBtn:id("verifyReportBtn"),downloadNote:id("downloadNote"),toast:id("toast"),themeToggleBtn:id("themeToggleBtn"),shortcutBtn:id("shortcutBtn"),shortcutModal:id("shortcutModal"),closeShortcutBtn:id("closeShortcutBtn"),helpBtn:id("helpBtn"),helpModal:id("helpModal"),closeHelpBtn:id("closeHelpBtn"),historyList:id("historyList"),clearHistoryBtn:id("clearHistoryBtn"),purposeButtons:[...document.querySelectorAll(".purpose-btn")],balanceScore:id("balanceScore"),balanceMeter:id("balanceMeter"),balanceMeta:id("balanceMeta"),diagnosticPanel:id("diagnosticPanel"),diagnoseBtn:id("diagnoseBtn"),deviceGrade:id("deviceGrade"),recommendedWorkers:id("recommendedWorkers"),highRiskCount:id("highRiskCount"),stabilityScore:id("stabilityScore"),riskList:id("riskList"),reportQuality:id("reportQuality"),reportStability:id("reportStability"),workflowPanel:id("workflowPanel"),workflowMessage:id("workflowMessage"),workflowUpload:id("workflowUpload"),workflowSettings:id("workflowSettings"),workflowConvert:id("workflowConvert"),workflowDownload:id("workflowDownload"),lastDownloadReceipt:id("lastDownloadReceipt"),sessionStarted:id("sessionStarted"),sessionUploaded:id("sessionUploaded"),sessionConverted:id("sessionConverted"),sessionDownloaded:id("sessionDownloaded"),sessionSaved:id("sessionSaved"),sessionState:id("sessionState"),systemCheckBtn:id("systemCheckBtn"),systemCheckModal:id("systemCheckModal"),closeSystemCheckBtn:id("closeSystemCheckBtn"),rerunSystemCheckBtn:id("rerunSystemCheckBtn"),downloadSystemReportBtn:id("downloadSystemReportBtn"),systemCheckSummary:id("systemCheckSummary"),systemCheckList:id("systemCheckList"),formatSettingsPanel:id("formatSettingsPanel"),formatContentMode:id("formatContentMode"),formatColorMode:id("formatColorMode"),formatSharpen:id("formatSharpen"),formatAlphaMode:id("formatAlphaMode"),formatTrimTransparent:id("formatTrimTransparent"),formatTrimThreshold:id("formatTrimThreshold"),formatTrimThresholdWrap:id("formatTrimThresholdWrap"),formatBackgroundColor:id("formatBackgroundColor"),formatBackgroundWrap:id("formatBackgroundWrap"),formatPresetButtons:[...document.querySelectorAll("[data-format-preset]")],formatGifFrameMode:id("formatGifFrameMode"),formatGifFrameIndex:id("formatGifFrameIndex"),formatGifFrameIndexWrap:id("formatGifFrameIndexWrap"),formatSvgScale:id("formatSvgScale"),formatBmpAlphaMode:id("formatBmpAlphaMode"),formatArtifactMode:id("formatArtifactMode"),formatSourceFrameMode:id("formatSourceFrameMode"),formatSourceFrameIndex:id("formatSourceFrameIndex"),formatSourceFrameIndexWrap:id("formatSourceFrameIndexWrap")}
}

export function installRuntimeDiagnostics({ diagnosticsManager, elements, showToast }) {
  const onError = event => {
    diagnosticsManager?.recordRuntimeIssue(
      "error",
      event.message || "알 수 없는 실행 오류",
      event.error
    );
  };

  const onUnhandledRejection = event => {
    diagnosticsManager?.recordRuntimeIssue(
      "unhandledrejection",
      event.reason?.message || String(event.reason || "알 수 없는 비동기 오류"),
      event.reason
    );
    console.error("Unhandled converter error", event.reason);
    showToast?.(elements, "예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.");
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
