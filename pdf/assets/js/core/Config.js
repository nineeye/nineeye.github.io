function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function deepMerge(target, source) {
  const output = { ...target };
  if (!isPlainObject(source)) return output;
  for (const [key, value] of Object.entries(source)) {
    output[key] = isPlainObject(value) && isPlainObject(output[key])
      ? deepMerge(output[key], value)
      : Array.isArray(value) ? [...value] : value;
  }
  return output;
}

export const DEFAULT_CONFIG = Object.freeze({
  app: Object.freeze({ name: "Converter Mall", version: "0.5.7" }),
  upload: Object.freeze({ maxFiles: 100, maxFileSize: 1024 * 1024 * 1024 }),
  history: Object.freeze({ limit: 30 }),
  ui: Object.freeze({ toastDuration: 3000, sidebarStorageKey: "sidebar-open" })
});

export class Config {
  #values;
  constructor(initial = {}) { this.#values = deepMerge(DEFAULT_CONFIG, initial); }
  get(path, fallback = null) {
    const keys = Array.isArray(path) ? path : String(path || "").split(".").filter(Boolean);
    let current = this.#values;
    for (const key of keys) {
      if (current == null || !Object.hasOwn(current, key)) return fallback;
      current = current[key];
    }
    return current;
  }
  set(path, value) {
    const keys = Array.isArray(path) ? path : String(path || "").split(".").filter(Boolean);
    if (!keys.length) throw new TypeError("Config path is required.");
    let current = this.#values;
    keys.slice(0, -1).forEach(key => {
      if (!isPlainObject(current[key])) current[key] = {};
      current = current[key];
    });
    current[keys.at(-1)] = value;
    return value;
  }
  merge(values) { this.#values = deepMerge(this.#values, values); return this; }
  toJSON() { return typeof structuredClone === "function" ? structuredClone(this.#values) : JSON.parse(JSON.stringify(this.#values)); }
  reset() { this.#values = deepMerge({}, DEFAULT_CONFIG); }
}

export const config = new Config();
if (typeof window !== "undefined") window.ConverterConfig = config;
export default config;
