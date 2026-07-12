export function createModalManager(e) {
  const registry = {
    compare: e.compareModal,
    help: e.helpModal,
    shortcut: e.shortcutModal,
    system: e.systemCheckModal,
  };

  let activeName = null;
  let restoreFocus = null;
  let compareZoom = 1;
  let compareUrls = [];
  let comparePanBound = false;

  function get(name) {
    return registry[name] || null;
  }

  function open(name, options = {}) {
    const modal = get(name);
    if (!modal) return false;
    if (activeName && activeName !== name) close(activeName);
    restoreFocus = options.trigger || document.activeElement;
    modal.hidden = false;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    activeName = name;
    const focusTarget = options.focusTarget || modal.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    requestAnimationFrame(() => focusTarget?.focus?.());
    return true;
  }

  function close(name = activeName) {
    const modal = get(name);
    if (!modal) return false;
    if (name === "compare") releaseCompareUrls();
    modal.hidden = true;
    if (activeName === name) activeName = null;
    const target = restoreFocus;
    restoreFocus = null;
    requestAnimationFrame(() => target?.focus?.());
    return true;
  }

  function closeAll() {
    Object.keys(registry).forEach(name => {
      const modal = get(name);
      if (!modal?.hidden) {
        if (name === "compare") releaseCompareUrls();
        modal.hidden = true;
      }
    });
    activeName = null;
    const target = restoreFocus;
    restoreFocus = null;
    requestAnimationFrame(() => target?.focus?.());
  }

  function bindBackdrop(name) {
    const modal = get(name);
    if (!modal) return;
    modal.addEventListener("click", event => {
      if (event.target === modal) close(name);
    });
  }

  function bindCloseButton(name, button) {
    if (!button) return;
    button.addEventListener("click", () => close(name));
  }

  function releaseCompareUrls() {
    for (const url of compareUrls) URL.revokeObjectURL(url);
    compareUrls = [];
    if (e.compareModal) e.compareModal.dataset.urls = "";
    if (e.originalCompareImage) e.originalCompareImage.removeAttribute("src");
    if (e.convertedCompareImage) e.convertedCompareImage.removeAttribute("src");
  }

  function setCompareZoom(value) {
    compareZoom = Math.min(3, Math.max(0.5, Math.round(Number(value) * 100) / 100));
    const transform = `scale(${compareZoom})`;
    if (e.originalCompareImage) e.originalCompareImage.style.transform = transform;
    if (e.convertedCompareImage) e.convertedCompareImage.style.transform = transform;
    if (e.compareZoomLabel) e.compareZoomLabel.textContent = `확대율 ${Math.round(compareZoom * 100)}% · 두 화면 동기화`;
  }

  function bindComparePan() {
    if (comparePanBound || !e.compareModal) return;
    const stages = [...e.compareModal.querySelectorAll(".compare-stage")];
    if (stages.length < 2) return;
    comparePanBound = true;
    let syncing = false;
    for (const stage of stages) {
      stage.addEventListener("scroll", () => {
        if (syncing) return;
        syncing = true;
        const other = stages[0] === stage ? stages[1] : stages[0];
        const rx = stage.scrollWidth > stage.clientWidth ? stage.scrollLeft / (stage.scrollWidth - stage.clientWidth) : 0;
        const ry = stage.scrollHeight > stage.clientHeight ? stage.scrollTop / (stage.scrollHeight - stage.clientHeight) : 0;
        other.scrollLeft = rx * Math.max(0, other.scrollWidth - other.clientWidth);
        other.scrollTop = ry * Math.max(0, other.scrollHeight - other.clientHeight);
        requestAnimationFrame(() => { syncing = false; });
      }, { passive: true });
    }
  }

  function openCompare({ title, originalUrl, convertedUrl, originalMeta, convertedMeta, trigger }) {
    releaseCompareUrls();
    compareUrls = [originalUrl, convertedUrl].filter(Boolean);
    if (e.compareModal) e.compareModal.dataset.urls = JSON.stringify(compareUrls);
    if (e.compareTitle) e.compareTitle.textContent = title || "전후 비교";
    if (e.originalCompareImage) e.originalCompareImage.src = originalUrl;
    if (e.convertedCompareImage) e.convertedCompareImage.src = convertedUrl;
    if (e.originalCompareMeta) e.originalCompareMeta.textContent = originalMeta || "";
    if (e.convertedCompareMeta) e.convertedCompareMeta.textContent = convertedMeta || "";
    bindComparePan();
    setCompareZoom(1);
    open("compare", { trigger, focusTarget: e.closeCompareBtn });
  }

  bindBackdrop("compare");
  bindBackdrop("help");
  bindBackdrop("shortcut");
  bindBackdrop("system");
  bindCloseButton("compare", e.closeCompareBtn);
  bindCloseButton("help", e.closeHelpBtn);
  bindCloseButton("shortcut", e.closeShortcutBtn);
  bindCloseButton("system", e.closeSystemCheckBtn);

  e.compareZoomOut?.addEventListener("click", () => setCompareZoom(compareZoom - 0.25));
  e.compareZoomReset?.addEventListener("click", () => setCompareZoom(1));
  e.compareZoomIn?.addEventListener("click", () => setCompareZoom(compareZoom + 0.25));

  return {
    open,
    close,
    closeAll,
    isOpen: name => !get(name)?.hidden,
    openCompare,
    setCompareZoom,
    get activeName() { return activeName; },
  };
}
