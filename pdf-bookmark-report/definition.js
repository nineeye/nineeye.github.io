window.PDF_TOOL_DEFINITION = {
  "id": "pdf-bookmark-report",
  "title": "PDF 북마크 분석",
  "description": "PDF의 북마크 제목, 계층 깊이와 연결 대상 정보를 보고서로 확인합니다.",
  "mode": "bookmark-report",
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
    "heading": "북마크 계층과 문서 탐색 구조 확인",
    "summary": "목차처럼 사용되는 PDF 북마크의 계층을 펼쳐 제목과 연결 정보를 점검합니다.",
    "features": [
      "북마크 제목·계층 깊이",
      "최대 500개 안전 분석",
      "TXT·JSON 보고서"
    ],
    "cautions": [
      "비표준 목적지와 손상된 연결은 제한적으로 표시될 수 있습니다.",
      "북마크가 없다고 문서 목차가 없는 것은 아닙니다."
    ]
  },
  "accessLevel": "professional",
  "actionLabel": "분석 시작",
  "trialAvailable": true
};
