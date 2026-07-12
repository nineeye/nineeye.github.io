/**
 * Device-aware optimization advisor shared by image converters.
 * Keeps performance profiling, file-risk diagnosis, smart presets and
 * adaptive batch planning independent from page/UI code.
 */
export function createOptimizationAdvisor({ mapPool, sum }) {
  if (typeof mapPool !== "function") throw new TypeError("mapPool is required");
  if (typeof sum !== "function") throw new TypeError("sum is required");

  function getDeviceProfile() {
    const cores = Math.max(1, navigator.hardwareConcurrency || 2);
    const memory = Number(navigator.deviceMemory || 4);
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const score = Math.min(100, cores * 8 + memory * 7 - (mobile ? 8 : 0));
    const grade = score >= 75 ? "고성능" : score >= 48 ? "균형형" : "절전형";
    const workers = Math.max(
      1,
      Math.min(6, mobile ? Math.floor(cores / 2) : Math.ceil(cores / 2), memory <= 2 ? 2 : 6),
    );
    return { cores, memory, mobile, score, grade, workers };
  }

  async function diagnose(files, getDimensions) {
    const profile = getDeviceProfile();
    const rows = await mapPool(files, Math.min(3, profile.workers), async (file) => {
      const dimensions = await getDimensions(file);
      const width = Number(dimensions.w || 0);
      const height = Number(dimensions.h || 0);
      const pixels = width * height;
      const risks = [];

      if (file.size > 40 * 1024 * 1024) risks.push("원본 용량 40MB 초과");
      if (pixels > 40_000_000) risks.push("4천만 픽셀 초과");
      if (width > 10_000 || height > 10_000) risks.push("한 변이 10,000px 초과");
      if (profile.memory <= 2 && file.size > 15 * 1024 * 1024) risks.push("저메모리 기기에서 부담 가능");

      return { file, dimensions, pixels, risks };
    });

    const risky = rows.filter((row) => row.risks.length);
    const highRisk = rows.filter((row) => row.risks.length >= 2 || row.pixels > 60_000_000);
    const stability = Math.max(
      20,
      100 - highRisk.length * 18 - (risky.length - highRisk.length) * 7 - (files.length > 60 ? 10 : 0) - (profile.memory <= 2 ? 8 : 0),
    );

    return { profile, rows, risky, highRisk, stability };
  }

  async function recommend(files, { getDimensions, estimates, getKey }) {
    const profile = getDeviceProfile();
    const data = await mapPool(files, Math.min(4, profile.workers), async (file) => {
      const dimensions = await getDimensions(file);
      const width = Number(dimensions.w || 0);
      const height = Number(dimensions.h || 0);
      return {
        file,
        dimensions,
        pixels: width * height,
        large: width > 2400 || height > 2400,
        huge: width * height > 12_000_000,
        heavy: file.size > 4 * 1024 * 1024,
      };
    });

    const large = data.filter((item) => item.large).length;
    const huge = data.filter((item) => item.huge).length;
    const heavy = data.filter((item) => item.heavy).length;
    const avgPixels = sum(data.map((item) => item.pixels)) / Math.max(1, data.length);
    const expected = sum(files.map((file) => estimates.get(getKey(file)) || 0));
    const original = sum(files.map((file) => file.size));

    let quality = 88;
    let resizeMode = "original";
    let resizeValue = 100;
    const reasons = [];

    if (heavy || huge) {
      quality = 82;
      resizeMode = "width";
      resizeValue = profile.memory <= 2 ? 1600 : 1920;
      reasons.push(`${Math.max(heavy, huge)}개 대용량·고해상도 파일은 가로 ${resizeValue}px 최적화가 효율적입니다.`);
    } else if (large) {
      quality = 86;
      resizeMode = "width";
      resizeValue = profile.mobile ? 1920 : 2400;
      reasons.push(`${large}개 고해상도 파일은 가로 ${resizeValue}px로 줄여 웹 품질을 유지합니다.`);
    } else {
      quality = 90;
      reasons.push("현재 해상도는 원본 유지가 적합합니다.");
    }

    if (expected && original && expected / original > 0.8) {
      quality = Math.min(quality, 78);
      reasons.push("현재 예상 절감률이 낮아 품질 78% 이하를 추천합니다.");
    }
    if (avgPixels < 700_000) {
      quality = Math.max(quality, 88);
      reasons.push("작은 이미지는 선명도 유지를 위해 높은 품질을 추천합니다.");
    }
    if (profile.memory <= 2) reasons.push("저메모리 기기에 맞춰 동시 처리량과 권장 해상도를 낮췄습니다.");

    return {
      profile,
      data,
      reasons,
      recommendation: { quality, resizeMode, resizeValue, backgroundMode: "white" },
      metrics: { large, huge, heavy, avgPixels, expected, original },
    };
  }

  async function buildAdaptivePlan(files, getDimensions) {
    const profile = getDeviceProfile();
    const rows = await mapPool(files, Math.min(3, profile.workers), async (file) => {
      const dimensions = await getDimensions(file);
      const pixels = Math.max(0, Number(dimensions.w || 0) * Number(dimensions.h || 0));
      return {
        file,
        pixels,
        weight: Math.max(1, pixels / 8_000_000, file.size / (12 * 1024 * 1024)),
      };
    });

    const totalWeight = sum(rows.map((row) => row.weight));
    const heavy = rows.filter((row) => row.pixels > 30_000_000 || row.file.size > 30 * 1024 * 1024).length;
    let workers = profile.workers;
    if (profile.memory <= 2 || heavy >= 2) workers = Math.min(workers, 2);
    else if (totalWeight > files.length * 2.5) workers = Math.min(workers, 3);
    workers = Math.max(1, Math.min(6, workers));

    let batchSize = Math.max(workers, workers * (profile.memory <= 2 ? 1 : heavy ? 2 : 3));
    if (files.length > 60) batchSize = Math.min(batchSize, Math.max(workers, 12));

    const batches = [];
    for (let index = 0; index < files.length; index += batchSize) batches.push(files.slice(index, index + batchSize));
    return { profile, workers, batchSize, batches, heavy, totalWeight };
  }

  return { getDeviceProfile, diagnose, recommend, buildAdaptivePlan };
}
