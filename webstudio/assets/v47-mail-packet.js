/* AllFileOne WebStudio V47: complete manual email packet, no server submission.
 * Works with V26 consultation preview and optional V46 original start-kit report.
 * No network calls, analytics, external libraries, or automatic send.
 */
(() => {
  'use strict';
  const RECIPIENT = 'nineeyes@naver.com';
  const MAX = 30000;
  const safe = value => String(value || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');

  function init() {
    const form = document.getElementById('brief-form');
    const preview = document.getElementById('brief-output');
    if (!form || !preview || document.getElementById('v47-mail-packet')) return;
    const container = document.createElement('section');
    container.id = 'v47-mail-packet';
    container.className = 'v47-mail-packet';
    container.setAttribute('aria-label', '고객 문의 전체 내용 보내기');
    const header = document.createElement('div');
    header.className = 'v47-head';
    const heading = document.createElement('h3');
    heading.textContent = '문의 내용 빠짐없이 보내기';
    const intro = document.createElement('p');
    intro.textContent = '상담서와 준비키트 원본을 한 번에 묶습니다. 준비키트를 가져오지 않았다면 상담서만 포함합니다.';
    header.append(heading, intro);
    const recipient = document.createElement('p');
    recipient.className = 'v47-recipient';
    recipient.textContent = '받는 사람: ' + RECIPIENT;
    const actions = document.createElement('div');
    actions.className = 'v47-actions';
    const copy = document.createElement('button');
    copy.id = 'v47-copy-all'; copy.type = 'button';
    copy.textContent = '제목·상담서·준비키트 전체 복사';
    const save = document.createElement('button');
    save.id = 'v47-download-all'; save.type = 'button';
    save.textContent = '전체 메일 TXT 저장';
    const inspect = document.createElement('button');
    inspect.id = 'v47-show-all'; inspect.type = 'button';
    inspect.textContent = '보낼 내용 확인';
    const webmail = document.createElement('a');
    webmail.href = 'https://mail.naver.com/'; webmail.target = '_blank';
    webmail.rel = 'noopener noreferrer'; webmail.textContent = '네이버 메일 열기';
    actions.append(copy, save, inspect, webmail);
    const status = document.createElement('p');
    status.id = 'v47-status'; status.className = 'v47-status';
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const review = document.createElement('div');
    review.id = 'v47-review'; review.className = 'v47-review'; review.hidden = true;
    const label = document.createElement('p'); label.textContent = '메일 작성 화면에 아래 내용을 붙여넣어 보내세요.';
    const pre = document.createElement('pre'); pre.id = 'v47-review-text';
    pre.setAttribute('tabindex', '0');
    review.append(label, pre);
    const disclaimer = document.createElement('p');
    disclaimer.className = 'v47-caution';
    disclaimer.textContent = '이 버튼들은 메일을 자동 전송하지 않습니다. 웹메일의 받는 사람과 내용을 확인하고 직접 「보내기」를 눌러야 합니다. 실제 수신 여부는 확인되지 않았습니다.';
    container.append(header, recipient, actions, status, review, disclaimer);
    const insertion = document.getElementById('v42-webmail-guide') || document.getElementById('v40-mail-fallback') || preview.closest('.preview') || preview;
    insertion.insertAdjacentElement('afterend', container);

    function packet() {
      const industry = form.elements.namedItem('industry');
      const opt = industry?.selectedOptions?.[0]?.textContent.trim() || '맞춤형';
      const subject = '[올파일원 웹스튜디오] ' + safe(opt).slice(0, 80) + ' 홈페이지 제작 문의';
      const brief = safe(preview.textContent).trim();
      const original = document.getElementById('v46-full-report');
      const raw = original ? safe(original.textContent).trim() : '';
      const whole = [
        '받는 사람: ' + RECIPIENT,
        '제목: ' + subject,
        '',
        brief,
        ...(raw ? ['', '----- 제작 시작키트 원본 (누락 방지) -----', raw] : []),
        '',
        '※ 이 텍스트를 복사하거나 저장하는 것만으로는 문의가 접수되지 않습니다.'
      ].join('\n');
      return whole.length > MAX ? null : whole;
    }
    function validate() {
      if (!form.checkValidity()) {
        status.textContent = '업종과 제작 목적을 선택한 다음 진행해 주세요. 아직 메일은 발송되지 않았습니다.';
        if (typeof form.reportValidity === 'function') form.reportValidity();
        return null;
      }
      const data = packet();
      if (!data) { status.textContent = '문의 내용이 너무 깁니다. 원본 TXT와 상담서를 나누어 보내 주세요.'; return null; }
      if (!safe(preview.textContent).trim()) {
        status.textContent = '상담 요청서가 아직 준비되지 않았습니다. 작성 내용을 확인해 주세요.';
        return null;
      }
      return data;
    }
    inspect.addEventListener('click', () => {
      const data = validate(); if (!data) return;
      pre.textContent = data;
      review.hidden = !review.hidden;
      inspect.textContent = review.hidden ? '보낼 내용 확인' : '미리보기 닫기';
      status.textContent = review.hidden ? '미리보기를 닫았습니다.' : '전체 내용 표시 중입니다. 전송되거나 저장되지 않았습니다.';
    });
    copy.addEventListener('click', async () => {
      const data = validate(); if (!data) return;
      try {
        if (typeof navigator.clipboard?.writeText !== 'function') throw Error('clipboard blocked');
        await navigator.clipboard.writeText(data);
        status.textContent = '전체 메일 내용을 복사했습니다. 웹메일에서 직접 붙여넣고 보내 주세요. 아직 접수되지 않았습니다.';
      } catch (_) {
        pre.textContent = data; review.hidden = false; inspect.textContent = '미리보기 닫기';
        status.textContent = '자동 복사가 제한되었습니다. 아래 내용을 선택해 Ctrl+C로 복사하거나 TXT를 저장해 주세요.';
      }
    });
    save.addEventListener('click', () => {
      const data = validate(); if (!data) return;
      const blob = new Blob(['\ufeff', data], {type:'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = 'AllFileOne_Complete_Inquiry_V47.txt';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      status.textContent = '전체 메일 TXT를 저장했습니다. 저장은 상담 접수가 아닙니다.';
    });
    form.addEventListener('input', () => { if (!review.hidden) {review.hidden=true;inspect.textContent='보낼 내용 확인';status.textContent='상담서가 변경되었습니다. 최신 내용으로 다시 확인하세요.';} });
    form.addEventListener('change', () => { if (!review.hidden) {review.hidden=true;inspect.textContent='보낼 내용 확인';status.textContent='선택 항목이 변경되었습니다. 최신 내용으로 다시 확인하세요.';} });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
