export function createSessionManager({
  historyStore,
  sessionStore,
  downloadReceiptStore,
  formatSize,
  renderWorkflow,
  maxHistory = 10,
  now = () => new Date()
} = {}) {
  if (!historyStore || !sessionStore || !downloadReceiptStore) {
    throw new TypeError("SessionManager requires history, session, and download receipt stores.");
  }
  if (typeof formatSize !== "function") {
    throw new TypeError("SessionManager requires a formatSize function.");
  }

  const emptySession = () => ({
    startedAt: now().toISOString(),
    uploaded: 0,
    converted: 0,
    downloaded: 0,
    saved: 0,
    state: "대기"
  });

  const readHistory = () => {
    const value = historyStore.read();
    return Array.isArray(value) ? value : [];
  };

  function renderHistory(e) {
    if (!e?.historyList) return;
    const items = readHistory();
    if (!items.length) {
      e.historyList.innerHTML = "<p>아직 변환 이력이 없습니다.</p>";
      return;
    }
    e.historyList.innerHTML = items.map(item => {
      const at = new Date(item.at);
      const failed = Number(item.failed || 0);
      return `<div class="history-item"><strong>${at.toLocaleString("ko-KR")}</strong><span>${Number(item.count || 0)}개 완료${failed ? ` · ${failed}개 실패` : ""}</span><span>${formatSize(Number(item.original || 0))} → ${formatSize(Number(item.converted || 0))}</span><span>${Number(item.rate || 0).toFixed(1)}% 절감</span><span>${(Number(item.time || 0) / 1000).toFixed(2)}초</span></div>`;
    }).join("");
  }

  function saveHistory(e, result) {
    const original = Number(result?.original || 0);
    const converted = Number(result?.converted || 0);
    const rate = original ? ((original - converted) / original * 100) : 0;
    const item = {
      at: now().toISOString(),
      count: Number(result?.success || 0),
      failed: Number(result?.failed || 0),
      original,
      converted,
      rate,
      time: Number(result?.time || 0)
    };
    historyStore.write([item, ...readHistory()].slice(0, maxHistory));
    renderHistory(e);
    return item;
  }

  function clearHistory(e) {
    historyStore.remove();
    renderHistory(e);
  }

  function renderDownloadReceipt(e, receipt) {
    if (!e?.lastDownloadReceipt || !receipt) return;
    const at = new Date(receipt.time || Date.now());
    e.lastDownloadReceipt.textContent = `최근 다운로드 · ${receipt.type || "파일"} · ${Number(receipt.count || 0)}개 · ${formatSize(Number(receipt.bytes || 0))} · ${at.toLocaleString("ko-KR")}`;
  }

  function restoreDownloadReceipt(e) {
    const receipt = downloadReceiptStore.read();
    if (receipt) renderDownloadReceipt(e, receipt);
    return receipt;
  }

  function recordDownloadReceipt(e, type, count, bytes) {
    const receipt = {
      type,
      count: Number(count || 0),
      bytes: Number(bytes || 0),
      time: now().toISOString()
    };
    downloadReceiptStore.write(receipt);
    renderDownloadReceipt(e, receipt);
    if (typeof renderWorkflow === "function") {
      renderWorkflow(e, "download", { message: `${type} 다운로드 요청이 완료되었습니다.` });
    }
    return receipt;
  }

  function readSession() {
    const value = sessionStore.read();
    return value && typeof value === "object" ? { ...emptySession(), ...value } : emptySession();
  }

  function renderSession(e, data) {
    if (!e?.sessionStarted) return;
    const startedAt = new Date(data.startedAt || Date.now());
    e.sessionStarted.textContent = startedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    e.sessionUploaded.textContent = `${Number(data.uploaded || 0)}개`;
    e.sessionConverted.textContent = `${Number(data.converted || 0)}개`;
    e.sessionDownloaded.textContent = `${Number(data.downloaded || 0)}개`;
    e.sessionSaved.textContent = formatSize(Number(data.saved || 0));
    e.sessionState.textContent = data.state || "대기";
  }

  function restoreSession(e) {
    const data = readSession();
    sessionStore.write(data);
    renderSession(e, data);
    return data;
  }

  function updateSession(e, delta = {}) {
    const data = readSession();
    for (const key of ["uploaded", "converted", "downloaded", "saved"]) {
      if (Number.isFinite(Number(delta[key]))) {
        data[key] = Math.max(0, Number(data[key] || 0) + Number(delta[key]));
      }
    }
    if (delta.state) data.state = delta.state;
    data.updatedAt = now().toISOString();
    sessionStore.write(data);
    renderSession(e, data);
    return data;
  }

  return {
    renderHistory,
    saveHistory,
    clearHistory,
    restoreDownloadReceipt,
    recordDownloadReceipt,
    restoreSession,
    updateSession,
    readSession
  };
}
