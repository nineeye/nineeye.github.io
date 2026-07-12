window.PDF_TOOL_DEFINITION = {
  "id": "pdf-date-period-report",
  "title": "PDF 날짜·기간 패턴 분석",
  "description": "날짜, 연월, 기간과 유효기간 후보 표현을 찾아 정리합니다.",
  "mode": "date-period-report",
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
    "heading": "일정·계약 기간 후보 확인",
    "summary": "문서에서 날짜와 기간 표현을 찾아 페이지 위치와 반복 횟수를 보고서로 만듭니다.",
    "features": [
      "날짜 형식 탐지",
      "기간 표현 탐지",
      "페이지별 위치"
    ],
    "cautions": [
      "실제 유효한 날짜인지 판정하지 않습니다.",
      "자연어로만 적힌 날짜는 일부 누락될 수 있습니다."
    ]
  },
  "accessLevel": "professional",
  "actionLabel": "분석 시작",
  "trialAvailable": true
};
