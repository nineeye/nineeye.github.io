window.PDF_TOOL_DEFINITION = {
  "id": "pdf-attachment-report",
  "title": "PDF 첨부파일 분석",
  "description": "PDF 문서 내부에 포함된 첨부파일 이름, 설명, 크기와 파일 명세를 분석합니다.",
  "mode": "attachment-report",
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
    "heading": "내장 첨부파일과 파일 명세 확인",
    "summary": "배포 전에 문서 속에 숨겨진 첨부파일이 있는지 이름 트리를 검사합니다.",
    "features": [
      "첨부파일 이름·설명",
      "알 수 있는 경우 파일 크기",
      "TXT·JSON 보고서"
    ],
    "cautions": [
      "악성 파일 여부를 판정하지 않습니다.",
      "비표준 첨부 구조는 일부 누락될 수 있습니다."
    ]
  },
  "accessLevel": "professional",
  "actionLabel": "분석 시작",
  "trialAvailable": true
};
