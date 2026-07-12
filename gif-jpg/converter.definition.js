/** GIF → JPG converter definition. */
export const GIF_JPG_DEFINITION = Object.freeze({
  "id": "gif-jpg",
  "stage": 100,
  "version": "1.22.0",
  "runtimeVersion": "v1.22.0-source-aware",
  "title": "GIF → JPG",
  "description": "GIF 이미지를 JPG 형식으로 변환합니다. 애니메이션 GIF에서 첫·가운데·마지막 또는 지정 프레임을 선택해 변환합니다.",
  "source": {
    "format": "GIF",
    "extensions": [
      "gif"
    ],
    "mimeTypes": [
      "image/gif"
    ],
    "emptyMessage": "GIF 파일만 업로드할 수 있습니다."
  },
  "target": {
    "format": "JPG",
    "extension": "jpg",
    "mimeType": "image/jpeg"
  },
  "features": {
    "quality": true,
    "transparencyHandling": true,
    "preserveAlpha": false,
    "resize": true,
    "purposePresets": true,
    "smartOptimization": true,
    "perFileSettings": true,
    "comparison": true,
    "reports": true
  },

  "specialization": {
    "purpose": "애니메이션 GIF에서 원하는 한 프레임을 골라 정지 이미지로 변환합니다.",
    "differences": [
      "ImageDecoder 지원 브라우저에서는 첫·가운데·마지막·지정 프레임을 실제 추출합니다.",
      "미지원 브라우저는 첫 프레임으로 안전하게 대체됩니다."
    ],
    "recommendations": [
      "입력 형식 전용 설정을 먼저 확인하세요.",
      "미리보기와 예상 용량을 확인한 뒤 변환하세요."
    ],
    "warnings": [
      "ImageDecoder 지원 브라우저에서는 첫·가운데·마지막·지정 프레임을 실제 추출합니다.",
      "미지원 브라우저는 첫 프레임으로 안전하게 대체됩니다."
    ],
    "settingLabel": "입력 형식 해석·출력 품질·호환성",
    "pro": "대량 배치, 고급 코덱, 색상 프로파일과 메타데이터 제어"
  },
  "limits": {
    "maxFiles": 100,
    "maxFileSize": 104857600,
    "maxPixels": 80000000,
    "maxEstimateCacheBytes": 188743680
  },
  "storageKeys": {
    "settings": "converterMall.gifjpg.settings.v1",
    "history": "converterMall.gifjpg.history.v1",
    "session": "converterMall.gifjpg.session.v1",
    "theme": "converterMall.theme",
    "downloadReceipt": "converterMall.gifjpg.lastDownload.v1"
  },
  "defaults": {
    "quality": 0.9,
    "background": "#ffffff",
    "resizeMode": "original",
    "resizeValue": 1920,
    "zipName": "converter-mall-gif-to-jpg"
  }
});

export default GIF_JPG_DEFINITION;
