// =====================================
// Converter Mall
// Upload Dispatcher
// =====================================

const EVENT_NAME = "converter-upload";

export function dispatchUpload(files = []) {

    const list = [...files];

    window.dispatchEvent(

        new CustomEvent(EVENT_NAME, {

            detail: {

                files: list,

                count: list.length,

                time: Date.now()

            }

        })

    );

}

export function onUpload(callback) {

    if (typeof callback !== "function") {

        return () => {};

    }

    const handler = e => {

        callback(

            e.detail.files || [],

            e.detail

        );

    };

    window.addEventListener(

        EVENT_NAME,

        handler

    );

    return () => {

        window.removeEventListener(

            EVENT_NAME,

            handler

        );

    };

}

export function onceUpload(callback) {

    if (typeof callback !== "function") return;

    const handler = e => {

        callback(

            e.detail.files || [],

            e.detail

        );

        window.removeEventListener(

            EVENT_NAME,

            handler

        );

    };

    window.addEventListener(

        EVENT_NAME,

        handler

    );

}

export function hasUploadListener() {

    return true;

}

window.UploadDispatcher = {

    dispatch: dispatchUpload,

    on: onUpload,

    once: onceUpload

};