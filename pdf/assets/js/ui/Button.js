const DEFAULT_CLASS = "ui-button";

function resolveElement(target) {
  if (target instanceof HTMLElement) return target;
  if (typeof target === "string") return document.querySelector(target);
  return null;
}

function normalizeContent(value) {
  if (value instanceof Node) return value;
  const span = document.createElement("span");
  span.className = "ui-button__label";
  span.textContent = value == null ? "" : String(value);
  return span;
}

export class Button {
  #element;
  #controller = new AbortController();
  #busy = false;
  #originalLabel = "";

  constructor(options = {}) {
    const {
      element,
      label = "",
      type = "button",
      variant = "default",
      size = "medium",
      className = "",
      disabled = false,
      ariaLabel,
      title,
      icon,
      onClick,
      attributes = {}
    } = options;

    this.#element = resolveElement(element) || document.createElement("button");
    this.#element.type = type;
    this.#element.classList.add(DEFAULT_CLASS, `${DEFAULT_CLASS}--${variant}`, `${DEFAULT_CLASS}--${size}`);
    if (className) this.#element.classList.add(...String(className).split(/\s+/).filter(Boolean));

    this.setContent({ label, icon });
    this.setDisabled(disabled);

    if (ariaLabel) this.#element.setAttribute("aria-label", ariaLabel);
    if (title) this.#element.title = title;
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== false && value != null) this.#element.setAttribute(key, value === true ? "" : String(value));
    });

    if (typeof onClick === "function") {
      this.#element.addEventListener("click", onClick, { signal: this.#controller.signal });
    }
  }

  get element() {
    return this.#element;
  }

  mount(target, position = "beforeend") {
    const parent = resolveElement(target);
    if (!parent) throw new TypeError("Button.mount target을 찾을 수 없습니다.");
    parent.insertAdjacentElement(position, this.#element);
    return this;
  }

  setContent({ label = "", icon = null } = {}) {
    this.#element.replaceChildren();
    if (icon != null) {
      const iconNode = icon instanceof Node ? icon : document.createTextNode(String(icon));
      const iconWrap = document.createElement("span");
      iconWrap.className = "ui-button__icon";
      iconWrap.setAttribute("aria-hidden", "true");
      iconWrap.append(iconNode);
      this.#element.append(iconWrap);
    }
    const labelNode = normalizeContent(label);
    this.#element.append(labelNode);
    this.#originalLabel = typeof label === "string" ? label : this.#element.textContent || "";
    return this;
  }

  setLabel(label) {
    const node = this.#element.querySelector(".ui-button__label");
    if (node) node.textContent = String(label ?? "");
    else this.setContent({ label });
    this.#originalLabel = String(label ?? "");
    return this;
  }

  setDisabled(disabled = true) {
    this.#element.disabled = Boolean(disabled);
    this.#element.setAttribute("aria-disabled", String(Boolean(disabled)));
    return this;
  }

  setBusy(busy = true, label = "처리 중…") {
    this.#busy = Boolean(busy);
    this.#element.classList.toggle("is-busy", this.#busy);
    this.#element.setAttribute("aria-busy", String(this.#busy));
    this.setDisabled(this.#busy);
    this.setLabel(this.#busy ? label : this.#originalLabel);
    return this;
  }

  on(type, listener, options = {}) {
    this.#element.addEventListener(type, listener, { ...options, signal: this.#controller.signal });
    return this;
  }

  focus() {
    this.#element.focus();
    return this;
  }

  destroy({ remove = true } = {}) {
    this.#controller.abort();
    if (remove) this.#element.remove();
  }
}

export function createButton(options) {
  return new Button(options);
}

export default Button;
