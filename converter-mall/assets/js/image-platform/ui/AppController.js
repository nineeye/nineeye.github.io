/**
 * App-level UI controller for theme, keyboard shortcuts and lifecycle guards.
 * Converter-specific business logic is supplied through callbacks.
 */
export function createAppController({ themeStore, modalManager, showToast, isConverting, onConvert, onPageHide, onHidden }) {
  let elements = null;
  let keyHandler = null;

  function syncThemeButton() {
    if (!elements?.themeToggleBtn) return;
    const dark = document.documentElement.dataset.theme === "dark";
    elements.themeToggleBtn.textContent = dark ? "☀️ 라이트모드" : "🌙 다크모드";
    elements.themeToggleBtn.setAttribute("aria-pressed", String(dark));
  }

  function restoreTheme() {
    const theme = themeStore.read() || "light";
    document.documentElement.dataset.theme = theme;
    syncThemeButton();
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    themeStore.write(next);
    syncThemeButton();
  }

  function handleShortcut(event) {
    const target = event.target;
    const tag = target?.tagName?.toLowerCase();
    const editing = tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;
    if (event.key === "Escape") {
      modalManager?.closeAll();
      return;
    }
    if (editing) return;
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === "o") {
      event.preventDefault();
      elements.fileInput.click();
      showToast(elements, "PNG 파일 선택창을 열었습니다.");
      return;
    }
    if (mod && event.key === "Enter") {
      event.preventDefault();
      onConvert();
      return;
    }
    if (mod && event.shiftKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (!elements.zipDownloadBtn.disabled) elements.zipDownloadBtn.click();
      else showToast(elements, "먼저 파일 변환을 완료해 주세요.");
      return;
    }
    if (event.altKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      toggleTheme();
      return;
    }
    if (event.key === "?") {
      event.preventDefault();
      modalManager?.open("shortcut", { trigger: elements.shortcutBtn, focusTarget: elements.closeShortcutBtn });
    }
  }

  function bind(e) {
    elements = e;
    restoreTheme();
    elements.themeToggleBtn.onclick = toggleTheme;
    keyHandler = handleShortcut;
    document.addEventListener("keydown", keyHandler);
    window.addEventListener("pagehide", () => onPageHide?.(), { once: true });
    window.addEventListener("beforeunload", (event) => {
      if (isConverting()) {
        event.preventDefault();
        event.returnValue = "";
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) onHidden?.();
    });
  }

  function destroy() {
    if (keyHandler) document.removeEventListener("keydown", keyHandler);
    keyHandler = null;
    elements = null;
  }

  return { bind, destroy, restoreTheme, toggleTheme, syncThemeButton };
}
