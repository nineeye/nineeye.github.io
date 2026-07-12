const TARGET_PROFILES = Object.freeze({
  JPG: {
    purpose: "사진·웹 업로드·쇼핑몰처럼 넓은 호환성과 작은 용량이 필요한 작업에 적합합니다.",
    differences: ["투명도를 지원하지 않아 배경색 합성이 필요합니다.", "손실 압축이므로 품질을 낮출수록 파일은 작아지지만 세부 묘사가 줄어듭니다."],
    recommendations: ["사진은 82~92% 품질", "텍스트·로고는 92% 이상 또는 PNG 유지", "투명 영역은 흰색·브랜드 색상으로 지정"],
    warnings: ["투명 PNG는 JPG 변환 후 투명도가 사라집니다.", "반복 저장하면 압축 손실이 누적될 수 있습니다."],
    settingLabel: "사진·문자 보호·배경·해상도",
    pro: "대량 규격화, 색상 프로파일, 고급 샤프닝"
  },
  JPEG: {
    purpose: "사진·웹 업로드·쇼핑몰처럼 넓은 호환성과 작은 용량이 필요한 작업에 적합합니다.",
    differences: ["JPG와 같은 JPEG 계열이며 확장자 표기만 다릅니다.", "투명도를 지원하지 않고 손실 압축을 사용합니다."],
    recommendations: ["호환성 요구에 따라 .jpeg 확장자 선택", "사진은 82~92% 품질", "투명 영역 배경색 확인"],
    warnings: ["투명도는 보존되지 않습니다.", "품질을 과도하게 낮추면 블록 노이즈가 생길 수 있습니다."],
    settingLabel: "사진·문자 보호·배경·해상도",
    pro: "대량 규격화, 색상 프로파일, 고급 샤프닝"
  },
  WEBP: {
    purpose: "웹사이트와 모바일 서비스에서 화질 대비 용량을 줄이고 투명 배경을 유지하는 데 적합합니다.",
    differences: ["투명도를 유지하거나 원하는 배경색으로 평탄화할 수 있습니다.", "브라우저 인코더 특성상 결과 용량이 브라우저별로 조금 다를 수 있습니다."],
    recommendations: ["웹 일반 75~88%", "투명 로고·UI는 90% 이상", "불필요한 투명 여백은 자동 잘라내기로 제거"],
    warnings: ["일부 오래된 프로그램은 WEBP를 열지 못할 수 있습니다.", "최고품질 100%는 무손실을 보장하는 옵션이 아닙니다."],
    settingLabel: "웹 프로필·투명도·여백·크기",
    pro: "진짜 무손실 인코더, 메타데이터 제어, 다중 해상도 출력"
  },
  PNG: {
    purpose: "투명 배경, 로고, UI, 캡처처럼 픽셀 정확도와 무손실 보존이 중요한 작업에 적합합니다.",
    differences: ["무손실 형식이라 품질 슬라이더가 필요하지 않습니다.", "사진은 JPG·WEBP보다 용량이 커질 수 있습니다."],
    recommendations: ["투명도 유지가 필요할 때 선택", "사진은 WEBP/JPG와 용량 비교", "리사이즈가 필요 없으면 원본 해상도 유지"],
    warnings: ["애니메이션 입력은 첫 프레임만 처리될 수 있습니다.", "큰 사진을 PNG로 바꾸면 결과 용량이 크게 증가할 수 있습니다."],
    settingLabel: "투명도·해상도·무손실",
    pro: "색상 수 최적화, 고급 압축, 메타데이터 보존"
  }
});

const SOURCE_NOTES = Object.freeze({
  GIF: "애니메이션 GIF는 현재 브라우저 디코딩 결과에 따라 첫 프레임만 변환될 수 있습니다.",
  AVIF: "AVIF 디코딩 지원 여부는 브라우저 버전에 따라 달라질 수 있습니다.",
  SVG: "SVG의 벡터 정보는 래스터 이미지로 변환되며 확대 가능한 경로 정보는 유지되지 않습니다.",
  BMP: "BMP 원본은 용량이 큰 편이므로 변환 전 메모리 사용량을 확인하세요.",
  WEBP: "WEBP는 애니메이션과 투명도를 포함할 수 있으므로 프레임과 알파 처리 설정을 확인하세요.",
  JPG: "JPG는 이미 손실 압축된 형식이므로 다시 손실 형식으로 저장하면 품질 저하가 누적될 수 있습니다.",
  JPEG: "JPEG는 이미 손실 압축된 형식이므로 다시 손실 형식으로 저장하면 품질 저하가 누적될 수 있습니다."
});

function li(items = []) { return items.map(item => `<li>${escapeHtml(item)}</li>`).join(""); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

export function resolveFormatSpecialization(definition) {
  const target = String(definition?.target?.format || "").toUpperCase();
  const source = String(definition?.source?.format || "").toUpperCase();
  const base = TARGET_PROFILES[target] || {
    purpose: `${target} 형식의 호환성과 사용 목적에 맞춰 변환합니다.`,
    differences: ["출력 형식의 특성에 따라 파일 크기와 표현 방식이 달라질 수 있습니다."],
    recommendations: ["변환 전 미리보기와 예상 용량을 확인하세요."],
    warnings: ["중요한 원본 파일은 별도로 보관하세요."],
    settingLabel: "형식별 변환 옵션",
    pro: "고급 배치 처리와 전문 설정"
  };
  const override = definition?.specialization || {};
  const sourceNote = SOURCE_NOTES[source];
  return {
    ...base,
    ...override,
    differences: [...(override.differences || base.differences || [])],
    recommendations: [...(override.recommendations || base.recommendations || [])],
    warnings: [...(override.warnings || base.warnings || []), ...(sourceNote ? [sourceNote] : [])]
  };
}

function renderJpegSettings(panel) {
  panel.innerHTML = `
    <div class="format-settings-head"><div><span>PNG → JPEG 전용 설정</span><h3>사진과 문자·로고를 다르게 보호합니다</h3></div><span class="format-settings-badge">실제 엔진 적용</span></div>
    <div class="format-settings-grid">
      <label class="format-field"><span>이미지 성격</span><select id="formatContentMode"><option value="photo">사진 중심</option><option value="mixed">사진+문자 혼합</option><option value="text">문자·로고 중심</option></select><small>선택에 따라 권장 품질과 선명도 보정이 달라집니다.</small></label>
      <label class="format-field"><span>색상 모드</span><select id="formatColorMode"><option value="color">컬러 유지</option><option value="grayscale">그레이스케일</option></select><small>흑백 문서·스캔은 그레이스케일로 용량을 줄일 수 있습니다.</small></label>
      <label class="format-field"><span>축소 후 선명도</span><select id="formatSharpen"><option value="off">보정 없음</option><option value="mild">약하게</option><option value="strong">강하게</option></select><small>축소 이미지의 문자와 경계를 실제 픽셀 보정합니다.</small></label>
      <div class="format-quick-presets"><span>빠른 전문 프리셋</span><div><button type="button" data-format-preset="jpeg-photo">사진 균형</button><button type="button" data-format-preset="jpeg-text">문자 보호</button><button type="button" data-format-preset="jpeg-small">최소 용량</button></div></div>
    </div>`;
}

function renderWebpSettings(panel) {
  panel.innerHTML = `
    <div class="format-settings-head"><div><span>PNG → WEBP 전용 설정</span><h3>투명도와 웹 전송 효율을 함께 조절합니다</h3></div><span class="format-settings-badge">실제 엔진 적용</span></div>
    <div class="format-settings-grid">
      <label class="format-field"><span>WEBP 프로필</span><select id="formatContentMode"><option value="balanced">웹 균형</option><option value="photo">사진 중심</option><option value="graphic">로고·UI 중심</option><option value="maximum">최고품질</option></select><small>최고품질은 브라우저 인코더의 품질 100%이며 진짜 무손실을 보장하지 않습니다.</small></label>
      <label class="format-field"><span>알파 채널 처리</span><select id="formatAlphaMode"><option value="preserve">투명도 유지</option><option value="flatten">배경색으로 평탄화</option></select><small>호환성이 중요한 환경에서는 평탄화를 선택할 수 있습니다.</small></label>
      <label id="formatBackgroundWrap" class="format-field" hidden><span>평탄화 배경색</span><input id="formatBackgroundColor" type="color" value="#ffffff"><small>투명 픽셀을 선택한 색상으로 합성합니다.</small></label>
      <label class="format-check-field"><input id="formatTrimTransparent" type="checkbox"><span><strong>투명 여백 자동 잘라내기</strong><small>가장자리의 완전 투명 영역을 실제로 제거합니다.</small></span></label>
      <label id="formatTrimThresholdWrap" class="format-field" hidden><span>투명도 임계값</span><input id="formatTrimThreshold" type="range" min="0" max="32" value="2"><small>값이 높을수록 반투명 가장자리까지 더 적극적으로 제거합니다.</small></label>
      <div class="format-quick-presets"><span>빠른 웹 프리셋</span><div><button type="button" data-format-preset="webp-balanced">웹 균형</button><button type="button" data-format-preset="webp-logo">투명 로고</button><button type="button" data-format-preset="webp-small">초경량</button></div></div>
    </div>`;
}


function renderAvifSourceSettings(panel, target) {
  const alpha = target === "JPG" || target === "JPEG" ? "" : `
      <label class="format-field"><span>알파 채널 처리</span><select id="formatAlphaMode"><option value="preserve">투명도 유지</option><option value="flatten">배경색으로 평탄화</option></select><small>출력 형식과 사용 프로그램의 투명도 호환성을 고려하세요.</small></label>
      <label id="formatBackgroundWrap" class="format-field" hidden><span>평탄화 배경색</span><input id="formatBackgroundColor" type="color" value="#ffffff"><small>투명 영역을 선택 색상으로 합성합니다.</small></label>`;
  panel.innerHTML = `
    <div class="format-settings-head"><div><span>AVIF 입력 전문 설정</span><h3>고효율 원본의 디테일과 알파를 목적에 맞게 해석합니다</h3></div><span class="format-settings-badge">입력 형식 인식</span></div>
    <div class="format-settings-grid">
      <label class="format-field"><span>원본 성격</span><select id="formatContentMode"><option value="photo">사진·그라데이션</option><option value="mixed">사진+문자 혼합</option><option value="graphic">로고·UI 그래픽</option></select><small>AVIF의 미세 디테일을 출력 형식에 맞춰 보정합니다.</small></label>
      <label class="format-field"><span>색상 출력</span><select id="formatColorMode"><option value="color">컬러 유지</option><option value="grayscale">그레이스케일</option></select><small>브라우저 디코더가 표시한 색상을 기준으로 변환합니다.</small></label>
      <label class="format-field"><span>디테일 보정</span><select id="formatSharpen"><option value="off">보정 없음</option><option value="mild">약하게</option><option value="strong">강하게</option></select><small>축소하거나 다시 압축할 때 경계 선명도를 보완합니다.</small></label>
      ${alpha}
    </div>`;
}

function renderGifSourceSettings(panel, target) {
  const alpha = target === "JPG" || target === "JPEG" ? `
      <label class="format-field"><span>투명 배경</span><input id="formatBackgroundColor" type="color" value="#ffffff"><small>JPG는 투명도를 지원하지 않아 선택 색상으로 합성됩니다.</small></label>` : `
      <label class="format-field"><span>알파 채널 처리</span><select id="formatAlphaMode"><option value="preserve">투명도 유지</option><option value="flatten">배경색으로 평탄화</option></select><small>GIF의 단일 투명색을 출력 알파로 유지하거나 합성합니다.</small></label>
      <label id="formatBackgroundWrap" class="format-field" hidden><span>평탄화 배경색</span><input id="formatBackgroundColor" type="color" value="#ffffff"></label>`;
  panel.innerHTML = `
    <div class="format-settings-head"><div><span>GIF 입력 전문 설정</span><h3>애니메이션에서 사용할 프레임을 직접 선택합니다</h3></div><span class="format-settings-badge">프레임 선택</span></div>
    <div class="format-settings-grid">
      <label class="format-field"><span>추출 프레임</span><select id="formatGifFrameMode"><option value="first">첫 프레임</option><option value="middle">가운데 프레임</option><option value="last">마지막 프레임</option><option value="index">프레임 번호 직접 지정</option></select><small>지원 브라우저에서는 실제 애니메이션 프레임을 디코딩합니다.</small></label>
      <label id="formatGifFrameIndexWrap" class="format-field" hidden><span>프레임 번호</span><input id="formatGifFrameIndex" type="number" min="1" value="1"><small>범위를 넘으면 마지막 프레임으로 자동 조정됩니다.</small></label>
      ${alpha}
      <label class="format-field"><span>축소 후 선명도</span><select id="formatSharpen"><option value="off">보정 없음</option><option value="mild">약하게</option><option value="strong">강하게</option></select><small>작은 GIF를 확대할 때는 과도한 보정을 피하세요.</small></label>
    </div>`;
}

function renderSvgSourceSettings(panel, target) {
  const alpha = target === "JPG" || target === "JPEG" ? `
      <label class="format-field"><span>래스터 배경색</span><input id="formatBackgroundColor" type="color" value="#ffffff"><small>JPG 출력 시 SVG의 투명 영역에 적용됩니다.</small></label>` : `
      <label class="format-field"><span>알파 채널 처리</span><select id="formatAlphaMode"><option value="preserve">투명도 유지</option><option value="flatten">배경색으로 평탄화</option></select></label>
      <label id="formatBackgroundWrap" class="format-field" hidden><span>평탄화 배경색</span><input id="formatBackgroundColor" type="color" value="#ffffff"></label>`;
  panel.innerHTML = `
    <div class="format-settings-head"><div><span>SVG 래스터화 전문 설정</span><h3>벡터를 필요한 픽셀 밀도로 렌더링합니다</h3></div><span class="format-settings-badge">벡터 → 픽셀</span></div>
    <div class="format-settings-grid">
      <label class="format-field"><span>렌더링 배율</span><select id="formatSvgScale"><option value="1">1× 기본</option><option value="2">2× 고해상도</option><option value="3">3× 초고해상도</option><option value="4">4× 인쇄·대형 화면</option></select><small>배율이 높을수록 선명하지만 메모리와 결과 용량이 증가합니다.</small></label>
      <label class="format-field"><span>색상 출력</span><select id="formatColorMode"><option value="color">컬러 유지</option><option value="grayscale">그레이스케일</option></select></label>
      <label class="format-field"><span>경계 보정</span><select id="formatSharpen"><option value="off">보정 없음</option><option value="mild">약하게</option><option value="strong">강하게</option></select><small>작은 문자·아이콘을 축소 출력할 때 유용합니다.</small></label>
      ${alpha}
    </div>`;
}

function renderBmpSourceSettings(panel, target) {
  const alpha = target === "JPG" || target === "JPEG" ? `
      <label class="format-field"><span>배경색</span><input id="formatBackgroundColor" type="color" value="#ffffff"><small>32비트 BMP의 투명 영역을 JPG 배경으로 합성합니다.</small></label>` : `
      <label class="format-field"><span>32비트 알파 해석</span><select id="formatBmpAlphaMode"><option value="auto">자동 감지</option><option value="preserve">알파 유지</option><option value="opaque">모두 불투명 처리</option></select><small>일부 구형 BMP는 알파 바이트가 있어도 투명도가 아닌 예약값으로 사용됩니다.</small></label>`;
  panel.innerHTML = `
    <div class="format-settings-head"><div><span>BMP 입력 전문 설정</span><h3>레거시 비트맵의 알파와 색상을 안전하게 해석합니다</h3></div><span class="format-settings-badge">호환성 중심</span></div>
    <div class="format-settings-grid">
      ${alpha}
      <label class="format-field"><span>색상 출력</span><select id="formatColorMode"><option value="color">컬러 유지</option><option value="grayscale">그레이스케일</option></select></label>
      <label class="format-field"><span>축소 후 선명도</span><select id="formatSharpen"><option value="off">보정 없음</option><option value="mild">약하게</option><option value="strong">강하게</option></select><small>스크린샷·UI 비트맵에는 약한 보정이 유용할 수 있습니다.</small></label>
    </div>`;
}


function renderJpgSourceSettings(panel, target) {
  panel.innerHTML = `
    <div class="format-settings-head"><div><span>JPG 입력 전문 설정</span><h3>이미 누적된 JPEG 손실을 과도하게 증폭하지 않도록 보정합니다</h3></div><span class="format-settings-badge">재압축 보호</span></div>
    <div class="format-settings-grid">
      <label class="format-field"><span>원본 성격</span><select id="formatContentMode"><option value="photo">사진 중심</option><option value="mixed">사진+문자 혼합</option><option value="text">문서·문자 중심</option></select><small>문자 중심일수록 높은 출력 품질과 약한 선명도 보정을 권장합니다.</small></label>
      <label class="format-field"><span>JPEG 블록 노이즈 완화</span><select id="formatArtifactMode"><option value="off">원본 유지</option><option value="mild">약하게 완화</option><option value="strong">강하게 완화</option></select><small>저품질 JPG의 8×8 블록과 링잉을 부드럽게 합니다. 강한 완화는 세부 묘사를 줄일 수 있습니다.</small></label>
      <label class="format-field"><span>색상 출력</span><select id="formatColorMode"><option value="color">컬러 유지</option><option value="grayscale">그레이스케일</option></select><small>문서 스캔은 그레이스케일로 결과 용량을 줄일 수 있습니다.</small></label>
      <label class="format-field"><span>축소 후 선명도</span><select id="formatSharpen"><option value="off">보정 없음</option><option value="mild">약하게</option><option value="strong">강하게</option></select><small>블록 완화를 사용했다면 강한 선명도는 피하는 것이 좋습니다.</small></label>
      <div class="format-quick-presets"><span>빠른 입력 복원 프리셋</span><div><button type="button" data-format-preset="jpg-clean-photo">사진 자연스럽게</button><button type="button" data-format-preset="jpg-document">문서 선명하게</button><button type="button" data-format-preset="jpg-legacy">저화질 JPG 완화</button></div></div>
    </div>`;
}

function renderWebpSourceSettings(panel, target) {
  const alpha = target === "JPG" || target === "JPEG" ? `
      <label class="format-field"><span>투명 영역 배경색</span><input id="formatBackgroundColor" type="color" value="#ffffff"><small>JPG는 투명도를 지원하지 않아 선택 색상으로 합성됩니다.</small></label>` : `
      <label class="format-field"><span>알파 채널 처리</span><select id="formatAlphaMode"><option value="preserve">투명도 유지</option><option value="flatten">배경색으로 평탄화</option></select><small>PNG 출력에서는 투명도를 유지하는 것이 일반적입니다.</small></label>
      <label id="formatBackgroundWrap" class="format-field" hidden><span>평탄화 배경색</span><input id="formatBackgroundColor" type="color" value="#ffffff"></label>`;
  panel.innerHTML = `
    <div class="format-settings-head"><div><span>WEBP 입력 전문 설정</span><h3>애니메이션 프레임과 투명도를 출력 목적에 맞게 선택합니다</h3></div><span class="format-settings-badge">프레임·알파 인식</span></div>
    <div class="format-settings-grid">
      <label class="format-field"><span>추출 프레임</span><select id="formatSourceFrameMode"><option value="first">첫 프레임</option><option value="middle">가운데 프레임</option><option value="last">마지막 프레임</option><option value="index">프레임 번호 직접 지정</option></select><small>정지 WEBP는 항상 첫 프레임 하나만 사용됩니다.</small></label>
      <label id="formatSourceFrameIndexWrap" class="format-field" hidden><span>프레임 번호</span><input id="formatSourceFrameIndex" type="number" min="1" value="1"><small>범위를 넘으면 마지막 프레임으로 자동 조정됩니다.</small></label>
      ${alpha}
      <label class="format-field"><span>색상 출력</span><select id="formatColorMode"><option value="color">컬러 유지</option><option value="grayscale">그레이스케일</option></select></label>
      <label class="format-check-field"><input id="formatTrimTransparent" type="checkbox"><span><strong>투명 여백 자동 잘라내기</strong><small>투명 WEBP 가장자리의 불필요한 여백을 제거합니다.</small></span></label>
      <label id="formatTrimThresholdWrap" class="format-field" hidden><span>투명도 임계값</span><input id="formatTrimThreshold" type="range" min="0" max="32" value="2"><small>반투명 그림자가 잘리지 않도록 낮은 값부터 사용하세요.</small></label>
      <label class="format-field"><span>축소 후 선명도</span><select id="formatSharpen"><option value="off">보정 없음</option><option value="mild">약하게</option><option value="strong">강하게</option></select></label>
    </div>`;
}

function installFormatSettings(definition) {
  const panel = document.getElementById("formatSettingsPanel");
  if (!panel) return;
  const source = String(definition?.source?.format || "").toUpperCase();
  const target = String(definition?.target?.format || "").toUpperCase();
  if (source === "PNG" && ["JPG", "JPEG"].includes(target)) renderJpegSettings(panel);
  else if (source === "PNG" && target === "WEBP") renderWebpSettings(panel);
  else if (source === "AVIF") renderAvifSourceSettings(panel, target);
  else if (source === "GIF") renderGifSourceSettings(panel, target);
  else if (source === "SVG") renderSvgSourceSettings(panel, target);
  else if (source === "BMP") renderBmpSourceSettings(panel, target);
  else if (["JPG", "JPEG"].includes(source)) renderJpgSourceSettings(panel, target);
  else if (source === "WEBP") renderWebpSourceSettings(panel, target);
  else { panel.hidden = true; panel.innerHTML = ""; return; }
  panel.hidden = false;
}

export function applyFormatSpecialization(definition) {
  const profile = resolveFormatSpecialization(definition);
  const section = document.getElementById("formatProfileSection");
  if (section) {
    section.hidden = false;
    section.innerHTML = `
      <div class="format-profile-head">
        <div><span class="format-profile-kicker">FORMAT SPECIALIST</span><h2>${escapeHtml(definition.title)}에 맞춘 변환 설계</h2></div>
        <span class="format-profile-badge">형식 최적화</span>
      </div>
      <p class="format-profile-purpose">${escapeHtml(profile.purpose)}</p>
      <div class="format-profile-grid">
        <article><h3>무엇이 달라지나요?</h3><ul>${li(profile.differences)}</ul></article>
        <article><h3>권장 설정</h3><ul>${li(profile.recommendations)}</ul></article>
        <article class="format-warning"><h3>변환 전 확인</h3><ul>${li(profile.warnings)}</ul></article>
        <article class="format-pro"><h3>PRO 확장 방향</h3><p>${escapeHtml(profile.pro)}</p></article>
      </div>`;
  }
  installFormatSettings(definition);
  const headerText = document.getElementById("converterPurposeText");
  if (headerText) headerText.textContent = profile.purpose;
  const workflow = document.querySelector("#workflowSettings small");
  if (workflow) workflow.textContent = profile.settingLabel || "형식별 변환 옵션";
  const helpIntro = document.getElementById("formatHelpIntro");
  if (helpIntro) helpIntro.textContent = profile.purpose;
}
