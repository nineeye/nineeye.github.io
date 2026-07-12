function resolve(target) {
  if (target instanceof HTMLElement) return target;
  if (typeof target === "string") return document.querySelector(target);
  return null;
}

export class Sidebar {
  #element;
  #controller = new AbortController();
  #open;
  #storageKey;
  #toggleButtons = new Set();

  constructor({ element, open = true, storageKey = "converterMall.sidebar.open", className = "" } = {}) {
    this.#element = resolve(element) || document.createElement("aside");
    this.#element.className = `ui-sidebar ${className}`.trim();
    this.#element.setAttribute("aria-label", "사이드바");
    this.#storageKey = storageKey;
    const stored = this.#readStored();
    this.#open = stored == null ? Boolean(open) : stored;
    this.#applyState(false);
  }

  get element() { return this.#element; }
  get isOpen() { return this.#open; }

  mount(target) {
    const parent = resolve(target);
    if (!parent) throw new TypeError("Sidebar.mount target을 찾을 수 없습니다.");
    parent.append(this.#element);
    return this;
  }

  bindToggle(button) {
    const node = resolve(button);
    if (!node) throw new TypeError("Sidebar.bindToggle 버튼을 찾을 수 없습니다.");
    this.#toggleButtons.add(node);
    node.setAttribute("aria-controls", this.#ensureId());
    node.addEventListener("click", () => this.toggle(), { signal: this.#controller.signal });
    this.#syncToggle(node);
    return this;
  }

  open() { this.setOpen(true); return this; }
  close() { this.setOpen(false); return this; }
  toggle() { this.setOpen(!this.#open); return this; }

  setOpen(value, { persist = true, emit = true } = {}) {
    const next = Boolean(value);
    if (next === this.#open) return this;
    this.#open = next;
    this.#applyState(persist);
    if (emit) this.#element.dispatchEvent(new CustomEvent("sidebar:change", { detail: { open: this.#open } }));
    return this;
  }

  #applyState(persist) {
    this.#element.classList.toggle("is-open", this.#open);
    this.#element.classList.toggle("is-closed", !this.#open);
    this.#element.setAttribute("aria-hidden", String(!this.#open));
    this.#element.dataset.state = this.#open ? "open" : "closed";
    this.#toggleButtons.forEach(button => this.#syncToggle(button));
    if (persist) {
      try { localStorage.setItem(this.#storageKey, String(this.#open)); } catch {}
    }
  }

  #syncToggle(button) {
    button.setAttribute("aria-expanded", String(this.#open));
    button.classList.toggle("is-active", this.#open);
  }

  #readStored() {
    try {
      const value = localStorage.getItem(this.#storageKey);
      return value == null ? null : value === "true";
    } catch { return null; }
  }

  #ensureId() {
    if (!this.#element.id) this.#element.id = `sidebar-${crypto.randomUUID?.() || Date.now()}`;
    return this.#element.id;
  }

  destroy({ remove = false } = {}) {
    this.#controller.abort();
    this.#toggleButtons.clear();
    if (remove) this.#element.remove();
  }
}

export default Sidebar;
