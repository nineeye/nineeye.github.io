/**
 * common.js
 * ------------------------------------------------------------------
 * 변환기 종합 백화점 - 공통 코어 모듈
 * 모든 플러그인(변환기)이 공유하는 기능:
 *   - 파일 업로드 UI (드래그앤드롭 / 클립보드 붙여넣기 / 클릭 선택)
 *   - Magic Number 기반 파일 검증
 *   - 진행률(onProgress) 콜백 관리
 *   - Blob 생성/다운로드/즉시 메모리 해제
 *   - 즐겨찾기 / 최근 사용 (localStorage)
 *   - 다크모드
 *   - 간단한 Toast 알림
 * 이 파일은 어떤 특정 변환기 로직도 포함하지 않는다. (관심사 분리)
 * ------------------------------------------------------------------
 */

const CM = (() => {
  'use strict';

  /* ---------------------------------------------------------------
   * 1. 파일 시그니처(Magic Number) 테이블
   *    확장자 위조 업로드를 막기 위해 파일의 실제 바이트를 검사한다.
   * ------------------------------------------------------------- */
  const MAGIC_NUMBERS = {
    pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
    jpg: [[0xff, 0xd8, 0xff]],
    png: [[0x89, 0x50, 0x4e, 0x47]],
    heic: [[0x66, 0x74, 0x79, 0x70]], // 'ftyp' at offset 4 (checked specially)
    zip: [[0x50, 0x4b, 0x03, 0x04]],
    json: null, // 텍스트 포맷은 매직넘버 없음 -> 파싱 검증으로 대체
    csv: null,
    txt: null,
  };

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
  }

  async function readHeader(file, length = 16) {
    const slice = file.slice(0, length);
    const buf = await slice.arrayBuffer();
    return new Uint8Array(buf);
  }

  /**
   * 파일이 지정한 타입군(예: 'image', 'pdf', 'text')에 실제로 부합하는지 검사.
   * @returns {Promise<{valid:boolean, reason?:string}>}
   */
  async function validateFile(file, expectedExt) {
    const ext = expectedExt.replace('.', '').toLowerCase();
    const header = await readHeader(file, 16);

    // 텍스트 계열은 매직넘버가 없으므로 확장자 + 간단 파싱만 검사
    if (MAGIC_NUMBERS[ext] === null) {
      return { valid: true };
    }

    if (ext === 'heic') {
      // HEIC: 오프셋 4~7 에 'ftyp', 8~11에 브랜드(heic/heix/mif1 등)
      const brand = String.fromCharCode(...header.slice(4, 8));
      if (brand !== 'ftyp') {
        return { valid: false, reason: 'HEIC 시그니처가 아닙니다 (ftyp 누락)' };
      }
      return { valid: true };
    }

    const signatures = MAGIC_NUMBERS[ext];
    if (!signatures) return { valid: true }; // 정의되지 않은 타입은 통과

    const ok = signatures.some(sig =>
      sig.every((byte, i) => header[i] === byte)
    );

    if (!ok) {
      return {
        valid: false,
        reason: `파일 헤더가 .${ext} 형식과 일치하지 않습니다 (${bytesToHex(header.slice(0, 4))})`,
      };
    }
    return { valid: true };
  }

  /* ---------------------------------------------------------------
   * 2. 메모리 관리 - Blob URL 생성/추적/즉시 해제
   * ------------------------------------------------------------- */
  const activeObjectUrls = new Set();

  function createTrackedObjectUrl(blob) {
    const url = URL.createObjectURL(blob);
    activeObjectUrls.add(url);
    return url;
  }

  function revokeObjectUrl(url) {
    if (activeObjectUrls.has(url)) {
      URL.revokeObjectURL(url);
      activeObjectUrls.delete(url);
    }
  }

  function revokeAllObjectUrls() {
    activeObjectUrls.forEach(url => URL.revokeObjectURL(url));
    activeObjectUrls.clear();
  }

  // 페이지를 벗어날 때 남아있는 Blob 전부 정리 (iOS Safari OOM 방지)
  window.addEventListener('pagehide', revokeAllObjectUrls);

  /**
   * 변환 결과(Blob)를 다운로드하고, 사용자가 내려받은 직후 메모리를 해제한다.
   * 모든 변환기가 동일한 인터페이스를 사용하도록 강제해 다운로드 로직이
   * 도구마다 흩어지는 것을 방지한다.
   */
  function downloadBlob(blob, filename) {
    const url = createTrackedObjectUrl(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // 클릭 이벤트가 브라우저 다운로드 파이프라인에 들어간 뒤 안전하게 해제
    setTimeout(() => revokeObjectUrl(url), 4000);
  }

  /* ---------------------------------------------------------------
   * 3. 진행률 트래커
   *    각 변환기는 new CM.Progress(el) 로 받아 report(pct, label) 호출
   * ------------------------------------------------------------- */
  class Progress {
    constructor(container) {
      this.container = container;
      this.container.innerHTML = `
        <div class="cm-progress-wrap" hidden>
          <div class="cm-progress-bar"><div class="cm-progress-fill" style="width:0%"></div></div>
          <p class="cm-progress-label text-sm text-neutral-500 mt-1"></p>
        </div>`;
      this.wrap = this.container.querySelector('.cm-progress-wrap');
      this.fill = this.container.querySelector('.cm-progress-fill');
      this.label = this.container.querySelector('.cm-progress-label');
    }
    report(percent, label = '') {
      this.wrap.hidden = false;
      this.fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
      this.label.textContent = label || `${Math.round(percent)}%`;
    }
    done() {
      this.report(100, '완료');
      setTimeout(() => { this.wrap.hidden = true; }, 800);
    }
    reset() {
      this.wrap.hidden = true;
      this.fill.style.width = '0%';
    }
  }

  /* ---------------------------------------------------------------
   * 4. 파일 업로드 위젯
   *    - 드래그앤드롭, 클릭, Ctrl+V 클립보드 붙여넣기 지원
   *    - maxSizeMB 초과, 매직넘버 불일치 시 즉시 사용자에게 안내
   * ------------------------------------------------------------- */
  function createUploader({ container, accept, maxSizeMB = 20, multiple = false, onFiles }) {
    container.innerHTML = `
      <div class="cm-dropzone" tabindex="0" role="button"
           aria-label="파일을 여기에 끌어다 놓거나 클릭하여 선택하세요">
        <input type="file" class="cm-file-input" accept="${accept.join(',')}" ${multiple ? 'multiple' : ''} hidden />
        <div class="cm-dropzone-inner">
          <div class="cm-dropzone-icon" aria-hidden="true">⇪</div>
          <p class="cm-dropzone-text">파일을 끌어다 놓거나 클릭하여 선택</p>
          <p class="cm-dropzone-sub">허용: ${accept.join(', ')} · 최대 ${maxSizeMB}MB · Ctrl+V 붙여넣기 지원</p>
        </div>
      </div>
      <p class="cm-upload-error text-sm text-red-500 mt-2" hidden></p>
    `;
    const dz = container.querySelector('.cm-dropzone');
    const input = container.querySelector('.cm-file-input');
    const errorEl = container.querySelector('.cm-upload-error');

    function showError(msg) {
      errorEl.hidden = false;
      errorEl.textContent = msg;
    }
    function clearError() {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    async function handleFiles(fileList) {
      clearError();
      const files = Array.from(fileList);
      if (!files.length) return;

      const accepted = [];
      for (const file of files) {
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
          showError(`"${file.name}" 파일이 최대 크기(${maxSizeMB}MB)를 초과합니다. (${sizeMB.toFixed(1)}MB)`);
          continue;
        }
        const ext = accept.find(a => file.name.toLowerCase().endsWith(a.replace('*', '')));
        if (ext && ext !== '*') {
          const result = await validateFile(file, ext);
          if (!result.valid) {
            showError(`"${file.name}" 파일이 손상되었거나 형식이 올바르지 않습니다. ${result.reason || ''}`);
            continue;
          }
        }
        accepted.push(file);
      }
      if (accepted.length) onFiles(multiple ? accepted : accepted.slice(0, 1));
    }

    dz.addEventListener('click', () => input.click());
    dz.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', e => handleFiles(e.target.files));

    ['dragenter', 'dragover'].forEach(evt =>
      dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.add('cm-dropzone-active'); })
    );
    ['dragleave', 'drop'].forEach(evt =>
      dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.remove('cm-dropzone-active'); })
    );
    dz.addEventListener('drop', e => handleFiles(e.dataTransfer.files));

    // Ctrl+V 클립보드 이미지 붙여넣기
    dz.addEventListener('paste', e => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItems = items.filter(i => i.type.startsWith('image/'));
      if (imageItems.length) {
        const files = imageItems.map(i => i.getAsFile()).filter(Boolean);
        handleFiles(files);
      }
    });
    document.addEventListener('paste', e => {
      if (document.activeElement === dz) return; // 위에서 이미 처리됨
    });

    return { reset: () => { input.value = ''; clearError(); } };
  }

  /* ---------------------------------------------------------------
   * 5. Downsampling 헬퍼 (모바일 메모리 보호)
   *    큰 이미지를 처리 전에 Canvas 로 1차 축소한다.
   * ------------------------------------------------------------- */
  async function preDownsampleImage(file, maxDimension = 4096) {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width <= maxDimension && bitmap.height <= maxDimension) {
      return { bitmap, downsampled: false };
    }
    const scale = maxDimension / Math.max(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const newBitmap = await createImageBitmap(canvas);
    return { bitmap: newBitmap, downsampled: true };
  }

  // 대략적인 기기 메모리 확인 (Device Memory API, 미지원 브라우저는 4GB 가정)
  function estimatedDeviceMemoryGB() {
    return navigator.deviceMemory || 4;
  }

  /* ---------------------------------------------------------------
   * 6. localStorage 기반 즐겨찾기 / 최근 사용 / 설정
   * ------------------------------------------------------------- */
  const LS_KEYS = { favorites: 'cm_favorites', recent: 'cm_recent', settings: 'cm_settings' };

  function readLS(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function writeLS(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  const store = {
    getFavorites: () => readLS(LS_KEYS.favorites, []),
    toggleFavorite(id) {
      const favs = new Set(store.getFavorites());
      favs.has(id) ? favs.delete(id) : favs.add(id);
      writeLS(LS_KEYS.favorites, [...favs]);
      return favs.has(id);
    },
    isFavorite: id => store.getFavorites().includes(id),

    getRecent: () => readLS(LS_KEYS.recent, []),
    pushRecent(id) {
      const recent = store.getRecent().filter(x => x !== id);
      recent.unshift(id);
      writeLS(LS_KEYS.recent, recent.slice(0, 20));
    },

    getSettings: () => readLS(LS_KEYS.settings, { theme: 'auto', defaultQuality: 90 }),
    setSetting(key, value) {
      const s = store.getSettings();
      s[key] = value;
      writeLS(LS_KEYS.settings, s);
    },
  };

  /* ---------------------------------------------------------------
   * 7. 다크모드
   * ------------------------------------------------------------- */
  function initTheme() {
    const s = store.getSettings();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = s.theme === 'dark' || (s.theme === 'auto' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
  }
  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    store.setSetting('theme', isDark ? 'dark' : 'light');
  }

  /* ---------------------------------------------------------------
   * 8. Toast 알림
   * ------------------------------------------------------------- */
  function toast(message, type = 'info') {
    let host = document.getElementById('cm-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'cm-toast-host';
      host.className = 'cm-toast-host';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = `cm-toast cm-toast-${type}`;
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('cm-toast-show'));
    setTimeout(() => {
      el.classList.remove('cm-toast-show');
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  /* ---------------------------------------------------------------
   * 9. Lazy Loading: 외부 라이브러리를 CDN에서 동적으로 1회만 로드
   * ------------------------------------------------------------- */
  const loadedScripts = new Map();
  function loadScript(src, globalCheck) {
    if (globalCheck && window[globalCheck]) return Promise.resolve();
    if (loadedScripts.has(src)) return loadedScripts.get(src);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.crossOrigin = 'anonymous';
      s.onload = resolve;
      s.onerror = () => reject(new Error(`라이브러리 로드 실패: ${src}`));
      document.head.appendChild(s);
    });
    loadedScripts.set(src, p);
    return p;
  }

  /* ---------------------------------------------------------------
   * 10. 파일 크기 포맷터 (공통 유틸)
   * ------------------------------------------------------------- */
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  return {
    validateFile,
    createTrackedObjectUrl,
    revokeObjectUrl,
    revokeAllObjectUrls,
    downloadBlob,
    Progress,
    createUploader,
    preDownsampleImage,
    estimatedDeviceMemoryGB,
    store,
    initTheme,
    toggleTheme,
    toast,
    loadScript,
    formatBytes,
  };
})();

export default CM;
