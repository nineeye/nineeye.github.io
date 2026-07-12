export async function decodePng(file){
  const bitmap=await createImageBitmap(file);
  const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);bitmap.close?.();
  return {canvas,ctx,width:canvas.width,height:canvas.height,imageData:ctx.getImageData(0,0,canvas.width,canvas.height)};
}
export function canvasBlob(canvas,type,quality){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('이미지 인코딩 실패')),type,quality))}
export function encodeBmp(imageData, options = {}) {
  const { width, height, data } = imageData;
  const bitDepth = Number(options.bitDepth || 24) === 32 ? 32 : 24;
  const keepAlpha = bitDepth === 32 && options.alphaMode === 'keep';
  const background = hexToRgb(options.background || '#ffffff');
  const topDown = options.origin === 'top';
  const bytesPerPixel = bitDepth / 8;
  const rowSize = Math.ceil(width * bytesPerPixel / 4) * 4;
  const pixelSize = rowSize * height;
  const out = new Uint8Array(54 + pixelSize);
  const v = new DataView(out.buffer);
  out[0] = 0x42; out[1] = 0x4d;
  v.setUint32(2, out.length, true); v.setUint32(10, 54, true);
  v.setUint32(14, 40, true); v.setInt32(18, width, true); v.setInt32(22, topDown ? -height : height, true);
  v.setUint16(26, 1, true); v.setUint16(28, bitDepth, true); v.setUint32(34, pixelSize, true);
  let p = 54;
  for (let row = 0; row < height; row++) {
    const y = topDown ? row : height - 1 - row;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      let r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (!keepAlpha) { [r, g, b] = flattenPixel(r, g, b, a, background); a = 255; }
      out[p++] = b; out[p++] = g; out[p++] = r;
      if (bitDepth === 32) out[p++] = a;
    }
    while ((p - 54) % rowSize) out[p++] = 0;
  }
  return new Blob([out], { type: 'image/bmp' });
}

function lzwEncode(indices,minCodeSize=8){
  const clear=1<<minCodeSize,end=clear+1;let codeSize=minCodeSize+1,next=end+1;let dict=new Map();const bytes=[];let cur=0,bits=0;
  const emit=code=>{cur|=code<<bits;bits+=codeSize;while(bits>=8){bytes.push(cur&255);cur>>=8;bits-=8;}};
  const reset=()=>{dict=new Map();codeSize=minCodeSize+1;next=end+1;};emit(clear);reset();let prefix=indices[0]??0;
  for(let i=1;i<indices.length;i++){const k=indices[i],key=prefix+','+k;if(dict.has(key)){prefix=dict.get(key);}else{emit(prefix);if(next<4096){dict.set(key,next++);if(next===(1<<codeSize)&&codeSize<12)codeSize++;}else{emit(clear);reset();}prefix=k;}}
  emit(prefix);emit(end);if(bits)bytes.push(cur&255);return new Uint8Array(bytes);
}
function buildGifPalette(targetColors, reserveTransparent) {
  const opaqueSlots = Math.max(1, targetColors - (reserveTransparent ? 1 : 0));
  let rLevels = 2, gLevels = 2, bLevels = 2;
  while (rLevels * gLevels * bLevels < opaqueSlots) {
    if (gLevels <= rLevels && gLevels <= bLevels) gLevels++;
    else if (rLevels <= bLevels) rLevels++;
    else bLevels++;
  }
  while (rLevels * gLevels * bLevels > opaqueSlots) {
    if (gLevels >= rLevels && gLevels >= bLevels && gLevels > 2) gLevels--;
    else if (rLevels >= bLevels && rLevels > 2) rLevels--;
    else if (bLevels > 2) bLevels--;
    else break;
  }
  const colors = [];
  if (reserveTransparent) colors.push([0, 0, 0]);
  for (let r = 0; r < rLevels && colors.length < targetColors; r++)
    for (let g = 0; g < gLevels && colors.length < targetColors; g++)
      for (let b = 0; b < bLevels && colors.length < targetColors; b++)
        colors.push([
          Math.round(r * 255 / Math.max(1, rLevels - 1)),
          Math.round(g * 255 / Math.max(1, gLevels - 1)),
          Math.round(b * 255 / Math.max(1, bLevels - 1))
        ]);
  while (colors.length < targetColors) colors.push(colors[colors.length - 1] || [0, 0, 0]);
  return colors;
}
function nearestPaletteIndex(r, g, b, palette, start) {
  let best = start, bestDistance = Infinity;
  for (let i = start; i < palette.length; i++) {
    const c = palette[i], dr = r - c[0], dg = g - c[1], db = b - c[2];
    const distance = dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
    if (distance < bestDistance) { bestDistance = distance; best = i; }
  }
  return best;
}
export function encodeGif(imageData, options = {}) {
  const { width, height, data } = imageData;
  const requested = Math.max(2, Math.min(256, Number(options.colors || 256)));
  const tableSize = 1 << Math.ceil(Math.log2(requested));
  const keepTransparency = options.alphaMode === 'keep';
  const alphaThreshold = Math.max(0, Math.min(255, Number(options.alphaThreshold || 128)));
  const background = hexToRgb(options.background || '#ffffff');
  const paletteColors = buildGifPalette(tableSize, keepTransparency);
  const palette = new Uint8Array(tableSize * 3);
  paletteColors.forEach((c, i) => { palette[i * 3] = c[0]; palette[i * 3 + 1] = c[1]; palette[i * 3 + 2] = c[2]; });
  const idx = new Uint8Array(width * height);
  const dither = options.dither === 'floyd';
  const errorR = new Float32Array((width + 2) * 2), errorG = new Float32Array((width + 2) * 2), errorB = new Float32Array((width + 2) * 2);
  for (let y = 0; y < height; y++) {
    const current = (y & 1) * (width + 2), next = ((y + 1) & 1) * (width + 2);
    errorR.fill(0, next, next + width + 2); errorG.fill(0, next, next + width + 2); errorB.fill(0, next, next + width + 2);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4, a = data[i + 3];
      if (keepTransparency && a < alphaThreshold) { idx[y * width + x] = 0; continue; }
      let r = data[i], g = data[i + 1], b = data[i + 2];
      if (!keepTransparency && a < 255) [r, g, b] = flattenPixel(r, g, b, a, background);
      if (dither) { r = Math.max(0, Math.min(255, r + errorR[current + x + 1])); g = Math.max(0, Math.min(255, g + errorG[current + x + 1])); b = Math.max(0, Math.min(255, b + errorB[current + x + 1])); }
      const pi = nearestPaletteIndex(r, g, b, paletteColors, keepTransparency ? 1 : 0);
      idx[y * width + x] = pi;
      if (dither) {
        const c = paletteColors[pi], er = r - c[0], eg = g - c[1], eb = b - c[2];
        errorR[current + x + 2] += er * 7 / 16; errorG[current + x + 2] += eg * 7 / 16; errorB[current + x + 2] += eb * 7 / 16;
        errorR[next + x] += er * 3 / 16; errorG[next + x] += eg * 3 / 16; errorB[next + x] += eb * 3 / 16;
        errorR[next + x + 1] += er * 5 / 16; errorG[next + x + 1] += eg * 5 / 16; errorB[next + x + 1] += eb * 5 / 16;
        errorR[next + x + 2] += er / 16; errorG[next + x + 2] += eg / 16; errorB[next + x + 2] += eb / 16;
      }
    }
  }
  const minCodeSize = Math.max(2, Math.ceil(Math.log2(tableSize)));
  const lzw = lzwEncode(idx, minCodeSize), chunks = [];
  for (let i = 0; i < lzw.length; i += 255) chunks.push(Uint8Array.of(Math.min(255, lzw.length - i)), lzw.slice(i, i + 255));
  chunks.push(Uint8Array.of(0));
  const head = new Uint8Array(13); head.set(new TextEncoder().encode('GIF89a'), 0); const v = new DataView(head.buffer);
  v.setUint16(6, width, true); v.setUint16(8, height, true); head[10] = 0x80 | 0x70 | (Math.log2(tableSize) - 1); head[11] = 0; head[12] = 0;
  const gce = keepTransparency ? Uint8Array.of(0x21,0xF9,0x04,0x01,0,0,0,0) : new Uint8Array(0);
  const desc = new Uint8Array(10); desc[0] = 0x2c; new DataView(desc.buffer).setUint16(5, width, true); new DataView(desc.buffer).setUint16(7, height, true);
  return new Blob([head, palette, gce, desc, Uint8Array.of(minCodeSize), ...chunks, Uint8Array.of(0x3b)], { type: 'image/gif' });
}

function parseIconSizes(value, fallback) {
  const source = Array.isArray(value) ? value : String(value || '').split(',');
  const sizes = [...new Set(source.map(Number).filter(size => Number.isInteger(size) && size >= 16 && size <= 256))].sort((a, b) => a - b);
  return sizes.length ? sizes : fallback;
}

function normalizeIconOptions(options, fallbackSizes) {
  if (Array.isArray(options)) return { sizes: parseIconSizes(options, fallbackSizes) };
  return {
    sizes: parseIconSizes(options?.sizes, fallbackSizes),
    fitMode: ['contain', 'cover', 'stretch'].includes(options?.fitMode) ? options.fitMode : 'contain',
    padding: Math.min(35, Math.max(0, Number(options?.padding) || 0)),
    smoothing: options?.smoothing === 'pixel' ? 'pixel' : 'smooth',
    alphaMode: options?.alphaMode === 'flatten' ? 'flatten' : 'keep',
    background: options?.background || '#ffffff'
  };
}

function drawSquareVariant(bitmap, size, options) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('아이콘 렌더링용 Canvas를 만들 수 없습니다.');
  ctx.imageSmoothingEnabled = options.smoothing !== 'pixel';
  if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = 'high';
  if (options.alphaMode === 'flatten') {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, size, size);
  } else {
    ctx.clearRect(0, 0, size, size);
  }
  const pad = Math.round(size * options.padding / 100);
  const box = Math.max(1, size - pad * 2);
  const sw = bitmap.width, sh = bitmap.height;
  if (options.fitMode === 'stretch') {
    ctx.drawImage(bitmap, pad, pad, box, box);
  } else if (options.fitMode === 'cover') {
    const scale = Math.max(box / sw, box / sh);
    const cropW = box / scale, cropH = box / scale;
    const sx = (sw - cropW) / 2, sy = (sh - cropH) / 2;
    ctx.drawImage(bitmap, sx, sy, cropW, cropH, pad, pad, box, box);
  } else {
    const scale = Math.min(box / sw, box / sh);
    const dw = Math.max(1, Math.round(sw * scale));
    const dh = Math.max(1, Math.round(sh * scale));
    const dx = Math.round((size - dw) / 2), dy = Math.round((size - dh) / 2);
    ctx.drawImage(bitmap, dx, dy, dw, dh);
  }
  return canvas;
}

export async function encodeIco(file, options = {}) {
  const normalized = normalizeIconOptions(options, [16, 32, 48, 64, 128, 256]);
  const bitmap = await createImageBitmap(file);
  const images = [];
  try {
    for (const size of normalized.sizes) {
      const canvas = drawSquareVariant(bitmap, size, normalized);
      images.push(new Uint8Array(await (await canvasBlob(canvas, 'image/png')).arrayBuffer()));
    }
  } finally {
    bitmap.close?.();
  }
  const count = images.length;
  let offset = 6 + 16 * count;
  const header = new Uint8Array(offset);
  const view = new DataView(header.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, count, true);
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    const size = normalized.sizes[index];
    header[entry] = size === 256 ? 0 : size;
    header[entry + 1] = size === 256 ? 0 : size;
    header[entry + 2] = 0;
    header[entry + 3] = 0;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, image.length, true);
    view.setUint32(entry + 12, offset, true);
    offset += image.length;
  });
  return new Blob([header, ...images], { type: 'image/x-icon' });
}
function ascii(s){return new TextEncoder().encode(s)}
export async function makePdf(files, options = {}) {
  const pageMode = options.page || 'a4';
  const orientation = options.orientation || 'auto';
  const margin = Math.max(0, Number(options.margin || 0));
  const gap = Math.max(0, Number(options.gap || 0));
  const quality = Math.max(.2, Math.min(1, Number(options.quality || .9)));
  const fitMode = options.fitMode === 'cover' ? 'cover' : 'contain';
  const layoutMode = options.layoutMode || 'one';
  const imagesPerPage = Math.max(1, Number(options.imagesPerPage || 1));
  const targetPages = Math.max(1, Math.min(files.length, Number(options.targetPages || 1)));
  const background = hexToRgb(options.background || '#ffffff');
  const pageNumbers = options.pageNumbers === 'bottom';
  const decoded = [];
  for (const file of files) {
    const { canvas, width, height } = await decodePng(file);
    const jpeg = await canvasBlob(canvas, 'image/jpeg', quality);
    decoded.push({ bytes: new Uint8Array(await jpeg.arrayBuffer()), width, height });
  }
  let groups = [];
  if (layoutMode === 'target') {
    const baseCount = Math.floor(decoded.length / targetPages), remainder = decoded.length % targetPages;
    let cursor = 0;
    for (let p = 0; p < targetPages; p++) { const count = baseCount + (p < remainder ? 1 : 0); groups.push(decoded.slice(cursor, cursor + count)); cursor += count; }
  } else {
    const count = layoutMode === 'grid' ? imagesPerPage : 1;
    for (let i = 0; i < decoded.length; i += count) groups.push(decoded.slice(i, i + count));
  }
  const pageSizeFor = group => {
    let size = pageMode === 'letter' ? [612, 792] : pageMode === 'image' ? [group[0].width, group[0].height] : [595.28, 841.89];
    if (orientation === 'landscape' || (orientation === 'auto' && group.length > 1 && size[1] > size[0])) size = [Math.max(...size), Math.min(...size)];
    if (orientation === 'portrait') size = [Math.min(...size), Math.max(...size)];
    return size;
  };
  const objects = [], offsets = [], pageRefs = [], imageRefs = [], contentRefs = [];
  let objNo = 4; // 1 catalog, 2 pages, 3 Helvetica font
  decoded.forEach(img => { img.obj = objNo++; imageRefs.push(img.obj); });
  groups.forEach(() => { contentRefs.push(objNo++); pageRefs.push(objNo++); });
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Count ${groups.length} /Kids [${pageRefs.map(n => `${n} 0 R`).join(' ')}] >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  decoded.forEach(img => { objects[img.obj] = { prefix:`<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`, bytes:img.bytes, suffix:'\nendstream' }; });
  let imageCursor = 0;
  groups.forEach((group, pageIndex) => {
    const [pw, ph] = pageSizeFor(group);
    const n = group.length;
    const cols = Math.ceil(Math.sqrt(n * (pw / ph)));
    const rows = Math.ceil(n / cols);
    const usableW = Math.max(1, pw - margin * 2 - gap * (cols - 1));
    const usableH = Math.max(1, ph - margin * 2 - gap * (rows - 1) - (pageNumbers ? 18 : 0));
    const cellW = usableW / cols, cellH = usableH / rows;
    let content = `${(background.r/255).toFixed(4)} ${(background.g/255).toFixed(4)} ${(background.b/255).toFixed(4)} rg\n0 0 ${pw.toFixed(2)} ${ph.toFixed(2)} re f\n`;
    const xobjs = [];
    group.forEach((img, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = margin + col * (cellW + gap), cy = ph - margin - (row + 1) * cellH - row * gap - (pageNumbers ? 18 : 0);
      const contain = Math.min(cellW / img.width, cellH / img.height);
      const cover = Math.max(cellW / img.width, cellH / img.height);
      const scale = fitMode === 'cover' ? cover : contain;
      const w = img.width * scale, h = img.height * scale;
      const x = cx + (cellW - w) / 2, y = cy + (cellH - h) / 2;
      const name = `Im${imageCursor + 1}`; xobjs.push(`/${name} ${img.obj} 0 R`);
      content += 'q\n';
      if (fitMode === 'cover') content += `${cx.toFixed(2)} ${cy.toFixed(2)} ${cellW.toFixed(2)} ${cellH.toFixed(2)} re W n\n`;
      content += `${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/${name} Do\nQ\n`;
      imageCursor++;
    });
    if (pageNumbers) content += `BT /F1 10 Tf ${(pw/2-10).toFixed(2)} 9 Td (${pageIndex + 1}) Tj ET\n`;
    objects[contentRefs[pageIndex]] = `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}endstream`;
    objects[pageRefs[pageIndex]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] /Resources << /Font << /F1 3 0 R >> /XObject << ${xobjs.join(' ')} >> >> /Contents ${contentRefs[pageIndex]} 0 R >>`;
  });
  const chunks=[ascii('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')]; let pos=chunks[0].length;
  for(let n=1;n<objects.length;n++){offsets[n]=pos;const st=ascii(`${n} 0 obj\n`),en=ascii('\nendobj\n');chunks.push(st);pos+=st.length;const o=objects[n];if(typeof o==='string'){const b=ascii(o);chunks.push(b);pos+=b.length;}else{const a=ascii(o.prefix),z=ascii(o.suffix);chunks.push(a,o.bytes,z);pos+=a.length+o.bytes.length+z.length;}chunks.push(en);pos+=en.length;}
  const xref=pos;let table=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let n=1;n<objects.length;n++)table+=String(offsets[n]).padStart(10,'0')+' 00000 n \n';
  table+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;chunks.push(ascii(table));
  return new Blob(chunks,{type:'application/pdf'});
}

function flattenRgb(imageData) {
  const { width, height, data } = imageData;
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, p = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    rgb[p++] = Math.round(data[i] * alpha + 255 * (1 - alpha));
    rgb[p++] = Math.round(data[i + 1] * alpha + 255 * (1 - alpha));
    rgb[p++] = Math.round(data[i + 2] * alpha + 255 * (1 - alpha));
  }
  return { width, height, rgb };
}

function netpbmBackground(options = {}) {
  return hexToRgb(options.background || '#ffffff');
}

function flattenRgbWithOptions(imageData, options = {}) {
  const { width, height, data } = imageData;
  const rgb = new Uint8Array(width * height * 3);
  const background = netpbmBackground(options);
  const alphaMode = options.alphaMode || 'flatten';
  for (let i = 0, p = 0; i < data.length; i += 4) {
    const alpha = alphaMode === 'ignore' ? 1 : data[i + 3] / 255;
    rgb[p++] = Math.round(data[i] * alpha + background.r * (1 - alpha));
    rgb[p++] = Math.round(data[i + 1] * alpha + background.g * (1 - alpha));
    rgb[p++] = Math.round(data[i + 2] * alpha + background.b * (1 - alpha));
  }
  return { width, height, rgb };
}

function quantizeSample(value, maxVal = 255) {
  const max = Math.max(1, Math.min(255, Number(maxVal) || 255));
  return Math.round((value / 255) * max);
}

function wrapAsciiTokens(tokens, lineLength = 70) {
  const width = Math.max(16, Math.min(240, Number(lineLength) || 70));
  const lines = [];
  let line = '';
  for (const token of tokens) {
    const next = line ? `${line} ${token}` : String(token);
    if (next.length > width && line) {
      lines.push(line);
      line = String(token);
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.join('\n') + '\n';
}

function grayscalePlane(imageData, options = {}) {
  const { width, height, rgb } = flattenRgbWithOptions(imageData, options);
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < rgb.length; i += 3) {
    gray[p++] = rgb[i] * 0.299 + rgb[i + 1] * 0.587 + rgb[i + 2] * 0.114;
  }
  return { width, height, gray };
}

function monochromePlane(imageData, options = {}) {
  const { width, height, gray } = grayscalePlane(imageData, options);
  const threshold = Math.max(0, Math.min(255, Number(options.threshold ?? 128)));
  const invert = options.invert === 'yes' || options.invert === true;
  const useDither = options.dither === 'floyd-steinberg';
  const work = new Float32Array(gray);
  const black = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const oldValue = Math.max(0, Math.min(255, work[index]));
      let isBlack = oldValue < threshold;
      if (invert) isBlack = !isBlack;
      black[index] = isBlack ? 1 : 0;
      if (useDither) {
        const rendered = isBlack ? 0 : 255;
        const error = oldValue - rendered;
        if (x + 1 < width) work[index + 1] += error * 7 / 16;
        if (y + 1 < height) {
          if (x > 0) work[index + width - 1] += error * 3 / 16;
          work[index + width] += error * 5 / 16;
          if (x + 1 < width) work[index + width + 1] += error / 16;
        }
      }
    }
  }
  return { width, height, black };
}

export function encodePpm(imageData, extension = 'ppm', options = {}) {
  const { width, height, rgb } = flattenRgbWithOptions(imageData, options);
  const encoding = options.encoding === 'ascii' ? 'ascii' : 'binary';
  const maxVal = Math.max(1, Math.min(255, Number(options.maxVal) || 255));
  let blob;
  if (encoding === 'ascii') {
    const tokens = [];
    for (const value of rgb) tokens.push(String(quantizeSample(value, maxVal)));
    const text = `P3\n# Generated by Converter Mall\n${width} ${height}\n${maxVal}\n${wrapAsciiTokens(tokens, options.lineLength)}`;
    blob = new Blob([text], { type: 'image/x-portable-pixmap;charset=us-ascii' });
  } else {
    const pixels = new Uint8Array(rgb.length);
    for (let i = 0; i < rgb.length; i++) pixels[i] = quantizeSample(rgb[i], maxVal);
    const header = new TextEncoder().encode(`P6\n# Generated by Converter Mall\n${width} ${height}\n${maxVal}\n`);
    blob = new Blob([header, pixels], { type: extension === 'pnm' ? 'image/x-portable-anymap' : 'image/x-portable-pixmap' });
  }
  return blob;
}

export function encodePgm(imageData, options = {}) {
  const { width, height, gray } = grayscalePlane(imageData, options);
  const encoding = options.encoding === 'ascii' ? 'ascii' : 'binary';
  const maxVal = Math.max(1, Math.min(255, Number(options.maxVal) || 255));
  if (encoding === 'ascii') {
    const tokens = Array.from(gray, value => String(quantizeSample(value, maxVal)));
    const text = `P2\n# Generated by Converter Mall\n${width} ${height}\n${maxVal}\n${wrapAsciiTokens(tokens, options.lineLength)}`;
    return new Blob([text], { type: 'image/x-portable-graymap;charset=us-ascii' });
  }
  const pixels = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) pixels[i] = quantizeSample(gray[i], maxVal);
  const header = new TextEncoder().encode(`P5\n# Generated by Converter Mall\n${width} ${height}\n${maxVal}\n`);
  return new Blob([header, pixels], { type: 'image/x-portable-graymap' });
}

export function encodePbm(imageData, options = {}) {
  const { width, height, black } = monochromePlane(imageData, options);
  const encoding = options.encoding === 'ascii' ? 'ascii' : 'binary';
  if (encoding === 'ascii') {
    const tokens = Array.from(black, value => String(value));
    const text = `P1\n# Generated by Converter Mall\n${width} ${height}\n${wrapAsciiTokens(tokens, options.lineLength)}`;
    return new Blob([text], { type: 'image/x-portable-bitmap;charset=us-ascii' });
  }
  const rowBytes = Math.ceil(width / 8);
  const bits = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) if (black[y * width + x]) bits[y * rowBytes + (x >> 3)] |= 1 << (7 - (x & 7));
  }
  const header = new TextEncoder().encode(`P4\n# Generated by Converter Mall\n${width} ${height}\n`);
  return new Blob([header, bits], { type: 'image/x-portable-bitmap' });
}

export function encodePam(imageData, options = {}) {
  const { width, height, data } = imageData;
  const tupleType = String(options.tupleType || 'RGB_ALPHA');
  const maxVal = Math.max(1, Math.min(255, Number(options.maxVal) || 255));
  let depth = 4;
  if (tupleType === 'RGB') depth = 3;
  else if (tupleType === 'GRAYSCALE_ALPHA') depth = 2;
  else if (tupleType === 'GRAYSCALE') depth = 1;
  const background = netpbmBackground(options);
  const pixels = new Uint8Array(width * height * depth);
  let p = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3] / 255;
    let r = data[i], g = data[i + 1], b = data[i + 2];
    if (!tupleType.includes('ALPHA')) {
      r = Math.round(r * alpha + background.r * (1 - alpha));
      g = Math.round(g * alpha + background.g * (1 - alpha));
      b = Math.round(b * alpha + background.b * (1 - alpha));
    }
    if (tupleType.startsWith('GRAYSCALE')) {
      pixels[p++] = quantizeSample(r * 0.299 + g * 0.587 + b * 0.114, maxVal);
      if (tupleType.endsWith('ALPHA')) pixels[p++] = quantizeSample(data[i + 3], maxVal);
    } else {
      pixels[p++] = quantizeSample(r, maxVal);
      pixels[p++] = quantizeSample(g, maxVal);
      pixels[p++] = quantizeSample(b, maxVal);
      if (tupleType.endsWith('ALPHA')) pixels[p++] = quantizeSample(data[i + 3], maxVal);
    }
  }
  const header = new TextEncoder().encode(
    `P7\n# Generated by Converter Mall\nWIDTH ${width}\nHEIGHT ${height}\nDEPTH ${depth}\nMAXVAL ${maxVal}\nTUPLTYPE ${tupleType}\nENDHDR\n`
  );
  return new Blob([header, pixels], { type: 'image/x-portable-arbitrarymap' });
}

export function encodeXbm(imageData, symbolName = 'converter_mall_image', options = {}) {
  const { width, height, black } = monochromePlane(imageData, options);
  const requestedName = options.symbolName || symbolName || 'converter_mall_image';
  const safeName = String(requestedName).replace(/[^a-zA-Z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
  const rowBytes = Math.ceil(width / 8);
  const bytes = [];
  for (let y = 0; y < height; y++) {
    for (let byteIndex = 0; byteIndex < rowBytes; byteIndex++) {
      let value = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = byteIndex * 8 + bit;
        if (x < width && black[y * width + x]) value |= 1 << bit;
      }
      bytes.push(value);
    }
  }
  const bytesPerLine = Math.max(4, Math.min(32, Number(options.bytesPerLine) || 12));
  const lines = [];
  for (let i = 0; i < bytes.length; i += bytesPerLine) {
    lines.push('  ' + bytes.slice(i, i + bytesPerLine).map(value => `0x${value.toString(16).padStart(2, '0')}`).join(', '));
  }
  const storage = options.storage === 'const' ? 'static const unsigned char' : 'static unsigned char';
  const guard = options.includeGuard === 'yes' ? `${safeName.toUpperCase()}_XBM_INCLUDED` : '';
  const bodyCore = `#define ${safeName}_width ${width}\n#define ${safeName}_height ${height}\n${storage} ${safeName}_bits[] = {\n${lines.join(',\n')}\n};\n`;
  const body = guard ? `#ifndef ${guard}\n#define ${guard}\n\n${bodyCore}\n#endif /* ${guard} */\n` : bodyCore;
  return new Blob([body], { type: 'image/x-xbitmap;charset=utf-8' });
}


function tgaRleEncode(pixels, bytesPerPixel) {
  const chunks = [];
  const count = pixels.length / bytesPerPixel;
  let i = 0;
  const same = (a, b) => { for (let k = 0; k < bytesPerPixel; k++) if (pixels[a * bytesPerPixel + k] !== pixels[b * bytesPerPixel + k]) return false; return true; };
  while (i < count) {
    let run = 1;
    while (i + run < count && run < 128 && same(i, i + run)) run++;
    if (run >= 2) {
      chunks.push(Uint8Array.of(0x80 | (run - 1)), pixels.slice(i * bytesPerPixel, i * bytesPerPixel + bytesPerPixel));
      i += run;
    } else {
      const start = i++; while (i < count && i - start < 128) { let r = 1; while (i + r < count && r < 2 && same(i, i + r)) r++; if (r >= 2) break; i++; }
      chunks.push(Uint8Array.of(i - start - 1), pixels.slice(start * bytesPerPixel, i * bytesPerPixel));
    }
  }
  return chunks;
}
export function encodeTga(imageData, options = {}) {
  const { width, height, data } = imageData;
  const bitDepth = Number(options.bitDepth || 32) === 24 ? 24 : 32;
  const bytesPerPixel = bitDepth / 8;
  const keepAlpha = bitDepth === 32 && options.alphaMode === 'keep';
  const background = hexToRgb(options.background || '#ffffff');
  const topOrigin = options.origin !== 'bottom';
  const useRle = options.compression === 'rle';
  const header = new Uint8Array(18); const view = new DataView(header.buffer);
  header[2] = useRle ? 10 : 2; view.setUint16(12, width, true); view.setUint16(14, height, true);
  header[16] = bitDepth; header[17] = (keepAlpha ? 8 : 0) | (topOrigin ? 0x20 : 0);
  const pixels = new Uint8Array(width * height * bytesPerPixel); let p = 0;
  for (let row = 0; row < height; row++) {
    const y = topOrigin ? row : height - 1 - row;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4; let r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
      if (!keepAlpha) { [r,g,b] = flattenPixel(r,g,b,a,background); a=255; }
      pixels[p++]=b; pixels[p++]=g; pixels[p++]=r; if (bitDepth===32) pixels[p++]=a;
    }
  }
  return new Blob(useRle ? [header, ...tgaRleEncode(pixels, bytesPerPixel)] : [header, pixels], { type: 'image/x-tga' });
}

function packBitsEncode(bytes) {
  const out = [];
  let i = 0;
  while (i < bytes.length) {
    let run = 1;
    while (i + run < bytes.length && bytes[i + run] === bytes[i] && run < 128) run++;
    if (run >= 3) {
      out.push(257 - run, bytes[i]);
      i += run;
      continue;
    }
    const literalStart = i;
    i += run;
    while (i < bytes.length) {
      let nextRun = 1;
      while (i + nextRun < bytes.length && bytes[i + nextRun] === bytes[i] && nextRun < 128) nextRun++;
      if (nextRun >= 3 || i - literalStart >= 128) break;
      i += nextRun;
    }
    const count = i - literalStart;
    out.push(count - 1);
    for (let j = literalStart; j < literalStart + count; j++) out.push(bytes[j]);
  }
  return Uint8Array.from(out);
}

function hexToRgb(hex = '#ffffff') {
  const value = String(hex).replace('#', '').trim();
  const normalized = value.length === 3 ? value.split('').map(c => c + c).join('') : value.padEnd(6, 'f').slice(0, 6);
  const number = Number.parseInt(normalized, 16);
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
}

function flattenPixel(r, g, b, a, background) {
  const alpha = a / 255;
  return [
    Math.round(r * alpha + background.r * (1 - alpha)),
    Math.round(g * alpha + background.g * (1 - alpha)),
    Math.round(b * alpha + background.b * (1 - alpha))
  ];
}

export function encodeTiff(imageData, options = {}) {
  const { width, height, data } = imageData;
  const dpi = Math.max(1, Number(options.dpi ?? options ?? 300) || 300);
  const colorMode = options.colorMode === 'grayscale' ? 'grayscale' : 'rgb';
  const keepAlpha = String(options.alphaMode || 'keep') === 'keep';
  const compression = options.compression === 'packbits' ? 'packbits' : 'none';
  const background = hexToRgb(options.background || '#ffffff');
  const samples = colorMode === 'grayscale' ? (keepAlpha ? 2 : 1) : (keepAlpha ? 4 : 3);
  const raw = new Uint8Array(width * height * samples);
  for (let i = 0, p = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (!keepAlpha) {
      [r, g, b] = flattenPixel(r, g, b, a, background);
      a = 255;
    }
    if (colorMode === 'grayscale') {
      raw[p++] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
      if (keepAlpha) raw[p++] = a;
    } else {
      raw[p++] = r; raw[p++] = g; raw[p++] = b;
      if (keepAlpha) raw[p++] = a;
    }
  }
  const pixelData = compression === 'packbits' ? packBitsEncode(raw) : raw;
  const tags = [];
  const add = (tag, type, count, value) => tags.push({ tag, type, count, value });
  add(256, 4, 1, width);
  add(257, 4, 1, height);
  add(258, 3, samples, null);
  add(259, 3, 1, compression === 'packbits' ? 32773 : 1);
  add(262, 3, 1, colorMode === 'grayscale' ? 1 : 2);
  add(273, 4, 1, null);
  add(277, 3, 1, samples);
  add(278, 4, 1, height);
  add(279, 4, 1, pixelData.length);
  add(282, 5, 1, null);
  add(283, 5, 1, null);
  add(284, 3, 1, 1);
  add(296, 3, 1, 2);
  if (keepAlpha) add(338, 3, 1, 2);

  const ifdOffset = 8;
  const ifdSize = 2 + tags.length * 12 + 4;
  let extraOffset = ifdOffset + ifdSize;
  const bitsOffset = samples > 1 ? extraOffset : null;
  if (samples > 1) extraOffset += samples * 2;
  const xResOffset = extraOffset; extraOffset += 8;
  const yResOffset = extraOffset; extraOffset += 8;
  const pixelOffset = extraOffset;
  const out = new Uint8Array(pixelOffset + pixelData.length);
  const v = new DataView(out.buffer);
  out[0] = 0x49; out[1] = 0x49;
  v.setUint16(2, 42, true);
  v.setUint32(4, ifdOffset, true);
  v.setUint16(ifdOffset, tags.length, true);
  let ep = ifdOffset + 2;
  for (const item of tags) {
    v.setUint16(ep, item.tag, true); v.setUint16(ep + 2, item.type, true); v.setUint32(ep + 4, item.count, true);
    let value = item.value;
    if (item.tag === 258) value = samples === 1 ? 8 : bitsOffset;
    if (item.tag === 273) value = pixelOffset;
    if (item.tag === 282) value = xResOffset;
    if (item.tag === 283) value = yResOffset;
    if (item.type === 3 && item.count === 1) v.setUint16(ep + 8, value, true);
    else v.setUint32(ep + 8, value, true);
    ep += 12;
  }
  v.setUint32(ep, 0, true);
  if (samples > 1) for (let i = 0; i < samples; i++) v.setUint16(bitsOffset + i * 2, 8, true);
  v.setUint32(xResOffset, dpi, true); v.setUint32(xResOffset + 4, 1, true);
  v.setUint32(yResOffset, dpi, true); v.setUint32(yResOffset + 4, 1, true);
  out.set(pixelData, pixelOffset);
  return new Blob([out], { type: 'image/tiff' });
}

function pcxRleEncode(bytes) {
  const out = [];
  for (let i = 0; i < bytes.length;) {
    const value = bytes[i];
    let run = 1;
    while (i + run < bytes.length && bytes[i + run] === value && run < 63) run++;
    if (run > 1 || (value & 0xC0) === 0xC0) out.push(0xC0 | run, value);
    else out.push(value);
    i += run;
  }
  return Uint8Array.from(out);
}

export function encodePcx(imageData, options = {}) {
  if (typeof options === 'number') options = { dpi: options };
  const { width, height, data } = imageData;
  const dpi = Math.max(1, Number(options.dpi || 96));
  const colorMode = options.colorMode === 'grayscale' ? 'grayscale' : 'rgb24';
  const background = hexToRgb(options.background || '#ffffff');
  const bytesPerLine = width + (width % 2);
  const header = new Uint8Array(128); const v = new DataView(header.buffer);
  header[0]=10; header[1]=5; header[2]=1; header[3]=8;
  v.setUint16(8,width-1,true); v.setUint16(10,height-1,true); v.setUint16(12,dpi,true); v.setUint16(14,dpi,true);
  header[65] = colorMode === 'grayscale' ? 1 : 3; v.setUint16(66, bytesPerLine, true); v.setUint16(68, colorMode === 'grayscale' ? 2 : 1, true);
  const planes = colorMode === 'grayscale' ? 1 : 3;
  const scan = new Uint8Array(bytesPerLine * height * planes); let p=0;
  for (let y=0;y<height;y++) for (let plane=0;plane<planes;plane++) {
    for (let x=0;x<width;x++) { const i=(y*width+x)*4; const [r,g,b]=flattenPixel(data[i],data[i+1],data[i+2],data[i+3],background); scan[p++]=colorMode==='grayscale'?Math.round(.299*r+.587*g+.114*b):[r,g,b][plane]; }
    if(width%2) scan[p++]=0;
  }
  if (colorMode === 'grayscale') {
    const palette = new Uint8Array(769); palette[0]=12; for(let i=0;i<256;i++){palette[1+i*3]=i;palette[2+i*3]=i;palette[3+i*3]=i;}
    return new Blob([header, pcxRleEncode(scan), palette], { type:'image/x-pcx' });
  }
  return new Blob([header, pcxRleEncode(scan)], { type:'image/x-pcx' });
}

function cursorHotspot(size, options) {
  const mode = options.hotspotMode || 'top-left';
  const max = size - 1;
  if (mode === 'center') return [Math.round(max / 2), Math.round(max / 2)];
  if (mode === 'bottom-left') return [0, max];
  if (mode === 'bottom-right') return [max, max];
  if (mode === 'top-right') return [max, 0];
  const x = Math.round(max * Math.min(100, Math.max(0, Number(options.hotspotXPercent) || 0)) / 100);
  const y = Math.round(max * Math.min(100, Math.max(0, Number(options.hotspotYPercent) || 0)) / 100);
  return mode === 'custom' ? [x, y] : [0, 0];
}

export async function encodeCur(file, options = {}) {
  if (Array.isArray(options)) {
    options = { sizes: options, hotspotMode: 'custom', hotspotXPercent: 0, hotspotYPercent: 0 };
  }
  const normalized = normalizeIconOptions(options, [32, 48, 64, 128]);
  normalized.hotspotMode = options.hotspotMode || 'top-left';
  normalized.hotspotXPercent = options.hotspotXPercent;
  normalized.hotspotYPercent = options.hotspotYPercent;
  const bitmap = await createImageBitmap(file);
  const images = [];
  try {
    for (const size of normalized.sizes) {
      const canvas = drawSquareVariant(bitmap, size, normalized);
      images.push(new Uint8Array(await (await canvasBlob(canvas, 'image/png')).arrayBuffer()));
    }
  } finally {
    bitmap.close?.();
  }
  const count = images.length;
  let offset = 6 + 16 * count;
  const header = new Uint8Array(offset);
  const view = new DataView(header.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 2, true);
  view.setUint16(4, count, true);
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    const size = normalized.sizes[index];
    const [hotspotX, hotspotY] = cursorHotspot(size, normalized);
    header[entry] = size === 256 ? 0 : size;
    header[entry + 1] = size === 256 ? 0 : size;
    header[entry + 2] = 0;
    header[entry + 3] = 0;
    view.setUint16(entry + 4, hotspotX, true);
    view.setUint16(entry + 6, hotspotY, true);
    view.setUint32(entry + 8, image.length, true);
    view.setUint32(entry + 12, offset, true);
    offset += image.length;
  });
  return new Blob([header, ...images], { type: 'image/x-win-bitmap' });
}


function canvasToBlobStrict(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob || blob.size === 0) {
        reject(new Error(`${mimeType} 인코딩에 실패했습니다.`));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

function isAvifBlob(bytes) {
  if (bytes.length < 16) return false;
  const text = String.fromCharCode(...bytes.subarray(4, Math.min(bytes.length, 32)));
  return text.includes('ftyp') && (text.includes('avif') || text.includes('avis'));
}

export async function encodeAvif(file, options = {}) {
  const bitmap = await createImageBitmap(file);
  try {
    const source = document.createElement('canvas');
    source.width = bitmap.width;
    source.height = bitmap.height;
    const sourceCtx = source.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!sourceCtx) throw new Error('Canvas 2D를 사용할 수 없습니다.');
    sourceCtx.clearRect(0, 0, source.width, source.height);
    sourceCtx.drawImage(bitmap, 0, 0);

    const threshold = Math.max(0, Math.min(255, Number(options.alphaThreshold ?? 1)));
    let crop = { x: 0, y: 0, width: source.width, height: source.height };
    if (options.trimTransparent === 'yes') {
      const imageData = sourceCtx.getImageData(0, 0, source.width, source.height);
      let minX = source.width, minY = source.height, maxX = -1, maxY = -1;
      for (let y = 0; y < source.height; y++) {
        for (let x = 0; x < source.width; x++) {
          if (imageData.data[(y * source.width + x) * 4 + 3] >= threshold) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX >= minX && maxY >= minY) crop = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    }

    const maxDimension = Math.max(0, Number(options.maxDimension || 0));
    const scale = maxDimension > 0 ? Math.min(1, maxDimension / Math.max(crop.width, crop.height)) : 1;
    const outWidth = Math.max(1, Math.round(crop.width * scale));
    const outHeight = Math.max(1, Math.round(crop.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D를 사용할 수 없습니다.');
    ctx.imageSmoothingEnabled = options.resizeFilter !== 'pixel';
    ctx.imageSmoothingQuality = 'high';

    if (options.alphaMode === 'flatten') {
      const background = hexToRgb(options.background || '#ffffff');
      ctx.fillStyle = `rgb(${background[0]}, ${background[1]}, ${background[2]})`;
      ctx.fillRect(0, 0, outWidth, outHeight);
    } else {
      ctx.clearRect(0, 0, outWidth, outHeight);
    }
    ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, outWidth, outHeight);

    if (options.colorMode === 'grayscale') {
      const imageData = ctx.getImageData(0, 0, outWidth, outHeight);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        data[i] = gray; data[i + 1] = gray; data[i + 2] = gray;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    const quality = Math.min(1, Math.max(0.01, Number(options.quality || 82) / 100));
    const blob = await canvasToBlobStrict(canvas, 'image/avif', quality);
    const bytes = new Uint8Array(await blob.slice(0, 40).arrayBuffer());
    if (blob.type !== 'image/avif' || !isAvifBlob(bytes)) {
      throw new Error('현재 브라우저가 AVIF 저장을 지원하지 않습니다. 가짜 AVIF 파일은 생성하지 않습니다. 최신 브라우저 또는 향후 AVIF WASM 코덱 확장팩이 필요합니다.');
    }
    return blob;
  } finally {
    bitmap.close?.();
  }
}

function nearestPowerOfTwo(value, mode = 'nearest') {
  if (mode === 'keep') return value;
  const lower = 2 ** Math.floor(Math.log2(Math.max(1, value)));
  const upper = 2 ** Math.ceil(Math.log2(Math.max(1, value)));
  if (mode === 'down') return lower;
  if (mode === 'up') return upper;
  return value - lower <= upper - value ? lower : upper;
}

function resizeImageDataNearest(imageData, width, height) {
  if (imageData.width === width && imageData.height === height) return imageData;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const sy = Math.min(imageData.height - 1, Math.floor(y * imageData.height / height));
    for (let x = 0; x < width; x++) {
      const sx = Math.min(imageData.width - 1, Math.floor(x * imageData.width / width));
      const source = (sy * imageData.width + sx) * 4;
      const target = (y * width + x) * 4;
      out[target] = imageData.data[source]; out[target + 1] = imageData.data[source + 1];
      out[target + 2] = imageData.data[source + 2]; out[target + 3] = imageData.data[source + 3];
    }
  }
  return { width, height, data: out };
}

function downsampleHalf(imageData) {
  const width = Math.max(1, Math.floor(imageData.width / 2));
  const height = Math.max(1, Math.floor(imageData.height / 2));
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sums = [0, 0, 0, 0]; let count = 0;
    for (let oy = 0; oy < 2; oy++) for (let ox = 0; ox < 2; ox++) {
      const sx = Math.min(imageData.width - 1, x * 2 + ox);
      const sy = Math.min(imageData.height - 1, y * 2 + oy);
      const index = (sy * imageData.width + sx) * 4;
      for (let c = 0; c < 4; c++) sums[c] += imageData.data[index + c];
      count++;
    }
    const target = (y * width + x) * 4;
    for (let c = 0; c < 4; c++) out[target + c] = Math.round(sums[c] / count);
  }
  return { width, height, data: out };
}

function ddsPixels(imageData, alphaMode = 'keep', background = '#ffffff') {
  const bg = hexToRgb(background);
  const pixels = new Uint8Array(imageData.width * imageData.height * 4);
  for (let i = 0, p = 0; i < imageData.data.length; i += 4) {
    let r = imageData.data[i], g = imageData.data[i + 1], b = imageData.data[i + 2], a = imageData.data[i + 3];
    if (alphaMode === 'opaque') a = 255;
    if (alphaMode === 'flatten') { [r, g, b] = flattenPixel(r, g, b, a, bg); a = 255; }
    pixels[p++] = b; pixels[p++] = g; pixels[p++] = r; pixels[p++] = a;
  }
  return pixels;
}

export function encodeDds(imageData, options = {}) {
  if (!imageData.width || !imageData.height) throw new Error('DDS로 변환할 이미지 크기가 올바르지 않습니다.');
  const potMode = options.powerOfTwo || 'keep';
  const width = Math.min(16384, nearestPowerOfTwo(imageData.width, potMode));
  const height = Math.min(16384, nearestPowerOfTwo(imageData.height, potMode));
  let level = resizeImageDataNearest(imageData, width, height);
  const levels = [level];
  if (String(options.mipmaps || 'none') === 'full') {
    while (level.width > 1 || level.height > 1) { level = downsampleHalf(level); levels.push(level); }
  }
  const header = new Uint8Array(128);
  const v = new DataView(header.buffer);
  header.set([0x44, 0x44, 0x53, 0x20], 0);
  v.setUint32(4, 124, true);
  let flags = 0x0000100F;
  if (levels.length > 1) flags |= 0x00020000;
  v.setUint32(8, flags, true);
  v.setUint32(12, height, true); v.setUint32(16, width, true); v.setUint32(20, width * 4, true);
  v.setUint32(24, 0, true); v.setUint32(28, levels.length > 1 ? levels.length : 0, true);
  v.setUint32(76, 32, true); v.setUint32(80, 0x41, true); v.setUint32(84, 0, true); v.setUint32(88, 32, true);
  v.setUint32(92, 0x00FF0000, true); v.setUint32(96, 0x0000FF00, true); v.setUint32(100, 0x000000FF, true); v.setUint32(104, 0xFF000000, true);
  v.setUint32(108, levels.length > 1 ? 0x00401008 : 0x1000, true);
  const payload = levels.map(item => ddsPixels(item, options.alphaMode || 'keep', options.background || '#ffffff'));
  return new Blob([header, ...payload], { type: 'image/vnd-ms.dds' });
}

function psdPackBitsRow(bytes) { return packBitsEncode(bytes); }

export function encodePsd(imageData, options = {}) {
  const { width, height, data } = imageData;
  if (!width || !height || width > 30000 || height > 30000) throw new Error('PSD 출력은 가로·세로 30,000px 이하만 지원합니다.');
  const colorMode = options.colorMode === 'grayscale' ? 'grayscale' : 'rgb';
  const includeAlpha = String(options.alphaMode || 'keep') === 'keep';
  const compression = options.compression === 'rle' ? 'rle' : 'raw';
  const background = hexToRgb(options.background || '#ffffff');
  const channels = colorMode === 'grayscale' ? (includeAlpha ? 2 : 1) : (includeAlpha ? 4 : 3);
  const header = new Uint8Array(26); const v = new DataView(header.buffer);
  header.set([0x38, 0x42, 0x50, 0x53], 0); v.setUint16(4, 1, false); v.setUint16(12, channels, false);
  v.setUint32(14, height, false); v.setUint32(18, width, false); v.setUint16(22, 8, false); v.setUint16(24, colorMode === 'grayscale' ? 1 : 3, false);
  const sectionLengths = new Uint8Array(12);
  const planes = Array.from({ length: channels }, () => new Uint8Array(width * height));
  for (let i = 0, p = 0; p < width * height; i += 4, p++) {
    let r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (!includeAlpha) { [r, g, b] = flattenPixel(r, g, b, a, background); a = 255; }
    if (colorMode === 'grayscale') {
      planes[0][p] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
      if (includeAlpha) planes[1][p] = a;
    } else {
      planes[0][p] = r; planes[1][p] = g; planes[2][p] = b;
      if (includeAlpha) planes[3][p] = a;
    }
  }
  const compressionHeader = new Uint8Array(2); new DataView(compressionHeader.buffer).setUint16(0, compression === 'rle' ? 1 : 0, false);
  if (compression === 'raw') return new Blob([header, sectionLengths, compressionHeader, ...planes], { type: 'image/vnd.adobe.photoshop' });
  const rows = []; const rowLengths = new Uint8Array(channels * height * 2); const rv = new DataView(rowLengths.buffer);
  let rowIndex = 0;
  for (const plane of planes) for (let y = 0; y < height; y++) {
    const encoded = psdPackBitsRow(plane.subarray(y * width, (y + 1) * width));
    if (encoded.length > 65535) throw new Error('PSD RLE 한 행의 압축 데이터가 규격 한도를 초과했습니다. RAW 압축을 선택하세요.');
    rv.setUint16(rowIndex * 2, encoded.length, false); rowIndex++; rows.push(encoded);
  }
  return new Blob([header, sectionLengths, compressionHeader, rowLengths, ...rows], { type: 'image/vnd.adobe.photoshop' });
}
