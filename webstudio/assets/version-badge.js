/* AllFileOne WebStudio — visible release badge, no paid API or analytics.
 * On every release update assets/current-release.json (single mutable pointer).
 * Page HTML has an initial visible fallback so JS/CSP failures never show "버전" alone.
 */
'use strict';
(() => {
  const sourceUrl = document.currentScript?.src || '';
  const manifestUrl = new URL('current-release.json', sourceUrl || new URL('assets/', location.href));
  function currentMetaVersion() {
    let largest = 0;
    document.querySelectorAll('meta[name^="webstudio-release"]').forEach(meta => {
      const found = (meta.getAttribute('content') || '').match(/(?:^|-)V([1-9][0-9]{0,3})(?:-|$)/i);
      if (found) largest = Math.max(largest, Number(found[1]));
    });
    return largest;
  }
  function start() {
    const badge = document.getElementById('site-current-version');
    if (!badge) return;
    const initial = /^V([1-9][0-9]{0,3})$/i.exec(badge.textContent.trim());
    let shown = Math.max(currentMetaVersion(), initial ? Number(initial[1]) : 0);
    const paint = (version, origin) => {
      if (!Number.isSafeInteger(version) || version < shown) return;
      shown = version;
      badge.textContent = 'V' + version;
      badge.setAttribute('aria-label', '현재 홈페이지 버전 V' + version);
      badge.title = origin;
    };
    if (shown) paint(shown, '홈페이지 HTML에 포함된 버전 정보');
    if (typeof fetch !== 'function') return;
    fetch(manifestUrl.href, {cache:'no-store',credentials:'same-origin'})
      .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(data => {
        if (data?.product !== 'AllFileOne WebStudio') return;
        const match = /^V([1-9][0-9]{0,3})$/.exec(String(data.version || ''));
        if (!match || !new RegExp('(?:^|-)V' + match[1] + '-').test(String(data.release_id || ''))) return;
        paint(Number(match[1]), '공개 서버 버전 파일 확인: ' + data.release_id);
      })
      .catch(() => {/* Keep truthful HTML fallback if the network or manifest fails. */});
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else start();
})();
