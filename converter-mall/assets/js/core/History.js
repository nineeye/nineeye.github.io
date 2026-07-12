import { Storage } from "./Storage.js";

export class History {
  #items = [];
  #limit;
  #store;
  #key;

  constructor({ limit = 30, storage = new Storage(), key = "history" } = {}) {
    this.#limit = Math.max(1, Number(limit) || 30);
    this.#store = storage;
    this.#key = String(key || "history");
    const saved = this.#store.get(this.#key, []);
    this.#items = Array.isArray(saved) ? saved.slice(0, this.#limit) : [];
  }

  add(entry, { dedupeBy = "id" } = {}) {
    if (!entry || typeof entry !== "object") throw new TypeError("History entry must be an object.");
    const item = Object.freeze({ ...entry, timestamp: entry.timestamp || new Date().toISOString() });
    if (dedupeBy && item[dedupeBy] != null) {
      this.#items = this.#items.filter(existing => existing?.[dedupeBy] !== item[dedupeBy]);
    }
    this.#items.unshift(item);
    this.#items = this.#items.slice(0, this.#limit);
    this.#persist();
    return item;
  }

  getAll() { return [...this.#items]; }
  latest() { return this.#items[0] || null; }
  find(predicate) { return this.#items.find(predicate) || null; }
  remove(predicate) {
    const before = this.#items.length;
    this.#items = this.#items.filter(item => !predicate(item));
    if (this.#items.length !== before) this.#persist();
    return before - this.#items.length;
  }
  clear() { this.#items = []; this.#persist(); }
  get size() { return this.#items.length; }
  #persist() { this.#store.set(this.#key, this.#items); }
}

export const history = new History();
export default history;
