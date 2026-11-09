/* AllFileOne WebStudio V85. Original first-party static page, no paid API, no POST. */
(()=>{'use strict';
  const sectors=window.AFO_V67_INDUSTRIES||{},catalog=window.ALLFILEONE_V28_CATALOG||{},extra=window.AFO_V77_FEATURE_EXTENSION||{};
  const keys=Object.keys(sectors).filter(k=>Object.prototype.hasOwnProperty.call(catalog,k)&&Object.prototype.hasOwnProperty.call(extra,k));
  const styles=['modern','premium','editorial'],styleNames={modern:'모던',premium:'프리미엄',editorial:'에디토리얼'};
  const $=id=>document.getElementById(id);
  const sel=$('v85-sector'),frame=$('v85-live-frame'),host=$('v85-preview-host'),thumbCards=[...document.querySelectorAll('[data-v85-style-card]')];
  if(!sel||!frame||!host||keys.length!==12){const state=$('v85-preview-state');if(state)state.textContent='소스 데이터 로딩 오류: 원본 12개 업종을 확인하세요.';return;}
  const q=new URLSearchParams(location.search);
  let sector=keys.includes(q.get('industry'))?q.get('industry'):keys[0];
  let style=styles.includes(q.get('style'))?q.get('style'):'modern';
  let device=q.get('device')==='mobile'?'mobile':'desktop';
  const originalURL=(id,theme,feature)=>{
    const url=new URL('./demo/'+encodeURIComponent(id)+'/'+theme+'/index.html',document.baseURI);
    if(Number.isInteger(feature)){url.searchParams.set('feature',String(feature));url.hash='v28-tools';}
    return url.href;
  };
  const labURL=(id,i)=>new URL('./feature-lab-v80.html?'+new URLSearchParams({industry:id,feature:String(i)}),document.baseURI).href;
  const el=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
  const setSameURL=(a,url)=>{if(a.href!==url)a.href=url;};
  const scaleFrames=()=>{
    const targetWidth=device==='mobile'?390:1366,targetHeight=device==='mobile'?844:920;
    const inner=host.clientWidth-(device==='mobile'?0:0);
    let ratio=Math.min(inner/targetWidth,1);
    if(device==='desktop')ratio=inner/targetWidth;
    ratio=Math.max(.2,ratio);
    host.style.setProperty('--v85-frame-width',targetWidth+'px');host.style.setProperty('--v85-frame-height',targetHeight+'px');
    frame.style.transform='scale('+ratio+')';
    thumbCards.forEach(c=>{
      const child=c.querySelector('iframe'),box=c.querySelector('.v85-thumb');
      if(child&&box)child.style.transform='scale('+Math.max(.1,box.clientWidth/1280)+')';
    });
  };
  const renderFeatures=()=>{
    const root=$('v85-feature-grid');root.replaceChildren();
    const first=catalog[sector]?.features||[],later=extra[sector]?.extra||[];
    if(first.length!==4||later.filter(f=>f.status==='simulated').length!==3||later.filter(f=>f.status==='planned').length!==1){
      root.append(el('p','','기능 카탈로그를 완전히 불러오지 못했습니다.'));
      return;
    }
    const added=later.map((f,i)=>({...f,idx:i})).filter(f=>f.status==='simulated');
    const items=[...first.map((f,i)=>({...f,num:i+1,url:originalURL(sector,style,i)})),...added.map((f,i)=>({...f,num:i+5,url:labURL(sector,f.idx)}))];
    for(const f of items){
      const card=el('article','v85-feature');card.dataset.status='simulated';
      const num=el('span','v85-feature-num',String(f.num).padStart(2,'0')+' / 직접 조작 · 가상 시연');
      const head=el('h3','',f.title),desc=el('p','',f.desc);
      const link=el('a','','이 기능 체험 ↗');link.href=f.url;link.target='_blank';link.rel='noopener';
      card.append(num,head,desc,link);root.append(card);
    }
    const f=later.find(x=>x.status==='planned'),card=el('article','v85-feature is-planned');card.dataset.status='planned';
    const title=el('h3','',f.title),description=el('p','',f.desc+' 실제 납품 시 별도 구현·비용·보안 검토가 필요합니다.');
    const a=el('a','','제작 범위 검토 ↗');a.href=$('v85-scope').href;
    card.append(el('span','v85-feature-num','별도 개발 / 현재 미구현'),title,description,a);root.append(card);
  };
  const render=()=>{
    const info=sectors[sector];sel.value=sector;
    $('v85-sector-label').textContent=info.name;
    $('v85-sector-intro').textContent=info.lead;
    $('v85-live-title').replaceChildren(document.createTextNode(info.name+' '),el('span','',styleNames[style]));
    $('v85-live-description').textContent=info.headlines[styles.indexOf(style)].replace(/\\n/g,' ')+' · 가상 브랜드 실제 HTML 페이지';
    $('v85-feature-heading').textContent=info.name+' · 실제 조작 가능한 기능 7가지';
    $('v85-browser-address').textContent='demo / '+sector+' / '+style;
    document.querySelectorAll('[data-v85-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v85Style===style)));
    thumbCards.forEach(card=>{
      const theme=card.dataset.v85StyleCard;
      card.classList.toggle('is-current',theme===style);
      const preview=card.querySelector('iframe'),url=originalURL(sector,theme);
      if(preview&&preview.src!==url)preview.src=url;
    });
    host.dataset.device=device;
    document.querySelectorAll('[data-v85-device]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v85Device===device)));
    const live=originalURL(sector,style);
    if(frame.src!==live){$('v85-preview-state').textContent='실제 HTML 화면을 불러오는 중입니다.';frame.src=live;}
    setSameURL($('v85-open-site'),live);
    $('v85-compare').href='./design-compare-live.html?'+new URLSearchParams({industry:sector,style});
    $('v85-scope').href='./feature-scope-v81.html?'+new URLSearchParams({industry:sector,style});
    renderFeatures();scaleFrames();
    if(location.protocol==='http:'||location.protocol==='https:'){
      const target=new URL(location.href);target.searchParams.set('industry',sector);target.searchParams.set('style',style);target.searchParams.set('device',device);
      history.replaceState(null,'',target.href);
    }
  };
  $('v85-download').addEventListener('click',()=>{
    const first=catalog[sector].features,later=extra[sector].extra;
    const lines=['올파일원 웹스튜디오 V85 / 업종·디자인 선택 요약','',
      '업종: '+sectors[sector].name,'디자인 방향: '+styleNames[style],'샘플 페이지: '+originalURL(sector,style),'',
      '브라우저에서 조작 가능한 가상 시연 7개:',...first.map((f,i)=>String(i+1)+'. '+f.title),
      ...later.filter(f=>f.status==='simulated').map((f,i)=>String(i+5)+'. '+f.title),'',
      '미구현 실제 운영 기능 · 별도 제작:',...later.filter(f=>f.status==='planned').map(f=>'- '+f.title),
      '','중요: 이 문서는 예시 선택 기록이며 견적서·계약서 또는 실제 고객 거래 증명서가 아닙니다.',
      '예약·결제·회원·재고·이메일 접수 서버는 운영 중이지 않습니다.','금액·부가세·도메인·호스팅·유지보수·사용권은 별도 협의합니다.',
      '이 파일은 내 브라우저에서 생성되며 사이트 서버로 전송되지 않습니다.',''];
    const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='AllFileOne_V85_'+sector+'_'+style+'_summary.txt';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('v85-save-feedback').textContent='TXT를 저장했습니다. 이메일은 발송되지 않았습니다.';
  });
  sel.addEventListener('change',()=>{if(keys.includes(sel.value)){sector=sel.value;render()}});
  document.querySelectorAll('[data-v85-style]').forEach(b=>b.addEventListener('click',()=>{if(styles.includes(b.dataset.v85Style)){style=b.dataset.v85Style;render()}}));
  document.querySelectorAll('[data-v85-device]').forEach(b=>b.addEventListener('click',()=>{device=b.dataset.v85Device==='mobile'?'mobile':'desktop';render()}));
  frame.addEventListener('load',()=>{
    const status=$('v85-preview-state');
    try {
      const body=frame.contentDocument?.body;
      if(body?.dataset.industry===sector&&body?.dataset.v13Style===style){
        status.textContent='실제 HTML 시안이 불러와졌습니다. 기능은 가상 데이터를 이용합니다.';
      }else{
        status.textContent='미리보기에서 해당 업종·디자인 화면을 검증하지 못했습니다. 새 창 열기로 확인하세요.';
      }
    }catch(_){status.textContent='미리보기 접근이 제한됐습니다. 새 창에서 전체 크기로 확인하세요.';}
  });
  window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);if(keys.includes(p.get('industry')))sector=p.get('industry');if(styles.includes(p.get('style')))style=p.get('style');device=p.get('device')==='mobile'?'mobile':'desktop';render();});
  if('ResizeObserver' in window){const ob=new ResizeObserver(scaleFrames);ob.observe(host);thumbCards.forEach(c=>ob.observe(c.querySelector('.v85-thumb')));}else window.addEventListener('resize',scaleFrames);
  render();window.AFO_V85_EXPERIENCE_READY=true;
})();
