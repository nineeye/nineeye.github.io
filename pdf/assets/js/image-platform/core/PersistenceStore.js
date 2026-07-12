/**
 * Safe JSON persistence wrapper for browser storage.
 * Storage failures (private mode, quota, blocked access) never break conversion.
 */
export function createJsonStore(storage, key, fallbackFactory = () => null) {
  const fallback = () => {
    const value = fallbackFactory();
    return value && typeof value === "object" ? structuredCloneSafe(value) : value;
  };

  return {
    key,
    read() {
      try {
        const raw = storage?.getItem(key);
        return raw == null ? fallback() : JSON.parse(raw);
      } catch {
        return fallback();
      }
    },
    write(value) {
      try {
        storage?.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove() {
      try {
        storage?.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
    update(mutator) {
      const current = this.read();
      const next = mutator(current);
      this.write(next);
      return next;
    }
  };
}

export function probeStorage(storage) {
  const key = `__converterMallProbe__${Date.now()}`;
  try {
    storage?.setItem(key, "1");
    const ok = storage?.getItem(key) === "1";
    storage?.removeItem(key);
    return ok;
  } catch {
    return false;
  }
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") {
    try { return structuredClone(value); } catch {}
  }
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}
