window.PDF_TOOL_DEFINITION = {
  "id": "pdf-accessibility-audit",
  "title": "PDF 접근성 기초 검사",
  "description": "PDF 문서 제목, 언어, 태그 구조, MarkInfo, 북마크 등 접근성 기본 항목을 점검합니다.",
  "mode": "accessibility-audit",
  "multiple": false,
  "optionsTitle": "보고서 설정",
  "options": [
    {
      "id": "reportFormat",
      "label": "보고서 형식",
      "type": "select",
      "value": "txt",
      "values": [
        {
          "value": "txt",
          "label": "읽기 쉬운 TXT"
        },
        {
          "value": "json",
          "label": "자동화용 JSON"
        }
      ]
    }
  ],
  "specialization": {
    "heading": "접근 가능한 PDF를 위한 첫 점검",
    "summary": "PDF/UA 인증 전 단계에서 놓치기 쉬운 문서 수준 속성을 빠르게 확인합니다.",
    "features": [
      "문서 제목·언어",
      "태그 구조·MarkInfo",
      "북마크·제목 표시 설정"
    ],
    "cautions": [
      "PDF/UA 적합성을 인증하는 도구가 아닙니다.",
      "읽기 순서·대체 텍스트·표 구조·색상 대비는 수동 검토가 필요합니다."
    ]
  },
  "accessLevel": "pro",
  "actionLabel": "분석 시작",
  "trialAvailable": true
};
