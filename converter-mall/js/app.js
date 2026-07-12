import CM from './common.js';
import i18n from './i18n.js';

/**
 * app.js
 * ------------------------------------------------------------------
 * - plugins/registry.json 을 읽어 각 플러그인의 manifest.json을 가져온다
 *   (아직 실제 변환 코드는 로드하지 않음 → 홈 화면은 가볍게 뜬다)
 * - 해시 라우팅(#/id)으로 도구 페이지 이동. 도구 페이지 진입 시에만
 *   해당 플러그인의 index.js를 dynamic import (Lazy Loading)
 * - 검색 / 카테고리 / 즐겨찾기 / 최근 사용 렌더링
 * ------------------------------------------------------------------
 */

CM.initTheme();

// 이 스크립트(js/app.js)의 실제 위치를 기준으로 사이트 루트를 계산한다.
// 이렇게 하면 정적 SEO 페이지가 /tools/<id>/index.html 처럼 어느 깊이에
// 있든, 그리고 GitHub Pages의 프로젝트 하위 경로(/repo-name/)에 배포되든
// registry/manifest/plugin 경로가 항상 올바르게 풀린다.
const SITE_ROOT = new URL('../', import.meta.url);
function siteUrl(relativePath) {
  return new URL(relativePath.replace(/^\.\//, ''), SITE_ROOT).href;
}

const state = { manifests: [], currentPluginModule: null };

const els = {
  app: document.getElementById('app'),
  search: document.getElementById('cm-search-input'),
  themeToggle: document.getElementById('cm-theme-toggle'),
  privacyNotice: document.getElementById('cm-privacy-notice'),
};

if (els.privacyNotice) els.privacyNotice.textContent = i18n.t('privacy.notice');
if (els.search) els.search.placeholder = i18n.t('search.placeholder');
els.themeToggle?.addEventListener('click', CM.toggleTheme);

async function loadRegistry() {
  const reg = await fetch(siteUrl('./plugins/registry.json')).then(r => r.json());
  const manifests = await Promise.all(
    reg.plugins.map(id => fetch(siteUrl(`./plugins/${id}/manifest.json`)).then(r => r.json()))
  );
  state.manifests = manifests;
  return manifests;
}

function categoryLabel(cat) {
  return { pdf: 'PDF', image: '이미지', data: '데이터', text: '텍스트' }[cat] || cat;
}

function renderCard(m) {
  const isFav = CM.store.isFavorite(m.id);
  return `
    <a href="#/${m.id}" class="cm-card" data-id="${m.id}">
      <button class="cm-fav-btn ${isFav ? 'cm-fav-active' : ''}" data-fav="${m.id}" aria-label="즐겨찾기">${isFav ? '★' : '☆'}</button>
      <div class="cm-card-icon" aria-hidden="true">${m.icon}</div>
      <h3 class="cm-card-title">${i18n.pick(m.name)}</h3>
      <p class="cm-card-desc">${i18n.pick(m.description)}</p>
      <span class="cm-card-tag">${categoryLabel(m.category)}</span>
    </a>`;
}

function renderHome() {
  const manifests = state.manifests;
  const favorites = CM.store.getFavorites();
  const recent = CM.store.getRecent();

  const favMs = favorites.map(id => manifests.find(m => m.id === id)).filter(Boolean);
  const recentMs = recent.map(id => manifests.find(m => m.id === id)).filter(Boolean);

  const categories = [...new Set(manifests.map(m => m.category))];

  els.app.innerHTML = `
    <section class="cm-hero">
      <h1>${i18n.t('app.title')}</h1>
      <p>${i18n.t('app.tagline')}</p>
    </section>

    <section class="cm-section" data-section="favorites">
      <h2>⭐ ${i18n.t('nav.favorites')}</h2>
      <div class="cm-grid" data-grid="favorites">
        ${favMs.length ? favMs.map(renderCard).join('') : `<p class="cm-empty">${i18n.t('state.empty.favorites')}</p>`}
      </div>
    </section>

    <section class="cm-section" data-section="recent">
      <h2>🕘 ${i18n.t('nav.recent')}</h2>
      <div class="cm-grid" data-grid="recent">
        ${recentMs.length ? recentMs.map(renderCard).join('') : `<p class="cm-empty">${i18n.t('state.empty.recent')}</p>`}
      </div>
    </section>

    ${categories.map(cat => `
      <section class="cm-section" data-section="cat-${cat}">
        <h2>${categoryLabel(cat)}</h2>
        <div class="cm-grid" data-grid="cat-${cat}">
          ${manifests.filter(m => m.category === cat).map(renderCard).join('')}
        </div>
      </section>
    `).join('')}
  `;

  bindCardEvents();
}

function bindCardEvents() {
  els.app.querySelectorAll('[data-fav]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.fav;
      const nowFav = CM.store.toggleFavorite(id);
      btn.textContent = nowFav ? '★' : '☆';
      btn.classList.toggle('cm-fav-active', nowFav);
      // 즐겨찾기 섹션은 즉시 다시 그림
      const favGrid = els.app.querySelector('[data-grid="favorites"]');
      const favMs = CM.store.getFavorites().map(fid => state.manifests.find(m => m.id === fid)).filter(Boolean);
      favGrid.innerHTML = favMs.length ? favMs.map(renderCard).join('') : `<p class="cm-empty">${i18n.t('state.empty.favorites')}</p>`;
      bindCardEvents();
    });
  });
}

function renderSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return renderHome();
  const results = state.manifests.filter(m => {
    const hay = [i18n.pick(m.name), i18n.pick(m.description), m.category, ...(m.keywords || [])]
      .join(' ').toLowerCase();
    return hay.includes(q);
  });
  els.app.innerHTML = `
    <section class="cm-section">
      <h2>🔍 "${escapeHtml(query)}" 검색 결과 (${results.length})</h2>
      <div class="cm-grid">
        ${results.length ? results.map(renderCard).join('') : `<p class="cm-empty">${i18n.t('state.empty.search')}</p>`}
      </div>
    </section>`;
  bindCardEvents();
}

async function renderTool(id) {
  const manifest = state.manifests.find(m => m.id === id);
  if (!manifest) { els.app.innerHTML = `<p class="cm-empty">도구를 찾을 수 없습니다.</p>`; return; }

  document.title = `${i18n.pick(manifest.name)} · ${i18n.t('app.title')}`;

  els.app.innerHTML = `
    <a href="#/" class="cm-back-link">← ${i18n.t('nav.allTools')}</a>
    <div class="cm-tool-header">
      <span class="cm-tool-icon">${manifest.icon}</span>
      <div>
        <h1>${i18n.pick(manifest.name)}</h1>
        <p>${i18n.pick(manifest.description)}</p>
      </div>
    </div>
    <div class="cm-tool-layout">
      <aside class="cm-sidebar" aria-label="업로드 및 옵션"></aside>
      <main class="cm-main" aria-label="결과"></main>
    </div>
    ${!window.__CM_DIRECT_TOOL_ID && manifest.seo?.ko ? renderSeoBlock(manifest.seo.ko) : ''}
  `;

  const sidebarEl = els.app.querySelector('.cm-sidebar');
  const mainEl = els.app.querySelector('.cm-main');

  try {
    // Lazy Loading: 사용자가 이 도구를 열었을 때만 실제 변환 로직을 가져온다
    const mod = await import(siteUrl(manifest.entry));
    await mod.default.mount({ sidebarEl, mainEl, CM, i18n, manifest });
  } catch (err) {
    console.error(err);
    mainEl.innerHTML = `<p class="cm-empty">도구를 불러오지 못했습니다: ${err.message}</p>`;
  }
}

function renderSeoBlock(seo) {
  return `
    <section class="cm-seo-block">
      <h2>${seo.h1 || ''}</h2>
      <p>${seo.summary || ''}</p>
      ${seo.faq ? `
        <div class="cm-faq">
          ${seo.faq.map(f => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('')}
        </div>` : ''}
    </section>`;
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

/* ---------------------------------------------------------------
 * 라우터
 * ------------------------------------------------------------- */
function route() {
  // 정적 SEO 랜딩 페이지(/tools/<id>/index.html)는 크롤러가 바로 콘텐츠를
  // 읽을 수 있도록 빌드 시 생성되며, 로드 시 이 전역 변수로 도구를 직접 지정한다.
  if (window.__CM_DIRECT_TOOL_ID) return renderTool(window.__CM_DIRECT_TOOL_ID);
  const hash = location.hash.replace(/^#\/?/, '');
  if (!hash) return renderHome();
  return renderTool(hash);
}

window.addEventListener('hashchange', route);
els.search?.addEventListener('input', e => renderSearch(e.target.value));

(async function init() {
  await loadRegistry();
  route();
})();
