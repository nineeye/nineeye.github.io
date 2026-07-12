const ALL = "all";

export class ImageHub {
    constructor({
        registryUrl = "./data/image-converters.json",
        grid,
        searchInput,
        sourceFilter,
        targetFilter,
        routeBox,
        resultMeta,
        emptyState,
        onOpen,
        onNotice
    }) {
        this.registryUrl = registryUrl;
        this.grid = grid;
        this.searchInput = searchInput;
        this.sourceFilter = sourceFilter;
        this.targetFilter = targetFilter;
        this.routeBox = routeBox;
        this.resultMeta = resultMeta;
        this.emptyState = emptyState;
        this.onOpen = onOpen || (() => {});
        this.onNotice = onNotice || (() => {});
        this.tools = [];
        this.filtered = [];
    }

    async init() {
        if (!this.grid) return;
        const response = await fetch(this.registryUrl, {
            headers: { Accept: "application/json" },
            cache: "no-cache"
        });
        if (!response.ok) throw new Error(`이미지 변환기 목록 요청 실패 (${response.status})`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new TypeError("이미지 변환기 목록 형식이 올바르지 않습니다.");

        this.tools = data.filter(tool => tool.status === "ready" && tool.path);
        this.populateFilters();
        this.bindEvents();
        this.render();
    }

    populateFilters() {
        this.fillSelect(this.sourceFilter, this.uniqueFormats("sourceFormat"), "입력 형식 전체");
        this.fillSelect(this.targetFilter, this.uniqueFormats("targetFormat"), "출력 형식 전체");
    }

    uniqueFormats(key) {
        return [...new Set(this.tools.map(tool => String(tool[key] || "").toUpperCase()).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "ko"));
    }

    fillSelect(select, formats, allLabel) {
        if (!select) return;
        select.innerHTML = [
            `<option value="${ALL}">${allLabel}</option>`,
            ...formats.map(format => `<option value="${escapeAttribute(format)}">${escapeHtml(format)}</option>`)
        ].join("");
    }

    bindEvents() {
        this.searchInput?.addEventListener("input", () => this.render());
        this.sourceFilter?.addEventListener("change", () => this.render());
        this.targetFilter?.addEventListener("change", () => this.render());
    }

    getCriteria() {
        return {
            query: String(this.searchInput?.value || "").trim().toLowerCase(),
            source: this.sourceFilter?.value || ALL,
            target: this.targetFilter?.value || ALL
        };
    }

    render() {
        const { query, source, target } = this.getCriteria();
        this.filtered = this.tools.filter(tool => {
            const haystack = [
                tool.title,
                tool.description,
                tool.sourceFormat,
                tool.targetFormat,
                ...(tool.accept || [])
            ].join(" ").toLowerCase();
            return (!query || haystack.includes(query)) &&
                (source === ALL || tool.sourceFormat === source) &&
                (target === ALL || tool.targetFormat === target);
        });

        this.grid.innerHTML = this.filtered.map(tool => this.cardTemplate(tool)).join("");
        this.grid.dataset.registryState = "ready";
        this.updateMeta();
        this.renderRoutes();
        this.bindCards();
    }

    cardTemplate(tool) {
        return `<a href="${escapeAttribute(tool.path)}" class="tool-card is-live image-hub-card"
            data-tool-id="${escapeAttribute(tool.id)}"
            data-source="${escapeAttribute(tool.sourceFormat)}"
            data-target="${escapeAttribute(tool.targetFormat)}">
            <span class="format-route" aria-hidden="true">
                <strong>${escapeHtml(tool.sourceFormat)}</strong>
                <span>→</span>
                <strong>${escapeHtml(tool.targetFormat)}</strong>
            </span>
            <span class="tool-card-icon" aria-hidden="true">${escapeHtml(tool.icon || "🖼")}</span>
            <h3>${escapeHtml(tool.title)}</h3>
            <p>${escapeHtml(tool.description || "이미지 형식 변환")}</p>
            <span class="tool-ready-badge">바로 사용</span>
        </a>`;
    }

    bindCards() {
        this.grid.querySelectorAll("[data-tool-id]").forEach(card => {
            card.addEventListener("click", () => {
                const tool = this.tools.find(item => item.id === card.dataset.toolId);
                if (tool) this.onOpen(tool);
            });
        });
    }

    updateMeta() {
        if (this.resultMeta) {
            this.resultMeta.textContent = `사용 가능한 이미지 변환기 ${this.filtered.length}개 / 전체 ${this.tools.length}개`;
        }
        if (this.emptyState) {
            const empty = this.filtered.length === 0;
            this.emptyState.hidden = !empty;
            if (empty) this.emptyState.textContent = "조건에 맞는 이미지 변환기가 없습니다. 입력·출력 형식을 다시 선택해 주세요.";
        }
    }

    renderRoutes() {
        if (!this.routeBox) return;
        const { source, target } = this.getCriteria();
        const sourceFormats = source === ALL ? this.uniqueFormats("sourceFormat") : [source];
        const recommendations = [];

        for (const from of sourceFormats) {
            const direct = this.tools.filter(tool => tool.sourceFormat === from && (target === ALL || tool.targetFormat === target));
            for (const tool of direct) recommendations.push({ type: "direct", tools: [tool] });

            if (target !== ALL && !direct.length) {
                for (const first of this.tools.filter(tool => tool.sourceFormat === from)) {
                    const second = this.tools.find(tool => tool.sourceFormat === first.targetFormat && tool.targetFormat === target);
                    if (second) recommendations.push({ type: "two-step", tools: [first, second] });
                }
            }
        }

        const unique = dedupeRoutes(recommendations).slice(0, 8);
        if (!unique.length) {
            this.routeBox.innerHTML = `<p class="route-empty">입력 형식과 출력 형식을 선택하면 가능한 변환 경로를 추천합니다.</p>`;
            return;
        }

        this.routeBox.innerHTML = unique.map(route => {
            const formats = [route.tools[0].sourceFormat, ...route.tools.map(tool => tool.targetFormat)];
            const label = route.type === "direct" ? "직접 변환" : "2단계 경로";
            const href = route.tools[0].path;
            return `<a class="route-chip" href="${escapeAttribute(href)}" data-route-id="${escapeAttribute(route.tools[0].id)}">
                <span class="route-label">${label}</span>
                <strong>${formats.map(escapeHtml).join(" → ")}</strong>
            </a>`;
        }).join("");

        this.routeBox.querySelectorAll("[data-route-id]").forEach(link => {
            link.addEventListener("click", () => {
                const tool = this.tools.find(item => item.id === link.dataset.routeId);
                if (tool) this.onOpen(tool);
            });
        });
    }
}

function dedupeRoutes(routes) {
    const seen = new Set();
    return routes.filter(route => {
        const key = route.tools.map(tool => tool.id).join(">");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[character]);
}

function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
}
