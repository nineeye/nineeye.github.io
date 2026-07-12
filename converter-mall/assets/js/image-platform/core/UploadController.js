import { validateIncomingFiles, mergeUniqueFiles } from "./FileController.js";

/**
 * 파일 선택·드래그앤드롭·검증·중복 제거·저장 흐름을 관리합니다.
 * 화면 렌더링과 변환기 상태 갱신은 콜백으로 위임해 다른 변환기에서도 재사용할 수 있습니다.
 */
export function createUploadController({
  dropZone,
  fileInput,
  selectButton,
  getFiles,
  setFiles,
  persistFiles,
  maxFiles = 100,
  maxFileSize = 100 * 1024 * 1024,
  onFilesAdded = async () => {},
  onRejected = () => {},
  acceptedEmptyMessage = "지원되는 파일을 선택해 주세요.",
  accepts,
  formatLabel = "지원 형식",
}) {
  let bound = false;
  let processing = false;

  const openPicker = () => {
    if (!processing) fileInput?.click();
  };

  const handleIncoming = async incoming => {
    if (processing) return { skipped: true };
    processing = true;

    try {
      const current = Array.from(getFiles?.() || []);
      const { accepted, rejected } = validateIncomingFiles(incoming, {
        currentCount: current.length,
        maxFiles,
        maxFileSize,
        accepts,
        formatLabel,
      });

      if (!accepted.length) {
        onRejected(rejected.length ? rejected : [acceptedEmptyMessage]);
        return { accepted: [], rejected, added: [], duplicates: [] };
      }

      const merged = mergeUniqueFiles(current, accepted);
      setFiles?.(merged.files);
      await persistFiles?.(merged.files);
      await onFilesAdded({ ...merged, rejected });
      return { ...merged, rejected };
    } catch (error) {
      onRejected([`파일을 불러오지 못했습니다: ${error?.message || "알 수 없는 오류"}`]);
      return { accepted: [], rejected: [error?.message || String(error)], added: [], duplicates: [] };
    } finally {
      processing = false;
      if (fileInput) fileInput.value = "";
      dropZone?.classList.remove("dragover");
    }
  };

  const onSelectClick = event => {
    event?.stopPropagation();
    openPicker();
  };
  const onDropZoneClick = event => {
    if (event?.target === selectButton || selectButton?.contains?.(event?.target)) return;
    openPicker();
  };
  const onDropZoneKeyDown = event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };
  const onInputChange = () => handleIncoming(Array.from(fileInput?.files || []));
  const onDragOver = event => {
    event.preventDefault();
    if (!processing) dropZone?.classList.add("dragover");
  };
  const onDragLeave = event => {
    if (!dropZone?.contains(event.relatedTarget)) dropZone?.classList.remove("dragover");
  };
  const onDrop = event => {
    event.preventDefault();
    dropZone?.classList.remove("dragover");
    return handleIncoming(Array.from(event.dataTransfer?.files || []));
  };

  function bind() {
    if (bound) return;
    bound = true;
    selectButton?.addEventListener("click", onSelectClick);
    dropZone?.addEventListener("click", onDropZoneClick);
    dropZone?.addEventListener("keydown", onDropZoneKeyDown);
    fileInput?.addEventListener("change", onInputChange);
    dropZone?.addEventListener("dragover", onDragOver);
    dropZone?.addEventListener("dragleave", onDragLeave);
    dropZone?.addEventListener("drop", onDrop);
  }

  function destroy() {
    if (!bound) return;
    bound = false;
    selectButton?.removeEventListener("click", onSelectClick);
    dropZone?.removeEventListener("click", onDropZoneClick);
    dropZone?.removeEventListener("keydown", onDropZoneKeyDown);
    fileInput?.removeEventListener("change", onInputChange);
    dropZone?.removeEventListener("dragover", onDragOver);
    dropZone?.removeEventListener("dragleave", onDragLeave);
    dropZone?.removeEventListener("drop", onDrop);
  }

  return {
    bind,
    destroy,
    openPicker,
    handleIncoming,
    isProcessing: () => processing,
  };
}
