/** BMP → PNG converter definition. */
export const BMP_PNG_DEFINITION = Object.freeze({
  "id": "bmp-png",
  "stage": 100,
  "version": "1.22.0",
  "runtimeVersion": "v1.22.0-source-aware",
  "title": "BMP → PNG",
  "description": "BMP 이미지를 고품질 PNG 형식으로 변환합니다.",
  "source": {
    "format": "BMP",
    "extensions": [
      "bmp"
    ],
    "mimeTypes": [
      "image/bmp",
      "image/x-ms-bmp"
    ],
    "emptyMessage": "BMP 파일만 업로드할 수 있습니다."
  },
  "target": {
    "format": "PNG",
    "extension": "png",
    "mimeType": "image/png"
  },
  "features": {
    "quality": false,
    "transparencyHandling": false,
    "preserveAlpha": true,
    "resize": true,
    "purposePresets": false,
    "smartOptimization": true,
    "perFileSettings": true,
    "comparison": true,
    "reports": true
  },

  "specialization": {
    "purpose": "BMP의 비트 깊이와 레거시 알파 해석 차이를 고려해 호환성 중심으로 변환합니다.",
    "differences": [
      "32비트 BMP의 알파 바이트는 프로그램에 따라 투명도 또는 예약값으로 해석될 수 있습니다.",
      "구형 BMP는 파일 용량과 메모리 사용량이 클 수 있습니다."
    ],
    "recommendations": [
      "입력 형식 전용 설정을 먼저 확인하세요.",
      "미리보기와 예상 용량을 확인한 뒤 변환하세요."
    ],
    "warnings": [
      "32비트 BMP의 알파 바이트는 프로그램에 따라 투명도 또는 예약값으로 해석될 수 있습니다.",
      "구형 BMP는 파일 용량과 메모리 사용량이 클 수 있습니다."
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
    "settings": "converterMall.bmppng.settings.v1",
    "history": "converterMall.bmppng.history.v1",
    "session": "converterMall.bmppng.session.v1",
    "theme": "converterMall.theme",
    "downloadReceipt": "converterMall.bmppng.lastDownload.v1"
  },
  "defaults": {
    "quality": 0.9,
    "background": "#ffffff",
    "resizeMode": "original",
    "resizeValue": 1920,
    "zipName": "converter-mall-bmp-to-png"
  }
});

export default BMP_PNG_DEFINITION;
