(() => {
  const $ = (s) => document.querySelector(s);
  const state = { pdfLib:false, pdfJs:false, worker:false, source:'unknown' };
  const esc = (v) => String(v ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function badge(ok, yes='정상', no='확인 필요') { return `<span class="diag-badge ${ok?'ok':'warn'}">${ok?yes:no}</span>`; }
  function render() {
    $('#diagPdfLib').innerHTML = `${badge(state.pdfLib)} <strong>pdf-lib</strong><small>${esc(window.PDFLib?.version || '전역 객체 기준 확인')}</small>`;
    $('#diagPdfJs').innerHTML = `${badge(state.pdfJs)} <strong>PDF.js</strong><small>${esc(window.pdfjsLib?.version || '버전 정보 없음')}</small>`;
    $('#diagWorker').innerHTML = `${badge(state.worker)} <strong>PDF.js Worker</strong><small>${esc(window.pdfjsLib?.GlobalWorkerOptions?.workerSrc || '아직 설정되지 않음')}</small>`;
    $('#diagOverall').textContent = state.pdfLib && state.pdfJs && state.worker ? 'PDF 엔진을 사용할 준비가 되었습니다.' : '일부 PDF 엔진을 확인하지 못했습니다.';
    $('#diagOverall').className = state.pdfLib && state.pdfJs && state.worker ? 'diag-overall ok' : 'diag-overall warn';
  }
  async function testRuntime() {
    $('#diagRun').disabled = true; $('#diagRun').textContent = '검사 중...';
    try {
      await window.PDFRuntimeLoader.start({ mount: async () => {
        state.pdfLib = Boolean(window.PDFLib?.PDFDocument);
        state.pdfJs = Boolean(window.pdfjsLib?.getDocument);
        state.worker = Boolean(window.pdfjsLib?.GlobalWorkerOptions?.workerSrc);
        render();
      }});
    } finally { $('#diagRun').disabled = false; $('#diagRun').textContent = '엔진 다시 검사'; }
  }
  document.addEventListener('DOMContentLoaded', () => {
    render();
    $('#diagRun')?.addEventListener('click', testRuntime);
    testRuntime();
  });
})();
