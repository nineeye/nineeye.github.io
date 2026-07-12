// =====================================
// File Transfer
// =====================================

import { UploadManager } from "./UploadManager.js";

export function openConverter(url) {

    if (!UploadManager.hasFiles()) {

        location.href = url;

        return;

    }

    location.href = url;

}