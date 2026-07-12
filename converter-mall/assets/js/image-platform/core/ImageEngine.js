const DEFAULT_MAX_PIXELS = 80_000_000;

async function decodeAnimatedFrame(file, settings = {}, modeKey = "gifFrameMode", indexKey = "gifFrameIndex") {
  if (!("ImageDecoder" in window)) return null;
  try {
    const data = await file.arrayBuffer();
    const decoder = new ImageDecoder({ data, type: file.type || "image/gif" });
    await decoder.tracks.ready;
    const track = decoder.tracks.selectedTrack;
    const count = Math.max(1, track?.frameCount || 1);
    let index = 0;
    const mode = settings[modeKey] || "first";
    if (mode === "middle") index = Math.floor((count - 1) / 2);
    else if (mode === "last") index = count - 1;
    else if (mode === "index") index = Math.max(0, Math.min(count - 1, Number(settings[indexKey] || 1) - 1));
    const result = await decoder.decode({ frameIndex: index });
    const frame = result.image;
    const originalClose = frame.close.bind(frame);
    frame.close = () => { originalClose(); decoder.close(); };
    return frame;
  } catch { return null; }
}

export async function decodeImage(file, settings = {}) {
  if ((file.type === "image/gif" || /\.gif$/i.test(file.name || "")) && settings.gifFrameMode) {
    const frame = await decodeAnimatedFrame(file, settings, "gifFrameMode", "gifFrameIndex");
    if (frame) return frame;
  }
  if ((file.type === "image/webp" || /\.webp$/i.test(file.name || "")) && settings.sourceFrameMode) {
    const frame = await decodeAnimatedFrame(file, settings, "sourceFrameMode", "sourceFrameIndex");
    if (frame) return frame;
  }
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, {
        imageOrientation: "from-image",
        premultiplyAlpha: "default",
        colorSpaceConversion: "default",
      });
    } catch {}
  }
  return loadImage(file);
}

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 로드 실패"));
    };
    image.src = url;
  });
}

export async function decodeBlobDimensions(blob) {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(blob);
    const result = { w: bitmap.width, h: bitmap.height };
    bitmap.close?.();
    return result;
  }

  return await new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(blob);
    image.onload = () => {
      const result = { w: image.naturalWidth, h: image.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(result);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("JPG 재디코딩 실패"));
    };
    image.src = url;
  });
}

export function targetDimensions(width, height, settings) {
  if (settings.resizeMode === "percent") {
    const ratio = Math.max(1, settings.resizeValue || 100) / 100;
    return {
      w: Math.max(1, Math.round(width * ratio)),
      h: Math.max(1, Math.round(height * ratio)),
    };
  }

  if (settings.resizeMode === "width") {
    const nextWidth = Math.min(width, Math.max(1, settings.resizeValue || width));
    return {
      w: Math.round(nextWidth),
      h: Math.max(1, Math.round((height * nextWidth) / width)),
    };
  }

  return { w: width, h: height };
}

function createCanvas(width, height, alpha = true) {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    return { canvas, context: canvas.getContext("2d", { alpha, desynchronized: true }) };
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, context: canvas.getContext("2d", { alpha, desynchronized: true }) };
}

function findTransparentBounds(source, width, height, threshold = 0) {
  if (width * height > 20_000_000) return { x: 0, y: 0, w: width, h: height };
  const { canvas, context } = createCanvas(width, height, true);
  if (!context) return { x: 0, y: 0, w: width, h: height };
  context.clearRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  let data;
  try { data = context.getImageData(0, 0, width, height).data; }
  catch { return { x: 0, y: 0, w: width, h: height }; }
  let left = width, top = height, right = -1, bottom = -1;
  const limit = Math.max(0, Math.min(255, Number(threshold) || 0));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > limit) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < left || bottom < top) return { x: 0, y: 0, w: 1, h: 1 };
  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}

function applyGrayscale(context, width, height) {
  const image = context.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722);
    data[i] = gray; data[i + 1] = gray; data[i + 2] = gray;
  }
  context.putImageData(image, 0, 0);
}

function applySharpen(context, width, height, mode = "off") {
  if (mode === "off" || width * height > 12_000_000 || width < 3 || height < 3) return;
  const strength = mode === "strong" ? 0.48 : 0.24;
  const source = context.getImageData(0, 0, width, height);
  const src = source.data;
  const output = new Uint8ClampedArray(src);
  const row = width * 4;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * row + x * 4;
      for (let c = 0; c < 3; c += 1) {
        const center = src[i + c];
        const neighbors = src[i - 4 + c] + src[i + 4 + c] + src[i - row + c] + src[i + row + c];
        output[i + c] = Math.max(0, Math.min(255, center * (1 + 4 * strength) - neighbors * strength));
      }
    }
  }
  context.putImageData(new ImageData(output, width, height), 0, 0);
}


function applyArtifactSmoothing(context, width, height, mode = "off") {
  if (mode === "off" || width * height > 12_000_000 || width < 3 || height < 3) return;
  const strength = mode === "strong" ? 0.28 : 0.14;
  const image = context.getImageData(0, 0, width, height);
  const src = image.data;
  const out = new Uint8ClampedArray(src);
  const row = width * 4;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * row + x * 4;
      for (let c = 0; c < 3; c += 1) {
        const avg = (src[i + c] * 4 + src[i - 4 + c] + src[i + 4 + c] + src[i - row + c] + src[i + row + c]) / 8;
        out[i + c] = Math.round(src[i + c] * (1 - strength) + avg * strength);
      }
    }
  }
  context.putImageData(new ImageData(out, width, height), 0, 0);
}

export async function transformImage(file, settings, options = {}) {
  const maxPixels = options.maxPixels || DEFAULT_MAX_PIXELS;
  const source = await decodeImage(file, settings);
  const width = source.width || source.displayWidth || source.codedWidth || source.naturalWidth;
  const height = source.height || source.displayHeight || source.codedHeight || source.naturalHeight;

  if (width * height > maxPixels) {
    source.close?.();
    throw new Error("이미지 해상도가 너무 큽니다 (최대 8천만 픽셀)");
  }

  const preserveAlpha = Boolean(options.preserveAlpha ?? settings.preserveAlpha);
  const crop = settings.trimTransparent && preserveAlpha
    ? findTransparentBounds(source, width, height, settings.trimThreshold)
    : { x: 0, y: 0, w: width, h: height };
  const sourceScale = Math.max(1, Math.min(4, Number(settings.sourceScale || 1)));
  const scaledCrop = { w: Math.max(1, Math.round(crop.w * sourceScale)), h: Math.max(1, Math.round(crop.h * sourceScale)) };
  const dimensions = targetDimensions(scaledCrop.w, scaledCrop.h, settings);
  const { canvas, context } = createCanvas(dimensions.w, dimensions.h, preserveAlpha);

  if (!context) {
    source.close?.();
    throw new Error("Canvas 2D 컨텍스트를 만들 수 없습니다");
  }

  if (!preserveAlpha) {
    context.fillStyle = settings.background || "#ffffff";
    context.fillRect(0, 0, dimensions.w, dimensions.h);
  } else {
    context.clearRect(0, 0, dimensions.w, dimensions.h);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = dimensions.w < crop.w || dimensions.h < crop.h ? "high" : "medium";
  context.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, dimensions.w, dimensions.h);
  if (settings.bmpAlphaMode === "opaque" && preserveAlpha) {
    const image = context.getImageData(0, 0, dimensions.w, dimensions.h);
    for (let i = 3; i < image.data.length; i += 4) image.data[i] = 255;
    context.putImageData(image, 0, 0);
  }
  source.close?.();

  applyArtifactSmoothing(context, dimensions.w, dimensions.h, settings.artifactMode || "off");
  if (settings.colorMode === "grayscale") applyGrayscale(context, dimensions.w, dimensions.h);
  const effectiveSharpen = settings.sharpen === "off" && settings.contentMode === "text" ? "mild" : settings.sharpen;
  applySharpen(context, dimensions.w, dimensions.h, effectiveSharpen);

  const outputMimeType = options.outputMimeType || settings.outputMimeType || "image/jpeg";
  if (canvas.convertToBlob) {
    return canvas.convertToBlob({ type: outputMimeType, quality: settings.quality });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("변환 실패"))),
      outputMimeType,
      settings.quality,
    );
  });
}

export async function verifyPng(blob) {
  if (!blob || blob.size < 8) throw new Error("결과 파일이 비어 있습니다");
  const head = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!signature.every((value, index) => head[index] === value)) {
    throw new Error("PNG 무결성 검사 실패");
  }
  return true;
}

export async function verifyJpeg(blob) {
  if (!blob || blob.size < 4) throw new Error("결과 파일이 비어 있습니다");
  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  const tail = new Uint8Array(await blob.slice(-2).arrayBuffer());
  if (head[0] !== 0xff || head[1] !== 0xd8 || tail[0] !== 0xff || tail[1] !== 0xd9) {
    throw new Error("JPG 시작·끝 무결성 검사 실패");
  }
  return true;
}

export async function verifyWebp(blob) {
  if (!blob || blob.size < 12) throw new Error("결과 파일이 비어 있습니다");
  const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const riff = String.fromCharCode(...head.slice(0, 4));
  const webp = String.fromCharCode(...head.slice(8, 12));
  if (riff !== "RIFF" || webp !== "WEBP") throw new Error("WEBP 무결성 검사 실패");
  return true;
}

export async function verifyImageOutput(blob, mimeType = "image/jpeg") {
  if (mimeType === "image/png") return verifyPng(blob);
  if (mimeType === "image/webp") return verifyWebp(blob);
  return verifyJpeg(blob);
}

export async function transformWithRetry(file, settings, options = {}) {
  const maxAttempts = Math.max(1, options.maxAttempts || 2);
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const blob = await transformImage(file, settings, options);
      await verifyImageOutput(blob, options.outputMimeType || settings.outputMimeType || "image/jpeg");
      return blob;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 80 * attempt));
      }
    }
  }

  throw lastError || new Error("변환 실패");
}
