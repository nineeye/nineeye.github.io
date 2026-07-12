/** AVIF → JPG converter definition. */
export const AVIF_JPG_DEFINITION = Object.freeze({
  "id": "avif-jpg",
  "stage": 100,
  "version": "1.22.0",
  "runtimeVersion": "v1.22.0-source-aware",
  "title": "AVIF → JPG",
  "description": "AVIF 이미지를 고품질 JPG 형식으로 변환합니다.",
  "source": {
    "format": "AVIF",
    "extensions": [
      "avif"
    ],
    "mimeTypes": [
      "image/avif"
    ],
    "emptyMessage": "AVIF 파일만 업로드할 수 있습니다."
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
    "purpose": "AVIF는 고효율 압축·고색심도·알파를 지원하지만 브라우저 디코더를 거치며 HDR·원본 비트 심도는 일반 8비트 래스터 출력으로 단순화될 수 있습니다.",
    "differences": [
      "브라우저 AVIF 디코딩 지원이 필요합니다.",
      "HDR·10/12비트 정보는 출력 형식에서 유지되지 않을 수 있습니다."
    ],
    "recommendations": [
      "입력 형식 전용 설정을 먼저 확인하세요.",
      "미리보기와 예상 용량을 확인한 뒤 변환하세요."
    ],
    "warnings": [
      "브라우저 AVIF 디코딩 지원이 필요합니다.",
      "HDR·10/12비트 정보는 출력 형식에서 유지되지 않을 수 있습니다."
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
    "settings": "converterMall.avifjpg.settings.v1",
    "history": "converterMall.avifjpg.history.v1",
    "session": "converterMall.avifjpg.session.v1",
    "theme": "converterMall.theme",
    "downloadReceipt": "converterMall.avifjpg.lastDownload.v1"
  },
  "defaults": {
    "quality": 0.9,
    "background": "#ffffff",
    "resizeMode": "original",
    "resizeValue": 1920,
    "zipName": "converter-mall-avif-to-jpg"
  }
});

export default AVIF_JPG_DEFINITION;
