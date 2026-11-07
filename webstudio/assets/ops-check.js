'use strict';
(() => {
  const byId = id => document.getElementById(id);
  const area = byId('check-items');
  const summary = byId('summary');
  const runButton = byId('run-check');
  const downloadButton = byId('download-check');
  const activity = byId('activity');
  let latest = null;
  let running = false;

  const specifications = [
    ['home', '메인 홈페이지', 'index.html', 'html', '방문자가 첫 화면을 열 수 있는지 확인'],
    ['portfolio', '포트폴리오', 'portfolio.html', 'html', '실제 기능형 시연 전시관'],
    ['builder', '맞춤 시안 제작기', 'builder.html', 'html', '다운로드 가능한 시안 제작기'],
    ['modules', '30개 기능 설계실', 'modules.html', 'html', '기능 선택과 제작 요청서'],
    ['inquiry', '고객 문의 화면', 'inquiry.html', 'html', '실제 접수 설정 전 제출 차단'],
    ['admin', '관리자 화면', 'admin-inbox.html', 'html', '비밀 키는 이 진단에서 요구하지 않음'],
    ['css', '문의 화면 스타일', 'assets/inbox.css', 'css', '정적 스타일 파일 제공 여부'],
    ['js', '문의 동작 스크립트', 'assets/inquiry.js', 'js', '정적 스크립트 파일 제공 여부'],
    ['sitemap', '검색엔진 사이트맵', 'sitemap.xml', 'xml', '홈페이지 주소와 페이지 목록']
  ];
  const labels = {pass:'정상',warning:'확인 필요',fail:'실패'};
  const BAD = '예상한 파일이나 API 응답이 아닙니다. Cloudflare 배포 경로 및 최신 버전을 확인하세요.';
  async function request(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9500);
    try {
      return await fetch(path, {method:'GET', cache:'no-store', credentials:'omit', redirect:'follow', signal:controller.signal,
        headers:{Accept:'*/*'}});
    } finally {clearTimeout(timer);}
  }
  function record(id, title, status, detail, hint='') {
    return {id,title,status,detail,hint};
  }
  async function checkStatic([id,title,path,kind,hint]) {
    try {
      const response = await request(path);
      const mime = (response.headers.get('content-type')||'').toLowerCase();
      const expected = {html:'text/html',css:'text/css',js:'javascript',xml:'xml'}[kind];
      if (!response.ok || !mime.includes(expected)) return record(id,title,'fail',`HTTP ${response.status} · 예상 파일 형식(${expected})과 다름`,BAD);
      if (kind==='xml') {
        const source = await response.text();
        if (!source.includes('<urlset') || !source.includes('/inquiry.html'))
          return record(id,title,'warning','사이트맵 형식이나 신규 접수 주소 확인 필요','V9/V10 배포가 반영됐는지 확인하세요.');
      }
      return record(id,title,'pass',`HTTP ${response.status} · 정적 ${kind.toUpperCase()} 파일 확인`,hint);
    } catch {return record(id,title,'fail','요청이 실패했거나 시간 제한을 초과했습니다.',BAD);}
  }
  async function checkReadiness() {
    try {
      const response = await request('/api/inbox-status');
      const mime=(response.headers.get('content-type')||'').toLowerCase();
      if (!response.ok || !mime.includes('application/json'))
        return record('api','접수 준비 API','fail',`HTTP ${response.status} · JSON API를 찾지 못했습니다.`,
          'Git 연결의 루트 functions/api/ 및 Pages 배포 로그를 확인하세요.');
      let result;
      try {result=await response.json();} catch {return record('api','접수 준비 API','fail','JSON 파싱 실패','함수 컴파일/응답을 확인하세요.');}
      if (result?.ready===true)
        return record('api','접수 준비 API','pass','서버가 접수 준비 상태를 보고합니다. 실제 저장 시험은 별도로 필요합니다.','D1·Turnstile 실운영 저장 시험을 실시해야 운영 확정입니다.');
      if (result?.ready===false)
        return record('api','접수 준비 API','warning',result.reason==='schema_not_ready'
          ? 'DB 테이블이 없거나 스키마 마이그레이션이 필요합니다.'
          : '비밀 변수·DB 연결·개인정보 승인·활성화 설정 중 하나 이상이 준비되지 않았습니다.',
          '하단의 Cloudflare 설정 절차를 확인하세요. 미설정 상태에서는 접수가 비활성화됩니다.');
      return record('api','접수 준비 API','fail','알 수 없는 응답 형식','배포된 Functions 버전을 확인하세요.');
    } catch {return record('api','접수 준비 API','fail','요청 실패 또는 시간 초과','Cloudflare 배포·함수 실행 상태를 확인하세요.');}
  }
  async function checkAdminAuth() {
    try {
      const response = await request('/api/admin/inquiries?limit=1');
      if (response.status===401 || response.status===503)
        return record('auth','관리자 인증 차단','pass',`비인증 관리자 조회가 HTTP ${response.status}로 거부됐습니다.`,
          '토큰은 오직 관리자 화면에만 입력합니다.');
      if(response.status===200)
        return record('auth','관리자 인증 차단','fail','비인증 조회에 HTTP 200이 반환됐습니다. 응답 내용은 읽지 않았습니다.',
          '즉시 해당 API를 비활성화하고 관리자 인증을 검토하세요.');
      return record('auth','관리자 인증 차단','warning',`HTTP ${response.status} · 예상 응답(401/503)이 아닙니다.`,
        'Functions 라우팅과 관리자 인증 로직을 점검하세요.');
    } catch {return record('auth','관리자 인증 차단','warning','관리자 API 접근 확인이 불가능합니다.','네트워크/라우팅을 확인하세요.');}
  }
  async function checkWrongVerb() {
    try {
      const response=await request('/api/inquiries');
      if(response.status===405)return record('method','접수 API 잘못된 요청 차단','pass','GET 요청이 HTTP 405로 거부됐습니다.',
        '실제 등록은 서버가 검증한 POST로만 처리됩니다.');
      return record('method','접수 API 잘못된 요청 차단','fail',`GET 요청이 HTTP ${response.status}를 반환했습니다.`,
        '실제 Functions 라우팅과 메서드 차단을 확인하세요.');
    } catch {return record('method','접수 API 잘못된 요청 차단','warning','접수 API 확인 불가','네트워크/라우팅을 확인하세요.');}
  }
  async function checkHeaders() {
    try {
      const response=await request('index.html');
      if(!response.ok) return record('headers','보안 응답 헤더','warning',`메인 페이지 HTTP ${response.status}`,'메인 배포부터 복구하세요.');
      const h=response.headers;
      const csp=h.get('content-security-policy')||'';
      const nosniff=(h.get('x-content-type-options')||'').toLowerCase()==='nosniff';
      const noframes=/frame-ancestors\s+'self'/.test(csp) || /sameorigin/i.test(h.get('x-frame-options')||'');
      const count=[!!csp,nosniff,noframes].filter(Boolean).length;
      return record('headers','보안 응답 헤더',count===3?'pass':'warning',
        `기본 보안 헤더 ${count}/3 확인 (CSP·nosniff·프레임 제한)`,
        'Cloudflare Pages 출력 폴더에 _headers 파일이 포함됐는지 확인하세요.');
    } catch {return record('headers','보안 응답 헤더','warning','헤더 요청에 실패했습니다.','네트워크/배포 상태를 확인하세요.');}
  }
  function card(item) {
    const el=document.createElement('article');el.className='check';el.dataset.status=item.status;
    const top=document.createElement('div');top.className='check-top';
    const title=document.createElement('h3');title.textContent=item.title;
    const badge=document.createElement('span');badge.className='status';badge.textContent=labels[item.status]||'미확인';
    top.append(title,badge);el.append(top);
    const detail=document.createElement('p');detail.textContent=item.detail;el.append(detail);
    if(item.hint){const hint=document.createElement('p');hint.textContent=item.hint;el.append(hint);}
    return el;
  }
  function render(records) {
    area.replaceChildren(...records.map(card));
    const n={pass:0,warning:0,fail:0};records.forEach(item=>{if(item.status in n)n[item.status]++;});
    byId('stat-total').textContent=String(records.length);byId('stat-pass').textContent=String(n.pass);
    byId('stat-warning').textContent=String(n.warning);byId('stat-fail').textContent=String(n.fail);
    const open=records.find(item=>item.id==='api');
    const isReady=open?.status==='pass' && n.fail===0;
    const mode=n.fail>0?'fail':n.warning>0?'warning':'pass';
    summary.dataset.status=mode;
    summary.textContent=n.fail>0?'검사 실패 항목이 있습니다. 운영 상태를 점검하세요.'
      : !isReady?'일부 확인이 필요합니다. 실운영 접수는 별도 검증이 필수입니다.'
      : '공개 점검 통과. 실제 D1 접수·복구 시험은 여전히 필요합니다.';
    latest={time:new Date().toISOString(),origin:location.origin,counts:n,checks:records};
    downloadButton.disabled=false;
    activity.textContent='검사 완료 · '+new Date().toLocaleString('ko-KR');
  }
  async function run() {
    if(running)return;
    running=true;runButton.disabled=true;downloadButton.disabled=true;
    activity.textContent='공개 페이지와 API 상태를 확인하고 있습니다…';
    try {
      const results=await Promise.all([
        ...specifications.map(checkStatic),checkReadiness(),checkAdminAuth(),checkWrongVerb(),checkHeaders()
      ]);
      render(results);
    } catch {
      activity.textContent='예상하지 못한 검사 오류가 발생했습니다.';
    } finally {running=false;runButton.disabled=false;}
  }
  function download() {
    if(!latest)return;
    const lines=[
      '올파일원 웹스튜디오 V10 운영 준비도 점검',
      '검사 시각(UTC): '+latest.time,
      '사이트: '+latest.origin,
      '※ 공개 배포 상태만 확인하며 관리자 토큰·개인정보는 수집하지 않음',
      '※ 실제 고객 문의 저장, 결제, 복구 및 법적 적합성은 별도 검증',
      '정상: '+latest.counts.pass+' / 확인 필요: '+latest.counts.warning+' / 실패: '+latest.counts.fail,
      ''
    ];
    latest.checks.forEach((v,i)=>lines.push((i+1)+'. ['+labels[v.status]+'] '+v.title+' — '+v.detail));
    const blob=new Blob(['\uFEFF',lines.join('\n')+'\n'],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');
    a.href=url;a.download='allfileone_v10_public_readiness.txt';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    activity.textContent='비밀 키가 포함되지 않은 진단 보고서를 저장했습니다.';
  }
  runButton.addEventListener('click',run);
  downloadButton.addEventListener('click',download);
})();
