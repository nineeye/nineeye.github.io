// =====================================
// Converter Mall
// Registry-driven smart workspace router
// =====================================

import { SmartFileRouter } from "./SmartFileRouter.js";

let router;

export async function loadWorkspace(files = []) {
    router ||= new SmartFileRouter({
        registryUrl: "./data/image-converters.json",
        workspace: "#workspace",
        recommend: "#recommendContainer",
        onNotice(message) {
            if (typeof window.showSiteNotice === "function") {
                window.showSiteNotice(message);
            } else {
                alert(message);
            }
        }
    });

    return router.route(files);
}
