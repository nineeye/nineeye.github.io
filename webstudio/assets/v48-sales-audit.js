/* AllFileOne WebStudio V48 — read-only live sales-funnel validation.
 * Fetches only public same-origin static files. No visitor data, API, tracking, payment or email submission.
 * An HTTP/file check is NOT a real email receipt or search-index verification.
 */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const target = get('v48-sales-audit');
  if (!target || target.dataset.initialized === 'yes') return;
  target.dataset.initialized = 'yes';
  const root = new URL('./', document.baseURI);
  const base = path => new URL(path, root);
  const sectorPaths = ['manufacturing', 'academy', 'interior'];
  const RULES = [
    {id:'release',path:'assets/current-release.json',label:'최신 릴리스 식별',test:text=>{const x=JSON.parse(text);return x.product==='AllFileOne WebStudio'&&/^V\d+$/.test(x.version)&&Number(x.version.slice(1))>=47;}},
    {id:'home',path:'index.html',label:'메인에서 3업종 이동',test:text=>sectorPaths.every(id=>text.includes('for-'+id+'.html'))},
    {id:'manufacturing',path:'for-manufacturing.html',label:'제조·도매 판매페이지·상담 동선',test:t=>t.includes('v43-industry-lab.js')&&t.includes('launch-kit.html')&&t.includes('contact.html')&&t.includes('rel="canonical"')},
    {id:'academy',path:'for-academy.html',label:'학원·교육 판매페이지·상담 동선',test:t=>t.includes('v43-industry-lab.js')&&t.includes('launch-kit.html')&&t.includes('contact.html')&&t.includes('rel="canonical"')},
    {id:'interior',path:'for-interior.html',label:'인테리어 판매페이지·상담 동선',test:t=>t.includes('v43-industry-lab.js')&&t.includes('launch-kit.html')&&t.includes('contact.html')&&t.includes('rel="canonical"')},
    {id:'sector-faq',path:'for-manufacturing.html',label:'제조업 구매자 질문 콘텐츠',test:t=>(t.match(/class="v44-faq-item"/g)||[]).length>=4},
    {id:'kit',path:'launch-kit.html',label:'제작 시작키트·상담 연결',test:t=>t.includes('id="checklist"')&&t.includes('v45-launch-kit.js')&&t.includes('v46-handoff.js')},
    {id:'kit-js',path:'assets/v45-launch-kit.js',label:'고객 준비자료 TXT 생성',test:t=>t.includes('downloadTxt')&&t.includes('projectMemo')&&t.includes('selected()')},
    {id:'handoff',path:'assets/v46-handoff.js',label:'일회성 안전 인계',test:t=>t.includes('sessionStorage.removeItem(KEY)')&&t.includes('source=startkit')&&t.includes('MAX_AGE_MS')},
    {id:'contact',path:'contact.html',label:'상담서·메일 패키지 연결',test:t=>t.includes('id="brief-form"')&&t.includes('v26-contact.js')&&t.includes('v46-handoff.js')&&t.includes('v47-mail-packet.js')},
    {id:'packet',path:'assets/v47-mail-packet.js',label:'전체 문의 메일 수동 발송 준비',test:t=>t.includes('v46-full-report')&&t.includes('v47-download-all')&&t.includes('nineeyes@naver.com')&&!t.includes('fetch(')},
    {id:'webmail',path:'assets/v42-webmail-guide.js',label:'웹메일 수동 전송 안내',test:t=>t.includes('https://mail.naver.com/')&&t.includes('v42-copy-complete')},
    {id:'sitemap',path:'sitemap.xml',label:'사이트맵의 3업종·시작키트',test:t=>[...sectorPaths.map(x=>'for-'+x+'.html'),'launch-kit.html'].every(x=>t.includes(x))},
    {id:'robots',path:'robots.txt',label:'검색 로봇·사이트맵 안내',test:t=>/Sitemap:\s*https:\/\/allfileone-webstudio\.pages\.dev\/sitemap\.xml/.test(t)&&t.includes('Disallow: /demo/')},
    {id:'plans',path:'plan-guide.html',label:'제작 상품·비용 고지',test:t=>t.includes('29')&&t.includes('59')&&t.includes('99')&&t.includes('확정 견적')},
    {id:'designs',path:'design-gallery-v13.html',label:'36개 디자인 선택 화면',test:t=>t.includes('gallery-v13')&&t.includes('demo')}
  ];
  const state={running:false,records:[],completed:'',version:''};
  const renderHead=(name,text)=>{const el=document.createElement(name);el.textContent=text;return el;};
  const title=renderHead('h3','V48 · 실제 판매 동선 자동 점검');
  const lead=renderHead('p','이 브라우저가 연결된 서버의 공개 파일을 확인합니다. 네이버·Google 색인, 실제 상담 메일 수신, 실거래·계약 완료 여부는 확인하지 못합니다.');
  const toolbar=document.createElement('div');toolbar.className='v48-toolbar';
  const start=document.createElement('button');start.type='button';start.id='v48-run';start.textContent='판매 동선 다시 검사';
  const save=document.createElement('button');save.type='button';save.id='v48-save';save.textContent='TXT 결과 저장';save.disabled=true;
  const copy=document.createElement('button');copy.type='button';copy.id='v48-copy';copy.textContent='검사 결과 복사';copy.disabled=true;
  toolbar.append(start,save,copy);
  const status=renderHead('p','배포 파일 검사 준비 중');status.id='v48-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const list=document.createElement('ol');list.id='v48-results';list.className='v48-results';
  const external=renderHead('p','검색 등록은 운영자 계정의 소유 확인이 필요합니다. 이 점검은 네이버·Google 사이트 등록을 대신하지 않습니다.');external.className='v48-disclosure';
  const providers=document.createElement('p');providers.className='v48-providers';
  [['네이버 서치어드바이저','https://searchadvisor.naver.com/'],['Google Search Console','https://search.google.com/search-console']].forEach(([caption,href])=>{const link=document.createElement('a');link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=caption+' ↗';providers.append(link)});
  target.append(title,lead,toolbar,status,list,external,providers);
  async function read(path){
    const url=base(path);
    if(!['http:','https:'].includes(root.protocol)||url.origin!==root.origin||!url.pathname.startsWith(root.pathname))throw Error('검사 경로가 동일 출처가 아닙니다');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(url.href,{cache:'no-store',credentials:'omit',redirect:'follow',signal:controller.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      if(new URL(response.url).origin!==root.origin)throw Error('외부 출처로 리다이렉트됨');
      const text=await response.text();if(text.length>1500000)throw Error('허용 크기 초과');return text;
    }finally{clearTimeout(timer)}
  }
  function result(rule,pass,detail){
    const item={id:rule.id,path:rule.path,label:rule.label,pass:!!pass,detail:String(detail).slice(0,120)};
    state.records.push(item);
    const li=document.createElement('li');li.className=pass?'v48-ok':'v48-hold';
    const mark=renderHead('strong',pass?'통과':'확인 필요');mark.className='v48-mark';
    const body=document.createElement('span');body.append(renderHead('b',rule.label),renderHead('small',rule.path+' · '+item.detail));
    const a=document.createElement('a');a.href=base(rule.path).href;a.textContent='열기';
    li.append(mark,body,a);list.append(li);
  }
  async function run(){
    if(state.running)return;state.running=true;start.disabled=true;save.disabled=true;copy.disabled=true;
    state.records=[];list.replaceChildren();state.version='';state.completed='';status.textContent='공개 파일 16개 항목 검사 중입니다…';
    try{
      for(let i=0;i<RULES.length;i+=4){
        const batch=RULES.slice(i,i+4);
        await Promise.all(batch.map(async(rule)=>{
          try{
            const raw=await read(rule.path);const pass=!!rule.test(raw);
            if(rule.id==='release'&&pass)state.version=JSON.parse(raw).version;
            result(rule,pass,pass?'공개 파일 응답·기대 내용 확인':'파일 내용이 기대와 다름');
          }catch(e){result(rule,false,e.name==='AbortError'?'응답 시간 제한':e.message||'파일 접근 불가')}
        }));
      }
      const pass=state.records.filter(x=>x.pass).length;
      state.completed=new Date().toLocaleString('ko-KR');
      status.textContent=`${pass}/${RULES.length}개 통과 · 배포 식별 ${state.version||'미확인'} · ${state.completed}. 실제 이메일 수신·검색 색인은 미검증입니다.`;
      save.disabled=false;copy.disabled=false;
    }finally{start.disabled=false;state.running=false;}
  }
  function report(){return [
    '올파일원 웹스튜디오 / V48 공개 판매 동선 점검',
    '검사 출처: '+root.href,'서버 표시 버전: '+(state.version||'미확인'),
    '검사 시각: '+state.completed,
    '공개 파일: '+state.records.filter(x=>x.pass).length+'/'+RULES.length+' 통과',
    ...state.records.map(x=>(x.pass?'PASS':'HOLD')+' | '+x.label+' | '+x.path+' | '+x.detail),
    '', '주의: 검사는 공개 정적 파일·문구만 검사합니다. 실제 고객 문의 수신, 색인 등록, 실계약을 확인하지 않습니다.'
  ].join('\n')+'\n'}
  start.addEventListener('click',run);
  save.addEventListener('click',()=>{
    const blob=new Blob(['\ufeff',report()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='AllFileOne_WebStudio_V48_Sales_Audit.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  });
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(report());status.textContent+=' · 보고서를 복사했습니다.'}catch(_){status.textContent+=' · 클립보드가 차단되어 TXT 저장을 이용하세요.'}});
  run();
})();
