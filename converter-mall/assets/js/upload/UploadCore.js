// =====================================
// Converter Mall
// Upload Core
// Validation, persistence and event orchestration
// =====================================

import { EventBus } from "../core/EventBus.js";
import { UploadManager } from "./UploadManager.js";

export const UploadEvents = Object.freeze({
    STARTED: "upload:started",
    REJECTED: "upload:rejected",
    DUPLICATE_ONLY: "upload:duplicate-only",
    COMPLETED: "upload:completed",
    FAILED: "upload:failed",
    REMOVED: "upload:removed",
    CLEARED: "upload:cleared"
});

let operationSequence = 0;

class UploadCoreService {
    constructor({ manager = UploadManager, eventBus = EventBus } = {}) {
        this.manager = manager;
        this.eventBus = eventBus;
    }

    async receive(files = [], options = {}) {
        const operationId = ++operationSequence;
        const incomingFiles = normalizeFiles(files);
        const validate = typeof options.validate === "function"
            ? options.validate
            : () => true;

        this.#emit(UploadEvents.STARTED, {
            operationId,
            incomingFiles,
            incomingCount: incomingFiles.length
        });

        try {
            const { validFiles, invalidFiles } = await validateFiles(
                incomingFiles,
                validate
            );

            if (validFiles.length === 0) {
                const result = createResult({
                    operationId,
                    incomingFiles,
                    invalidFiles
                });

                this.#emit(UploadEvents.REJECTED, result);
                return result;
            }

            const saveResult = await this.manager.append(validFiles);
            const result = createResult({
                operationId,
                incomingFiles,
                validFiles,
                invalidFiles,
                ...saveResult
            });

            const eventName = result.addedCount === 0
                ? UploadEvents.DUPLICATE_ONLY
                : UploadEvents.COMPLETED;

            this.#emit(eventName, result);
            return result;
        } catch (error) {
            const failure = {
                operationId,
                error: normalizeError(error),
                incomingFiles,
                incomingCount: incomingFiles.length
            };

            this.#emit(UploadEvents.FAILED, failure);
            throw failure.error;
        }
    }

    restore() {
        return this.manager.get();
    }

    async remove(fileOrKey) {
        try {
            const files = await this.manager.remove(fileOrKey);
            const result = createResult({
                operationId: ++operationSequence,
                mergedFiles: files,
                action: "remove"
            });

            this.#emit(UploadEvents.REMOVED, result);
            // 기존 COMPLETED 구독부와의 호환성을 유지합니다.
            this.#emit(UploadEvents.COMPLETED, result);
            return files;
        } catch (error) {
            this.#emitFailure(error, "remove");
            throw normalizeError(error);
        }
    }

    async clear() {
        try {
            await this.manager.clear();
            const result = createResult({
                operationId: ++operationSequence,
                action: "clear"
            });

            this.#emit(UploadEvents.CLEARED, result);
            return result;
        } catch (error) {
            this.#emitFailure(error, "clear");
            throw normalizeError(error);
        }
    }

    #emit(eventName, payload) {
        this.eventBus.emit(eventName, payload);
    }

    #emitFailure(error, action) {
        this.#emit(UploadEvents.FAILED, {
            operationId: ++operationSequence,
            action,
            error: normalizeError(error)
        });
    }
}

async function validateFiles(files, validate) {
    const validationResults = await Promise.all(files.map(async file => {
        try {
            return {
                file,
                valid: Boolean(await validate(file))
            };
        } catch (error) {
            return {
                file,
                valid: false,
                validationError: normalizeError(error)
            };
        }
    }));

    return validationResults.reduce((result, item) => {
        const target = item.valid ? result.validFiles : result.invalidFiles;
        target.push(item.file);

        if (item.validationError) {
            result.validationErrors.push({
                file: item.file,
                error: item.validationError
            });
        }

        return result;
    }, {
        validFiles: [],
        invalidFiles: [],
        validationErrors: []
    });
}

function createResult({
    operationId,
    incomingFiles = [],
    validFiles = [],
    invalidFiles = [],
    mergedFiles = [],
    addedFiles = [],
    duplicateFiles = [],
    action = "receive"
} = {}) {
    return {
        operationId,
        action,
        incomingFiles: [...incomingFiles],
        validFiles: [...validFiles],
        invalidFiles: [...invalidFiles],
        mergedFiles: [...mergedFiles],
        addedFiles: [...addedFiles],
        duplicateFiles: [...duplicateFiles],
        incomingCount: incomingFiles.length,
        addedCount: addedFiles.length,
        duplicateCount: duplicateFiles.length,
        invalidCount: invalidFiles.length,
        totalCount: mergedFiles.length
    };
}

function normalizeFiles(files) {
    return Array.from(files || []).filter(Boolean);
}

function normalizeError(error) {
    return error instanceof Error ? error : new Error(String(error));
}

export const UploadCore = new UploadCoreService();
export { UploadCoreService };

globalThis.UploadCore = UploadCore;
