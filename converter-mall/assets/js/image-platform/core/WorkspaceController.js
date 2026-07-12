/**
 * WorkspaceController
 * Manages short-lived workspace recovery, delayed cleanup, and memory summaries.
 * It deliberately stores snapshots only in the current browser tab memory.
 */
export function createWorkspaceController({ sum, formatSize }) {
  let recoverySnapshot = null;
  let cleanupTimer = null;
  let cleanupTicker = null;

  function capture({ files, selected, converted, perFile, originalOrder }) {
    recoverySnapshot = {
      files: [...files],
      selected: new Set(selected),
      converted: [...converted],
      perFile: new Map(perFile),
      originalOrder: [...originalOrder],
      createdAt: Date.now(),
    };
    return recoverySnapshot;
  }

  function consumeRecovery() {
    const snapshot = recoverySnapshot;
    recoverySnapshot = null;
    return snapshot;
  }

  function hasRecovery() {
    return Boolean(recoverySnapshot);
  }

  function clearRecovery() {
    recoverySnapshot = null;
  }

  function cancelCleanup(e) {
    clearTimeout(cleanupTimer);
    clearInterval(cleanupTicker);
    cleanupTimer = null;
    cleanupTicker = null;
    e?.downloadNote?.classList?.remove("cleanup-countdown");
  }

  function scheduleCleanup(e, {
    enabled,
    hasResults,
    delay = 15000,
    onCleanup,
    onNotify,
  }) {
    if (!enabled || !hasResults) return false;
    cancelCleanup(e);
    const deadline = Date.now() + delay;
    const paint = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (e?.downloadNote) {
        e.downloadNote.textContent = `다운로드 요청 완료 · ${seconds}초 후 결과 메모리 자동 정리`;
        e.downloadNote.classList.add("cleanup-countdown");
      }
    };
    paint();
    cleanupTicker = setInterval(paint, 1000);
    cleanupTimer = setTimeout(() => {
      clearInterval(cleanupTicker);
      cleanupTicker = null;
      cleanupTimer = null;
      onCleanup?.();
      if (e?.downloadNote) e.downloadNote.textContent = "다운로드 후 결과 메모리 자동 정리 완료";
      onNotify?.("다운로드 결과 메모리를 안전하게 정리했습니다.");
    }, delay);
    return true;
  }

  function getMemorySummary(converted, cacheBytes = 0) {
    const resultBytes = sum(converted.map(item => item.blob?.size || 0));
    const totalBytes = resultBytes + Math.max(0, cacheBytes || 0);
    return {
      resultBytes,
      cacheBytes: Math.max(0, cacheBytes || 0),
      totalBytes,
      resultCount: converted.length,
      label: totalBytes
        ? `메모리 사용 ${formatSize(totalBytes)} · 결과 ${converted.length}개`
        : "메모리 사용 최소",
    };
  }

  function destroy(e) {
    cancelCleanup(e);
    clearRecovery();
  }

  return {
    capture,
    consumeRecovery,
    hasRecovery,
    clearRecovery,
    cancelCleanup,
    scheduleCleanup,
    getMemorySummary,
    destroy,
  };
}
