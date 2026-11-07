'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const container = $('admin-results');
  const feedback = $('admin-feedback');
  let token = '';
  const IDLE_LOCK_MS = 15 * 60 * 1000;
  let lastActivity = Date.now();
  let rows = [];
  let offset = 0;
  let nextOffset = null;
  const choices = {new:'신규',reviewing:'검토 중',quoted:'견적 회신',closed:'종료'};
  const val = input => (typeof input==='string' ? input : '');
  function status(text) {feedback.textContent=text;}
  function node(tag,cls,content) {
    const el=document.createElement(tag); if(cls)el.className=cls;
    if(content!==undefined)el.textContent=String(content);return el;
  }
  async function call(url, opts={}) {
    const response = await fetch(url, {
      ...opts,
      credentials:'same-origin', cache:'no-store',
      headers:{Authorization:'Bearer '+token, Accept:'application/json', ...(opts.headers||{})}
    });
    const data=await response.json().catch(()=>({ok:false}));
    if (!response.ok || !data?.ok) throw new Error(data?.code||'REQUEST_FAILED');
    return data;
  }
  function itemCard(item) {
    const card=node('article','admin-card');card.setAttribute('role','listitem');
    const head=node('div','admin-card-head');
    const title=node('h3','', val(item.company)||val(item.contact_name));
    const pill=node('span','admin-pill',choices[item.status]||'상태 미정');
    head.append(title,pill);card.append(head);
    card.append(node('p','admin-card-sub',new Date(item.created_at).toLocaleString('ko-KR')+' · 접수번호 '+val(item.id)));
    const meta=node('dl','admin-meta');
    const props=[['담당자',item.contact_name],['이메일',item.contact_email],['업종',item.industry],['예산',item.budget],['희망 일정',item.timing]];
    props.forEach(([key,value])=>{meta.append(node('dt','',key),node('dd','',val(value)));});
    card.append(meta,node('div','admin-detail',val(item.details)));
    const edit=node('div','admin-edit');
    const stateLabel=node('label','','처리 상태');const state=node('select');
    Object.entries(choices).forEach(([key,label])=>{const op=node('option','',label);op.value=key;op.selected=item.status===key;state.append(op);});
    stateLabel.append(state);
    const noteLabel=node('label','','관리자 메모');const note=node('input');note.type='text';note.maxLength=1000;note.value=val(item.owner_note);note.placeholder='처리 메모';noteLabel.append(note);
    const save=node('button','','저장');save.type='button';
    save.addEventListener('click',async()=>{
      save.disabled=true;status('저장 중…');
      try {
        const res=await call('/api/admin/inquiries',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,version:item.version,status:state.value,owner_note:note.value})});
        item.version=res.version;item.status=state.value;item.owner_note=note.value;pill.textContent=choices[item.status];status('처리 상태와 메모가 실제 데이터베이스에 저장됐습니다.');
      }catch(e){status(e.message==='CONFLICT_OR_NOT_FOUND'?'다른 관리 작업과 충돌했습니다. 새로고침하여 다시 확인하세요.':'저장 실패: 인증 또는 연결 상태를 확인하세요.');}
      finally{save.disabled=false;}
    });
    const remove=node('button','danger','삭제');remove.type='button';
    remove.addEventListener('click',async()=>{
      if(!confirm('이 문의의 개인정보와 내용을 데이터베이스에서 영구 삭제할까요?'))return;
      remove.disabled=true;
      try{await call('/api/admin/inquiries?id='+encodeURIComponent(item.id),{method:'DELETE'});rows=rows.filter(x=>x.id!==item.id);card.remove();$('inbox-count').textContent='표시 중 '+rows.length+'건';status('선택한 문의를 삭제했습니다.');}
      catch{status('삭제하지 못했습니다. 관리자 인증 및 저장소 상태를 확인해 주세요.');remove.disabled=false;}
    });
    edit.append(stateLabel,noteLabel,save,remove);card.append(edit);
    return card;
  }
  function addRows(items,reset=false) {
    if(reset){container.replaceChildren();rows=[];}
    rows.push(...items);
    items.forEach(item=>container.append(itemCard(item)));
    $('inbox-count').textContent='표시 중 '+rows.length+'건';
    if(!rows.length)container.append(node('p','admin-empty','현재 해당 조건의 문의가 없습니다.'));
  }
  async function load(reset=true) {
    if(reset){offset=0;rows=[];container.replaceChildren();}
    status('문의 목록을 조회하고 있습니다…');
    try {
      const search=new URLSearchParams({status:$('admin-status').value,limit:'30',offset:String(offset)});
      const data=await call('/api/admin/inquiries?'+search);
      if(reset)container.replaceChildren();
      addRows(data.items,reset);
      nextOffset=data.nextOffset;
      $('admin-more').hidden=nextOffset===null;
      status('서버에서 실제 저장된 문의 목록을 불러왔습니다.');
    }catch(e){status('조회 실패: '+ (e.message==='UNAUTHORIZED'?'관리자 인증을 확인해 주세요.':'데이터베이스/서버 설정을 확인해 주세요.'));}
  }
  $('login-form').addEventListener('submit',async e=>{
    e.preventDefault();const input=$('admin-token');const candidate=input.value.trim();
    if(!/^[A-Za-z0-9_-]{43,256}$/.test(candidate)){$('login-feedback').textContent='43자 이상의 비밀 토큰을 입력하세요.';return;}
    token=candidate;input.value='';
    try {
      await call('/api/admin/inquiries?limit=1');
      lastActivity=Date.now();
      $('login-panel').hidden=true;$('admin-dashboard').hidden=false;
      await load(true);
    }catch{token='';$('login-feedback').textContent='인증되지 않았거나 DB가 준비되지 않았습니다.';}
  });
  $('admin-status').addEventListener('change',()=>load(true));
  $('admin-refresh').addEventListener('click',()=>load(true));
  $('admin-more').addEventListener('click',()=>{if(nextOffset!==null){offset=nextOffset;load(false);}});
  function lockAdmin(idle=false) {
    // Never persist the token or personally identifiable client records.
    token=''; rows=[]; offset=0; nextOffset=null; container.replaceChildren();
    $('admin-token').value=''; $('admin-dashboard').hidden=true; $('login-panel').hidden=false;
    $('admin-more').hidden=true; $('inbox-count').textContent='문의 0건'; status('');
    $('login-feedback').textContent=idle ? '15분 동안 활동이 없어 자동 잠금됐습니다. 관리자 토큰으로 다시 인증하세요.' : '';
  }
  $('admin-logout').addEventListener('click',()=>lockAdmin(false));
  // Idle lock is only a UI safety measure. Server-side Bearer authentication remains mandatory.
  for (const eventType of ['pointerdown','keydown']) {
    document.addEventListener(eventType,()=>{
      if(token && !document.hidden && Date.now()-lastActivity < IDLE_LOCK_MS) lastActivity=Date.now();
    },{passive:true});
  }
  const autoLockIfIdle=()=>{
    if(token && Date.now()-lastActivity>=IDLE_LOCK_MS) lockAdmin(true);
  };
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)autoLockIfIdle();});
  setInterval(autoLockIfIdle,30*1000);
  function csvSafe(s){
    let v=String(s??'');
    if(/^[\s\u0000-\u001f]*[=+@\-]/.test(v))v="'"+v;
    return '"'+v.replace(/"/g,'""')+'"';
  }
  $('admin-export').addEventListener('click',()=>{
    if(!rows.length){status('내보낼 문의가 없습니다.');return;}
    const fields=['id','created_at','company','contact_name','contact_email','industry','details','budget','timing','status','owner_note'];
    const lines=[fields.join(',')];
    rows.forEach(item=>lines.push(fields.map(field=>csvSafe(item[field])).join(',')));
    const blob=new Blob(['\uFEFF',lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);const a=node('a');a.href=url;a.download='allfileone_inquiries_export.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status('현재 조회한 '+rows.length+'건만 CSV로 내보냈습니다. 내려받은 파일에 개인정보가 있으므로 안전하게 보관하세요.');
  });
})();
