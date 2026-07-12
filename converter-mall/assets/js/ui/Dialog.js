const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function toNode(content) {
  if (content instanceof Node) return content;
  const wrapper = document.createElement("div");
  wrapper.textContent = content == null ? "" : String(content);
  return wrapper;
}

export class Dialog {
  #root;
  #panel;
  #title;
  #body;
  #footer;
  #controller = new AbortController();
  #previousFocus = null;
  #resolve = null;
  #open = false;
  #closeOnBackdrop;
  #closeOnEscape;

  constructor(options = {}) {
    const {
      id = `dialog-${crypto.randomUUID?.() || Date.now()}`,
      className = "",
      closeOnBackdrop = true,
      closeOnEscape = true
    } = options;

    this.#closeOnBackdrop = closeOnBackdrop;
    this.#closeOnEscape = closeOnEscape;

    this.#root = document.createElement("div");
    this.#root.id = id;
    this.#root.className = `ui-dialog ${className}`.trim();
    this.#root.hidden = true;
    this.#root.setAttribute("aria-hidden", "true");

    this.#panel = document.createElement("section");
    this.#panel.className = "ui-dialog__panel";
    this.#panel.setAttribute("role", "dialog");
    this.#panel.setAttribute("aria-modal", "true");

    const header = document.createElement("header");
    header.className = "ui-dialog__header";

    this.#title = document.createElement("h2");
    this.#title.className = "ui-dialog__title";
    this.#title.id = `${id}-title`;
    this.#panel.setAttribute("aria-labelledby", this.#title.id);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "ui-dialog__close";
    close.setAttribute("aria-label", "닫기");
    close.textContent = "×";

    this.#body = document.createElement("div");
    this.#body.className = "ui-dialog__body";

    this.#footer = document.createElement("footer");
    this.#footer.className = "ui-dialog__footer";

    header.append(this.#title, close);
    this.#panel.append(header, this.#body, this.#footer);
    this.#root.append(this.#panel);
    document.body.append(this.#root);

    close.addEventListener("click", () => this.close("close"), { signal: this.#controller.signal });
    this.#root.addEventListener("click", event => {
      if (event.target === this.#root && this.#closeOnBackdrop) this.close("backdrop");
    }, { signal: this.#controller.signal });
    document.addEventListener("keydown", event => this.#onKeydown(event), { signal: this.#controller.signal });
  }

  get element() { return this.#root; }
  get isOpen() { return this.#open; }

  async open(options = {}) {
    if (this.#open) this.close("replaced");
    const {
      title = "",
      content = "",
      confirmText = "확인",
      cancelText = "취소",
      showCancel = true,
      showConfirm = true,
      destructive = false,
      onConfirm,
      onCancel
    } = options;

    this.#title.textContent = String(title);
    this.#body.replaceChildren(toNode(content));
    this.#footer.replaceChildren();

    if (showCancel) {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "ui-dialog__button ui-dialog__button--cancel";
      cancel.textContent = cancelText;
      cancel.addEventListener("click", async () => {
        await onCancel?.();
        this.close("cancel");
      }, { once: true });
      this.#footer.append(cancel);
    }

    if (showConfirm) {
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = `ui-dialog__button ui-dialog__button--confirm${destructive ? " is-destructive" : ""}`;
      confirm.textContent = confirmText;
      confirm.addEventListener("click", async () => {
        try {
          confirm.disabled = true;
          const result = await onConfirm?.();
          if (result !== false) this.close("confirm", result);
        } finally {
          confirm.disabled = false;
        }
      }, { once: true });
      this.#footer.append(confirm);
    }

    this.#previousFocus = document.activeElement;
    this.#root.hidden = false;
    this.#root.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-open-dialog");
    this.#open = true;

    requestAnimationFrame(() => {
      this.#root.classList.add("is-open");
      (this.#panel.querySelector(FOCUSABLE) || this.#panel).focus?.();
    });

    return new Promise(resolve => { this.#resolve = resolve; });
  }

  close(reason = "close", value) {
    if (!this.#open) return;
    this.#open = false;
    this.#root.classList.remove("is-open");
    this.#root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-open-dialog");
    this.#root.hidden = true;
    this.#previousFocus?.focus?.();
    this.#resolve?.({ reason, value, confirmed: reason === "confirm" });
    this.#resolve = null;
  }

  #onKeydown(event) {
    if (!this.#open) return;
    if (event.key === "Escape" && this.#closeOnEscape) {
      event.preventDefault();
      this.close("escape");
      return;
    }
    if (event.key !== "Tab") return;
    const nodes = [...this.#panel.querySelectorAll(FOCUSABLE)];
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  destroy() {
    this.close("destroy");
    this.#controller.abort();
    this.#root.remove();
  }
}

export const dialog = new Dialog({ id: "appDialog" });
export default Dialog;
