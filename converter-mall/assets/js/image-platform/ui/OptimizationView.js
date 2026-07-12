/**
 * Presentation layer for device/file diagnosis and smart optimization advice.
 * Keeps DOM rendering out of the reusable OptimizationAdvisor engine.
 */
export function createOptimizationView({ advisor, escapeHtml, showToast }) {
  if (!advisor) throw new TypeError("advisor is required");

  async function diagnose({ e, files, selectedKeys, keyOf, getDimensions, notify = false }) {
    if (!e?.deviceGrade) return null;
    const targets = files.filter((file) => selectedKeys.has(keyOf(file)));
    const profile = advisor.getDeviceProfile();
    e.deviceGrade.textContent = `${profile.grade} · ${profile.cores}코어${navigator.deviceMemory ? ` · ${profile.memory}GB 추정` : ""}`;
    e.recommendedWorkers.textContent = `${profile.workers}개 동시 처리`;

    if (!targets.length) {
      e.highRiskCount.textContent = "0개";
      e.stabilityScore.textContent = "-";
      e.riskList.innerHTML = "<li>파일을 선택하면 자동으로 진단합니다.</li>";
      return { profile, rows: [], risky: [], highRisk: [], stability: null };
    }

    const result = await advisor.diagnose(targets, getDimensions);
    e.highRiskCount.textContent = `${result.highRisk.length}개`;
    e.stabilityScore.textContent = `${result.stability}점`;

    const messages = [
      `<li class="risk-ok">${targets.length}개 파일 진단 완료 · ${result.profile.grade} 프로필 · 권장 ${result.profile.workers}개 병렬 처리</li>`,
    ];
    if (!result.risky.length) messages.push('<li class="risk-ok">현재 선택 파일에서 특별한 위험 요소가 발견되지 않았습니다.</li>');
    for (const row of result.highRisk.slice(0, 5)) {
      messages.push(`<li class="risk-high"><strong>${escapeHtml(row.file.name)}</strong>: ${row.risks.join(", ")}</li>`);
    }
    for (const row of result.risky.filter((item) => !result.highRisk.includes(item)).slice(0, 5)) {
      messages.push(`<li class="risk-warn"><strong>${escapeHtml(row.file.name)}</strong>: ${row.risks.join(", ")}</li>`);
    }
    if (targets.length > 60) messages.push('<li class="risk-warn">60개 이상은 여러 묶음으로 나누면 메모리 안정성이 더 높습니다.</li>');
    if (result.profile.memory <= 2) messages.push('<li class="risk-warn">저메모리 기기로 감지되어 큰 이미지는 1920px 이하 축소를 권장합니다.</li>');
    e.riskList.innerHTML = messages.join("");
    if (notify) showToast(e, `파일 진단 완료 · 안정성 ${result.stability}점`);
    return result;
  }

  async function analyze({ e, files, selectedKeys, keyOf, getDimensions, estimates }) {
    const targets = files.filter((file) => selectedKeys.has(keyOf(file)));
    if (!targets.length) return null;
    e.analyzeBtn.disabled = true;
    e.smartSummary.textContent = "이미지 크기·용량·투명도를 분석하고 있습니다...";
    try {
      const result = await advisor.recommend(targets, { getDimensions, estimates, getKey: keyOf });
      const recommendation = result.recommendation;
      e.smartSummary.textContent = `${targets.length}개 분석 완료 · 추천 품질 ${recommendation.quality}%${recommendation.resizeMode === "width" ? ` · 가로 ${recommendation.resizeValue}px` : " · 원본 해상도 유지"}`;
      e.smartList.innerHTML = result.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("") + "<li>외부 AI API 없이 브라우저 규칙 엔진으로 분석했습니다.</li>";
      e.applySmartBtn.disabled = false;
      showToast(e, "스마트 최적화 분석이 완료됐습니다.");
      return recommendation;
    } finally {
      e.analyzeBtn.disabled = false;
    }
  }

  function apply({ e, recommendation, syncSettings, persistSettings, invalidateResults, scheduleEstimate }) {
    if (!recommendation) return false;
    e.qualityRange.value = recommendation.quality;
    e.resizeMode.value = recommendation.resizeMode;
    e.resizeValue.value = recommendation.resizeValue;
    e.backgroundMode.value = recommendation.backgroundMode;
    syncSettings(e);
    persistSettings(e);
    invalidateResults();
    scheduleEstimate(e);
    showToast(e, "추천 설정을 적용했습니다.");
    return true;
  }

  return { diagnose, analyze, apply };
}
