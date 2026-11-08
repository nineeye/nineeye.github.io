'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const disabled = $('inbox-disabled');
  const form = $('inbox-form');
  const button = $('inbox-submit');
  const feedback = $('inbox-feedback');
  const result = $('inbox-success');
  const receipt = $('inbox-receipt');
  const challenge = $('turnstile-box');
  let siteKey = '';
  let token = '';
  let widgetId = null;
  let submitting = false;
  // V61: public industry ID only, no customer data in the URL.
  // The server-side API remains disabled until the owner configures its safeguards.
  const industryLabels = Object.freeze({
    manufacturing:'제조·도매', academy:'학원·교육', interior:'인테리어·시공',
    restaurant:'음식점·카페', beauty:'뷰티·미용', logistics:'물류·운송'
  });
  const requestedIndustry = new URLSearchParams(window.location.search).get('industry');
  if (Object.prototype.hasOwnProperty.call(industryLabels, requestedIndustry)) {
    const field = form.elements.namedItem('industry');
    const label = industryLabels[requestedIndustry];
    if (field && [...field.options].some(option => option.value === label)) field.value = label;
  }

  function updateSubmit() {
    button.disabled = submitting || !siteKey || !token || !form.elements.consent.checked;
  }
  function resetChallenge() {
    token = '';
    updateSubmit();
    if (widgetId !== null && window.turnstile?.reset) window.turnstile.reset(widgetId);
  }
  function message(text) { feedback.textContent = text; }
  async function enable() {
    const statusResponse = await fetch('/api/inbox-status', {headers:{Accept:'application/json'}, cache:'no-store'});
    if (!statusResponse.ok) return;
    const config = await statusResponse.json();
    if(!config?.ready || !/^[A-Za-z0-9_-]{12,100}$/.test(config.siteKey || '')) return;
    siteKey = config.siteKey;
    disabled.hidden = true;
    form.hidden = false;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => {
      if (!window.turnstile?.render) {
        message('자동 제출 방지 도구를 불러오지 못했습니다. 이메일로 문의해 주세요.');
        return;
      }
      widgetId = window.turnstile.render(challenge, {
        sitekey: siteKey,
        action:'inquiry',
        callback: value => { token = value; updateSubmit(); },
        'expired-callback': resetChallenge,
        'error-callback': () => {token='';updateSubmit();message('보안 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.');}
      });
    };
    script.onerror = () => message('보안 확인 도구에 연결할 수 없습니다. 이메일로 문의해 주세요.');
    document.head.append(script);
  }
  form.elements.consent.addEventListener('change', updateSubmit);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || !token || !siteKey) return;
    if (!form.checkValidity()) {form.reportValidity();return;}
    const payload = {
      company:form.elements.company.value.trim(),
      name:form.elements.name.value.trim(),
      email:form.elements.email.value.trim(),
      industry:form.elements.industry.value,
      details:form.elements.details.value.trim(),
      budget:form.elements.budget.value,
      timing:form.elements.timing.value,
      website:form.elements.website.value,
      consent:form.elements.consent.checked,
      turnstileToken:token
    };
    if(payload.details.length<20){message('요청 내용을 20자 이상 작성해 주세요.');return;}
    submitting = true; updateSubmit(); message('안전하게 접수하는 중입니다…');
    try {
      const response = await fetch('/api/inquiries', {
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        credentials:'same-origin',
        body:JSON.stringify(payload),
        signal:AbortSignal.timeout(15000)
      });
      const body = await response.json();
      if (response.status===201 && body?.ok && /^[0-9a-f-]{36}$/i.test(body.id)) {
        receipt.textContent=body.id;
        result.hidden=false;
        form.hidden=true;
        result.scrollIntoView({behavior:'smooth',block:'center'});
        message('');
        return;
      }
      const errors = {
        INBOX_DISABLED:'안전한 접수 설정이 완료되지 않았습니다. 이메일로 문의해 주세요.',
        SCHEMA_NOT_READY:'접수 저장소가 준비되지 않았습니다. 이메일로 문의해 주세요.',
        BOT_CHECK_FAILED:'보안 확인이 만료됐거나 실패했습니다. 다시 확인해 주세요.',
        RATE_LIMITED:'반복 접수 제한에 도달했습니다. 잠시 후 다시 시도해 주세요.',
        INVALID_INPUT:'필수 입력값과 이메일 주소를 확인해 주세요.'
      };
      message(errors[body?.code] || '실제 접수가 완료되지 않았습니다. 이메일로 문의해 주세요.');
    } catch {
      message('접수 여부를 확인하지 못했습니다. 중복 제출 전에 관리자에게 이메일로 문의해 주세요.');
    } finally {submitting=false;resetChallenge();}
  });
  $('inbox-again').addEventListener('click', () => {
    form.reset(); result.hidden=true;form.hidden=false;resetChallenge();window.scrollTo({top:0,behavior:'smooth'});
  });
  // A failed readiness fetch must never produce an optimistic "submitted" status.
  enable().catch(() => {disabled.hidden=false;form.hidden=true;});
})();
