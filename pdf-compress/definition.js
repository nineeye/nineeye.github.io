window.PDF_TOOL_DEFINITION = {
  "id": "pdf-compress",
  "title": "PDF 압축",
  "description": "문서 목적별 프리셋과 구조 최적화·이미지 재구성 방식으로 PDF 용량을 줄입니다.",
  "mode": "compress",
  "multiple": false,
  "optionsTitle": "압축 목적과 세부 설정",
  "options": [
    {
      "id": "preset",
      "label": "사용 목적 프리셋",
      "type": "select",
      "value": "custom",
      "values": [
        {
          "value": "custom",
          "label": "사용자 지정"
        },
        {
          "value": "screen",
          "label": "화면 보기용 · 작은 용량"
        },
        {
          "value": "email",
          "label": "이메일 첨부용 · 균형"
        },
        {
          "value": "print",
          "label": "인쇄 유지 · 선명도 우선"
        }
      ]
    },
    {
      "id": "method",
      "label": "압축 방식",
      "type": "select",
      "value": "lossless",
      "values": [
        {
          "value": "lossless",
          "label": "무손실 구조 최적화"
        },
        {
          "value": "raster",
          "label": "페이지 이미지 재구성"
        }
      ]
    },
    {
      "id": "rasterDpi",
      "label": "재구성 해상도",
      "type": "select",
      "value": "120",
      "showWhen": {
        "id": "method",
        "equals": "raster"
      },
      "values": [
        {
          "value": "96",
          "label": "96 DPI · 화면용"
        },
        {
          "value": "120",
          "label": "120 DPI · 균형"
        },
        {
          "value": "150",
          "label": "150 DPI · 선명도"
        },
        {
          "value": "200",
          "label": "200 DPI · 인쇄 보존"
        }
      ]
    },
    {
      "id": "imageQuality",
      "label": "JPEG 품질 (35~95)",
      "type": "number",
      "value": "72",
      "min": 35,
      "max": 95,
      "showWhen": {
        "id": "method",
        "equals": "raster"
      }
    },
    {
      "id": "colorMode",
      "label": "색상",
      "type": "select",
      "value": "color",
      "showWhen": {
        "id": "method",
        "equals": "raster"
      },
      "values": [
        {
          "value": "color",
          "label": "컬러 유지"
        },
        {
          "value": "grayscale",
          "label": "그레이스케일"
        }
      ]
    },
    {
      "id": "removeMetadata",
      "label": "일반 문서 메타데이터 제거",
      "type": "checkbox",
      "value": false,
      "help": "제목·작성자·주제·키워드·생성 도구 정보를 비웁니다."
    }
  ],
  "specialization": {
    "heading": "목적별 압축과 전후 용량 비교",
    "summary": "화면·이메일·인쇄 프리셋을 제공하고 결과에 실제 절감률을 표시합니다.",
    "features": [
      "무손실 구조 최적화",
      "화면·이메일·인쇄 프리셋",
      "압축 전후 용량과 절감률 표시",
      "선택적 메타데이터 제거"
    ],
    "cautions": [
      "이미지 재구성은 검색 가능한 텍스트와 벡터를 이미지로 바꿉니다.",
      "문서 구조에 따라 결과가 원본보다 커질 수 있습니다."
    ]
  },
  "accessLevel": "free",
  "actionLabel": "PDF 압축 시작"
};
