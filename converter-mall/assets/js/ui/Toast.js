const TYPES = new Set(["success", "error", "warning", "info"]);

export class ToastManager {
  #container;
  #items = new Map();
  #maxVisible;

  constructor({ containerId = "toastContainer", maxVisible = 5 } = {}) {
    this.#maxVisible = maxVisible;
    this.#container = document.getElementById(containerId) || document.createElement("div");
    this.#container.id = containerId;
    this.#container.classList.add("toast-container");
    this.#container.setAttribute("aria-live", "polite");
    this.#container.setAttribute("aria-atomic", "false");
    if (!this.#container.isConnected) document.body.append(this.#container);
  }

  show(message, options = {}) {
    const {
      type = "info",
      duration = type === "error" ? 5000 : 3000,
      dismissible = true,
      id = `toast-${crypto.randomUUID?.() || Date.now()}`
    } = options;

    if (this.#items.has(id)) this.dismiss(id);
    while (this.#items.size >= this.#maxVisible) this.dismiss(this.#items.keys().next().value);

    const toast = document.createElement("div");
    toast.id = id;
    toast.className = `toast toast-${TYPES.has(type) ? type : "info"}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");

    const text = document.createElement("div");
    text.className = "toast-message";
    text.textContent = String(message ?? "");
    toast.append(text);

    if (dismissible) {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "toast-close";
      close.setAttribute("aria-label", "알림 닫기");
      close.textContent = "×";
      close.addEventListener("click", () => this.dismiss(id), { once: true });
      toast.append(close);
    }

    this.#container.append(toast);
    const timer = duration > 0 ? window.setTimeout(() => this.dismiss(id), duration) : null;
    this.#items.set(id, { element: toast, timer });
    requestAnimationFrame(() => toast.classList.add("show"));
    return id;
  }

  dismiss(id) {
    const item = this.#items.get(id);
    if (!item) return false;
    if (item.timer) clearTimeout(item.timer);
    item.element.classList.remove("show");
    item.element.remove();
    this.#items.delete(id);
    return true;
  }

  clear() {
    [...this.#items.keys()].forEach(id => this.dismiss(id));
  }

  success(message, duration = 3000) { return this.show(message, { type: "success", duration }); }
  error(message, duration = 5000) { return this.show(message, { type: "error", duration }); }
  warning(message, duration = 4000) { return this.show(message, { type: "warning", duration }); }
  info(message, duration = 3000) { return this.show(message, { type: "info", duration }); }
}

export const Toast = new ToastManager();
export default Toast;
