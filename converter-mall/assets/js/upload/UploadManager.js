// =====================================
// Converter Mall
// Upload Manager
// Persistent upload storage with race-safe writes
// =====================================

import { DedupEngine } from "./DedupEngine.js";

const DEFAULT_CONFIG = Object.freeze({
    dbName: "converter-mall",
    dbVersion: 1,
    storeName: "uploads",
    filesKey: "files"
});

class UploadStorageError extends Error {
    constructor(message, cause = null) {
        super(message);
        this.name = "UploadStorageError";
        this.cause = cause;
    }
}

class IndexedDbFileStore {
    #config;
    #dbPromise = null;

    constructor(config = {}) {
        this.#config = Object.freeze({ ...DEFAULT_CONFIG, ...config });
    }

    async read() {
        const db = await this.#open();

        return this.#request(db, "readonly", store => (
            store.get(this.#config.filesKey)
        ), value => normalizeFiles(value));
    }

    async write(files) {
        const safeFiles = DedupEngine.unique(normalizeFiles(files));
        const db = await this.#open();

        await this.#request(db, "readwrite", store => (
            store.put(safeFiles, this.#config.filesKey)
        ));

        return [...safeFiles];
    }

    async clear() {
        const db = await this.#open();
        await this.#request(db, "readwrite", store => (
            store.delete(this.#config.filesKey)
        ));
    }

    close() {
        if (!this.#dbPromise) return;

        this.#dbPromise
            .then(db => db.close())
            .catch(() => {});

        this.#dbPromise = null;
    }

    #open() {
        if (this.#dbPromise) return this.#dbPromise;

        if (!globalThis.indexedDB) {
            return Promise.reject(new UploadStorageError(
                "이 브라우저에서는 IndexedDB를 사용할 수 없습니다."
            ));
        }

        this.#dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(
                this.#config.dbName,
                this.#config.dbVersion
            );

            request.onupgradeneeded = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains(this.#config.storeName)) {
                    db.createObjectStore(this.#config.storeName);
                }
            };

            request.onsuccess = () => {
                const db = request.result;

                db.onversionchange = () => {
                    db.close();
                    this.#dbPromise = null;
                };

                resolve(db);
            };

            request.onerror = () => {
                this.#dbPromise = null;
                reject(new UploadStorageError(
                    "업로드 저장소를 열지 못했습니다.",
                    request.error
                ));
            };

            request.onblocked = () => {
                console.warn(
                    "UploadManager: 다른 탭이 이전 데이터베이스 연결을 사용 중입니다."
                );
            };
        });

        return this.#dbPromise;
    }

    #request(db, mode, createRequest, mapResult = value => value) {
        return new Promise((resolve, reject) => {
            let settled = false;
            const transaction = db.transaction(this.#config.storeName, mode);
            const store = transaction.objectStore(this.#config.storeName);
            const request = createRequest(store);
            let result;

            request.onsuccess = () => {
                result = mapResult(request.result);
            };

            request.onerror = () => {
                if (settled) return;
                settled = true;
                reject(new UploadStorageError(
                    "업로드 저장소 요청에 실패했습니다.",
                    request.error
                ));
            };

            transaction.oncomplete = () => {
                if (settled) return;
                settled = true;
                resolve(result);
            };

            transaction.onerror = () => {
                if (settled) return;
                settled = true;
                reject(new UploadStorageError(
                    "업로드 저장소 트랜잭션에 실패했습니다.",
                    transaction.error
                ));
            };

            transaction.onabort = transaction.onerror;
        });
    }
}

class UploadManagerService {
    #store;
    #queue = Promise.resolve();

    constructor(store = new IndexedDbFileStore()) {
        this.#store = store;
    }

    get() {
        return this.#enqueue(() => this.#store.read());
    }

    set(files = []) {
        return this.#enqueue(() => this.#store.write(files));
    }

    append(files = []) {
        return this.#enqueue(async () => {
            const existingFiles = await this.#store.read();
            const result = DedupEngine.merge(existingFiles, files);

            if (result.addedCount > 0) {
                result.mergedFiles = await this.#store.write(result.mergedFiles);
            }

            return result;
        });
    }

    remove(fileOrKey) {
        return this.#enqueue(async () => {
            const existingFiles = await this.#store.read();
            const targetKey = typeof fileOrKey === "string"
                ? fileOrKey
                : DedupEngine.createKey(fileOrKey);

            if (!targetKey) return existingFiles;

            const nextFiles = existingFiles.filter(file => (
                DedupEngine.createKey(file) !== targetKey
            ));

            if (nextFiles.length === existingFiles.length) {
                return existingFiles;
            }

            return this.#store.write(nextFiles);
        });
    }

    clear() {
        return this.#enqueue(async () => {
            await this.#store.clear();
            return [];
        });
    }

    async hasFiles() {
        return (await this.get()).length > 0;
    }

    async count() {
        return (await this.get()).length;
    }

    close() {
        this.#store.close?.();
    }

    #enqueue(operation) {
        const run = this.#queue.then(operation, operation);
        this.#queue = run.catch(() => {});
        return run;
    }
}

function normalizeFiles(files) {
    return Array.from(files || []).filter(Boolean);
}

export const UploadManager = new UploadManagerService();
export { UploadManagerService, IndexedDbFileStore, UploadStorageError };

globalThis.UploadManager = UploadManager;
