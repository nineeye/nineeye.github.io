/* AllFileOne WebStudio V62 — webmail subject/body copy, no network or storage.
 * Works with the existing V49 preview. No automatic email, payment, account or API.
 */
(() => {
  'use strict';
  const output = document.getElementById('v49-output');
  const status = document.getElementById('v49-status');
  const subjectButton = document.getElementById('v62-subject');
  const bodyButton = document.getElementById('v62-body');
  if (!output || !status || !subjectButton || !bodyButton) return;
  const LIMIT_SUBJECT = 200, LIMIT_BODY = 5000;

  function currentDraft() {
    const preview = String(output.textContent || '').replace(/\r\n?/g, '\n');
    // The V49 renderer explicitly provides recipient, subject and body as distinct lines.
    const parsed = /^받는 사람: ([^\n]+)\n제목: ([^\n]+)\n\n([\s\S]+)$/u.exec(preview);
    if (!parsed || parsed[1] !== 'nineeyes@naver.com') return null;
    const subject = parsed[2].trim(), body = parsed[3].trimEnd();
    if (!subject || !body || subject.length > LIMIT_SUBJECT || body.length > LIMIT_BODY) return null;
    return {subject, body};
  }

  function manualCopy(value) {
    let box = document.getElementById('v62-manual-copy');
    if (!box) {
      box = document.createElement('textarea');
      box.id = 'v62-manual-copy';
      box.setAttribute('aria-label', '직접 복사할 메일 내용');
      box.setAttribute('readonly', '');
      box.rows = 5;
      box.className = 'v62-manual-copy';
      status.after(box);
    }
    box.value = value;
    box.focus();
    box.select();
    status.textContent = '브라우저에서 자동 복사를 제한했습니다. 아래 선택된 내용을 Ctrl+C로 복사해 주세요. 메일은 전송되지 않았습니다.';
  }

  async function copyPart(part) {
    const draft = currentDraft();
    if (!draft) {
      status.textContent = '문의 문안을 읽을 수 없습니다. 업종과 필요한 기능을 다시 선택해 주세요. 이메일은 전송되지 않았습니다.';
      return;
    }
    const value = draft[part];
    try {
      if (typeof navigator.clipboard?.writeText !== 'function') throw new Error('clipboard_not_allowed');
      await navigator.clipboard.writeText(value);
      const manual = document.getElementById('v62-manual-copy');
      if (manual) manual.remove();
      status.textContent = (part === 'subject' ? '제목' : '본문') + ' 복사 완료. 웹메일의 해당 입력칸에 붙여넣은 다음 직접 보내기를 누르세요. 아직 접수되지 않았습니다.';
    } catch (_) { manualCopy(value); }
  }

  subjectButton.addEventListener('click', () => { void copyPart('subject'); });
  bodyButton.addEventListener('click', () => { void copyPart('body'); });
})();
