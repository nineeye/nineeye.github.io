window.PDF_TOOL_DEFINITION = {
  "id": "pdf-crop-pages",
  "title": "PDF 페이지 자르기",
  "description": "수동 재단 또는 흰 여백 자동 감지로 PDF 페이지의 불필요한 가장자리를 제거합니다.",
  "mode": "crop-pages",
  "multiple": false,
  "optionsTitle": "재단 방식과 페이지 범위",
  "options": [
    {
      "id": "cropMode",
      "label": "재단 방식",
      "type": "select",
      "value": "manual",
      "values": [
        {
          "value": "manual",
          "label": "수동 재단값 입력"
        },
        {
          "value": "auto",
          "label": "흰 여백 자동 감지"
        }
      ]
    },
    {
      "id": "targetMode",
      "label": "적용할 페이지",
      "type": "select",
      "value": "all",
      "values": [
        {
          "value": "all",
          "label": "전체 페이지"
        },
        {
          "value": "custom",
          "label": "선택한 특정 페이지"
        },
        {
          "value": "odd",
          "label": "홀수 페이지만"
        },
        {
          "value": "even",
          "label": "짝수 페이지만"
        }
      ]
    },
    {
      "id": "targetPages",
      "label": "특정 페이지",
      "type": "text",
      "value": "",
      "showWhen": {
        "id": "targetMode",
        "equals": "custom"
      }
    },
    {
      "id": "top",
      "label": "위쪽 자르기 (pt)",
      "type": "number",
      "value": 0,
      "min": 0,
      "max": 500,
      "showWhen": {
        "id": "cropMode",
        "equals": "manual"
      }
    },
    {
      "id": "right",
      "label": "오른쪽 자르기 (pt)",
      "type": "number",
      "value": 0,
      "min": 0,
      "max": 500,
      "showWhen": {
        "id": "cropMode",
        "equals": "manual"
      }
    },
    {
      "id": "bottom",
      "label": "아래쪽 자르기 (pt)",
      "type": "number",
      "value": 0,
      "min": 0,
      "max": 500,
      "showWhen": {
        "id": "cropMode",
        "equals": "manual"
      }
    },
    {
      "id": "left",
      "label": "왼쪽 자르기 (pt)",
      "type": "number",
      "value": 0,
      "min": 0,
      "max": 500,
      "showWhen": {
        "id": "cropMode",
        "equals": "manual"
      }
    },
    {
      "id": "autoTolerance",
      "label": "흰색 감지 민감도",
      "type": "number",
      "value": 18,
      "min": 3,
      "max": 80,
      "showWhen": {
        "id": "cropMode",
        "equals": "auto"
      }
    },
    {
      "id": "autoPadding",
      "label": "내용 주변 보호 여백 (pt)",
      "type": "number",
      "value": 8,
      "min": 0,
      "max": 72,
      "showWhen": {
        "id": "cropMode",
        "equals": "auto"
      }
    }
  ],
  "specialization": {
    "heading": "수동 재단과 흰 여백 자동 제거",
    "summary": "스캔 테두리는 자동 감지하고, 정밀한 작업은 네 방향 수동 재단값으로 처리합니다.",
    "features": [
      "수동 네 방향 독립 재단",
      "흰 여백 자동 감지",
      "내용 주변 보호 여백",
      "특정·홀수·짝수 페이지"
    ],
    "cautions": [
      "자동 감지는 흰 배경을 기준으로 하므로 컬러 배경 문서는 수동 방식이 안전합니다.",
      "잘린 영역은 결과에서 보이지 않으므로 원본을 보관하세요."
    ]
  },
  "accessLevel": "free",
  "actionLabel": "PDF 페이지 자르기"
};
