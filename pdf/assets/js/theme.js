// =====================================
// Converter-Mall/assets/js/theme.js
// Theme Module
// =====================================

const STORAGE_KEY = "converter-theme";

export function initTheme() {

    const button = document.querySelector(".theme-btn");

    const savedTheme =
        localStorage.getItem(STORAGE_KEY) || "light";

    applyTheme(savedTheme);

    if (!button) return;

    updateButton(button);

    button.addEventListener("click", () => {

        const current =
            document.documentElement.dataset.theme || "light";

        const next =
            current === "dark" ? "light" : "dark";

        applyTheme(next);

        localStorage.setItem(STORAGE_KEY, next);

        updateButton(button);

    });

}

function applyTheme(theme) {

    document.documentElement.dataset.theme = theme;

}

function updateButton(button) {

    const dark =
        document.documentElement.dataset.theme === "dark";

    button.textContent = dark ? "☀️" : "🌙";

}

window.Theme = {

    toggle() {

        const current =
            document.documentElement.dataset.theme || "light";

        const next =
            current === "dark" ? "light" : "dark";

        applyTheme(next);

        localStorage.setItem(STORAGE_KEY, next);

        const button = document.querySelector(".theme-btn");

        if (button) updateButton(button);

    }

};