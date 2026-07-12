window.PDF_TOOL_DEFINITION = {
  "id": "pdf-delete-pages",
  "title": "PDF 페이지 삭제",
  "description": "썸네일 번호 작업대에서 필요 없는 페이지를 선택해 삭제합니다.",
  "mode": "delete",
  "multiple": false,
  "optionsTitle": "삭제할 페이지",
  "options": [
    {
      "id": "pages",
      "label": "삭제할 페이지 (예: 2,4-6)",
      "type": "text",
      "value": "",
      "help": "페이지 선택 작업대에서 클릭하면 자동 입력됩니다."
    }
  ],
  "specialization": {
    "heading": "삭제 대상을 눈으로 확인",
    "summary": "페이지 번호를 개별 선택하거나 홀수·짝수 페이지를 한 번에 선택해 삭제할 수 있습니다.",
    "features": [
      "개별·범위 선택",
      "홀수·짝수 빠른 선택",
      "삭제 후 남는 페이지 수 확인"
    ],
    "cautions": [
      "모든 페이지를 한꺼번에 삭제할 수는 없습니다.",
      "원본은 변경되지 않고 새 PDF가 생성됩니다."
    ]
  },
  "accessLevel": "free",
  "actionLabel": "선택한 페이지 삭제"
};
