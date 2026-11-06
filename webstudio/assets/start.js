'use strict';
(()=>{
  const doc=document;
  const form=doc.getElementById('brief-form');
  const steps=[...doc.querySelectorAll('.step')];
  const progress=[...doc.querySelectorAll('.progress span')];
  const next=doc.getElementById('next');
  const back=doc.getElementById('back');
  const make=doc.getElementById('make');
  const result=doc.getElementById('result');
  const output=doc.getElementById('output');
  const status=doc.getElementById('status');
  let step=0; let generated='';
  const one=name=>form.elements.namedItem(name);
  const getValue=name=>String(one(name)?.value||'').trim();
  function draw(){
    steps.forEach((s,i)=>{s.hidden=i!==step;progress[i].classList.toggle('active',i<=step)});
    back.disabled=step===0;
    next.hidden=step===3;
    make.hidden=step!==3;
    const focus=steps[step].querySelector('select,textarea,input');
    if(focus)focus.focus({preventScroll:true});
  }
  function validate(){
    if(step===0&&!getValue('industry')){
      one('industry').focus();one('industry').setCustomValidity('업종을 선택해 주세요.');
      one('industry').reportValidity();return false;
    }
    return true;
  }
  one('industry').addEventListener('change',()=>one('industry').setCustomValidity(''));
  next.addEventListener('click',()=>{if(!validate())return;step=Math.min(3,step+1);draw()});
  back.addEventListener('click',()=>{step=Math.max(0,step-1);draw()});
  const text=(value)=>String(value).replace(/[\u0000-\u001f\u007f]/g,' ').trim();
  function build(){
    const selected=[...form.querySelectorAll('input[name="features"]:checked')].map(i=>text(i.value));
    const fields=[
      '[올파일원 웹스튜디오 · 홈페이지 제작 준비서]',
      '업종: '+text(getValue('industry')),
      '핵심 목표: '+text(getValue('goal')),
      '희망 규모: '+text(getValue('scope')),
      '필요 기능: '+(selected.join(', ')||'추가 기능 선택 없음'),
      '희망 제작 시기: '+text(getValue('deadline')),
      '보유 자료: '+text(getValue('assets')),
      '예산 범위: '+text(getValue('budget')),
      '추가 요청사항: '+(text(getValue('notes'))||'미기재'),
      '',
      '[협의 전에 확인할 내용]',
      '• 제작 페이지 수 및 자료 제공 범위',
      '• 문의/예약/결제 기능의 실제 연결 방법',
      '• 수정 횟수, 도메인 소유권, 납품 산출물, 유지관리 범위',
      '• 개인정보 처리 및 외부 서비스 비용 부담',
      '',
      '※ 견적 상담을 위한 기획 초안입니다. 자동 접수되지 않았습니다.'
    ];
    return fields.join('\n');
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!getValue('industry')){step=0;draw();validate();return}
    generated=build();output.textContent=generated;
    form.hidden=true;result.hidden=false;result.scrollIntoView({block:'start',behavior:'smooth'});
    const email=String(window.WEBSTUDIO_CONFIG?.contactEmail||'').trim();
    const emailLink=doc.getElementById('email');
    if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      emailLink.hidden=false;
      emailLink.href='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('[올파일원 웹스튜디오] 홈페이지 제작 준비서')+'&body='+encodeURIComponent(generated);
      doc.getElementById('delivery-hint').textContent='이메일 앱을 실행할 수 있습니다. 실제 전송 여부는 방문자가 이메일 앱에서 확인해야 합니다.';
    }
  });
  doc.getElementById('edit').addEventListener('click',()=>{result.hidden=true;form.hidden=false;status.textContent='';draw();form.scrollIntoView({block:'start',behavior:'smooth'})});
  doc.getElementById('copy').addEventListener('click',async()=>{
    try{
      if(!navigator.clipboard||!window.isSecureContext)throw new Error('unsupported');
      await navigator.clipboard.writeText(generated);
      status.textContent='복사 완료. 원하는 메신저나 이메일에 붙여넣어 보내주세요.';
    }catch{status.textContent='복사를 사용할 수 없습니다. 본문을 직접 선택하여 복사하거나 TXT 저장을 이용하세요.'}
  });
  doc.getElementById('download').addEventListener('click',()=>{
    const file=new Blob(['\uFEFF'+generated],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(file);
    const a=doc.createElement('a');a.href=url;a.download='allfileone_project_brief.txt';
    doc.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='저장 파일을 생성했습니다. 서버에는 저장되지 않습니다.';
  });
  draw();
})();
