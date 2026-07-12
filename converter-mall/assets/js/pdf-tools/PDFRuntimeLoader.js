(() => {
  const SCRIPT_TIMEOUT = 15000;
  const sources = {
    pdfLib: [
      '../../assets/vendor/pdf-lib.min.js',
      'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'
    ],
    pdfJs: [
      '../../assets/vendor/pdf.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'
    ]
  };
  const workerSources = [
    '../../assets/vendor/pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
  ];

  function ensureStatus() {
    let box = document.getElementById('pdfRuntimeStatus');
    if (box) return box;
    box = document.createElement('main');
    box.id = 'pdfRuntimeStatus';
    box.style.cssText = 'max-width:760px;margin:64px auto;padding:28px;border:1px solid #dbe3ef;border-radius:18px;background:#fff;box-shadow:0 12px 35px rgba(15,23,42,.08);font-family:system-ui,sans-serif;line-height:1.65;color:#172033';
    box.innerHTML = '<h1 style="margin:0 0 10px;font-size:24px">PDF 작업 엔진 준비 중</h1><p id="pdfRuntimeMessage" style="margin:0;color:#5a6678">필요한 PDF 라이브러리를 확인하고 있습니다.</p>';
    document.body.appendChild(box);
    return box;
  }

  function setMessage(text, error = false) {
    const box = ensureStatus();
    const p = box.querySelector('#pdfRuntimeMessage');
    if (p) { p.textContent = text; p.style.color = error ? '#b42318' : '#5a6678'; }
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      let done = false;
      const finish = (ok, value) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (!ok) s.remove();
        ok ? resolve(value) : reject(value);
      };
      const timer = setTimeout(() => finish(false, new Error(`시간 초과: ${url}`)), SCRIPT_TIMEOUT);
      s.src = url;
      s.async = true;
      s.onload = () => finish(true, url);
      s.onerror = () => finish(false, new Error(`불러오기 실패: ${url}`));
      document.head.appendChild(s);
    });
  }

  async function loadFirst(urls, ready, label) {
    if (ready()) return 'already-loaded';
    const errors = [];
    for (const url of urls) {
      try {
        setMessage(`${label}을 불러오는 중입니다.`);
        await loadScript(url);
        if (ready()) return url;
        errors.push(`${url}: 전역 객체 없음`);
      } catch (e) { errors.push(String(e.message || e)); }
    }
    throw new Error(`${label}을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.\n${errors.join('\n')}`);
  }

  async function start({ mount }) {
    ensureStatus();
    try {
      const pdfLibSource = await loadFirst(sources.pdfLib, () => Boolean(window.PDFLib?.PDFDocument), 'PDF 편집 엔진');
      const pdfJsSource = await loadFirst(sources.pdfJs, () => Boolean(window.pdfjsLib?.getDocument), 'PDF 분석·렌더링 엔진');
      if (window.pdfjsLib?.GlobalWorkerOptions) {
        const localPdfJs = String(pdfJsSource).includes('/assets/vendor/');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = localPdfJs ? workerSources[0] : (String(pdfJsSource).includes('jsdelivr') ? workerSources[2] : workerSources[1]);
      }
      const status = document.getElementById('pdfRuntimeStatus');
      if (status) status.remove();
      await mount();
    } catch (error) {
      console.error('[PDFRuntimeLoader]', error);
      const box = ensureStatus();
      box.innerHTML = `<h1 style="margin:0 0 10px;font-size:24px;color:#b42318">PDF 엔진을 시작하지 못했습니다</h1>
        <p style="white-space:pre-wrap;color:#5a6678">${String(error.message || error).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><button type="button" onclick="location.reload()" style="border:0;border-radius:10px;padding:11px 16px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer">다시 시도</button><a href="../../pdf-tools/" style="border:1px solid #cbd5e1;border-radius:10px;padding:10px 16px;color:#172033;text-decoration:none;font-weight:700">PDF 도구 목록</a></div>
        <p style="margin-top:18px;font-size:13px;color:#64748b">파일은 업로드되지 않았습니다. 이 오류는 라이브러리 로딩 단계에서 발생했습니다.</p>`;
    }
  }

  window.PDFRuntimeLoader = { start };
})();
