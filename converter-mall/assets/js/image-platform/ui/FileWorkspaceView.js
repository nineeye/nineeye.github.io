import { renderFileCards } from './FileCardView.js';

export function createFileWorkspaceView({
  keyOf,
  formatSize,
  sum,
  renderCards = renderFileCards,
  concurrency = 4,
  sourceFormat = "FILE",
  targetFormat = "OUTPUT",
  features = {},
}) {
  function syncSelection({ e, files, selected, convertedCount = 0, setWorkflow }) {
    setWorkflow?.(convertedCount > 0 ? 'convert' : 'settings');

    for (const card of e.previewList.querySelectorAll('.file-card')) {
      const checkbox = card.querySelector('.sel');
      if (checkbox) checkbox.checked = selected.has(card.dataset.fileKey);
    }

    const selectedCount = selected.size;
    e.selectedCount.textContent = `${selectedCount}개 선택`;
    e.selectAllCheckbox.checked = files.length > 0 && selectedCount === files.length;
    e.selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < files.length;
    e.deleteSelectedBtn.disabled = selectedCount === 0;
    e.convertBtn.disabled = selectedCount === 0;
  }

  function updateSummary(e, files) {
    e.totalCount.textContent = `${files.length}개`;
    e.totalSize.textContent = formatSize(sum(files.map(file => file.size)));
  }

  function bindToolbar({
    e,
    getFiles,
    getSelected,
    onReplaceSelection,
    onSelectionSynced,
    onDeleteSelected,
    onSort,
  }) {
    e.selectAllCheckbox.onchange = () => {
      const files = getFiles();
      onReplaceSelection(e.selectAllCheckbox.checked ? files.map(keyOf) : []);
      onSelectionSynced();
    };

    e.deleteSelectedBtn.onclick = () => onDeleteSelected();
    e.sortMode.onchange = () => onSort(e.sortMode.value);
  }

  async function render({
    e,
    files,
    selected,
    perFile,
    dimensions,
    escapeHtml,
    registerPreviewUrl,
    onSelectionChange,
    onDelete,
    onConfigChange,
    onCompare,
    setWorkflow,
    convertedCount = 0,
  }) {
    await renderCards({
      files,
      container: e.previewList,
      concurrency,
      keyOf,
      isSelected: file => selected.has(keyOf(file)),
      getConfig: file => perFile.get(keyOf(file)) || {},
      dimensions,
      formatSize,
      escapeHtml,
      registerPreviewUrl,
      onSelectionChange,
      onDelete,
      onConfigChange,
      onCompare,
      sourceFormat,
      targetFormat,
      features,
    });

    updateSummary(e, files);
    syncSelection({ e, files, selected, convertedCount, setWorkflow });
  }

  return Object.freeze({ bindToolbar, render, syncSelection, updateSummary });
}
