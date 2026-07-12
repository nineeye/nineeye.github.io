const LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40, silent: 99 });

function normalizeLevel(level) {
  const key = String(level || "info").toLowerCase();
  return Object.hasOwn(LEVELS, key) ? key : "info";
}

function createRecord(level, scope, args) {
  return Object.freeze({ level, scope, args: [...args], timestamp: new Date().toISOString() });
}

export class Logger {
  #scope;
  #level;
  #enabled;
  #history = [];
  #maxHistory;

  constructor({ scope = "ConverterMall", level = "info", enabled = true, maxHistory = 200 } = {}) {
    this.#scope = String(scope || "ConverterMall");
    this.#level = normalizeLevel(level);
    this.#enabled = Boolean(enabled);
    this.#maxHistory = Math.max(0, Number(maxHistory) || 0);
  }

  child(scope) {
    return new Logger({
      scope: `${this.#scope}:${String(scope || "child")}`,
      level: this.#level,
      enabled: this.#enabled,
      maxHistory: this.#maxHistory
    });
  }

  setLevel(level) { this.#level = normalizeLevel(level); return this; }
  enable() { this.#enabled = true; return this; }
  disable() { this.#enabled = false; return this; }

  #write(level, args) {
    if (!this.#enabled || LEVELS[level] < LEVELS[this.#level]) return null;
    const record = createRecord(level, this.#scope, args);
    if (this.#maxHistory > 0) {
      this.#history.push(record);
      if (this.#history.length > this.#maxHistory) this.#history.splice(0, this.#history.length - this.#maxHistory);
    }
    const method = typeof console?.[level] === "function" ? level : "log";
    console[method](`[${record.scope}]`, ...record.args);
    return record;
  }

  debug(...args) { return this.#write("debug", args); }
  info(...args) { return this.#write("info", args); }
  warn(...args) { return this.#write("warn", args); }
  error(...args) { return this.#write("error", args); }
  getHistory() { return [...this.#history]; }
  clearHistory() { this.#history.length = 0; }
}

export const logger = new Logger();
if (typeof window !== "undefined") window.ConverterLogger = logger;
export default logger;
