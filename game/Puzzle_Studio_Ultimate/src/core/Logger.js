/**
 * ============================================================
 * Puzzle Studio Ultimate
 * Professional Logger
 * Version : v0.1.2
 * ============================================================
 */

import Config from "./Config.js";
import Version from "./Version.js";

class Logger {

    static #timers = new Map();

    static #style(color) {
        return `
            background:${color};
            color:white;
            padding:2px 8px;
            border-radius:4px;
            font-weight:bold;
        `;
    }

    static info(message, ...args) {

        if (!Config.debug.enabled) return;

        console.log(
            `%cINFO`,
            Logger.#style("#2196F3"),
            message,
            ...args
        );

    }

    static success(message, ...args) {

        if (!Config.debug.enabled) return;

        console.log(
            `%cSUCCESS`,
            Logger.#style("#4CAF50"),
            message,
            ...args
        );

    }

    static warn(message, ...args) {

        if (!Config.debug.enabled) return;

        console.warn(
            `%cWARNING`,
            Logger.#style("#FF9800"),
            message,
            ...args
        );

    }

    static error(message, ...args) {

        console.error(
            `%cERROR`,
            Logger.#style("#F44336"),
            message,
            ...args
        );

    }

    static debug(message, ...args) {

        if (!Config.debug.enabled) return;

        console.debug(
            `%cDEBUG`,
            Logger.#style("#9C27B0"),
            message,
            ...args
        );

    }

    static time(label) {

        Logger.#timers.set(label, performance.now());

    }

    static timeEnd(label) {

        if (!Logger.#timers.has(label))
            return;

        const elapsed =
            performance.now() - Logger.#timers.get(label);

        Logger.#timers.delete(label);

        Logger.info(
            `${label}: ${elapsed.toFixed(2)} ms`
        );

    }

    static banner() {

        console.clear();

        console.log(
`%c
██████╗ ██╗   ██╗███████╗███████╗██╗     ███████╗
██╔══██╗██║   ██║╚══███╔╝╚══███╔╝██║     ██╔════╝
██████╔╝██║   ██║  ███╔╝   ███╔╝ ██║     █████╗
██╔═══╝ ██║   ██║ ███╔╝   ███╔╝  ██║     ██╔══╝
██║     ╚██████╔╝███████╗███████╗███████╗███████╗
╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝╚══════╝
`,
"color:#00BCD4;font-weight:bold;"
        );

        console.log(
            `%c${Version.NAME}`,
            "font-size:20px;font-weight:bold;color:#00BCD4;"
        );

        console.log(
            `Version : ${Version.VERSION}`
        );

        console.log(
            `Build : ${Version.BUILD}`
        );

        console.log(
            `Stage : ${Version.STAGE}`
        );

    }

}

export default Logger;