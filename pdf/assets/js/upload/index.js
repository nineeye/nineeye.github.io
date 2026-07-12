/**
 * Sprint 0.5.5
 * Upload Engine Entry
 * Responsibility:
 * - Register upload events
 * - Delegate processing to UploadCore
 * - Avoid business logic here
 */


// =====================================
// Converter Mall
// Upload Module Entry
// =====================================

import { UploadCore, UploadEvents } from "./UploadCore.js";
import { EventBus } from "../core/EventBus.js";
import { createDropZone } from "./DropZone.js";
import { renderPreview } from "./preview.js";
import { dispatchUpload } from "./dispatcher.js";
import { loadWorkspace } from "./workspace.js";

export function initUpload(options = {}) {
    const dropZone = getElement(options.dropZone, "#dropZone");
    const input = getElement(options.input, "#fileInput");
    const preview = getElement(options.preview, "#preview");

    if (!dropZone || !input) {
        console.warn("❌ Upload area not found");
        return;
    }

    bindUploadEvents({ input, preview });
    restoreSavedFiles(preview);

    return createDropZone({
        element: dropZone,
        input,
        onFiles(files) {
            return UploadCore.receive(files, {
                validate: isSupportedFile
            });
        }
    });
}


async function restoreSavedFiles(preview) {
    try {
        const files = await UploadCore.restore();

        if (!files || files.length === 0) {
            return;
        }

        await loadWorkspace(files);
        renderPreview(files, preview);
        dispatchUpload(files);

        if (window.workspaceEngine) {
            window.workspaceEngine.load(files[0]);
        }
    } catch (error) {
        console.error("❌ Upload restore failed", error);
    }
}

function bindUploadEvents({ input, preview }) {
    EventBus.on(UploadEvents.REJECTED, result => {
        showInvalidFileMessage(result.invalidFiles);
        resetInput(input);
    });

    EventBus.on(UploadEvents.DUPLICATE_ONLY, result => {
        showOnlyDuplicateMessage(
            result.duplicateCount,
            result.invalidCount
        );
        resetInput(input);
    });

    EventBus.on(UploadEvents.COMPLETED, async result => {
        const files = result.mergedFiles || [];

        showUploadResultMessage({
            addedCount: result.addedCount,
            duplicateCount: result.duplicateCount,
            invalidCount: result.invalidCount,
            totalCount: result.totalCount
        });

        await loadWorkspace(files);
        renderPreview(files, preview);
        dispatchUpload(files);

        if (window.workspaceEngine && files.length) {
            window.workspaceEngine.load(
                result.addedFiles?.[0] || files[0]
            );
        }

        resetInput(input);
    });

    EventBus.on(UploadEvents.FAILED, ({ error }) => {
        console.error("❌ Upload Error", error);
        alert(
            "파일을 처리하는 중 오류가 발생했습니다.\n\n" +
            "브라우저 콘솔에서 자세한 내용을 확인해 주세요."
        );
        resetInput(input);
    });

    EventBus.on(UploadEvents.CLEARED, () => {
        renderPreview([], preview);
        dispatchUpload([]);
        resetInput(input);
    });
}

function isSupportedFile(file) {
    const extension = getExtension(file?.name || "");
    return ["pdf", "jpg", "jpeg", "png", "heic", "csv", "json", "txt"].includes(extension);
}

function showUploadResultMessage({
    addedCount,
    duplicateCount,
    invalidCount,
    totalCount
}) {
    if (addedCount <= 0) return;

    const messages = [
        `파일 ${addedCount}개를 추가했습니다.`
    ];

    if (duplicateCount > 0) {
        messages.push(
            `이미 등록된 중복 파일 ${duplicateCount}개는 제외했습니다.`
        );
    }

    if (invalidCount > 0) {
        messages.push(
            `지원하지 않는 파일 ${invalidCount}개는 제외했습니다.`
        );
    }

    messages.push(`현재 등록된 파일은 총 ${totalCount}개입니다.`);

    if (duplicateCount > 0 || invalidCount > 0) {
        alert(messages.join("\n\n"));
    }
}

function showOnlyDuplicateMessage(duplicateCount, invalidCount) {
    const messages = [];

    if (duplicateCount > 0) {
        messages.push(
            `선택한 파일 ${duplicateCount}개는 이미 등록되어 있습니다.`
        );
    }

    if (invalidCount > 0) {
        messages.push(
            `지원하지 않는 파일 ${invalidCount}개는 제외했습니다.`
        );
    }

    messages.push("새롭게 추가된 파일이 없습니다.");
    alert(messages.join("\n\n"));
}

function showInvalidFileMessage(files) {
    const firstFile = files?.[0];
    const extension = getExtension(firstFile?.name || "");
    alert(
        "지원하지 않는 파일 형식입니다.\n\n" +
        `선택한 형식: ${extension || "알 수 없음"}\n` +
        "지원 형식: PDF, JPG, JPEG, PNG, HEIC, CSV, JSON, TXT"
    );
}

function getExtension(fileName = "") {
    const parts = fileName.toLowerCase().split(".");
    return parts.length > 1 ? parts.pop() : "";
}

function resetInput(input) {
    if (input) input.value = "";
}

function getElement(custom, fallback) {
    if (custom) {
        return typeof custom === "string"
            ? document.querySelector(custom)
            : custom;
    }

    return document.querySelector(fallback);
}

