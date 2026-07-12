// =====================================
// Converter Mall
// Dedup Engine
// =====================================

export const DedupEngine = {
    createKey(file) {
        if (!file) return "";

        const name = String(file.name || "")
            .trim()
            .toLowerCase();
        const size = Number(file.size || 0);
        const lastModified = Number(file.lastModified || 0);
        const type = String(file.type || "")
            .trim()
            .toLowerCase();

        return [name, size, lastModified, type].join("::");
    },

    merge(existingFiles = [], incomingFiles = []) {
        const existing = normalizeFiles(existingFiles);
        const incoming = normalizeFiles(incomingFiles);
        const mergedFiles = [...existing];
        const addedFiles = [];
        const duplicateFiles = [];
        const keys = new Set(existing.map(file => this.createKey(file)));

        incoming.forEach(file => {
            const key = this.createKey(file);

            if (!key || keys.has(key)) {
                duplicateFiles.push(file);
                return;
            }

            keys.add(key);
            mergedFiles.push(file);
            addedFiles.push(file);
        });

        return {
            mergedFiles,
            addedFiles,
            duplicateFiles,
            addedCount: addedFiles.length,
            duplicateCount: duplicateFiles.length,
            totalCount: mergedFiles.length
        };
    },

    unique(files = []) {
        return this.merge([], files).mergedFiles;
    },

    isDuplicate(file, files = []) {
        const key = this.createKey(file);
        return normalizeFiles(files).some(
            current => this.createKey(current) === key
        );
    }
};

function normalizeFiles(files) {
    if (!files) return [];
    return Array.from(files).filter(Boolean);
}

window.DedupEngine = DedupEngine;
