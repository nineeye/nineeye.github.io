/* AllFileOne WebStudio V46 — explicit, single-use, same-tab consultation handoff.
 * No network calls, third-party code, cookies, analytics or paid services.
 * Visitor-provided data is never placed in a URL; sessionStorage is removed on read.
 */
(() => {
  'use strict';
  const KEY = 'afo.webstudio.v46.handoff';
  const MAX_AGE_MS = 15 * 60 * 1000;
  const SECTORS = Object.freeze({manufacturing:'제조 · 도매',academy:'학원 · 교육',interior:'인테리어 · 시공'});
  const GOALS = Object.freeze({'신규 상담·견적 문의':'lead','상품·서비스 소개':'showcase','예약·방문 안내':'booking','신뢰·브랜드 강화':'brand'});
  const has = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);
  const txt = (s,max=300) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
  const sectorNow = () => document.querySelector('[data-sector][aria-pressed="true"]')?.dataset.sector || 'manufacturing';
  const feedback = (message) => { const el=document.getElementById('notice');if(el)el.textContent=message; };
  const validNames = (values) => Array.isArray(values) && values.length<=10 && values.every(s=>typeof s==='string' && s.length<=90);

  function setupLaunch() {
    const go=document.getElementById('contactLink');
    const checklist=document.getElementById('checklist');
    if(!go || !checklist) return;
    go.textContent='준비내용 포함하여 상담서 이동 ↗';
    go.title='같은 탭에서 1회만 전달, 상담서에서 즉시 임시 데이터 삭제';
    go.addEventListener('click', e => {
      if(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey){
        e.preventDefault();feedback('개인정보 보호를 위해 같은 탭에서 일반 클릭으로 이동해 주세요.');return;
      }
      const sector=sectorNow();
      if(!has(SECTORS,sector)) return;
      const rows=[...checklist.querySelectorAll('label.check-row')];
      const done=[],missing=[];
      for(const row of rows){
        const name=txt(row.querySelector('.check-top b')?.textContent,90);
        const checkbox=row.querySelector('input[type="checkbox"]');
        if(name && checkbox)(checkbox.checked?done:missing).push(name);
      }
      if(rows.length!==10 || done.length+missing.length!==10){e.preventDefault();feedback('체크리스트를 읽을 수 없습니다. TXT 저장을 이용해 주세요.');return;}
      const record={v:46,ts:Date.now(),industry:sector,
        project:txt(document.getElementById('projectName')?.value,80),
        goal:txt(document.getElementById('projectGoal')?.value,40),
        memo:txt(document.getElementById('projectMemo')?.value,300),
        done,missing};
      try {
        sessionStorage.setItem(KEY,JSON.stringify(record));
        go.href='./contact.html?source=startkit&industry='+encodeURIComponent(sector)+'&theme=modern';
      } catch (_) {
        // Never claim the transfer worked if storage is blocked.
        e.preventDefault();feedback('임시 전달이 차단되었습니다. 위에서 TXT를 저장하거나 전체 내용을 복사한 뒤 기존 상담서를 이용해 주세요.');
      }
    });
  }

  function detailsFrom(record,limit) {
    const lines=[
      record.project?'프로젝트명: '+record.project:'',
      record.goal?'준비키트 목표: '+record.goal:'',
      record.memo?'고객 메모: '+record.memo:'',
      '업종 준비자료: '+record.done.length+'/10개 자체 확인',
      record.missing.length?'미준비: '+record.missing.join(', '):'미준비: 없음'
    ].filter(Boolean);
    const full=lines.join('\n');
    if(full.length<=limit) return {text:full,shortened:false};
    // A clearly labeled truncation is better than silently dropping user information.
    const suffix='\n[상세는 준비서 TXT 참고]';
    if(limit<=0) return {text:'',shortened:true};
    if(limit<=suffix.length) return {text:full.slice(0,limit),shortened:true};
    const trimmed=full.slice(0,limit-suffix.length).trimEnd();
    return {text:trimmed+suffix,shortened:true};
  }
  function setupContact() {
    const form=document.getElementById('brief-form');
    if(!form || !document.getElementById('brief-output')) return;
    const query=new URLSearchParams(location.search);
    if(query.get('source')!=='startkit') return;
    let raw;
    try {raw=sessionStorage.getItem(KEY);sessionStorage.removeItem(KEY);} catch(_){return;}
    if(!raw || raw.length>6000) return;
    let rec;
    try {rec=JSON.parse(raw);} catch(_){return;}
    if(!rec || rec.v!==46 || !Number.isFinite(rec.ts) || rec.ts>Date.now()+60000 || Date.now()-rec.ts>MAX_AGE_MS) return;
    if(!has(SECTORS,rec.industry) || rec.industry!==query.get('industry')) return;
    if(typeof rec.project!=='string'||rec.project.length>80||typeof rec.memo!=='string'||rec.memo.length>300||
       typeof rec.goal!=='string'||rec.goal.length>40||!validNames(rec.done)||!validNames(rec.missing)||rec.done.length+rec.missing.length!==10) return;
    const fields=form.elements;
    if(fields.industry) fields.industry.value=rec.industry;
    if(has(GOALS,rec.goal)&&fields.goal) fields.goal.value=GOALS[rec.goal];
    const details=fields.namedItem('details');
    if(!details) return;
    const before=txt(details.value,700);
    const limit=Number(details.maxLength)>0?details.maxLength:700;
    const capacity=Math.max(0,limit-before.length-(before?2:0));
    const excerpt=detailsFrom(rec,capacity);
    details.value=(before?before+'\n\n':'')+excerpt.text;
    // Render with textContent, never innerHTML; user-supplied strings cannot inject HTML.
    const panel=document.createElement('aside');
    panel.className='v46-import';panel.id='v46-import';panel.setAttribute('aria-label','준비키트에서 가져온 내용');
    const title=document.createElement('strong');title.textContent='준비키트 내용을 가져왔습니다.';
    const description=document.createElement('p');
    description.textContent=SECTORS[rec.industry]+' · 준비 체크 '+rec.done.length+'/10개. 요청사항을 확인한 뒤 메일 앱이나 웹메일에서 직접 보내야 실제 문의가 접수됩니다.';
    const body=document.createElement('pre');body.id='v46-full-report';body.textContent=[
      '[제작 준비키트 전체 내용]',
      '업종: '+SECTORS[rec.industry],
      '프로젝트: '+(rec.project||'미입력'),
      '목표: '+(rec.goal||'미입력'),
      '메모: '+(rec.memo||'없음'),
      '준비 완료: '+(rec.done.join(' / ')||'없음'),
      '미준비: '+(rec.missing.join(' / ')||'없음'),
      '※ 항목은 고객 자체 체크이며, 실제 자료 검증·계약·제작 접수가 아닙니다.'
    ].join('\n');
    const actions=document.createElement('div');actions.className='v46-buttons';
    const copy=document.createElement('button');copy.type='button';copy.textContent='전체 준비키트 내용 복사';
    const notice=document.createElement('span');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
    copy.addEventListener('click',async()=>{
      try {if(typeof navigator.clipboard?.writeText!=='function') throw Error('blocked');
        await navigator.clipboard.writeText(body.textContent);
        notice.textContent='전체 내용 복사 완료. 이메일에 붙여넣어 직접 발송해 주세요.';
      } catch(_) {notice.textContent='자동 복사가 제한되었습니다. 위 내용을 직접 선택하거나 이전 화면에서 저장한 TXT를 이용해 주세요.';}
    });
    actions.append(copy,notice);
    panel.append(title,description,body,actions);
    if(excerpt.shortened){const caution=document.createElement('p');caution.className='v46-caution';caution.textContent='상담 요청사항은 글자 수 제한으로 요약되었습니다. 전체 내용은 위에서 복사해 별도로 전달해 주세요.';panel.append(caution);}
    const section=document.getElementById('brief');
    (section?.querySelector('.workspace')||form).before(panel);
    form.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function init(){setupLaunch();setupContact();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
