// =====================================
// Converter-Mall/assets/js/modal.js
// Universal Modal Module
// =====================================

let currentModal = null;

export function initModal() {

    if (document.getElementById("appModal")) return;

    const modal = document.createElement("div");

    modal.id = "appModal";

    modal.className = "modal-overlay";

    modal.innerHTML = `

<div class="modal-window">

    <div class="modal-header">

        <h2 class="modal-title"></h2>

        <button class="modal-close">&times;</button>

    </div>

    <div class="modal-body"></div>

    <div class="modal-footer">

        <button class="modal-cancel">
            취소
        </button>

        <button class="modal-confirm">
            확인
        </button>

    </div>

</div>

`;

    document.body.appendChild(modal);

    modal.addEventListener("click", e => {

        if (e.target === modal) close();

    });

    modal
        .querySelector(".modal-close")
        .addEventListener("click", close);

    modal
        .querySelector(".modal-cancel")
        .addEventListener("click", close);

}

function close() {

    if (!currentModal) return;

    currentModal.classList.remove("show");

    setTimeout(() => {

        currentModal.style.display = "none";

    }, 180);

}

function open(options = {}) {

    initModal();

    currentModal = document.getElementById("appModal");

    currentModal.style.display = "flex";

    currentModal.querySelector(".modal-title").textContent =
        options.title || "";

    const body =
        currentModal.querySelector(".modal-body");

    if (typeof options.content === "string") {

        body.innerHTML = options.content;

    } else if (options.content instanceof HTMLElement) {

        body.innerHTML = "";

        body.appendChild(options.content);

    }

    const confirm =
        currentModal.querySelector(".modal-confirm");

    confirm.onclick = () => {

        if (options.onConfirm)

            options.onConfirm();

        close();

    };

    requestAnimationFrame(() => {

        currentModal.classList.add("show");

    });

}

export const Modal = {

    open,

    close

};

window.Modal = Modal;