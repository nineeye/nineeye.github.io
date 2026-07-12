// ============================================
// Converter Mall - Unified Tool Registry
// Single source of truth for converter metadata
// ============================================

const TOOL_DEFINITIONS = Object.freeze([
  {
    id: "pdf-to-word",
    aliases: ["pdf-word"],
    name: "PDF → Word",
    icon: "📄",
    category: "PDF",
    accept: ["pdf"],
    path: "tools/pdf-to-word/index.html",
    description: "PDF 문서를 Word 형식으로 변환합니다.",
    keywords: ["pdf", "word", "docx", "문서"]
  },
  {
    id: "pdf-to-jpg",
    aliases: ["pdf-jpg"],
    name: "PDF → JPG",
    icon: "🖼️",
    category: "PDF",
    accept: ["pdf"],
    path: "tools/pdf-to-jpg/index.html",
    description: "PDF 페이지를 JPG 이미지로 변환합니다.",
    keywords: ["pdf", "jpg", "jpeg", "이미지"]
  },
  {
    id: "jpg-to-png",
    aliases: ["jpg-png"],
    name: "JPG → PNG",
    icon: "🖼️",
    category: "IMAGE",
    accept: ["jpg", "jpeg"],
    path: "tools/jpg-to-png/index.html",
    description: "JPG 이미지를 PNG 형식으로 변환합니다.",
    keywords: ["jpg", "jpeg", "png", "이미지"]
  },
  {
    id: "png-to-jpg",
    aliases: ["png-jpg"],
    name: "PNG → JPG",
    icon: "🖼️",
    category: "IMAGE",
    accept: ["png"],
    path: "tools/png-to-jpg/index.html",
    description: "PNG 이미지를 JPG 형식으로 변환합니다.",
    keywords: ["png", "jpg", "jpeg", "이미지"]
  },
  {
    id: "image-compress",
    aliases: [],
    name: "이미지 압축",
    icon: "📦",
    category: "IMAGE",
    accept: ["jpg", "jpeg", "png", "webp"],
    path: "tools/image-compress/index.html",
    description: "이미지 품질을 조절해 파일 용량을 줄입니다.",
    keywords: ["이미지", "압축", "용량", "최적화"]
  },
  {
    id: "heic-to-jpg",
    aliases: ["heic-jpg"],
    name: "HEIC → JPG",
    icon: "📷",
    category: "IMAGE",
    accept: ["heic", "heif"],
    path: "tools/heic-to-jpg/index.html",
    description: "아이폰 HEIC 사진을 JPG로 변환합니다.",
    keywords: ["heic", "heif", "jpg", "아이폰", "사진"]
  },
  {
    id: "json-to-csv",
    aliases: ["json-csv"],
    name: "JSON → CSV",
    icon: "💻",
    category: "DEVELOPER",
    accept: ["json"],
    path: "tools/json-to-csv/index.html",
    description: "JSON 데이터를 CSV 표 형식으로 변환합니다.",
    keywords: ["json", "csv", "데이터", "개발자"]
  },
  {
    id: "csv-to-json",
    aliases: ["csv-json"],
    name: "CSV → JSON",
    icon: "💻",
    category: "DEVELOPER",
    accept: ["csv"],
    path: "tools/csv-to-json/index.html",
    description: "CSV 데이터를 JSON 형식으로 변환합니다.",
    keywords: ["csv", "json", "데이터", "개발자"]
  },
  {
    id: "text-transform",
    aliases: ["text"],
    name: "텍스트 변환",
    icon: "✏️",
    category: "TEXT",
    accept: ["txt", "text"],
    path: "tools/text-transform/index.html",
    description: "대소문자, 공백, 줄바꿈을 정리합니다.",
    keywords: ["텍스트", "대소문자", "공백", "정리"]
  },
  {
    id: "image-resize",
    aliases: ["resize"],
    name: "이미지 리사이즈",
    icon: "📐",
    category: "IMAGE",
    accept: ["jpg", "jpeg", "png", "webp"],
    path: "tools/image-resize/index.html",
    description: "이미지의 가로와 세로 크기를 변경합니다.",
    keywords: ["이미지", "크기", "리사이즈", "resize"]
  }
]);

function normalizeText(value = "") {
  return String(value).trim();
}

export function normalizeExtension(value = "") {
  return normalizeText(value).toLowerCase().replace(/^\./, "");
}

function uniqueStrings(values = [], normalizer = normalizeText) {
  return Object.freeze(
    [...new Set(values.map(normalizer).filter(Boolean))]
  );
}

function normalizeTool(tool) {
  if (!tool || typeof tool !== "object") {
    throw new TypeError("Tool must be an object.");
  }

  const id = normalizeText(tool.id);
  if (!id) {
    throw new TypeError("Tool id is required.");
  }

  return Object.freeze({
    id,
    aliases: uniqueStrings(Array.isArray(tool.aliases) ? tool.aliases : []),
    name: normalizeText(tool.name || tool.title || id),
    icon: normalizeText(tool.icon || "🧰"),
    category: normalizeText(tool.category || "ETC").toUpperCase(),
    accept: uniqueStrings(
      Array.isArray(tool.accept) ? tool.accept : [],
      normalizeExtension
    ),
    path: normalizeText(tool.path || `tools/${id}/index.html`),
    description: normalizeText(tool.description),
    keywords: uniqueStrings(Array.isArray(tool.keywords) ? tool.keywords : [])
  });
}

export class Registry {
  #tools = new Map();
  #aliases = new Map();

  constructor(tools = []) {
    this.registerMany(tools);
  }

  register(tool, { overwrite = false } = {}) {
    const normalized = normalizeTool(tool);

    if (!overwrite && this.#tools.has(normalized.id)) {
      throw new Error(`Tool already registered: ${normalized.id}`);
    }

    if (overwrite && this.#tools.has(normalized.id)) {
      this.unregister(normalized.id);
    }

    this.#tools.set(normalized.id, normalized);

    for (const alias of normalized.aliases) {
      if (!overwrite && this.#aliases.has(alias)) {
        throw new Error(`Tool alias already registered: ${alias}`);
      }
      this.#aliases.set(alias, normalized.id);
    }

    return normalized;
  }

  registerMany(tools, options) {
    if (!Array.isArray(tools)) {
      throw new TypeError("Tools must be an array.");
    }
    return tools.map((tool) => this.register(tool, options));
  }

  unregister(idOrAlias) {
    const tool = this.get(idOrAlias);
    if (!tool) return false;

    this.#tools.delete(tool.id);
    for (const alias of tool.aliases) {
      this.#aliases.delete(alias);
    }
    return true;
  }

  resolveId(idOrAlias) {
    const value = normalizeText(idOrAlias);
    if (this.#tools.has(value)) return value;
    return this.#aliases.get(value) || null;
  }

  get(idOrAlias) {
    const id = this.resolveId(idOrAlias);
    return id ? this.#tools.get(id) || null : null;
  }

  has(idOrAlias) {
    return this.resolveId(idOrAlias) !== null;
  }

  getAll() {
    return [...this.#tools.values()];
  }

  get tools() {
    return this.getAll();
  }

  findByExtension(extension) {
    const ext = normalizeExtension(extension);
    if (!ext) return [];
    return this.getAll().filter((tool) => tool.accept.includes(ext));
  }

  findByCategory(category) {
    const target = normalizeText(category).toUpperCase();
    if (!target) return [];
    return this.getAll().filter((tool) => tool.category === target);
  }

  search(query) {
    const keyword = normalizeText(query).toLowerCase();
    if (!keyword) return this.getAll();

    return this.getAll().filter((tool) => {
      const searchable = [
        tool.id,
        ...tool.aliases,
        tool.name,
        tool.category,
        tool.description,
        ...tool.accept,
        ...tool.keywords
      ];

      return searchable.some((value) =>
        String(value).toLowerCase().includes(keyword)
      );
    });
  }

  clear() {
    this.#tools.clear();
    this.#aliases.clear();
  }

  get size() {
    return this.#tools.size;
  }
}

export const ToolRegistry = new Registry(TOOL_DEFINITIONS);

// 기존 workspace-engine.js 같은 일반 script 호환용
if (typeof window !== "undefined") {
  window.ToolRegistry = ToolRegistry;
}

export { TOOL_DEFINITIONS };
export default ToolRegistry;
