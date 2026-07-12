import { makeZipFromBlobs } from '../image-platform/core/ZipBuilder.js';
import { UploadManager } from '../upload/UploadManager.js';
import { decodePng, encodeBmp, encodeGif, encodeIco, encodePam, encodePbm, encodePgm, encodePpm, encodeXbm, encodeTga, encodeTiff, encodePcx, encodeCur, encodeAvif, encodeDds, encodePsd, makePdf } from './encoders.js';

const fmt = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;
const base = n => n.replace(/\.[^.]+$/, '');
const fileKey = file => `${file.name}:${file.size}:${file.lastModified}`;
const save = (blob, name) => {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
const readDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});
const safeStem = value => String(value || 'image').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_가-힣-]+/g, '_').replace(/^_+|_+$/g, '') || 'image';
const safeFileName = value => String(value || 'file').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim() || 'file';
const wrapText = (value, length) => {
  const width = Number(length || 0);
  if (!width || width < 8) return value;
  const lines = [];
  for (let index = 0; index < value.length; index += width) lines.push(value.slice(index, index + width));
  return lines.join('\n');
};
const copyText = async value => {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const area = document.createElement('textarea'); area.value = value; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
};
const isPng = file => file && (file.type === 'image/png' || file.name?.toLowerCase().endsWith('.png'));

export async function mountPngSpecialTool(def) {
  document.title = `${def.title} | Converter Mall`;
  document.body.innerHTML = buildPage(def);

  const $ = id => document.getElementById(id);
  const input = $('input');
  const drop = $('drop');
  let files = [];
  let results = [];
  const estimateCache = new Map();
  let estimateRun = 0;
  let currentStep = 'upload';
  let dragIndex = -1;

  renderOptions();
  bindEvents();
  setStep('upload');
  await restoreSavedFiles();

  async function restoreSavedFiles() {
    try {
      const saved = Array.from(await UploadManager.get() || []).filter(isPng);
      if (!saved.length) return;
      files = dedupe(saved);
      render();
      scheduleEstimate();
      setStep('settings');
      $('message').textContent = `메인 작업공간에서 저장된 PNG ${files.length}개를 자동으로 불러왔습니다.`;
      $('transferNotice').hidden = false;
      $('transferNotice').textContent = `연결된 작업공간에서 PNG ${files.length}개 자동 불러오기 완료`;
    } catch (error) {
      console.warn('PNG special tool restore failed:', error);
    }
  }

  function bindEvents() {
    $('pick').onclick = event => {
      event.stopPropagation();
      input.click();
    };
    drop.onclick = event => {
      if (event.target.closest('button')) return;
      input.click();
    };
    drop.onkeydown = event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        input.click();
      }
    };
    input.onchange = async () => {
      await add([...input.files]);
      input.value = '';
    };
    drop.ondragover = event => {
      event.preventDefault();
      drop.classList.add('drag');
    };
    drop.ondragleave = () => drop.classList.remove('drag');
    drop.ondrop = async event => {
      event.preventDefault();
      drop.classList.remove('drag');
      await add([...event.dataTransfer.files]);
    };
    $('clear').onclick = reset;
    $('convert').onclick = convertAll;
    $('downloadAll').onclick = downloadZip;
    $('selectMore').onclick = () => input.click();
    $('homeLink').onclick = () => { window.location.href = '../../index.html'; };
  }

  async function add(incoming) {
    const png = incoming.filter(isPng);
    if (!png.length) {
      showMessage('PNG 파일만 추가할 수 있습니다.', true);
      return;
    }
    files = dedupe([...files, ...png]);
    try { await UploadManager.set(files); } catch (error) { console.warn('PNG special tool persist failed:', error); }
    render();
    scheduleEstimate();
    setStep('settings');
    showMessage(`${png.length}개 PNG 파일을 추가했습니다.`);
  }

  function dedupe(items) {
    const map = new Map();
    for (const file of items) if (isPng(file)) map.set(fileKey(file), file);
    return [...map.values()];
  }

  function render() {
    const visible = files.length > 0;
    ['statsPanel', 'optionPanel', 'filesPanel', 'actionPanel'].forEach(id => $(id).classList.toggle('hidden', !visible));
    $('emptyHint').hidden = visible;
    $('count').textContent = `${files.length}개`;
    $('size').textContent = fmt(files.reduce((sum, file) => sum + file.size, 0));
    $('files').innerHTML = '';

    files.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const card = document.createElement('article');
      card.className = 'file-card';
      if (def.mode === 'pdf') card.draggable = true;
      card.innerHTML = `
        ${def.mode === 'pdf' ? `<div class="pdf-order-badge">${index + 1}</div>` : ''}
        <div class="thumb-wrap"><img src="${url}" alt="${escapeHtml(file.name)} 미리보기"></div>
        <div class="file-meta">
          <strong title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</strong>
          <span>${fmt(file.size)}</span>
          <span>${def.mode === 'pdf' ? `PDF 배치 ${index + 1}번` : 'PNG 원본'}</span>
        </div>
        ${def.mode === 'pdf' ? `<div class="pdf-order-actions"><button type="button" data-move="up" aria-label="앞으로 이동">←</button><button type="button" data-move="down" aria-label="뒤로 이동">→</button></div>` : ''}
        <button type="button" class="remove-btn" aria-label="${escapeHtml(file.name)} 삭제">삭제</button>`;

      if (def.mode === 'pdf') {
        card.querySelector('[data-move="up"]').onclick = () => movePdfItem(index, index - 1);
        card.querySelector('[data-move="down"]').onclick = () => movePdfItem(index, index + 1);
        card.addEventListener('dragstart', () => { dragIndex = index; card.classList.add('dragging'); });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
        card.addEventListener('dragover', event => event.preventDefault());
        card.addEventListener('drop', event => { event.preventDefault(); movePdfItem(dragIndex, index); dragIndex = -1; });
      }
      card.querySelector('.remove-btn').onclick = async () => {
        const [removed] = files.splice(index, 1);
        if (removed) estimateCache.clear();
        try { await UploadManager.set(files); } catch (error) { console.warn(error); }
        render();
        scheduleEstimate();
        if (!files.length) setStep('upload');
      };
      card.querySelector('img').onload = () => URL.revokeObjectURL(url);
      card.querySelector('img').onerror = () => URL.revokeObjectURL(url);
      $('files').append(card);
    });
  }

  async function movePdfItem(from, to) {
    if (to < 0 || to >= files.length || from < 0 || from === to) return;
    const [item] = files.splice(from, 1); files.splice(to, 0, item);
    try { await UploadManager.set(files); } catch (error) { console.warn(error); }
    render(); scheduleEstimate();
  }

  function renderOptions() {
    const options = $('options');
    options.innerHTML = '';
    if (!(def.options || []).length) {
      options.innerHTML = '<div class="no-options">이 도구는 별도 설정 없이 최적값으로 처리합니다.</div>';
      return;
    }
    for (const option of def.options || []) {
      const field = document.createElement('div');
      field.className = 'field';
      if (option.showWhen) field.dataset.showWhen = JSON.stringify(option.showWhen);
      if (option.type === 'select') {
        field.innerHTML = `<label for="${option.id}">${option.label}</label><select id="${option.id}">${option.values.map(value => `<option value="${value.value}" ${String(value.value) === String(option.value ?? '') ? 'selected' : ''}>${value.label}</option>`).join('')}</select>${option.help ? `<small class="field-help">${escapeHtml(option.help)}</small>` : ''}`;
      } else if (option.type === 'multicheck') {
        field.classList.add('field-wide');
        const defaults = new Set((option.value || []).map(String));
        field.innerHTML = `<span class="field-label">${option.label}</span><div id="${option.id}" class="check-grid">${option.values.map(value => `<label><input type="checkbox" value="${value.value}" ${defaults.has(String(value.value)) ? 'checked' : ''}><span>${value.label}</span></label>`).join('')}</div>${option.help ? `<small class="field-help">${escapeHtml(option.help)}</small>` : ''}`;
      } else {
        const attrs = `${option.min != null ? ` min="${option.min}"` : ''}${option.max != null ? ` max="${option.max}"` : ''}${option.step != null ? ` step="${option.step}"` : ''}${option.placeholder ? ` placeholder="${escapeHtml(option.placeholder)}"` : ''}`;
        field.innerHTML = `<label for="${option.id}">${option.label}</label><input id="${option.id}" type="${option.type || 'number'}" value="${option.value ?? ''}"${attrs}>${option.help ? `<small class="field-help">${escapeHtml(option.help)}</small>` : ''}`;
      }
      options.append(field);
      field.querySelectorAll('input, select').forEach(control => control.addEventListener('change', () => {
        updateConditionalOptions();
        estimateCache.clear();
        scheduleEstimate();
      }));
    }
    updateConditionalOptions();
  }

  function updateConditionalOptions() {
    const current = settings();
    document.querySelectorAll('[data-show-when]').forEach(node => {
      const rule = JSON.parse(node.dataset.showWhen);
      let visible = true;
      if (Object.prototype.hasOwnProperty.call(rule, 'equals')) visible = String(current[rule.id]) === String(rule.equals);
      else if (Object.prototype.hasOwnProperty.call(rule, 'notEquals')) visible = String(current[rule.id]) !== String(rule.notEquals);
      else if (Array.isArray(rule.in)) visible = rule.in.map(String).includes(String(current[rule.id]));
      node.classList.toggle('hidden', !visible);
    });
  }

  function settings() {
    const value = {};
    for (const option of def.options || []) {
      if (option.type === 'multicheck') {
        value[option.id] = [...document.querySelectorAll(`#${option.id} input:checked`)].map(input => Number(input.value) || input.value);
      } else {
        value[option.id] = $(option.id)?.value;
      }
    }
    return value;
  }

  async function convertAll() {
    if (!files.length) return;
    results = [];
    $('resultPanel').classList.remove('hidden');
    $('results').innerHTML = '';
    $('convert').disabled = true;
    $('status').textContent = '처리중';
    $('message').className = 'note';
    setStep('convert');
    const selectedSettings = settings();

    try {
      if (def.mode === 'pdf') {
        const blob = await makePdf(files, {
          ...selectedSettings,
          margin: Number(selectedSettings.margin || 24),
          gap: Number(selectedSettings.gap || 12),
          quality: Number(selectedSettings.quality || 90) / 100,
          imagesPerPage: Number(selectedSettings.imagesPerPage || 2),
          targetPages: Number(selectedSettings.targetPages || 1)
        });
        results = [{ name: 'converter-mall-images.pdf', blob }];
        updateProgress(files.length, files.length);
      } else if (def.mode === 'html') {
        const html = await makeHtml(files, selectedSettings);
        const htmlName = `${safeFileName(selectedSettings.fileName || 'converter-mall-gallery').replace(/\.html?$/i, '')}.html`;
        results = [{ name: htmlName, blob: new Blob([html], { type: 'text/html;charset=utf-8' }), text: html }];
        updateProgress(files.length, files.length);
      } else if (def.mode === 'zip-original') {
        const entries = buildZipEntries(files, selectedSettings);
        const zip = await makeZipFromBlobs(entries, updateProgress);
        const zipName = `${safeFileName(selectedSettings.zipName || 'converter-mall-png').replace(/\.zip$/i, '')}.zip`;
        results = [{ name: zipName, blob: zip }];
      } else if (def.mode === 'base64' && selectedSettings.outputMode === 'combined') {
        const combined = await makeCombinedBase64(files, selectedSettings);
        results = [combined];
        updateProgress(files.length, files.length);
      } else {
        for (let index = 0; index < files.length; index++) {
          results.push(await convertOne(files[index], selectedSettings));
          updateProgress(index + 1, files.length);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      renderResults();
      $('status').textContent = '완료';
      $('message').textContent = `${results.length}개 결과 생성이 완료되었습니다.`;
      $('downloadAll').disabled = false;
      $('outSize').textContent = fmt(results.reduce((sum, result) => sum + result.blob.size, 0));
      setStep('download');
    } catch (error) {
      $('status').textContent = '오류';
      showMessage(error.message || String(error), true);
      setStep('settings');
    } finally {
      $('convert').disabled = false;
    }
  }

  async function convertOne(file, selectedSettings) {
    const key = cacheKey(file, selectedSettings);
    if (['bmp', 'gif', 'ico', 'pnm', 'ppm', 'pgm', 'pbm', 'pam', 'xbm', 'tga', 'tiff', 'pcx', 'cur', 'avif', 'dds', 'psd'].includes(def.mode) && estimateCache.has(key)) return estimateCache.get(key);
    let result;
    if (def.mode === 'bmp') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.bmp`, blob: encodeBmp(decoded.imageData, selectedSettings) };
    } else if (def.mode === 'gif') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.gif`, blob: encodeGif(decoded.imageData, selectedSettings) };
    } else if (def.mode === 'ico') {
      result = { name: `${base(file.name)}.ico`, blob: await encodeIco(file, selectedSettings) };
    } else if (def.mode === 'pnm') {
      const decoded = await decodePng(file);
      const pnmType = selectedSettings.pnmType || 'ppm';
      const encoder = pnmType === 'pbm' ? encodePbm : pnmType === 'pgm' ? encodePgm : null;
      const blob = encoder ? encoder(decoded.imageData, selectedSettings) : encodePpm(decoded.imageData, 'pnm', selectedSettings);
      result = { name: `${base(file.name)}.pnm`, blob };
    } else if (def.mode === 'ppm') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.ppm`, blob: encodePpm(decoded.imageData, 'ppm', selectedSettings) };
    } else if (def.mode === 'pgm') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.pgm`, blob: encodePgm(decoded.imageData, selectedSettings) };
    } else if (def.mode === 'pbm') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.pbm`, blob: encodePbm(decoded.imageData, selectedSettings) };
    } else if (def.mode === 'pam') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.pam`, blob: encodePam(decoded.imageData, selectedSettings) };
    } else if (def.mode === 'xbm') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.xbm`, blob: encodeXbm(decoded.imageData, base(file.name), selectedSettings) };
    } else if (def.mode === 'tga') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.tga`, blob: encodeTga(decoded.imageData, selectedSettings) };
    } else if (def.mode === 'tiff') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.tiff`, blob: encodeTiff(decoded.imageData, selectedSettings) };
    } else if (def.mode === 'pcx') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.pcx`, blob: encodePcx(decoded.imageData, selectedSettings) };
    } else if (def.mode === 'cur') {
      result = { name: `${base(file.name)}.cur`, blob: await encodeCur(file, selectedSettings) };
    } else if (def.mode === 'avif') {
      result = { name: `${base(file.name)}.avif`, blob: await encodeAvif(file, selectedSettings) };
    } else if (def.mode === 'dds') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.dds`, blob: encodeDds(decoded.imageData, selectedSettings) };
    } else if (def.mode === 'psd') {
      const decoded = await decodePng(file);
      result = { name: `${base(file.name)}.psd`, blob: encodePsd(decoded.imageData, selectedSettings) };
    } else if (def.mode === 'base64') {
      result = await makeBase64Result(file, selectedSettings);
    } else {
      throw new Error('지원되지 않는 변환 모드입니다.');
    }
    if (['bmp', 'gif', 'ico', 'pnm', 'ppm', 'pgm', 'pbm', 'pam', 'xbm', 'tga', 'tiff', 'pcx', 'cur', 'avif', 'dds', 'psd'].includes(def.mode)) estimateCache.set(key, result);
    return result;
  }

  async function makeBase64Result(file, selectedSettings) {
    const dataUrl = await readDataUrl(file);
    const payload = dataUrl.split(',')[1] || '';
    const style = selectedSettings.codeStyle || 'data-url';
    const lineLength = Number(selectedSettings.lineLength || 0);
    const variable = safeStem(selectedSettings.variablePrefix ? `${selectedSettings.variablePrefix}_${base(file.name)}` : base(file.name)).replace(/^[^a-zA-Z_$]/, '_');
    const raw = selectedSettings.alphabet === 'url-safe' ? payload.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') : payload;
    let text = dataUrl;
    let extension = 'txt';
    if (style === 'raw') text = wrapText(raw, lineLength);
    else if (style === 'css') { extension = 'css'; text = `.${variable} {\n  background-image: url("${dataUrl}");\n  background-repeat: no-repeat;\n}`; }
    else if (style === 'js') { extension = 'js'; text = `const ${variable} = ${JSON.stringify(dataUrl)};\nexport default ${variable};`; }
    else if (style === 'json') { extension = 'json'; text = JSON.stringify({ name: file.name, mimeType: 'image/png', bytes: file.size, dataUrl }, null, selectedSettings.prettyJson === 'no' ? 0 : 2); }
    else if (lineLength) text = `data:image/png;base64,${wrapText(payload, lineLength)}`;
    const name = `${safeFileName(base(file.name))}.${extension}`;
    return { name, blob: new Blob([text], { type: `${extension === 'json' ? 'application/json' : 'text/plain'};charset=utf-8` }), text };
  }

  async function makeCombinedBase64(items, selectedSettings) {
    const style = selectedSettings.codeStyle || 'json';
    const rows = [];
    for (const file of items) {
      const dataUrl = await readDataUrl(file);
      rows.push({ name: file.name, mimeType: 'image/png', bytes: file.size, dataUrl });
    }
    let text;
    let extension;
    if (style === 'js') {
      extension = 'js';
      text = `const pngAssets = ${JSON.stringify(rows, null, 2)};\nexport default pngAssets;`;
    } else if (style === 'css') {
      extension = 'css';
      text = rows.map(row => `.${safeStem(base(row.name))} { background-image: url("${row.dataUrl}"); }`).join('\n\n');
    } else if (style === 'raw' || style === 'data-url') {
      extension = 'txt';
      text = rows.map(row => {
        const payload = row.dataUrl.split(',')[1] || '';
        const raw = selectedSettings.alphabet === 'url-safe' ? payload.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') : payload;
        const value = style === 'raw' ? wrapText(raw, selectedSettings.lineLength) : row.dataUrl;
        return `# ${row.name}\n${value}`;
      }).join('\n\n');
    } else {
      extension = 'json';
      text = JSON.stringify(rows, null, selectedSettings.prettyJson === 'no' ? 0 : 2);
    }
    const stem = safeFileName(selectedSettings.combinedName || 'png-base64-assets').replace(/\.(json|js|css)$/i, '');
    return { name: `${stem}.${extension}`, blob: new Blob([text], { type: 'text/plain;charset=utf-8' }), text };
  }

  async function makeHtml(items, selectedSettings = {}) {
    const cards = [];
    const captionMode = selectedSettings.caption || 'filename';
    const lazy = selectedSettings.lazy === 'yes' ? ' loading="lazy" decoding="async"' : '';
    const download = selectedSettings.downloadLinks === 'yes';
    const showInfo = selectedSettings.fileInfo === 'yes';
    for (const file of items) {
      const url = await readDataUrl(file);
      const caption = captionMode === 'none' ? '' : `<figcaption>${escapeHtml(file.name)}${showInfo ? `<small>${fmt(file.size)}</small>` : ''}</figcaption>`;
      const linkStart = download ? `<a href="${url}" download="${escapeHtml(file.name)}" title="${escapeHtml(file.name)} 다운로드">` : '';
      const linkEnd = download ? '</a>' : '';
      cards.push(`<figure>${linkStart}<img src="${url}" alt="${escapeHtml(base(file.name))}"${lazy}>${linkEnd}${caption}</figure>`);
    }
    const title = escapeHtml(selectedSettings.pageTitle || 'PNG 이미지 갤러리');
    const background = /^#[0-9a-f]{6}$/i.test(selectedSettings.background || '') ? selectedSettings.background : '#f5f7fb';
    const cardBackground = /^#[0-9a-f]{6}$/i.test(selectedSettings.cardBackground || '') ? selectedSettings.cardBackground : '#ffffff';
    const columns = Math.min(6, Math.max(1, Number(selectedSettings.columns || 3)));
    const fit = ['contain','cover'].includes(selectedSettings.imageFit) ? selectedSettings.imageFit : 'contain';
    const layout = selectedSettings.layout === 'list' ? 'list' : 'grid';
    const maxWidth = Math.min(1800, Math.max(480, Number(selectedSettings.maxWidth || 1200)));
    const gridCss = layout === 'list' ? 'grid-template-columns:1fr' : `grid-template-columns:repeat(${columns},minmax(0,1fr))`;
    return `<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${title}</title>\n<style>\n*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Noto Sans KR",sans-serif;background:${background};color:#172033}header{max-width:${maxWidth}px;margin:auto;padding:28px 18px 8px}h1{margin:0;font-size:clamp(26px,5vw,44px)}main{max-width:${maxWidth}px;margin:auto;padding:20px 18px 48px;display:grid;${gridCss};gap:18px}figure{margin:0;padding:14px;background:${cardBackground};border-radius:16px;box-shadow:0 8px 28px #00000012;overflow:hidden}figure a{display:block}img{width:100%;height:${layout === 'list' ? 'auto' : '260px'};object-fit:${fit};display:block;border-radius:10px}figcaption{margin-top:11px;font-weight:700;word-break:break-all}figcaption small{display:block;margin-top:4px;font-weight:400;color:#64748b}@media(max-width:760px){main{grid-template-columns:1fr 1fr}img{height:200px}}@media(max-width:480px){main{grid-template-columns:1fr}img{height:auto}}\n</style>\n</head>\n<body>\n<header><h1>${title}</h1></header>\n<main>${cards.join('')}</main>\n</body>\n</html>`;
  }

  function buildZipEntries(items, selectedSettings = {}) {
    const folderMode = selectedSettings.folderMode || 'flat';
    const customFolder = safeFileName(selectedSettings.customFolder || 'images').replace(/^\.+|\.+$/g, '') || 'images';
    const prefix = folderMode === 'folder' ? `${customFolder}/` : folderMode === 'dated' ? `png-${new Date().toISOString().slice(0,10)}/` : '';
    const renameMode = selectedSettings.renameMode || 'original';
    const start = Math.max(0, Number(selectedSettings.startNumber || 1));
    const digits = Math.min(6, Math.max(1, Number(selectedSettings.digits || 3)));
    const seen = new Map();
    const entries = items.map((file, index) => {
      let filename = renameMode === 'sequence' ? `${safeFileName(selectedSettings.filePrefix || 'image')}-${String(start + index).padStart(digits, '0')}.png` : safeFileName(file.name);
      const key = filename.toLowerCase();
      const count = seen.get(key) || 0;
      seen.set(key, count + 1);
      if (count) filename = `${base(filename)}-${count + 1}.png`;
      return { name: `${prefix}${filename}`, blob: file };
    });
    if (selectedSettings.manifest === 'yes') {
      const manifest = { createdAt: new Date().toISOString(), fileCount: items.length, totalBytes: items.reduce((sum, file) => sum + file.size, 0), files: entries.map((entry, index) => ({ path: entry.name, originalName: items[index].name, bytes: items[index].size, mimeType: items[index].type || 'image/png' })) };
      entries.push({ name: `${prefix}manifest.json`, blob: new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }) });
    }
    if (selectedSettings.readme === 'yes') {
      const readme = `Converter Mall PNG ZIP package\nFiles: ${items.length}\nCreated: ${new Date().toISOString()}\nThe PNG files are stored without image recompression.\n`;
      entries.push({ name: `${prefix}README.txt`, blob: new Blob([readme], { type: 'text/plain;charset=utf-8' }) });
    }
    return entries;
  }

  function renderResults() {
    $('results').innerHTML = '';
    results.forEach(result => {
      const row = document.createElement('div');
      row.className = 'result-row';
      row.innerHTML = `<div><strong>${escapeHtml(result.name)}</strong><br><small>${fmt(result.blob.size)}</small></div><div class="result-actions">${result.text != null ? '<button class="secondary" data-copy>복사</button>' : ''}<button class="primary" data-download>다운로드</button></div>`;
      row.querySelector('[data-download]').onclick = () => save(result.blob, result.name);
      row.querySelector('[data-copy]')?.addEventListener('click', async event => { await copyText(result.text); event.currentTarget.textContent = '복사됨'; setTimeout(() => event.currentTarget.textContent = '복사', 1400); });
      $('results').append(row);
    });
  }

  async function downloadZip() {
    if (!results.length) return;
    if (results.length === 1 && def.singleDirect !== false) {
      save(results[0].blob, results[0].name);
      return;
    }
    $('downloadAll').disabled = true;
    showMessage('ZIP 파일을 생성하고 있습니다.');
    try {
      const zip = await makeZipFromBlobs(results, updateProgress);
      save(zip, `${def.id}-results.zip`);
      showMessage('ZIP 다운로드를 시작했습니다.');
    } finally {
      $('downloadAll').disabled = false;
    }
  }

  function updateProgress(done, total) {
    const percent = Math.round(done / Math.max(1, total) * 100);
    $('bar').style.width = `${percent}%`;
    $('bar').parentElement.setAttribute('aria-valuenow', String(percent));
  }

  function cacheKey(file, selectedSettings = settings()) { return `${def.mode}:${fileKey(file)}:${JSON.stringify(selectedSettings)}`; }

  function scheduleEstimate() {
    const run = ++estimateRun;
    if (!files.length) {
      $('outSize').textContent = '-';
      return;
    }
    if (['base64', 'html', 'zip-original'].includes(def.mode)) {
      const original = files.reduce((sum, file) => sum + file.size, 0);
      const approximate = def.mode === 'base64' ? Math.ceil(original * 4 / 3) + files.length * 160 : def.mode === 'html' ? Math.ceil(original * 4 / 3) + files.length * 520 + 2400 : original + files.length * 140 + 256;
      $('outSize').textContent = `약 ${fmt(approximate)}`;
      $('status').textContent = '대기';
      return;
    }
    if (!['bmp', 'gif', 'ico', 'pnm', 'ppm', 'pgm', 'pbm', 'pam', 'xbm', 'tga', 'tiff', 'pcx', 'cur', 'avif', 'dds', 'psd'].includes(def.mode)) {
      $('outSize').textContent = '변환 후 계산';
      return;
    }
    $('outSize').textContent = '계산중...';
    $('status').textContent = '예상 계산중';
    setTimeout(async () => {
      try {
        const generated = [];
        for (const file of files) {
          if (run !== estimateRun) return;
          generated.push(await convertOne(file, settings()));
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        if (run !== estimateRun) return;
        $('outSize').textContent = fmt(generated.reduce((sum, result) => sum + result.blob.size, 0));
        $('status').textContent = '대기';
      } catch (error) {
        if (run !== estimateRun) return;
        $('outSize').textContent = '계산 실패';
        $('status').textContent = '대기';
      }
    }, 30);
  }

  async function reset() {
    files = [];
    results = [];
    estimateRun++;
    estimateCache.clear();
    input.value = '';
    try { await UploadManager.clear(); } catch (error) { console.warn(error); }
    $('resultPanel').classList.add('hidden');
    $('results').innerHTML = '';
    $('bar').style.width = '0';
    $('outSize').textContent = '-';
    $('status').textContent = '대기';
    $('message').className = 'note';
    $('downloadAll').disabled = true;
    $('transferNotice').hidden = true;
    render();
    setStep('upload');
    showMessage('작업을 초기화했습니다.');
  }

  function setStep(step) {
    currentStep = step;
    const order = ['upload', 'settings', 'convert', 'download'];
    const currentIndex = order.indexOf(step);
    document.querySelectorAll('[data-step]').forEach(item => {
      const index = order.indexOf(item.dataset.step);
      item.classList.toggle('active', index === currentIndex);
      item.classList.toggle('done', index < currentIndex);
    });
    $('workflowText').textContent = {
      upload: 'PNG 파일을 선택하거나 메인 작업공간에서 전달하세요.',
      settings: '파일과 변환 설정을 확인하세요.',
      convert: `${def.title} 작업을 처리하고 결과를 검증합니다.`,
      download: '완료된 결과를 개별 또는 ZIP으로 다운로드하세요.'
    }[currentStep];
  }

  function showMessage(message, error = false) {
    $('message').className = `note${error ? ' error' : ''}`;
    $('message').textContent = message;
  }
}


const SPECIAL_TOOL_PROFILES = Object.freeze({
  pdf: { purpose: '여러 PNG를 문서 페이지로 구성하는 작업입니다.', differences: ['이미지 순서가 PDF 페이지 순서에 반영됩니다.', '용지 크기·방향·여백에 따라 배치 결과가 달라집니다.'], recommendations: ['페이지 구성 미리보기 확인', '긴 이미지는 잘림 여부 확인', '인쇄용은 충분한 원본 해상도 사용'], warnings: ['투명 영역은 PDF 배경과 합성될 수 있습니다.'], pro: '페이지별 직접 배치, 머리글·번호, 인쇄 프리셋' },
  tiff: { purpose: '인쇄·스캔·장기 보관에 적합한 고품질 래스터 형식입니다.', differences: ['RGB·회색조와 알파 유지 여부를 선택할 수 있습니다.', '무압축 또는 PackBits 압축과 DPI 정보를 저장합니다.'], recommendations: ['일반 인쇄 300 DPI', '보관은 원본 픽셀 유지', '대용량 결과 예상치 확인'], warnings: ['DPI를 높여도 원본 픽셀 자체가 늘어나는 것은 아닙니다.'], pro: 'CMYK, ICC 프로파일, 16비트, 다중 페이지 TIFF' },
  dds: { purpose: '게임 엔진과 3D 파이프라인에서 사용하는 텍스처 컨테이너입니다.', differences: ['현재 BGRA8 무압축 텍스처로 생성됩니다.', '알파 채널을 유지합니다.'], recommendations: ['2의 거듭제곱 자동 보정 선택', '밉맵 생성 여부 확인', '게임 엔진에서 실제 임포트 테스트'], warnings: ['밉맵은 지원하지만 BC/DXT 압축은 아직 포함되지 않습니다.'], pro: 'BC1~BC7 압축, sRGB/Linear, Unity·Unreal 프리셋' },
  psd: { purpose: 'Photoshop 계열 편집 프로그램에서 열 수 있는 평면 PSD를 생성합니다.', differences: ['현재 단일 합성 이미지이며 원본 레이어는 생성되지 않습니다.', 'RGB·회색조, 알파 포함 여부, RAW·RLE 압축을 선택합니다.'], recommendations: ['편집 전 원본 PNG 보관', '대형 캔버스 메모리 확인'], warnings: ['레이어·텍스트·스마트 오브젝트는 포함되지 않습니다.'], pro: '레이어 분리, 텍스트 레이어, 스마트 오브젝트, 작업 프리셋' },
  ico: { purpose: 'Windows 앱·바로가기·웹 파비콘용 다중 크기 아이콘을 만듭니다.', differences: ['선택한 여러 해상도를 한 ICO 파일에 함께 저장합니다.', '원본 비율·여백·보간 방식이 작은 아이콘의 선명도에 직접 영향을 줍니다.'], recommendations: ['파비콘은 16·32·48px', 'Windows 앱은 256px 포함', '픽셀아트는 픽셀 보간 사용'], warnings: ['작은 크기에서는 글자와 복잡한 세부 요소가 뭉개질 수 있습니다.', '투명도를 평탄화하면 선택한 배경색이 영구 적용됩니다.'], pro: '플랫폼별 자동 세트, 크기별 선명화, 브랜드 프리셋' },
  cur: { purpose: 'Windows 마우스 커서와 클릭 기준점(핫스팟)을 함께 저장합니다.', differences: ['각 크기마다 비율로 계산된 핫스팟 좌표가 CUR 디렉터리에 기록됩니다.', '원본 비율·여백·보간 방식과 클릭 기준점을 함께 설계해야 합니다.'], recommendations: ['화살표 끝은 좌상단', '조준점은 가운데', '사용자 지정은 백분율로 지정'], warnings: ['잘못된 핫스팟은 실제 클릭 위치 오차를 만듭니다.', '운영체제 배율별 크기를 포함한 뒤 Windows에서 직접 테스트하세요.'], pro: '크기별 개별 핫스팟, ANI 애니메이션 커서, 커서 테마 세트' },
  gif: { purpose: '호환성이 높은 정지 GIF 이미지를 생성합니다.', differences: ['색상 수가 제한되어 그라데이션 품질이 낮아질 수 있습니다.', '현재 애니메이션 생성 도구가 아닙니다.'], recommendations: ['단순 그래픽·아이콘에 사용', '사진은 JPG/WEBP 권장'], warnings: ['애니메이션 GIF 제작은 별도 도구가 필요합니다.'], pro: '애니메이션 프레임, 지연 시간, 디더링' },
  avif: { purpose: '웹 전송과 사진 보관을 위한 고효율 차세대 이미지 출력입니다.', differences: ['품질·투명도·크기 제한을 함께 조절할 수 있습니다.', '브라우저가 실제 AVIF 인코딩을 지원해야 하며 미지원 시 가짜 파일을 만들지 않습니다.'], recommendations: ['사진은 품질 55~75부터 비교', '투명 로고는 알파 유지와 투명 여백 제거 사용', '대형 이미지는 최대 긴 변을 제한해 메모리 절약'], warnings: ['브라우저 Canvas AVIF 인코더는 HDR·10/12비트·세부 코덱 옵션을 직접 제어하지 못합니다.', '품질 100도 무손실을 보장하지 않습니다.'], pro: 'WASM 무손실, 속도·품질 세부 제어, HDR·고비트 심도' },
  bmp: { purpose: '구형 Windows·산업 프로그램과의 호환성을 위한 비압축 비트맵입니다.', differences: ['압축이 거의 없어 파일 크기가 큽니다.', '픽셀 데이터 호환성이 단순합니다.'], recommendations: ['레거시 프로그램 요구 시 사용', '대량 변환 전 용량 확인'], warnings: ['웹 배포용으로는 PNG/WEBP가 더 적합합니다.'], pro: '비트 깊이, 팔레트, 헤더 변형 선택' },
  tga: { purpose: '게임·3D·영상 파이프라인에서 사용하는 알파 지원 래스터 형식입니다.', differences: ['32비트 BGRA와 투명도를 보존합니다.', '일반 웹 브라우저 표시용 형식은 아닙니다.'], recommendations: ['게임 툴에서 임포트 검사', '알파 경계 확인'], warnings: ['결과 파일은 브라우저에서 바로 미리보기 어려울 수 있습니다.'], pro: 'RLE 압축, 원점 방향, 채널 옵션' },
  pcx: { purpose: '레거시 출판·그래픽 소프트웨어 호환을 위한 형식입니다.', differences: ['24비트 3-plane과 PCX RLE을 사용합니다.', '현대 웹용으로는 적합하지 않습니다.'], recommendations: ['대상 프로그램 요구 사양 확인', 'DPI 정보 선택'], warnings: ['프로그램별 PCX 지원 범위가 다릅니다.'], pro: '팔레트·비트 깊이·레거시 호환 프리셋' },
  ppm: { purpose: '개발·연구에서 RGB 픽셀 데이터를 직접 다루는 Netpbm 형식입니다.', differences: ['P6 바이너리와 P3 ASCII를 선택할 수 있습니다.', '최대 색상값을 낮춰 테스트용 양자화를 적용할 수 있습니다.'], recommendations: ['실사용은 P6·MAXVAL 255', '소스 확인은 P3 ASCII'], warnings: ['투명도는 배경색과 합성되며 일반 뷰어 지원이 제한적입니다.'], pro: '16비트 샘플, 색공간 변환, 배치 파이프라인' },
  pnm: { purpose: 'PPM·PGM·PBM 중 목적에 맞는 Netpbm 하위 형식을 선택해 저장합니다.', differences: ['컬러·회색조·1비트 흑백을 한 화면에서 선택합니다.', 'ASCII와 바이너리 구조가 실제 파일 헤더에 반영됩니다.'], recommendations: ['대상 프로그램이 요구하는 P1~P6 형식 확인', '일반 사용은 바이너리 권장'], warnings: ['PNM 확장자만으로 내부 색상 모델이 드러나지 않을 수 있습니다.'], pro: '자동 하위 형식 판별, 16비트, 파이프라인 검증' },
  pgm: { purpose: '과학·비전 처리용 그레이스케일 Netpbm 형식입니다.', differences: ['P5 바이너리와 P2 ASCII를 선택합니다.', '최대 회색값을 조절해 단계 수를 제한할 수 있습니다.'], recommendations: ['분석 파이프라인은 P5·255', '값 확인은 P2 ASCII'], warnings: ['변환 후 원본 색상은 복원할 수 없습니다.'], pro: '16비트, 감마, 히스토그램 정규화' },
  pbm: { purpose: '1비트 흑백 마스크·문서 처리용 Netpbm 형식입니다.', differences: ['P4 바이너리와 P1 ASCII를 지원합니다.', '임계값·디더링·비트 반전을 실제 이진화에 적용합니다.'], recommendations: ['문서·마스크는 디더링 없음', '사진 계조 표현은 Floyd–Steinberg'], warnings: ['회색과 색상 정보는 제거됩니다.'], pro: '적응형 임계값, 노이즈 제거, 문서 자동 보정' },
  pam: { purpose: '컬러·회색조·알파 채널 구조를 명시하는 Netpbm 확장 형식입니다.', differences: ['RGB_ALPHA·RGB·GRAYSCALE_ALPHA·GRAYSCALE을 선택합니다.', '선택한 DEPTH·TUPLTYPE·MAXVAL이 헤더에 기록됩니다.'], recommendations: ['투명도 보존은 RGB_ALPHA', '분석용 단일 채널은 GRAYSCALE'], warnings: ['일반 이미지 뷰어 지원이 제한적입니다.'], pro: '16비트 채널, 사용자 채널 맵, 다중 프레임' },
  xbm: { purpose: 'C/C++ 소스와 X11 자원에 삽입 가능한 1비트 비트맵 코드를 생성합니다.', differences: ['임계값·디더링·비트 반전을 지원합니다.', '심볼명·const 선언·한 줄 바이트 수·헤더 가드를 제어합니다.'], recommendations: ['작은 UI 아이콘은 디더링 없이 사용', '프로젝트 명명 규칙에 맞는 심볼 지정'], warnings: ['컬러와 다단계 투명도는 표현할 수 없습니다.'], pro: '핫스팟, C 헤더 묶음, 임베디드 플랫폼 프리셋' },
  base64: { purpose: 'PNG 바이너리를 Data URL·순수 Base64·CSS·JavaScript·JSON 코드로 변환합니다.', differences: ['개별 파일 또는 여러 파일 묶음 결과를 선택합니다.', 'URL-safe 알파벳과 줄바꿈 규칙을 개발 환경에 맞게 지정할 수 있습니다.', '결과를 바로 복사하거나 코드 파일로 다운로드합니다.'], recommendations: ['작은 아이콘·임베디드 자산에 사용', '웹 삽입은 Data URL 또는 CSS', 'API 데이터는 JSON'], warnings: ['Base64는 원본보다 보통 약 33% 커집니다.', '큰 이미지를 코드에 직접 넣으면 로딩·캐시 효율이 낮아집니다.'], pro: '프레임워크 컴포넌트, 해시·무결성 정보, 번들 최적화' },
  html: { purpose: 'PNG를 문서 내부에 포함한 독립 실행형 반응형 HTML 갤러리를 생성합니다.', differences: ['격자·목록 배치, 열 수, 이미지 맞춤, 캡션과 색상을 설정합니다.', '지연 로딩과 이미지 다운로드 링크를 선택할 수 있습니다.', '외부 이미지 파일 없이 HTML 하나로 열립니다.'], recommendations: ['오프라인 검수·간단한 포트폴리오 공유', '이미지가 많으면 지연 로딩 사용', '카드 채우기는 잘림 여부 확인'], warnings: ['Base64 포함으로 HTML 용량이 원본 합계보다 커집니다.', '민감한 이미지를 포함한 HTML 공유에 주의하세요.'], pro: '브랜드 템플릿, 검색·필터, 슬라이드쇼, 접근성 감사' },
  'zip-original': { purpose: '여러 PNG 원본을 다시 인코딩하지 않고 업무 규칙에 맞춰 ZIP으로 패키징합니다.', differences: ['평면·사용자 폴더·날짜 폴더 구조를 선택합니다.', '원본 파일명 또는 연속 번호 규칙을 적용합니다.', 'manifest.json과 README를 선택적으로 포함합니다.'], recommendations: ['납품·검수에는 manifest 포함', '자동 처리에는 연속 번호 사용', '압축 전 중복 파일명 확인'], warnings: ['PNG 자체는 이미 압축되어 있어 ZIP으로 용량이 크게 줄지 않을 수 있습니다.', '이 기능은 이미지 변환이 아니라 원본 패키징입니다.'], pro: '분할 ZIP, 암호화, 체크섬, 폴더 템플릿' }
});

function specialProfile(def) {
  return SPECIAL_TOOL_PROFILES[def.mode] || { purpose: def.description, differences: ['출력 형식의 특성에 맞춰 변환합니다.'], recommendations: ['변환 전 옵션과 결과 용량을 확인하세요.'], warnings: ['중요한 원본은 별도로 보관하세요.'], pro: '고급 일괄 처리와 전문 설정' };
}
function profileList(items = []) { return items.map(item => `<li>${escapeHtml(item)}</li>`).join(''); }
function buildSpecialProfile(def) {
  const p = specialProfile(def);
  return `<section class="panel special-profile"><div class="special-profile-head"><div><span class="eyebrow">FORMAT SPECIALIST</span><h2>${escapeHtml(def.title)} 전용 설계</h2></div><span class="special-badge">형식 최적화</span></div><p class="special-purpose">${escapeHtml(p.purpose)}</p><div class="special-profile-grid"><article><h3>형식 특징</h3><ul>${profileList(p.differences)}</ul></article><article><h3>권장 사용법</h3><ul>${profileList(p.recommendations)}</ul></article><article class="special-warning"><h3>주의사항</h3><ul>${profileList(p.warnings)}</ul></article><article class="special-pro"><h3>PRO 확장</h3><p>${escapeHtml(p.pro)}</p></article></div></section>`;
}

function buildPage(def) {
  return `
  <a class="skip-link" href="#mainContent">본문으로 바로가기</a>
  <header class="hero">
    <div class="wrap hero-grid">
      <div>
        <button id="homeLink" class="back-link" type="button">← Converter Mall</button>
        <div class="title-line"><h1>${escapeHtml(def.title)} 전문가 도구</h1><span class="turbo">⚡ TURBO</span></div>
        <p>${escapeHtml(def.description)}</p>
        <div class="hero-badges"><span>브라우저 내부 처리</span><span>서버 업로드 없음</span><span>다중 파일 지원</span></div>
      </div>
      <div class="hero-actions" aria-hidden="true"><div>🔒 로컬 처리</div><div>⚡ 빠른 변환</div><div>✅ 결과 검증</div><div>🧹 메모리 보호</div></div>
    </div>
  </header>
  <main id="mainContent" class="main"><div class="wrap">
    <section class="workflow panel compact-panel" aria-label="작업 단계">
      <div class="steps">
        <div class="step active" data-step="upload"><b>1</b><span>파일 선택</span></div>
        <div class="step" data-step="settings"><b>2</b><span>설정 확인</span></div>
        <div class="step" data-step="convert"><b>3</b><span>변환·검증</span></div>
        <div class="step" data-step="download"><b>4</b><span>다운로드</span></div>
      </div>
      <p id="workflowText">PNG 파일을 선택하거나 메인 작업공간에서 전달하세요.</p>
    </section>

    ${buildSpecialProfile(def)}

    <section class="panel upload-panel">
      <div id="drop" class="drop" tabindex="0" role="button" aria-label="PNG 파일 선택">
        <div class="upload-icon">${def.icon || '🖼️'}</div>
        <h2>PNG 파일 업로드</h2>
        <p>파일을 드래그하거나 <button id="pick" class="inline-pick" type="button">파일 선택</button>을 눌러 업로드하세요.</p>
        <p class="support">지원 형식: PNG · 여러 장 가능 · 브라우저 내부 처리</p>
        <div id="transferNotice" class="transfer-notice" hidden></div>
        <div class="trust-grid">
          <div><b>🔒 로컬 처리</b><span>이미지가 외부 서버로 전송되지 않습니다.</span></div>
          <div><b>⚡ 적응형 처리</b><span>기기 성능에 맞게 안전하게 처리합니다.</span></div>
          <div><b>✅ 결과 검증</b><span>생성 결과를 확인한 뒤 다운로드합니다.</span></div>
          <div><b>🧹 메모리 보호</b><span>임시 데이터를 안전하게 정리합니다.</span></div>
        </div>
        <input id="input" type="file" accept="image/png,.png" multiple hidden>
      </div>
      <p id="emptyHint" class="empty-hint">메인페이지에서 선택한 PNG가 있으면 이 화면에서 자동으로 불러옵니다.</p>
    </section>

    <section id="statsPanel" class="panel hidden"><div class="grid stats-grid">
      <div class="stat"><span>파일 수</span><strong id="count">0개</strong></div>
      <div class="stat"><span>원본 총 용량</span><strong id="size">0 B</strong></div>
      <div class="stat"><span>예상·결과 용량</span><strong id="outSize">-</strong></div>
      <div class="stat"><span>변환 상태</span><strong id="status">대기</strong></div>
    </div></section>

    <section id="optionPanel" class="panel hidden"><div class="section-head"><div><span class="eyebrow">SETTINGS</span><h2>변환 설정</h2></div><button id="selectMore" class="secondary" type="button">파일 추가</button></div><div id="options" class="options"></div></section>
    <section id="filesPanel" class="panel hidden"><div class="section-head"><div><span class="eyebrow">PREVIEW</span><h2>미리보기</h2></div><span class="section-note">선택한 PNG 파일을 확인하세요.</span></div><div id="files" class="files"></div></section>
    <section id="actionPanel" class="panel hidden"><div class="actions"><button id="convert" class="primary">${escapeHtml(def.button || '변환 시작')}</button><button id="downloadAll" class="secondary" disabled>전체 ZIP 다운로드</button><button id="clear" class="danger">전체 초기화</button></div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="bar"></i></div><p id="message" class="note">변환 준비가 완료되었습니다.</p></section>
    <section id="resultPanel" class="panel hidden"><div class="section-head"><div><span class="eyebrow">RESULT</span><h2>변환 결과</h2></div></div><div id="results" class="result"></div></section>
  </div></main>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
