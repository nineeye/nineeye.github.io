/* No network, customer data, cookies, localStorage or false automatic PASS. */
(()=>{'use strict';const $=id=>document.getElementById(id);const inputs=[...document.querySelectorAll('[data-v88-check]')];if(inputs.length!==30)return;
 const date=()=>new Date().toISOString();let firstDate=date();
 const state=()=>({checked:inputs.filter(x=>x.checked).length,total:inputs.length});
 const render=()=>{const s=state();$('v88-progress-hero').textContent=s.checked+' / '+s.total;$('v88-count').textContent=s.checked+' / '+s.total;$('v88-track-fill').style.width=(s.checked/s.total*100)+'%';$('v88-result').textContent=s.checked===s.total?'사용자가 30개 체크 · 외부 증거는 별도 검토':'현재 '+(s.total-s.checked)+'개 미확인';};
 inputs.forEach(x=>x.addEventListener('change',()=>{render();$('v88-save-feedback').textContent='변경된 점검 결과는 아직 파일에 저장되지 않았습니다.';}));
 function report(){const s=state();const lines=['올파일원 웹스튜디오 V88 / 운영자 수동 준비도','생성(UTC): '+date(),'점검 시작(UTC): '+firstDate,'선택한 체크: '+s.checked+'/'+s.total,'상태: '+(s.checked===s.total?'체크박스 30개 선택됨 / 실증 별도':'미확인 '+(s.total-s.checked)+'개 · 판매 준비 HOLD'),''];
  for(const group of document.querySelectorAll('.v88-group')){lines.push('['+group.querySelector('h2').textContent+']');for(const label of group.querySelectorAll('.v88-check')){lines.push((label.querySelector('input').checked?'[운영자 직접 체크] ':'[미확인] ')+label.querySelector('b').textContent, ' - '+label.querySelector('small').textContent)}lines.push('');}
  lines.push('중요: 체크박스 선택·TXT 생성만으로 이메일 실제 발송/수신, 계약 체결, 개인정보 처리 적법성 또는 고객 납품을 증명하지 않습니다.','가격·VAT·운영 조건은 미확정이며 별도 서면 합의가 필요합니다.','이 파일은 사용자 PC에서 생성됩니다. 개인정보와 비밀키를 입력하지 마세요.');return lines.join('\n')+'\n';}
 $('v88-download').addEventListener('click',()=>{const b=new Blob(['\ufeff'+report().replace(/\n/g,'\r\n')],{type:'text/plain;charset=utf-8'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='AllFileOne_V88_manual_launch_check.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);$('v88-save-feedback').textContent='수동 점검 TXT를 내 PC에 다운로드했습니다. 메일·계약 검증 결과와는 별도입니다.';});
 $('v88-clear').addEventListener('click',()=>{inputs.forEach(x=>x.checked=false);firstDate=date();render();$('v88-save-feedback').textContent='모든 체크를 초기화했습니다. 파일은 자동 저장되지 않았습니다.';});
 $('v88-copy-address').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('nineeyes@naver.com');$('v88-mail-feedback').textContent='주소만 복사했습니다. 발송·수신은 확인되지 않았습니다.';}catch(_){$('v88-mail-feedback').textContent='복사 권한이 없습니다. 위 주소를 직접 선택해 복사하세요.';}});
 $('v88-test-email').addEventListener('click',()=>{$('v88-mail-feedback').textContent='테스트 메일 앱을 열었습니다. 직접 발송하고 네이버 받은편지함·회신까지 확인하세요. 아직 미확인입니다.';});
 window.AFO_V88_LAUNCH_READY=true;window.AFO_V88_LAUNCH_STATE=state;window.AFO_V88_LAUNCH_REPORT=report;render();
})();
