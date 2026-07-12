// =====================================
// Converter Mall
// Upload Core
// =====================================

import { EventBus } from "./EventBus.js";
import { UploadManager } from "../upload/UploadManager.js";

export const UploadEvents = Object.freeze({
    STARTED: "upload:started",
    REJECTED: "upload:rejected",
    DUPLICATE_ONLY: "upload:duplicate-only",
    COMPLETED: "upload:completed",
    FAILED: "upload:failed",
    CLEARED: "upload:cleared"
});

export const UploadCore = {
    async receive(files = [], options = {}) {
        const incomingFiles = Array.from(files || []).filter(Boolean);
        const validate = typeof options.validate === "function"
            ? options.validate
            : () => true;

        EventBus.emit(UploadEvents.STARTED, {
            incomingFiles,
            incomingCount: incomingFiles.length
        });

        const validFiles = [];
        const invalidFiles = [];

        incomingFiles.forEach(file => {
            if (validate(file)) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file);
            }
        });

        if (validFiles.length === 0) {
            const result = createEmptyResult(invalidFiles);
            EventBus.emit(UploadEvents.REJECTED, result);
            return result;
        }

        try {
            const saveResult = await UploadManager.append(validFiles);
            const result = {
                ...saveResult,
                validFiles,
                invalidFiles,
                invalidCount: invalidFiles.length,
                incomingFiles,
                incomingCount: incomingFiles.length
            };

            if (saveResult.addedCount === 0) {
                EventBus.emit(UploadEvents.DUPLICATE_ONLY, result);
                return result;
            }

            EventBus.emit(UploadEvents.COMPLETED, result);
            return result;
        } catch (error) {
            const failure = {
                error,
                validFiles,
                invalidFiles,
                incomingFiles
            };

            EventBus.emit(UploadEvents.FAILED, failure);
            throw error;
        }
    },

    async restore() {
        return UploadManager.get();
    },

    async remove(fileOrKey) {
        const files = await UploadManager.remove(fileOrKey);

        EventBus.emit(UploadEvents.COMPLETED, {
            mergedFiles: files,
            addedFiles: [],
            duplicateFiles: [],
            addedCount: 0,
            duplicateCount: 0,
            invalidFiles: [],
            invalidCount: 0,
            totalCount: files.length,
            action: "remove"
        });

        return files;
    },

    async clear() {
        await UploadManager.clear();
        EventBus.emit(UploadEvents.CLEARED, { files: [] });
    }
};

function createEmptyResult(invalidFiles) {
    return {
        mergedFiles: [],
        addedFiles: [],
        duplicateFiles: [],
        validFiles: [],
        invalidFiles,
        addedCount: 0,
        duplicateCount: 0,
        invalidCount: invalidFiles.length,
        totalCount: 0,
        incomingCount: invalidFiles.length
    };
}

window.UploadCore = UploadCore;
