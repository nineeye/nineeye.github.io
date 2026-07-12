window.PDF_TOOL_DEFINITION = {
  "id": "pdf-acronym-term-report",
  "title": "PDF 약어·용어집 후보 분석",
  "description": "대문자 약어와 괄호 정의 패턴을 찾아 용어집 후보를 만듭니다.",
  "mode": "acronym-term-report",
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
    "heading": "긴 문서의 약어와 정의 정리",
    "summary": "반복 약어와 “전체 이름(약어)” 형식을 찾아 문서 용어집 초안을 만듭니다.",
    "features": [
      "반복 약어 집계",
      "괄호 정의 패턴",
      "출현 페이지"
    ],
    "cautions": [
      "제품명·코드가 약어로 포함될 수 있습니다.",
      "문맥 의미는 사람이 최종 확인해야 합니다."
    ]
  },
  "accessLevel": "pro",
  "actionLabel": "분석 시작",
  "trialAvailable": true
};
