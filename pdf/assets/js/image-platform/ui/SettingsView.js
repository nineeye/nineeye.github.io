const PURPOSE_PRESETS = Object.freeze({
  shopping: { quality: 88, mode: "width", value: 1600, bg: "white", label: "쇼핑몰 상품" },
  blog: { quality: 82, mode: "width", value: 1280, bg: "white", label: "블로그·웹" },
  social: { quality: 85, mode: "width", value: 1080, bg: "white", label: "SNS 업로드" },
  archive: { quality: 95, mode: "original", value: 100, bg: "white", label: "원본 보존" }
});


function syncFormatSettingsView(e) {
  if (e.formatBackgroundWrap && e.formatAlphaMode) e.formatBackgroundWrap.hidden = e.formatAlphaMode.value !== "flatten";
  if (e.formatTrimThresholdWrap && e.formatTrimTransparent) e.formatTrimThresholdWrap.hidden = !e.formatTrimTransparent.checked;
  if (e.formatGifFrameIndexWrap && e.formatGifFrameMode) e.formatGifFrameIndexWrap.hidden = e.formatGifFrameMode.value !== "index";
  if (e.formatSourceFrameIndexWrap && e.formatSourceFrameMode) e.formatSourceFrameIndexWrap.hidden = e.formatSourceFrameMode.value !== "index";
}

function applyFormatPreset(e, preset) {
  const q = value => { if (e.qualityRange) e.qualityRange.value = String(value); };
  if (preset === "jpeg-photo") { q(88); if (e.formatContentMode) e.formatContentMode.value = "photo"; if (e.formatSharpen) e.formatSharpen.value = "mild"; }
  if (preset === "jpeg-text") { q(95); if (e.formatContentMode) e.formatContentMode.value = "text"; if (e.formatSharpen) e.formatSharpen.value = "strong"; }
  if (preset === "jpeg-small") { q(68); if (e.formatContentMode) e.formatContentMode.value = "photo"; if (e.formatSharpen) e.formatSharpen.value = "off"; }
  if (preset === "webp-balanced") { q(82); if (e.formatContentMode) e.formatContentMode.value = "balanced"; if (e.formatAlphaMode) e.formatAlphaMode.value = "preserve"; }
  if (preset === "webp-logo") { q(94); if (e.formatContentMode) e.formatContentMode.value = "graphic"; if (e.formatAlphaMode) e.formatAlphaMode.value = "preserve"; if (e.formatTrimTransparent) e.formatTrimTransparent.checked = true; }
  if (preset === "webp-small") { q(64); if (e.formatContentMode) e.formatContentMode.value = "photo"; if (e.formatAlphaMode) e.formatAlphaMode.value = "preserve"; }
  if (preset === "jpg-clean-photo") { q(92); if (e.formatContentMode) e.formatContentMode.value = "photo"; if (e.formatArtifactMode) e.formatArtifactMode.value = "mild"; if (e.formatSharpen) e.formatSharpen.value = "off"; }
  if (preset === "jpg-document") { q(96); if (e.formatContentMode) e.formatContentMode.value = "text"; if (e.formatArtifactMode) e.formatArtifactMode.value = "off"; if (e.formatSharpen) e.formatSharpen.value = "mild"; }
  if (preset === "jpg-legacy") { q(90); if (e.formatContentMode) e.formatContentMode.value = "photo"; if (e.formatArtifactMode) e.formatArtifactMode.value = "strong"; if (e.formatSharpen) e.formatSharpen.value = "off"; }
  syncSettingsView(e);
  syncFormatSettingsView(e);
}
export function syncSettingsView(e) {
  e.qualityValue.textContent = `${e.qualityRange.value}%`;
  syncFilenameView(e);
  e.presetButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.quality === e.qualityRange.value);
  });
  e.customColorWrap.hidden = e.backgroundMode.value !== "custom";
  e.resizeValueWrap.hidden = e.resizeMode.value === "original";
  e.resizeUnit.textContent = e.resizeMode.value === "percent" ? "%" : "px";
  e.resizeButtons.forEach(button => {
    const modeMatches = button.dataset.resizeMode === e.resizeMode.value;
    const valueMatches = !button.dataset.resizeValue || button.dataset.resizeValue === e.resizeValue.value;
    button.classList.toggle("active", modeMatches && valueMatches);
  });  syncFormatSettingsView(e);
}


export function syncFilenameView(e) {
  if (!e.filenameMode) return;
  const needsText = ["suffix", "prefix"].includes(e.filenameMode.value);
  e.filenameTextWrap.hidden = !needsText;
  if (e.filenameMode.value === "suffix" && !e.filenameText.value) e.filenameText.value = "-converted";
  if (e.filenameMode.value === "prefix" && !e.filenameText.value) e.filenameText.value = "converted-";
}

export function readSettingsView(e) {
  return {
    quality: e.qualityRange.value,
    backgroundMode: e.backgroundMode.value,
    backgroundColor: e.backgroundColor.value,
    resizeMode: e.resizeMode.value,
    resizeValue: e.resizeValue.value,
    filenameMode: e.filenameMode?.value,
    filenameText: e.filenameText?.value,
    zipName: e.zipName?.value,
    autoCleanup: Boolean(e.autoCleanup?.checked),
    formatContentMode: e.formatContentMode?.value,
    formatColorMode: e.formatColorMode?.value,
    formatSharpen: e.formatSharpen?.value,
    formatAlphaMode: e.formatAlphaMode?.value,
    formatTrimTransparent: Boolean(e.formatTrimTransparent?.checked),
    formatTrimThreshold: e.formatTrimThreshold?.value,
    formatBackgroundColor: e.formatBackgroundColor?.value,
    formatGifFrameMode: e.formatGifFrameMode?.value,
    formatGifFrameIndex: e.formatGifFrameIndex?.value,
    formatSvgScale: e.formatSvgScale?.value,
    formatBmpAlphaMode: e.formatBmpAlphaMode?.value,
    formatArtifactMode: e.formatArtifactMode?.value,
    formatSourceFrameMode: e.formatSourceFrameMode?.value,
    formatSourceFrameIndex: e.formatSourceFrameIndex?.value
  };
}

export function restoreSettingsView(e, data = {}) {
  if (data.quality) e.qualityRange.value = data.quality;
  if (data.backgroundMode) e.backgroundMode.value = data.backgroundMode;
  if (data.backgroundColor) e.backgroundColor.value = data.backgroundColor;
  if (data.resizeMode) e.resizeMode.value = data.resizeMode;
  if (data.resizeValue) e.resizeValue.value = data.resizeValue;
  if (data.filenameMode && e.filenameMode) e.filenameMode.value = data.filenameMode;
  if (data.filenameText && e.filenameText) e.filenameText.value = data.filenameText;
  if (data.zipName && e.zipName) e.zipName.value = data.zipName;
  if (typeof data.autoCleanup === "boolean" && e.autoCleanup) e.autoCleanup.checked = data.autoCleanup;
  if (data.formatContentMode && e.formatContentMode) e.formatContentMode.value = data.formatContentMode;
  if (data.formatColorMode && e.formatColorMode) e.formatColorMode.value = data.formatColorMode;
  if (data.formatSharpen && e.formatSharpen) e.formatSharpen.value = data.formatSharpen;
  if (data.formatAlphaMode && e.formatAlphaMode) e.formatAlphaMode.value = data.formatAlphaMode;
  if (typeof data.formatTrimTransparent === "boolean" && e.formatTrimTransparent) e.formatTrimTransparent.checked = data.formatTrimTransparent;
  if (data.formatTrimThreshold != null && e.formatTrimThreshold) e.formatTrimThreshold.value = data.formatTrimThreshold;
  if (data.formatBackgroundColor && e.formatBackgroundColor) e.formatBackgroundColor.value = data.formatBackgroundColor;
  if (data.formatGifFrameMode && e.formatGifFrameMode) e.formatGifFrameMode.value = data.formatGifFrameMode;
  if (data.formatGifFrameIndex != null && e.formatGifFrameIndex) e.formatGifFrameIndex.value = data.formatGifFrameIndex;
  if (data.formatSvgScale && e.formatSvgScale) e.formatSvgScale.value = data.formatSvgScale;
  if (data.formatBmpAlphaMode && e.formatBmpAlphaMode) e.formatBmpAlphaMode.value = data.formatBmpAlphaMode;
  if (data.formatArtifactMode && e.formatArtifactMode) e.formatArtifactMode.value = data.formatArtifactMode;
  if (data.formatSourceFrameMode && e.formatSourceFrameMode) e.formatSourceFrameMode.value = data.formatSourceFrameMode;
  if (data.formatSourceFrameIndex != null && e.formatSourceFrameIndex) e.formatSourceFrameIndex.value = data.formatSourceFrameIndex;
  syncSettingsView(e);
}

export function applyPurposePresetView(e, purpose) {
  const preset = PURPOSE_PRESETS[purpose];
  if (!preset) return null;
  e.qualityRange.value = preset.quality;
  e.resizeMode.value = preset.mode;
  e.resizeValue.value = preset.value;
  e.backgroundMode.value = preset.bg;
  e.purposeButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.purpose === purpose);
  });
  syncSettingsView(e);
  return preset;
}

export function bindSettingsView(e, { onInvalidate, onPersist, onPurposeApplied } = {}) {
  const invalidate = () => onInvalidate?.();
  const persist = () => onPersist?.();

  e.qualityRange.oninput = () => {
    syncSettingsView(e);
    invalidate();
  };
  e.presetButtons.forEach(button => {
    button.onclick = () => {
      e.qualityRange.value = button.dataset.quality;
      e.qualityRange.oninput();
    };
  });
  e.backgroundMode.onchange = () => {
    syncSettingsView(e);
    invalidate();
  };
  e.backgroundColor.oninput = () => {
    e.backgroundColorText.textContent = e.backgroundColor.value;
    invalidate();
  };
  e.resizeMode.onchange = () => {
    syncSettingsView(e);
    invalidate();
  };
  e.resizeValue.oninput = invalidate;
  e.resizeButtons.forEach(button => {
    button.onclick = () => {
      e.resizeMode.value = button.dataset.resizeMode;
      if (button.dataset.resizeValue) e.resizeValue.value = button.dataset.resizeValue;
      syncSettingsView(e);
      invalidate();
    };
  });
  e.purposeButtons.forEach(button => {
    button.onclick = () => {
      const preset = applyPurposePresetView(e, button.dataset.purpose);
      if (!preset) return;
      persist();
      invalidate();
      onPurposeApplied?.(preset);
    };
  });
  e.formatPresetButtons?.forEach(button => {
    button.onclick = () => {
      applyFormatPreset(e, button.dataset.formatPreset);
      persist();
      invalidate();
    };
  });
  [e.formatContentMode, e.formatColorMode, e.formatSharpen, e.formatAlphaMode, e.formatTrimTransparent, e.formatTrimThreshold, e.formatBackgroundColor, e.formatGifFrameMode, e.formatGifFrameIndex, e.formatSvgScale, e.formatBmpAlphaMode, e.formatArtifactMode, e.formatSourceFrameMode, e.formatSourceFrameIndex]
    .filter(Boolean)
    .forEach(node => {
      const eventName = node.type === "range" || node.type === "color" ? "input" : "change";
      node.addEventListener(eventName, () => {
        if (node === e.formatContentMode && e.qualityRange) {
          const recommended = { photo: 88, mixed: 92, text: 95, balanced: 82, graphic: 94, maximum: 100 }[node.value];
          if (recommended) e.qualityRange.value = String(recommended);
          if (node.value === "text" && e.formatSharpen) e.formatSharpen.value = "strong";
          if (node.value === "photo" && e.formatSharpen) e.formatSharpen.value = "mild";
          syncSettingsView(e);
        }
        syncFormatSettingsView(e); invalidate();
      });
      node.addEventListener("change", persist);
    });
  [e.qualityRange, e.backgroundMode, e.backgroundColor, e.resizeMode, e.resizeValue, e.filenameMode, e.filenameText, e.zipName, e.autoCleanup]
    .filter(Boolean)
    .forEach(node => node.addEventListener("change", persist));
}

export function buildOutputNameView(file, index, e, { sanitizeName, sanitizeAffix, outputExtension = "jpg" } = {}) {
  const cleanName = sanitizeName || (value => String(value || ""));
  const cleanAffix = sanitizeAffix || (value => String(value || ""));
  const base = cleanName(file.name.replace(/\.[^.]+$/, "")) || `image-${index + 1}`;
  const mode = e.filenameMode?.value || "original";
  const text = cleanAffix(e.filenameText?.value || "");
  const extension = String(outputExtension || "jpg").replace(/^\./, "");
  if (mode === "suffix") return `${base}${text || "-converted"}.${extension}`;
  if (mode === "prefix") return `${text || "converted-"}${base}.${extension}`;
  if (mode === "sequence") return `image-${String(index + 1).padStart(3, "0")}.${extension}`;
  return `${base}.${extension}`;
}
