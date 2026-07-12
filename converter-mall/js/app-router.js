/**
 * Converter Mall - Tool Page Router
 *
 * 현재 URL에서 도구 ID를 추출하고 tools.json의 메타데이터를
 * 변환기 페이지 DOM에 안전하게 반영한다.
 */
(function initToolPageRouter(global) {
    "use strict";

    const DEFAULT_OPTIONS = Object.freeze({
        dataPaths: [
            "../../data/tools.json",
            "../data/tools.json",
            "./data/tools.json",
            "/data/tools.json"
        ],
        selectors: Object.freeze({
            title: "#toolTitle",
            subtitle: "#toolSubtitle",
            description: "#pageDesc",
            acceptText: "#acceptText"
        }),
        defaultTitle: "Converter Mall"
    });

    class ToolPageRouter {
        constructor(options = {}) {
            this.options = {
                ...DEFAULT_OPTIONS,
                ...options,
                dataPaths: Array.isArray(options.dataPaths)
                    ? [...options.dataPaths]
                    : [...DEFAULT_OPTIONS.dataPaths],
                selectors: {
                    ...DEFAULT_OPTIONS.selectors,
                    ...(options.selectors || {})
                }
            };

            this.controller = null;
            this.currentTool = null;
        }

        async start() {
            this.destroy();
            this.controller = new AbortController();

            try {
                const toolId = this.resolveToolId();

                if (!toolId) {
                    throw new Error("URL에서 변환기 ID를 찾을 수 없습니다.");
                }

                const tools = await this.loadTools(this.controller.signal);
                const tool = tools.find((item) => item && item.id === toolId);

                if (!tool) {
                    throw new Error(`등록되지 않은 변환기입니다: ${toolId}`);
                }

                this.currentTool = Object.freeze({ ...tool });
                this.render(this.currentTool);

                global.dispatchEvent(new CustomEvent("converter:route-ready", {
                    detail: { tool: this.currentTool }
                }));

                return this.currentTool;
            } catch (error) {
                if (error && error.name === "AbortError") {
                    return null;
                }

                this.renderError(error);
                console.error("[ToolPageRouter] 초기화 실패:", error);
                return null;
            }
        }

        destroy() {
            if (this.controller) {
                this.controller.abort();
                this.controller = null;
            }

            this.currentTool = null;
        }

        resolveToolId(pathname = global.location.pathname) {
            const segments = pathname
                .split("/")
                .map((segment) => decodeURIComponent(segment).trim())
                .filter(Boolean);

            if (segments.length === 0) {
                return "";
            }

            const lastSegment = segments.at(-1);
            const isHtmlFile = /\.html?$/i.test(lastSegment);

            if (lastSegment.toLowerCase() === "index.html") {
                return segments.at(-2) || "";
            }

            return isHtmlFile
                ? lastSegment.replace(/\.html?$/i, "")
                : lastSegment;
        }

        async loadTools(signal) {
            let lastError = null;

            for (const path of this.options.dataPaths) {
                try {
                    const response = await fetch(path, {
                        signal,
                        headers: { Accept: "application/json" }
                    });

                    if (!response.ok) {
                        throw new Error(`${path} 요청 실패 (${response.status})`);
                    }

                    const data = await response.json();

                    if (!Array.isArray(data)) {
                        throw new TypeError(`${path}의 데이터가 배열이 아닙니다.`);
                    }

                    return data;
                } catch (error) {
                    if (error && error.name === "AbortError") {
                        throw error;
                    }

                    lastError = error;
                }
            }

            throw lastError || new Error("도구 목록을 불러오지 못했습니다.");
        }

        render(tool) {
            const title = this.toText(tool.title, this.options.defaultTitle);
            const description = this.toText(tool.description);
            const accepts = Array.isArray(tool.accept)
                ? tool.accept.filter(Boolean).join(", ")
                : "";

            document.title = `${title} | ${this.options.defaultTitle}`;
            this.setText(this.options.selectors.title, title);
            this.setText(this.options.selectors.subtitle, description);
            this.setText(
                this.options.selectors.acceptText,
                accepts ? `지원 형식: ${accepts}` : ""
            );
            this.setMetaContent(this.options.selectors.description, description);

            document.documentElement.dataset.toolId = this.toText(tool.id);
            document.body.dataset.routeState = "ready";
        }

        renderError(error) {
            const message = error instanceof Error
                ? error.message
                : "페이지 정보를 불러오지 못했습니다.";

            document.title = `오류 | ${this.options.defaultTitle}`;
            this.setText(this.options.selectors.title, "변환기를 불러올 수 없습니다.");
            this.setText(this.options.selectors.subtitle, message);
            document.body.dataset.routeState = "error";
        }

        setText(selector, value) {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = this.toText(value);
            }
        }

        setMetaContent(selector, value) {
            const element = document.querySelector(selector);
            if (element) {
                element.setAttribute("content", this.toText(value));
            }
        }

        toText(value, fallback = "") {
            return typeof value === "string" && value.trim()
                ? value.trim()
                : fallback;
        }
    }

    const router = new ToolPageRouter();

    global.ToolPageRouter = ToolPageRouter;
    global.toolPageRouter = router;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => router.start(), {
            once: true
        });
    } else {
        router.start();
    }
})(window);
