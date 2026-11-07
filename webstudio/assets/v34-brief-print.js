'use strict';
/* V34: Print the visible client-owned brief. No submission, storage, network or third-party API. */
(() => {
  const button = document.getElementById('brief-print');
  const form = document.getElementById('brief-form');
  const text = document.getElementById('brief-output');
  const feedback = document.getElementById('brief-feedback');
  if (!button || !form || !text || !feedback) return;
  button.addEventListener('click', () => {
    if (!form.checkValidity()) {
      form.reportValidity();
      feedback.textContent = '인쇄하거나 PDF로 저장하기 전에 업종과 제작 목적을 선택해 주세요.';
      return;
    }
    if (!text.textContent.trim()) {
      feedback.textContent = '상담 준비서 내용을 먼저 작성해 주세요.';
      return;
    }
    feedback.textContent = '인쇄 대화상자에서 프린터 또는 PDF로 저장을 선택해 주세요. 이 작업은 상담 접수가 아닙니다.';
    window.print();
  });
})();
