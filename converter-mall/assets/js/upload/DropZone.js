// =====================================
// Converter Mall
// Drop Zone
// Reusable, accessible and safely disposable file input binding
// =====================================

const DEFAULT_ACTIVE_CLASS = "drag-over";

export class DropZone {
    #element;
    #input;
    #onFiles;
    #activeClass;
    #disabled = false;
    #bound = false;
    #dragDepth = 0;
    #abortController = null;

    constructor({
        element,
        input,
        onFiles,
        activeClass = DEFAULT_ACTIVE_CLASS,
        disabled = false
    } = {}) {
        this.#element = resolveElement(element);
        this.#input = resolveElement(input);
        this.#onFiles = typeof onFiles === "function" ? onFiles : async () => {};
        this.#activeClass = activeClass;
        this.#disabled = Boolean(disabled);

        if (!this.#element || !this.#input) {
            throw new TypeError("DropZone에는 유효한 element와 input이 필요합니다.");
        }
    }

    bind() {
        if (this.#bound) return this;

        this.#bound = true;
        this.#abortController = new AbortController();
        const { signal } = this.#abortController;

        this.#prepareAccessibility();

        this.#element.addEventListener("click", this.#handleClick, { signal });
        this.#element.addEventListener("keydown", this.#handleKeydown, { signal });
        this.#element.addEventListener("dragenter", this.#handleDragEnter, { signal });
        this.#element.addEventListener("dragover", this.#handleDragOver, { signal });
        this.#element.addEventListener("dragleave", this.#handleDragLeave, { signal });
        this.#element.addEventListener("drop", this.#handleDrop, { signal });
        this.#input.addEventListener("change", this.#handleInputChange, { signal });

        this.#syncDisabledState();
        return this;
    }

    destroy() {
        this.#abortController?.abort();
        this.#abortController = null;
        this.#bound = false;
        this.#dragDepth = 0;
        this.#setActive(false);
    }

    setDisabled(disabled) {
        this.#disabled = Boolean(disabled);
        this.#syncDisabledState();
        return this;
    }

    get isBound() {
        return this.#bound;
    }

    get isDisabled() {
        return this.#disabled;
    }

    #prepareAccessibility() {
        if (!this.#element.hasAttribute("role")) {
            this.#element.setAttribute("role", "button");
        }

        if (!this.#element.hasAttribute("tabindex")) {
            this.#element.tabIndex = 0;
        }
    }

    #syncDisabledState() {
        this.#element.setAttribute("aria-disabled", String(this.#disabled));
        this.#input.disabled = this.#disabled;

        if (this.#disabled) {
            this.#dragDepth = 0;
            this.#setActive(false);
        }
    }

    #handleClick = event => {
        if (this.#disabled || event.target === this.#input) return;
        this.#input.click();
    };

    #handleKeydown = event => {
        if (this.#disabled || !["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        this.#input.click();
    };

    #handleInputChange = async () => {
        await this.#submit(this.#input.files);
    };

    #handleDragEnter = event => {
        event.preventDefault();
        if (this.#disabled) return;

        this.#dragDepth += 1;
        this.#setActive(true);
    };

    #handleDragOver = event => {
        event.preventDefault();
        if (this.#disabled) return;

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "copy";
        }

        this.#setActive(true);
    };

    #handleDragLeave = event => {
        event.preventDefault();
        if (this.#disabled) return;

        this.#dragDepth = Math.max(0, this.#dragDepth - 1);
        if (this.#dragDepth === 0) this.#setActive(false);
    };

    #handleDrop = async event => {
        event.preventDefault();
        this.#dragDepth = 0;
        this.#setActive(false);

        if (this.#disabled) return;
        await this.#submit(event.dataTransfer?.files);
    };

    async #submit(fileList) {
        const files = Array.from(fileList || []).filter(Boolean);
        if (!files.length) return;

        this.setDisabled(true);

        try {
            await this.#onFiles(files);
        } finally {
            this.#input.value = "";
            this.setDisabled(false);
        }
    }

    #setActive(active) {
        this.#element.classList.toggle(this.#activeClass, active);
        this.#element.setAttribute("data-drag-active", String(active));
    }
}

export function createDropZone(options) {
    return new DropZone(options).bind();
}

function resolveElement(value) {
    if (typeof value === "string") return document.querySelector(value);
    return value instanceof Element ? value : null;
}
