window.PDF_TOOL_DEFINITION = {
  "id": "pdf-annotation-report",
  "title": "PDF 주석·링크 분석",
  "description": "PDF의 링크, 메모, 강조, 도형, 파일 첨부와 양식 위젯을 페이지별로 집계합니다.",
  "mode": "annotation-report",
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
    "heading": "상호작용 요소를 제거하기 전 정확히 확인",
    "summary": "문서에 어떤 주석 유형이 몇 개 있는지 페이지별 보고서로 확인합니다.",
    "features": [
      "주석 유형별 합계",
      "페이지별 주석 개수",
      "링크·Widget·첨부 주석 구분"
    ],
    "cautions": [
      "평탄화되어 페이지 내용이 된 표시에는 주석으로 집계되지 않습니다.",
      "비표준 주석은 Unknown 또는 기타 유형으로 표시될 수 있습니다."
    ]
  },
  "accessLevel": "professional",
  "actionLabel": "분석 시작",
  "trialAvailable": true
};
