function safeParse(value, fallback) {
  if (value == null) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function resolveStorage(type) {
  if (typeof window === "undefined") return null;
  try {
    const storage = type === "session" ? window.sessionStorage : window.localStorage;
    const probe = "__cm_storage_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch { return null; }
}

export class Storage {
  #namespace;
  #storage;
  #memory = new Map();

  constructor({ namespace = "converter-mall", type = "local" } = {}) {
    this.#namespace = String(namespace || "converter-mall");
    this.#storage = resolveStorage(type);
  }

  #key(key) { return `${this.#namespace}:${String(key)}`; }

  set(key, value) {
    const namespaced = this.#key(key);
    const serialized = JSON.stringify(value);
    this.#memory.set(namespaced, serialized);
    try { this.#storage?.setItem(namespaced, serialized); } catch {}
    return value;
  }

  get(key, fallback = null) {
    const namespaced = this.#key(key);
    let raw = null;
    try { raw = this.#storage?.getItem(namespaced) ?? null; } catch {}
    if (raw == null) raw = this.#memory.get(namespaced) ?? null;
    return safeParse(raw, fallback);
  }

  has(key) {
    const namespaced = this.#key(key);
    try { if (this.#storage?.getItem(namespaced) != null) return true; } catch {}
    return this.#memory.has(namespaced);
  }

  remove(key) {
    const namespaced = this.#key(key);
    this.#memory.delete(namespaced);
    try { this.#storage?.removeItem(namespaced); } catch {}
  }

  clear() {
    const prefix = `${this.#namespace}:`;
    this.#memory.clear();
    if (!this.#storage) return;
    try {
      const keys = [];
      for (let i = 0; i < this.#storage.length; i += 1) {
        const key = this.#storage.key(i);
        if (key?.startsWith(prefix)) keys.push(key);
      }
      keys.forEach(key => this.#storage.removeItem(key));
    } catch {}
  }
}

export const storage = new Storage();
export const sessionStorageStore = new Storage({ type: "session" });
export default storage;
