/**
 * Central state holder for file order, selection and per-file overrides.
 * Keeps mutation rules in one place so future image converters can reuse them.
 */
export function createConverterState(keyOf) {
  if (typeof keyOf !== "function") throw new TypeError("keyOf must be a function");

  let originalOrder = [];
  let selected = new Set();
  let perFile = new Map();
  let revision = 0;
  const listeners = new Set();

  const notify = (reason) => {
    revision += 1;
    const snapshot = api.snapshot();
    for (const listener of listeners) {
      try { listener(snapshot, reason); } catch { /* listener isolation */ }
    }
  };

  const api = {
    get originalOrder() { return originalOrder; },
    get selected() { return selected; },
    get perFile() { return perFile; },
    get revision() { return revision; },

    replaceOrder(keys, reason = "replace-order") {
      originalOrder = Array.from(keys || []);
      notify(reason);
      return originalOrder;
    },

    replaceSelection(keys, reason = "replace-selection") {
      selected = keys instanceof Set ? new Set(keys) : new Set(keys || []);
      notify(reason);
      return selected;
    },

    selectAll(files, reason = "select-all") {
      selected = new Set(Array.from(files || [], keyOf));
      notify(reason);
      return selected;
    },

    clearSelection(reason = "clear-selection") {
      selected.clear();
      notify(reason);
    },

    addSelected(fileOrKey, reason = "select") {
      selected.add(typeof fileOrKey === "string" ? fileOrKey : keyOf(fileOrKey));
      notify(reason);
    },

    removeSelected(fileOrKey, reason = "deselect") {
      selected.delete(typeof fileOrKey === "string" ? fileOrKey : keyOf(fileOrKey));
      notify(reason);
    },

    appendOrder(fileOrKey, reason = "append-order") {
      const key = typeof fileOrKey === "string" ? fileOrKey : keyOf(fileOrKey);
      if (!originalOrder.includes(key)) originalOrder.push(key);
      notify(reason);
    },

    setFileConfig(fileOrKey, config, reason = "file-config") {
      const key = typeof fileOrKey === "string" ? fileOrKey : keyOf(fileOrKey);
      perFile.set(key, { ...(config || {}) });
      notify(reason);
    },

    deleteFileState(fileOrKey, reason = "delete-file-state") {
      const key = typeof fileOrKey === "string" ? fileOrKey : keyOf(fileOrKey);
      selected.delete(key);
      perFile.delete(key);
      notify(reason);
    },

    replacePerFile(entries, reason = "replace-file-config") {
      perFile = entries instanceof Map ? new Map(entries) : new Map(entries || []);
      notify(reason);
      return perFile;
    },

    prune(files, reason = "prune") {
      const live = new Set(Array.from(files || [], keyOf));
      selected = new Set([...selected].filter((key) => live.has(key)));
      perFile = new Map([...perFile].filter(([key]) => live.has(key)));
      originalOrder = originalOrder.filter((key) => live.has(key));
      notify(reason);
    },

    reset(reason = "reset") {
      originalOrder = [];
      selected = new Set();
      perFile = new Map();
      notify(reason);
    },

    snapshot() {
      return {
        originalOrder: [...originalOrder],
        selected: new Set(selected),
        perFile: new Map(perFile),
        revision,
      };
    },

    restore(snapshot, reason = "restore") {
      originalOrder = [...(snapshot?.originalOrder || [])];
      selected = new Set(snapshot?.selected || []);
      perFile = new Map(snapshot?.perFile || []);
      notify(reason);
      return api.snapshot();
    },

    subscribe(listener) {
      if (typeof listener !== "function") return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  return api;
}
