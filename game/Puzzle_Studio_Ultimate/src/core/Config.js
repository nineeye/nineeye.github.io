/**
 * Global Configuration
 *
 * 프로젝트 전체 설정.
 * 모든 시스템은 이 파일을 통해 설정을 참조한다.
 */

import Version from "./Version.js";

const Config = Object.freeze({

    version: Version,

    canvas: {

        width: 1280,
        height: 720,

        autoResize: true,

        pixelRatio: window.devicePixelRatio || 1,

        imageSmoothing: true

    },

    render: {

        targetFPS: 120,

        fixedTimeStep: 1000 / 120,

        maxDelta: 100,

        backgroundColor: "#101418"

    },

    animation: {

        duration: 220,

        easing: "easeOutCubic"

    },

    input: {

        doubleTapTime: 300,

        longPressTime: 500,

        swipeThreshold: 20

    },

    audio: {

        masterVolume: 1.0,

        musicVolume: 0.7,

        sfxVolume: 0.9,

        muted: false

    },

    save: {

        storageKey: "PSU_SAVE",

        autoSave: true,

        autoSaveInterval: 60000

    },

    theme: {

        defaultTheme: "dark",

        enableAnimation: true

    },

    debug: {

        enabled: true,

        showFPS: true,

        showMemory: true,

        showScene: true,

        showHitbox: false

    }

});

export default Config;