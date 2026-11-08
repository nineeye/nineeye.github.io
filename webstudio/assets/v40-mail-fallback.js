/* AllFileOne WebStudio V40. Original, no external libraries or server calls.
 * This is a MAILTO FALLBACK only. It never sends an email or stores personal data.
 */
'use strict';
(() => {
  function init() {
    const actions = document.querySelector('.preview-actions');
    const emailButton = document.getElementById('brief-email');
    if (!actions || !emailButton || document.getElementById('v40-mail-fallback')) return;
    const recipient = 'nineeyes@naver.com';
    const panel = document.createElement('section');
    panel.id = 'v40-mail-fallback';
    panel.className = 'v40-mail-fallback';
    panel.setAttribute('aria-labelledby', 'v40-mail-title');
    const head = document.createElement('strong');
    head.id = 'v40-mail-title';
    head.textContent = '메일 앱이 열리지 않나요?';
    const intro = document.createElement('p');
    intro.textContent = '네이버 메일 등 웹메일에서도 상담할 수 있습니다. 아래 주소를 복사하고, 위 요청서 내용을 복사하여 직접 새 메일을 보내 주세요.';
    const controls = document.createElement('div');
    controls.className = 'v40-mail-controls';
    const field = document.createElement('input');
    field.type = 'text';
    field.value = recipient;
    field.readOnly = true;
    field.setAttribute('aria-label', '제작 상담 수신 이메일 주소');
    field.autocomplete = 'off';
    field.spellcheck = false;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'v40-mail-copy';
    copy.textContent = '이메일 주소 복사';
    const status = document.createElement('p');
    status.className = 'v40-mail-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const disclosure = document.createElement('p');
    disclosure.className = 'v40-mail-note';
    disclosure.textContent = '※ 이 사이트는 이메일을 자동 발송하거나 문의를 서버에 저장하지 않습니다. 메일 앱 또는 웹메일에서 직접 보내기 버튼을 눌러야 접수됩니다.';
    controls.append(field, copy);
    panel.append(head, intro, controls, status, disclosure);
    actions.insertAdjacentElement('afterend', panel);
    field.addEventListener('click', () => field.select());
    copy.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(recipient);
        status.textContent = '주소를 복사했습니다. 요청서 내용도 복사한 뒤 사용하시는 메일 서비스에서 직접 보내 주세요.';
      } catch {
        field.focus();
        field.select();
        status.textContent = '자동 복사가 제한되어 주소를 선택했습니다. Ctrl+C로 복사해 새 메일의 받는 사람에 붙여넣어 주세요.';
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();