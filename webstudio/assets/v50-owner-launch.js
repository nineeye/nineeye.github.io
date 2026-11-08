/* AllFileOne WebStudio V50 — local-only owner readiness, no credentials, cookies or tracking.
 * Same-origin static reads cannot verify mail delivery or search index. Manual checks stay in memory.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const run = $('auto-run'), list = $('auto-results');
  if(!run || !list || !document.getElementById('manual-list')) return;
  const origin = new URL('./', document.baseURI);
  const industries = ['manufacturing','academy','interior'];
  const RULES = [
    ['release','릴리스 식별','assets/current-release.json',t=>{const j=JSON.parse(t);return j.product==='AllFileOne WebStudio'&&/^V\d+$/.test(j.version)&&+j.version.slice(1)>=49;}],
    ['home','메인 업종 이동','index.html',t=>industries.every(x=>t.includes('for-'+x+'.html'))],
    ...industries.map(x=>[x,x==='manufacturing'?'제조·도매 판매':x==='academy'?'학원·교육 판매':'인테리어·시공 판매','for-'+x+'.html',t=>t.includes('launch-kit.html')&&t.includes('quick-inquiry.html')&&t.includes('rel="canonical"')]),
    ['quick','1분 문의 화면','quick-inquiry.html',t=>t.includes('id="v49-form"')&&t.includes('v49-quick-inquiry.js')&&t.includes('v49-mailto')],
    ['quickjs','문의 문안 작성 코드','assets/v49-quick-inquiry.js',t=>t.includes('v49-download')&&t.includes('mailto:')&&!t.includes('fetch(')],
    ['contact','상세 상담서','contact.html',t=>t.includes('id="brief-form"')&&t.includes('v47-mail-packet.js')],
    ['kit','제작 준비키트','launch-kit.html',t=>t.includes('v46-handoff.js')&&t.includes('id="checklist"')],
    ['sitemap','판매 페이지 사이트맵','sitemap.xml',t=>[...industries.map(x=>'for-'+x+'.html'),'quick-inquiry.html'].every(x=>t.includes(x))],
    ['robots','검색 로봇 안내','robots.txt',t=>/Sitemap:\s*https:\/\//.test(t)&&t.includes('/sitemap.xml')]
  ];
  const state = {ran:false,busy:false,records:[],when:'',release:'미확인'};
  const manual = [...document.querySelectorAll('#manual-list input[data-check]')];
  function updateManual(){
    const count=manual.filter(x=>x.checked).length;
    $('manual-count').textContent=count+'/'+manual.length+' 자체 확인';
  }
  manual.forEach(x=>x.addEventListener('change',updateManual));
  updateManual();
  async function load(path){
    const u=new URL(path,origin);
    if(!['http:','https:'].includes(origin.protocol)||u.origin!==origin.origin||!u.pathname.startsWith(origin.pathname))throw Error('동일 출처 HTTP(S) 검사가 아닙니다');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(u.href,{credentials:'omit',cache:'no-store',redirect:'follow',signal:controller.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      if(new URL(response.url).origin!==origin.origin)throw Error('외부 URL로 이동');
      const txt=await response.text();if(txt.length>1200000)throw Error('파일 크기 제한 초과');
      return txt;
    }finally{clearTimeout(timer)}
  }
  function result(rule,pass,detail){
    const entry={key:rule[0],label:rule[1],path:rule[2],pass,detail:String(detail).slice(0,130)};
    return entry;
  }
  function show(records){
    list.replaceChildren();
    records.forEach(rec=>{
      const li=document.createElement('li');
      const mark=document.createElement('b');mark.className=rec.pass?'ok':'hold';mark.textContent=rec.pass?'통과':'확인 필요';
      const wrap=document.createElement('div');
      const label=document.createElement('div');label.className='name';label.textContent=rec.label;
      const info=document.createElement('div');info.className='detail';info.textContent=rec.path+' · '+rec.detail;
      wrap.append(label,info);li.append(mark,wrap);list.append(li);
    });
  }
  async function execute(){
    if(state.busy)return;state.busy=true;run.disabled=true;$('auto-status').textContent='공개 파일 검사 중입니다…';
    state.records=[];state.ran=false;state.when='';state.release='미확인';list.replaceChildren();
    try {
      const records = new Array(RULES.length);
      for(let i=0;i<RULES.length;i+=3){
        await Promise.all(RULES.slice(i,i+3).map(async(rule,k)=>{
          let entry;
          try {const t=await load(rule[2]);const pass=!!rule[3](t);
            if(rule[0]==='release'&&pass)state.release=JSON.parse(t).version;
            entry=result(rule,pass,pass?'공개 파일과 필요한 내용 확인':'파일 내용이 기대와 다름');
          }catch(e){entry=result(rule,false,e?.name==='AbortError'?'응답 시간 제한':e?.message||'검사 불가');}
          records[i+k]=entry;
        }));
      }
      state.records=records;state.ran=true;state.when=new Date().toLocaleString('ko-KR');show(records);
      const good=records.filter(x=>x.pass).length;
      $('auto-count').textContent=good+'/'+RULES.length+' 파일 검사';
      $('auto-status').textContent='자동 검사 '+good+'/'+RULES.length+' 통과 · 확인 버전 '+state.release+' · 실제 메일 수신·검색 색인은 미검증입니다.';
    }finally {state.busy=false;run.disabled=false;}
  }
  function report(){
    const done=manual.filter(x=>x.checked).length;
    return [
      '올파일원 웹스튜디오 / V50 첫 고객 수주 준비도 자체 점검',
      '검사 사이트: '+origin.href,'검사 시각: '+(state.when||'미실시'),
      '공개 파일 확인: '+(state.ran?state.records.filter(x=>x.pass).length+'/'+RULES.length:'미실시'),
      '공개 릴리스: '+state.release,
      ...state.records.map(x=>(x.pass?'PASS':'HOLD')+' | '+x.label+' | '+x.path+' | '+x.detail),
      '', '운영자 직접 확인: '+done+'/'+manual.length+' (본인 체크, 자동 확인 아님)',
      ...manual.map((x,i)=>(x.checked?'[자체 확인] ':'[미확인] ')+(i+1)+'. '+x.closest('label')?.querySelector('b')?.textContent),
      '', '경계: 공개 파일 확인과 실제 메일 수신·네이버/Google 색인·계약·매출은 별개입니다.',
      '이 도구는 고객 정보, 비밀 키, 수신 확인 결과를 자동 조회하거나 저장하지 않습니다.'
    ].join('\r\n')+'\r\n';
  }
  function message(t){$('report-status').textContent=t;}
  $('report-preview').addEventListener('click',()=>{const x=$('report-text');x.textContent=report();x.hidden=!x.hidden;$('report-preview').textContent=x.hidden?'보고서 미리보기':'미리보기 닫기';message(x.hidden?'미리보기를 닫았습니다.':'브라우저 화면에만 보고서를 표시합니다.');});
  $('report-copy').addEventListener('click',async()=>{const x=report();try{if(typeof navigator.clipboard?.writeText!=='function')throw Error('clipboard blocked');await navigator.clipboard.writeText(x);message('점검 기록을 복사했습니다. 자동 업로드되지 않습니다.')}catch(_){const pre=$('report-text');pre.textContent=x;pre.hidden=false;message('자동 복사가 차단되었습니다. 아래 내용을 선택해 복사하거나 TXT를 저장하세요.');}});
  $('report-download').addEventListener('click',()=>{const blob=new Blob(['\ufeff',report()],{type:'text/plain;charset=utf-8'});const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download='AllFileOne_V50_Owner_Readiness.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),2500);message('TXT를 저장했습니다. 이것은 자체 확인 기록이며 외부 전송·접수가 아닙니다.');});
  run.addEventListener('click',execute);
  // Deliberately do not persist owner's checked state or automatically claim checks passed.
})();
