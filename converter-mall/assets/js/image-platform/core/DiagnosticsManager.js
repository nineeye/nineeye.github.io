export function createDiagnosticsManager({
  version,
  saveBlob,
  makeZipFromBlobs,
  verifyZipBlob,
  verifyOutput,
  outputMimeType = "image/jpeg",
  outputExtension = "jpg",
  decodeBlobDimensions,
  changeExt,
  uniqueName,
  sanitizeName,
  sum,
  esc,
  probeStorage,
  showToast
}) {
  let lastReport = null;
  let runtimeIssues = [];

  function recordRuntimeIssue(type, message, error) {
    runtimeIssues.push({
      type,
      message: String(message || ""),
      stack: error?.stack || "",
      time: new Date().toISOString()
    });
    if (runtimeIssues.length > 30) runtimeIssues = runtimeIssues.slice(-30);
  }

  function getRuntimeIssues() {
    return runtimeIssues.map(item => ({ ...item }));
  }

  function clearRuntimeIssues() {
    runtimeIssues = [];
  }

  function auditRuntimeBindings(e) {
    const required = [
      "dropZone", "fileInput", "selectFileBtn", "qualityRange", "backgroundMode",
      "resizeMode", "convertBtn", "downloadBtn", "zipDownloadBtn", "resetBtn",
      "systemCheckBtn", "shortcutBtn", "helpBtn"
    ];
    const missing = required.filter(key => !e[key]);
    const handlerChecks = [
      ["파일 선택", e.selectFileBtn, "onclick"],
      ["드롭존", e.dropZone, "onclick"],
      ["품질 슬라이더", e.qualityRange, "oninput"],
      ["배경 설정", e.backgroundMode, "onchange"],
      ["해상도 설정", e.resizeMode, "onchange"],
      ["변환", e.convertBtn, "onclick"],
      ["개별 다운로드", e.downloadBtn, "onclick"],
      ["ZIP 다운로드", e.zipDownloadBtn, "onclick"],
      ["초기화", e.resetBtn, "onclick"],
      ["환경 점검", e.systemCheckBtn, "onclick"],
      ["단축키", e.shortcutBtn, "onclick"],
      ["사용 가이드", e.helpBtn, "onclick"]
    ];
    const disconnected = handlerChecks
      .filter(([, node, prop]) => !node || typeof node[prop] !== "function")
      .map(([name]) => name);
    return {
      ok: missing.length === 0 && disconnected.length === 0,
      missing,
      disconnected,
      checked: handlerChecks.length,
      requiredCount: required.length
    };
  }

  async function runCoreSelfTest() {
    const started = performance.now();
    const specs = [
      { name: "작은-투명.png", w: 16, h: 16, quality: 0.62 },
      { name: "가로-사진.png", w: 320, h: 180, quality: 0.82 },
      { name: "정사각-고화질.png", w: 512, h: 512, quality: 0.94 }
    ];

    try {
      const results = [];
      for (const spec of specs) {
        const canvas = document.createElement("canvas");
        canvas.width = spec.w;
        canvas.height = spec.h;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) throw new Error("Canvas 2D 컨텍스트 생성 실패");

        const gradient = ctx.createLinearGradient(0, 0, spec.w, spec.h);
        gradient.addColorStop(0, "rgba(37,99,235,.22)");
        gradient.addColorStop(0.55, "rgba(16,185,129,.88)");
        gradient.addColorStop(1, "rgba(244,63,94,1)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, spec.w, spec.h);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          Math.max(1, spec.w * 0.2),
          Math.max(1, spec.h * 0.2),
          Math.max(2, spec.w * 0.6),
          Math.max(2, spec.h * 0.6)
        );
        ctx.fillStyle = "#111827";
        ctx.font = `${Math.max(8, Math.round(spec.h * 0.12))}px sans-serif`;
        ctx.fillText(`${spec.w}×${spec.h}`, 4, Math.max(10, spec.h - 5));

        const outputBlob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            blob => blob ? resolve(blob) : reject(new Error(`${spec.name} 이미지 인코딩 실패`)),
            outputMimeType,
            spec.quality
          );
        });
        await verifyOutput(outputBlob);
        const decoded = await decodeBlobDimensions(outputBlob);
        if (decoded.w !== spec.w || decoded.h !== spec.h) {
          throw new Error(`${spec.name} 해상도 검증 실패`);
        }
        results.push({
          source: spec.name,
          name: changeExt(spec.name, outputExtension),
          blob: outputBlob,
          w: decoded.w,
          h: decoded.h,
          quality: spec.quality,
          bytes: outputBlob.size
        });
      }

      const usedNames = [];
      const filenameCases = [
        "중복 이름.png",
        "중복 이름.png",
        "금지문자-테스트-/:*?\"<>|.png",
        `${"매우긴파일명".repeat(18)}.png`,
        ".숨김파일.png",
        "끝에점과공백. .png"
      ];
      const resolvedNames = filenameCases.map((name, index) => {
        const stem = name.replace(/\.[^.]+$/, "");
        const safe = `${sanitizeName(stem) || `image-${index + 1}`}.${outputExtension}`;
        const unique = uniqueName(safe, usedNames);
        usedNames.push(unique);
        return unique;
      });

      if (new Set(resolvedNames).size !== resolvedNames.length) {
        throw new Error("출력 파일명 중복 방지 실패");
      }
      if (resolvedNames.some(name => /[\/:*?"<>|\x00-\x1F]/.test(name))) {
        throw new Error("출력 파일명 금지 문자 정리 실패");
      }
      if (resolvedNames.some(name => name.length > 84)) {
        throw new Error("출력 파일명 길이 제한 실패");
      }
      if (!resolvedNames.some(name => /-2\.jpg$/i.test(name))) {
        throw new Error("출력 파일명 충돌 번호 처리 실패");
      }

      const zipItems = results.map((item, index) => ({
        name: index === 1 ? `테스트 폴더/${item.name}` : item.name,
        blob: item.blob
      }));
      zipItems.push(...resolvedNames.slice(0, 3).map((name, index) => ({
        name: `파일명 감사/${name}`,
        blob: results[index % results.length].blob
      })));

      const zip = await makeZipFromBlobs(zipItems);
      await verifyZipBlob(zip, zipItems.length);
      const names = await readStoredZipNames(zip);
      const expected = zipItems.map(item => item.name);
      if (expected.some((name, index) => names[index] !== name)) {
        throw new Error("ZIP 한글·폴더·특수 파일명 검증 실패");
      }

      return {
        ok: true,
        sampleCount: results.length,
        jpgBytes: sum(results.map(item => item.bytes)),
        zipBytes: zip.size,
        elapsedMs: Math.round(performance.now() - started),
        results: results.map(({ blob, ...item }) => item),
        zipNames: names,
        filenameAudit: {
          source: filenameCases,
          resolved: resolvedNames,
          uniqueCount: new Set(resolvedNames).size
        },
        detail: `${results.length}종 JPG · 파일명 ${resolvedNames.length}종 · 충돌·특수문자·장문명 정상`
      };
    } catch (error) {
      return {
        ok: false,
        sampleCount: 0,
        jpgBytes: 0,
        zipBytes: 0,
        elapsedMs: Math.round(performance.now() - started),
        results: [],
        zipNames: [],
        detail: error?.message || String(error)
      };
    }
  }

  async function readStoredZipNames(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const decoder = new TextDecoder("utf-8");
    const names = [];
    let offset = 0;
    while (offset + 30 <= bytes.length) {
      const view = new DataView(bytes.buffer, bytes.byteOffset + offset, Math.min(30, bytes.length - offset));
      if (view.getUint32(0, true) !== 0x04034b50) break;
      const compressed = view.getUint32(18, true);
      const nameLength = view.getUint16(26, true);
      const extraLength = view.getUint16(28, true);
      const nameStart = offset + 30;
      const nameEnd = nameStart + nameLength;
      if (nameEnd > bytes.length) throw new Error("ZIP 파일명 영역 손상");
      names.push(decoder.decode(bytes.slice(nameStart, nameEnd)));
      offset = nameEnd + extraLength + compressed;
    }
    return names;
  }

  async function runSystemCheck(e, notify = true) {
    const coreSelfTest = await runCoreSelfTest();
    const checks = [
      { name: "Canvas JPG 인코딩", ok: typeof HTMLCanvasElement !== "undefined" && "toBlob" in HTMLCanvasElement.prototype, detail: "PNG를 JPG Blob으로 변환" },
      { name: "고속 이미지 디코딩", ok: "createImageBitmap" in window, detail: "지원 시 대량 이미지 디코딩 가속" },
      { name: "파일·Blob API", ok: typeof File !== "undefined" && typeof Blob !== "undefined" && typeof URL?.createObjectURL === "function", detail: "로컬 파일 읽기와 다운로드" },
      { name: "SHA-256 검증", ok: !!window.crypto?.subtle, detail: "검증 리포트 해시 생성" },
      { name: "브라우저 저장소", ok: probeStorage(localStorage), detail: "설정과 최근 작업 기록" },
      { name: "멀티코어 정보", ok: Number(navigator.hardwareConcurrency || 0) > 0, detail: `감지 코어 ${navigator.hardwareConcurrency || "알 수 없음"}` },
      { name: "오프스크린 캔버스", ok: "OffscreenCanvas" in window, optional: true, detail: "지원 시 백그라운드 렌더링 최적화" },
      { name: "메모리 정보", ok: Number(navigator.deviceMemory || 0) > 0, optional: true, detail: navigator.deviceMemory ? `${navigator.deviceMemory}GB 추정` : "브라우저가 정보를 제공하지 않음" },
      { name: "다중 크기 변환·ZIP 자가 테스트", ok: coreSelfTest.ok, detail: coreSelfTest.ok ? `${coreSelfTest.detail} · ${coreSelfTest.elapsedMs}ms` : coreSelfTest.detail }
    ];

    const audit = auditRuntimeBindings(e);
    checks.push({
      name: "핵심 DOM 연결",
      ok: audit.missing.length === 0,
      detail: audit.missing.length ? `누락: ${audit.missing.join(", ")}` : `필수 요소 ${audit.requiredCount}개 연결`
    });
    checks.push({
      name: "버튼·입력 동작 연결",
      ok: audit.disconnected.length === 0,
      detail: audit.disconnected.length ? `미연결: ${audit.disconnected.join(", ")}` : `핵심 동작 ${audit.checked}개 연결`
    });
    checks.push({
      name: "현재 실행 오류",
      ok: runtimeIssues.length === 0,
      optional: true,
      detail: runtimeIssues.length ? `${runtimeIssues.length}건 기록됨` : "현재 세션 오류 없음"
    });

    const required = checks.filter(item => !item.optional);
    const passed = required.filter(item => item.ok).length;
    const ready = passed === required.length;
    lastReport = {
      version,
      coreSelfTest,
      checkedAt: new Date().toISOString(),
      ready,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform || "",
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      deviceMemory: navigator.deviceMemory || null,
      runtimeAudit: audit,
      runtimeIssues: getRuntimeIssues(),
      checks
    };

    if (e.systemCheckList) {
      e.systemCheckList.innerHTML = checks.map(item => `
        <div class="system-check-item">
          <div>
            <strong>${esc(item.name)}</strong>
            <div class="system-check-meta">${esc(item.detail)}</div>
          </div>
          <strong class="${item.ok ? "system-check-ok" : item.optional ? "system-check-warn" : "system-check-bad"}">
            ${item.ok ? "정상" : item.optional ? "선택 기능 미지원" : "지원 필요"}
          </strong>
        </div>
      `).join("");
    }
    if (e.systemCheckSummary) {
      e.systemCheckSummary.className = ready ? "privacy-note" : "warning-note";
      e.systemCheckSummary.textContent = ready
        ? `필수 기능 ${passed}/${required.length}개 정상 · 변환 준비 완료`
        : `필수 기능 ${passed}/${required.length}개 정상 · 최신 Chrome 또는 Edge 사용 권장`;
    }
    if (notify) {
      showToast(e, ready ? "브라우저 환경 점검을 통과했습니다." : "일부 필수 기능이 부족합니다.");
    }
    return lastReport;
  }

  async function downloadSystemReport(e) {
    const report = lastReport || await runSystemCheck(e, false);
    saveBlob(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
      `converter-mall-system-check-${new Date().toISOString().slice(0, 10)}.json`
    );
    showToast(e, "환경 진단 리포트를 저장했습니다.");
  }

  return {
    recordRuntimeIssue,
    getRuntimeIssues,
    clearRuntimeIssues,
    auditRuntimeBindings,
    runCoreSelfTest,
    runSystemCheck,
    downloadSystemReport,
    getLastReport: () => lastReport
  };
}
