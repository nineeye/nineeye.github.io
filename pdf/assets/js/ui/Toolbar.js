function resolve(target) {
  if (target instanceof HTMLElement) return target;
  if (typeof target === "string") return document.querySelector(target);
  return null;
}

export class Toolbar {
  #element;
  #controller = new AbortController();
  #items = new Map();

  constructor({ element, label = "도구 모음", className = "", orientation = "horizontal" } = {}) {
    this.#element = resolve(element) || document.createElement("div");
    this.#element.className = `ui-toolbar ${className}`.trim();
    this.#element.setAttribute("role", "toolbar");
    this.#element.setAttribute("aria-label", label);
    this.#element.setAttribute("aria-orientation", orientation);
    this.#element.addEventListener("keydown", event => this.#handleKeys(event), { signal: this.#controller.signal });
  }

  get element() { return this.#element; }

  mount(target) {
    const parent = resolve(target);
    if (!parent) throw new TypeError("Toolbar.mount target을 찾을 수 없습니다.");
    parent.append(this.#element);
    return this;
  }

  add(item, { id, group = "default" } = {}) {
    const node = item?.element instanceof HTMLElement ? item.element : item;
    if (!(node instanceof HTMLElement)) throw new TypeError("Toolbar.add에는 HTMLElement가 필요합니다.");
    const key = id || node.id || `toolbar-item-${this.#items.size + 1}`;
    node.dataset.toolbarItem = key;
    node.dataset.toolbarGroup = group;
    this.#items.set(key, node);
    this.#element.append(node);
    this.#syncTabIndex();
    return key;
  }

  remove(id) {
    const node = this.#items.get(id);
    if (!node) return false;
    node.remove();
    this.#items.delete(id);
    this.#syncTabIndex();
    return true;
  }

  setEnabled(id, enabled = true) {
    const node = this.#items.get(id);
    if (!node) return false;
    if ("disabled" in node) node.disabled = !enabled;
    node.setAttribute("aria-disabled", String(!enabled));
    return true;
  }

  #syncTabIndex() {
    const available = [...this.#items.values()].filter(node => !node.disabled && node.getAttribute("aria-disabled") !== "true");
    available.forEach((node, index) => { node.tabIndex = index === 0 ? 0 : -1; });
  }

  #handleKeys(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const available = [...this.#items.values()].filter(node => !node.disabled && node.getAttribute("aria-disabled") !== "true");
    if (!available.length) return;
    const current = Math.max(0, available.indexOf(document.activeElement));
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % available.length;
    if (event.key === "ArrowLeft") next = (current - 1 + available.length) % available.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = available.length - 1;
    event.preventDefault();
    available.forEach((node, index) => { node.tabIndex = index === next ? 0 : -1; });
    available[next].focus();
  }

  clear() {
    this.#items.clear();
    this.#element.replaceChildren();
  }

  destroy({ remove = true } = {}) {
    this.#controller.abort();
    this.#items.clear();
    if (remove) this.#element.remove();
  }
}

export default Toolbar;
