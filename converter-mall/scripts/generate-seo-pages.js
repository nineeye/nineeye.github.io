#!/usr/bin/env node
/**
 * scripts/generate-seo-pages.js
 * ------------------------------------------------------------------
 * 해시 라우팅(#/id) SPA만으로는 검색엔진이 각 변환기를 개별 페이지로
 * 색인하기 어렵다. 이 스크립트는 plugins/registry.json을 읽어
 * /tools/<id>/index.html 정적 페이지를 생성한다. 각 페이지는:
 *   - 실제 크롤링 가능한 h1/설명/FAQ 텍스트 (2,000자 내외 목표)
 *   - Schema.org SoftwareApplication + FAQPage 구조화 데이터
 *   - og/twitter/canonical 메타 태그
 *   - 로드 시 window.__CM_DIRECT_TOOL_ID 를 지정해 SPA가 해당 도구를
 *     바로 마운트하도록 함 (실제 변환 UI는 동일한 app.js가 그린다)
 * 새 변환기를 plugins/registry.json에 추가한 뒤 이 스크립트를 다시
 * 실행하면 새 SEO 페이지와 sitemap.xml이 자동 갱신된다.
 *
 * 실행: node scripts/generate-seo-pages.js
 * ------------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE_ORIGIN = 'https://example.com'; // 실제 배포 도메인으로 교체하세요

const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/registry.json'), 'utf-8'));
const manifests = registry.plugins.map(id =>
  JSON.parse(fs.readFileSync(path.join(ROOT, `plugins/${id}/manifest.json`), 'utf-8'))
);

const CATEGORY_LABEL = { pdf: 'PDF', image: '이미지', data: '데이터', text: '텍스트' };

function genericFaq(m) {
  return [
    { q: '이 도구는 무료인가요?', a: '네, 별도 설치나 회원가입 없이 무료로 사용할 수 있습니다.' },
    { q: '파일이 서버로 업로드되나요?', a: '아니요. 모든 처리는 사용자의 브라우저 안에서만 이루어지며 파일은 외부로 전송되지 않습니다.' },
    { q: `최대 몇 MB까지 변환할 수 있나요?`, a: `현재 버전은 브라우저 메모리 보호를 위해 파일당 최대 ${m.maxSizeMB}MB까지 지원합니다.` },
  ];
}

function buildSummary(m) {
  const name = m.name.ko;
  const desc = m.description.ko;
  return `${name} 변환기는 ${desc} 별도의 프로그램 설치나 회원가입 없이, 이 페이지에서 파일을 선택하는 즉시 브라우저 안에서 변환이 완료됩니다. 변환된 파일은 서버를 거치지 않고 사용자의 기기에서만 처리되므로, 계약서나 신분증처럼 민감한 문서를 다룰 때도 안심하고 사용할 수 있습니다. 사용법은 간단합니다: 왼쪽 영역에서 파일을 끌어다 놓거나 클릭해 선택하고, 필요한 옵션을 조정한 뒤 변환 버튼을 누르면 결과 미리보기와 다운로드 버튼이 오른쪽에 나타납니다.`;
}

function faqLdJson(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function pageHtml(m) {
  const url = `${SITE_ORIGIN}/tools/${m.id}/`;
  const faq = (m.seo?.ko?.faq && m.seo.ko.faq.length ? m.seo.ko.faq : []).concat(genericFaq(m));
  const summary = m.seo?.ko?.summary || buildSummary(m);
  const h1 = m.seo?.ko?.h1 || `${m.name.ko} 무료 온라인 변환`;

  const appLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: m.name.ko,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (Web Browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
    description: m.description.ko,
  };

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${h1} · 변환기 종합 백화점</title>
<meta name="description" content="${m.description.ko}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${h1}" />
<meta property="og:description" content="${m.description.ko}" />
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary" />
<script type="application/ld+json">${JSON.stringify(appLd)}</script>
<script type="application/ld+json">${JSON.stringify(faqLdJson(faq))}</script>
<link rel="stylesheet" href="../../css/styles.css" />
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <header class="cm-header">
    <div class="cm-header-inner">
      <a href="../../index.html" class="cm-logo">🏬 변환기 종합 백화점</a>
      <div class="cm-search-wrap">
        <input id="cm-search-input" type="search" class="cm-search-input" placeholder="변환기 검색..." aria-label="변환기 검색" />
      </div>
      <button id="cm-theme-toggle" class="cm-theme-toggle" aria-label="다크모드 전환">🌓</button>
    </div>
  </header>

  <div id="app" class="cm-app-root">
    <!-- 크롤러용 정적 콘텐츠: JS 실행 여부와 무관하게 아래 텍스트가 즉시 노출됨 -->
    <noscript>
      <h1>${h1}</h1>
      <p>${summary}</p>
    </noscript>
  </div>

  <section class="cm-static-seo cm-app-root" aria-hidden="false">
    <h1>${h1}</h1>
    <p>${summary}</p>
    <div class="cm-faq">
      ${faq.map(f => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('\n      ')}
    </div>
    <p><a href="../../index.html">← 전체 변환기 목록으로 돌아가기</a></p>
  </section>

  <footer class="cm-footer">
    <p id="cm-privacy-notice" class="cm-privacy-notice"></p>
    <p class="cm-footer-sub">© 2026 변환기 종합 백화점 · 모든 변환은 로컬(브라우저)에서 처리됩니다.</p>
  </footer>

  <script>window.__CM_DIRECT_TOOL_ID = ${JSON.stringify(m.id)};</script>
  <script type="module" src="../../js/app.js"></script>
</body>
</html>
`;
}

function main() {
  const toolsDir = path.join(ROOT, 'tools');
  fs.rmSync(toolsDir, { recursive: true, force: true });

  const urls = [`${SITE_ORIGIN}/`];

  manifests.forEach(m => {
    const dir = path.join(toolsDir, m.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), pageHtml(m), 'utf-8');
    urls.push(`${SITE_ORIGIN}/tools/${m.id}/`);
    console.log(`generated tools/${m.id}/index.html`);
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf-8');
  console.log(`generated sitemap.xml with ${urls.length} URLs`);
}

main();
