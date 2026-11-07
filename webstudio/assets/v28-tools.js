/* ALLFILEONE WEB STUDIO V28: 48 distinct client-side, fictional industry functions.
   No backend requests, tracking, cookies, payment or reservation submission.
   Copyright 2026 AllFileOne; original implementation. */
'use strict';
(() => {
  const catalog = window.ALLFILEONE_V28_CATALOG;
  const industryId = document.body?.dataset.industry;
  const group = catalog?.[industryId];
  const main = document.querySelector('main');
  if (!group || !main || document.getElementById('v28-tools')) return;
  const el = (tag, cls = '', txt) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (txt !== undefined) node.textContent = String(txt);
    return node;
  };
  const won = n => new Intl.NumberFormat('ko-KR',{maximumFractionDigits:0}).format(n) + '원';
  const say = txt => { status.textContent = txt; };
  const download = (name, content, mime='text/plain;charset=utf-8') => {
    const blob = new Blob(['\ufeff', content],{type:mime});
    const uri = URL.createObjectURL(blob);
    const anchor = el('a'); anchor.href = uri; anchor.download = name;
    document.body.append(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(uri), 8000);
  };
  const note = '※ 모든 제품·가격·시간표·자료는 가상의 시연 데이터입니다. 실제 발주·진료·수강·결제·예약·참가신청은 접수되지 않습니다.';
  let current = 0, brief = '', canExport = false;
  const section = el('section','v28-suite'); section.id='v28-tools'; section.dataset.v28Ready='true'; section.setAttribute('aria-labelledby','v28-title');
  const frame=el('div','v28-wrap');
  const top=el('div','v28-intro');
  const label=el('span','v28-eyebrow','INDUSTRY FUNCTION LAB / V28 · 04 INTERACTIVE TOOLS');
  const title=el('h2','',group.name+' 고객을 위한 실무 기능 4가지');title.id='v28-title';
  const sub=el('p','','단순한 디자인 미리보기가 아니라, 방문자가 실제로 검색·비교·계산·저장할 수 있는 시연입니다.');
  const disclosure=el('p','v28-disclosure',note);
  top.append(label,title,sub,disclosure);
  const nav=el('div','v28-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','업종별 기능 선택');
  const body=el('div','v28-body');body.id='v28-panel';body.setAttribute('role','tabpanel');body.setAttribute('aria-labelledby','v28-tab-0');
  const heading=el('div','v28-panel-head');const h3=el('h3');const desc=el('p');heading.append(h3,desc);
  const widget=el('div','v28-widget');
  const output=el('div','v28-output');output.setAttribute('aria-live','polite');output.setAttribute('role','status');
  const actions=el('div','v28-actions');
  const exportBtn=el('button','v28-export','현재 결과 TXT 저장');exportBtn.type='button';exportBtn.id='v28-export-txt';
  const status=el('p','v28-status');status.setAttribute('aria-live','polite');
  actions.append(exportBtn,status); body.append(heading,widget,output,actions);
  frame.append(top,nav,body);section.append(frame);
  const conversion=document.querySelector('.v27-conversion');
  if (conversion && conversion.parentElement === main) main.insertBefore(section,conversion);
  else (document.getElementById('v23-workflow')||main.lastElementChild)?.insertAdjacentElement('afterend',section);
  if (!section.isConnected)main.append(section);
  const buttons=[];
  const row=(labelText,control)=>{const wrap=el('label','v28-field');const span=el('span','',labelText);wrap.append(span,control);return wrap;};
  const choice=(options,initial)=>{const s=el('select','v28-select');for(const [value,display] of options){const o=el('option','',display);o.value=value;s.append(o);} if(initial!==undefined)s.value=initial;return s;};
  const button=(text,fn,cls='v28-button')=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;};
  const renderText=(text,success=true)=>{output.textContent=text;output.classList.toggle('v28-warning',!success);brief=text;canExport=!!text;exportBtn.disabled=!canExport;};
  const fmt=(field,val)=>`${field.label}: ${Number.isFinite(val)?new Intl.NumberFormat('ko-KR').format(val):'-'}`;
  const mountFilter=(f)=>{
    const toolbar=el('div','v28-toolbar');const query=el('input','v28-input');query.type='search';query.placeholder='품목·분야·규격 검색';query.setAttribute('aria-label','시연 항목 검색');
    const cats=['전체',...new Set(f.items.map(x=>x.cat))];const cat=choice(cats.map(x=>[x,x]));toolbar.append(row('키워드',query),row('분류',cat));
    const count=el('p','v28-meta');const result=el('div','v28-cards');const picked=new Set();
    const draw=()=>{
      const term=query.value.trim().toLocaleLowerCase('ko-KR');
      const items=f.items.filter(x=>(cat.value==='전체'||x.cat===cat.value)&&(!term||(x.name+' '+x.cat+' '+x.meta).toLocaleLowerCase('ko-KR').includes(term)));
      result.replaceChildren();count.textContent=`검색 결과 ${items.length}건 · 관심 항목 ${picked.size}개`;
      for(const x of items){const card=el('article','v28-card');card.append(el('span','v28-chip',x.cat),el('strong','',x.name),el('p','',x.meta));
        const save=button(picked.has(x.name)?'✓ 관심 해제':'＋ 관심 저장',()=>{picked.has(x.name)?picked.delete(x.name):picked.add(x.name);draw();},'v28-mini');save.setAttribute('aria-pressed',String(picked.has(x.name)));card.append(save);result.append(card);
      }
      if(!items.length)result.append(el('p','v28-empty','조건에 맞는 가상 항목이 없습니다. 검색어를 바꿔보세요.'));
      renderText(`검색 ${items.length}건 / 관심 ${picked.size}개${picked.size?'\n'+[...picked].map(x=>'· '+x).join('\n'):''}`);
    };
    query.addEventListener('input',draw);cat.addEventListener('change',draw);
    widget.append(toolbar,count,result);draw();
  };
  const mountCalc=(f)=>{
    const form=el('form','v28-form');form.noValidate=true;const controls=new Map();
    for(const fd of f.fields){const input=el('input','v28-input');input.type='number';input.min=String(fd.min);input.max=String(fd.max);input.step=String(fd.step);input.value=String(fd.default);input.required=true;input.inputMode='numeric';controls.set(fd.id,input);form.append(row(fd.label,input));}
    const go=button('계산하기 ↗',()=>compute());form.append(go);go.type='submit';form.addEventListener('submit',e=>{e.preventDefault();compute();});widget.append(form);
    function compute(){const values={};for(const fd of f.fields){const raw=controls.get(fd.id).value;const n=Number(raw);if(raw===''||!Number.isFinite(n)||n<fd.min||n>fd.max||n%fd.step!==0){renderText(`${fd.label}을(를) ${fd.min}~${fd.max} 범위에서 올바르게 입력해 주세요.`,false);return;}values[fd.id]=n;}
      let total=0,explanation='';
      if(f.formula==='moq'){
        if(values.quantity<f.moq){renderText(`최소주문수량(MOQ) ${f.moq}개 이상을 입력해야 합니다.`,false);return;}
        total=values.quantity*f.unitPrice;explanation=`수량 ${values.quantity}개 × 가상 단가 ${won(f.unitPrice)}`;
      }else if(f.formula==='area'){total=values.area*f.unitPrice;explanation=`가상 면적 ${values.area}㎡ × 가상 단가 ${won(f.unitPrice)}/㎡`;
      }else if(f.formula==='multiply'){const n=Object.values(values)[0];total=n*f.unitPrice;explanation=`${f.fields[0].label} ${n} × 가상 단가 ${won(f.unitPrice)}`;
      }else if(f.formula==='shipping'){const charge=values.subtotal>=f.freeThreshold?0:f.shippingPrice;total=values.subtotal+charge;explanation=`상품 ${won(values.subtotal)} + 가상 배송비 ${won(charge)} (무료 기준 ${won(f.freeThreshold)})`;
      }else if(f.formula==='sum'){total=Object.values(values).reduce((a,b)=>a+b,0);explanation=f.fields.map(fd=>fmt(fd,values[fd.id])).join(' · ');
      }else{renderText('알 수 없는 계산 방식입니다.',false);return;}
      renderText(`${explanation}\n가상 계산 결과: ${won(total)}\n※ 실제 가격이나 견적이 아닙니다.`);}
    compute();
  };
  const mountCompare=(f)=>{
    const selects=el('div','v28-toolbar');const opts=f.options.map((x,i)=>[String(i),x.name]);const a=choice(opts,'0'),b=choice(opts,String(Math.min(1,opts.length-1)));
    selects.append(row('비교 A',a),row('비교 B',b));const table=el('table','v28-table');const draw=()=>{const left=f.options[Number(a.value)],right=f.options[Number(b.value)];table.replaceChildren();
      const head=el('tr');['항목',left.name,right.name].forEach(v=>head.append(el('th','',v)));table.append(head);
      const keys=[...new Set([...Object.keys(left.attrs),...Object.keys(right.attrs)])];for(const k of keys){const tr=el('tr');tr.append(el('th','',k),el('td','',left.attrs[k]||'—'),el('td','',right.attrs[k]||'—'));table.append(tr);}
      renderText(`비교 항목: ${left.name} / ${right.name}\n`+keys.map(k=>`${k}: ${left.attrs[k]||'-'} / ${right.attrs[k]||'-'}`).join('\n'));};
    a.addEventListener('change',draw);b.addEventListener('change',draw);widget.append(selects,table);draw();
  };
  const mountChecklist=(f)=>{
    const list=el('div','v28-checks');const inputs=[];
    f.steps.forEach((text,i)=>{const input=el('input');input.type='checkbox';input.value=text;input.id=`v28-check-${current}-${i}`;inputs.push(input);const line=el('label','v28-check');line.append(input,el('span','',text));list.append(line);});
    const draw=()=>{const chosen=inputs.filter(x=>x.checked).map(x=>x.value);renderText(`준비 완료 ${chosen.length}/${inputs.length}건\n`+inputs.map(x=>`${x.checked?'[x]':'[ ]'} ${x.value}`).join('\n'));};
    inputs.forEach(x=>x.addEventListener('change',draw));widget.append(list);draw();
  };
  const mountQuiz=(f)=>{
    const input=choice(f.choices.map((x,i)=>[String(i),x.label]));const out=()=>{const x=f.choices[Number(input.value)];renderText(`선택: ${x.label}\n안내: ${x.result}\n※ 실제 전문 진단·자격 판단은 아닙니다.`);};input.addEventListener('change',out);widget.append(row(f.question,input));out();
  };
  const mountTimeline=(f)=>{
    const ordered=el('ol','v28-timeline');const inputs=[];
    f.steps.forEach((x,i)=>{const line=el('li');const check=el('input');check.type='checkbox';check.id=`v28-progress-${current}-${i}`;inputs.push(check);const lab=el('label','',`${i+1}. ${x}`);lab.htmlFor=check.id;line.append(check,lab);ordered.append(line);});
    const draw=()=>{renderText(`완료 단계 ${inputs.filter(x=>x.checked).length}/${inputs.length}\n`+inputs.map((x,i)=>`${x.checked?'[x]':'[ ]'} ${f.steps[i]}`).join('\n'));};
    inputs.forEach(x=>x.addEventListener('change',draw));widget.append(ordered);draw();
  };
  const mountSchedule=(f)=>{
    const dates=['전체',...new Set(f.events.map(x=>x.day))];const day=choice(dates.map(x=>[x,x]));const list=el('div','v28-checks');const selected=new Set();
    const mins=s=>Number(s.split(':')[0])*60+Number(s.split(':')[1]);
    const draw=()=>{list.replaceChildren();const arr=f.events.filter(x=>day.value==='전체'||x.day===day.value);
      arr.forEach((ev)=>{const i=f.events.indexOf(ev);const box=el('input');box.type='checkbox';box.checked=selected.has(i);const label=el('label','v28-check');label.append(box,el('span','',`${ev.day} ${ev.start}–${ev.end} / ${ev.name} (${ev.desc})`));list.append(label);box.addEventListener('change',()=>{box.checked?selected.add(i):selected.delete(i);draw();});});
      const all=[...selected].map(i=>f.events[i]);let conflicts=[];
      for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)if(all[i].day===all[j].day&&mins(all[i].start)<mins(all[j].end)&&mins(all[j].start)<mins(all[i].end))conflicts.push(`${all[i].name} ↔ ${all[j].name}`);
      renderText(`관심 일정 ${all.length}건${conflicts.length?'\n⚠ 일정 중복: '+conflicts.join(', '):'\n일정 중복 없음'}\n${all.map(x=>x.day+' '+x.start+' '+x.name).join('\n')}`,!conflicts.length);
    };day.addEventListener('change',draw);widget.append(row('요일 선택',day),list);draw();
  };
  const mountCart=(f)=>{
    const rows=el('div','v28-cart'),counts=[];
    for(const [i,p] of f.products.entries()){
      const inp=el('input','v28-input');inp.type='number';inp.min='0';inp.max=String(p.max);inp.step='1';inp.value='0';inp.inputMode='numeric';inp.setAttribute('aria-label',p.name+' 수량');
      const line=el('div','v28-cart-row');line.append(el('strong','',p.name),el('span','',won(p.price)),inp);rows.append(line);counts.push(inp);
    }
    const draw=()=>{let total=0;let lines=[];for(let i=0;i<counts.length;i++){const n=Number(counts[i].value);if(counts[i].value===''||!Number.isInteger(n)||n<0||n>f.products[i].max){renderText('장바구니 수량은 0~20개 정수만 입력할 수 있습니다.',false);return;}if(n){total+=n*f.products[i].price;lines.push(`${f.products[i].name} ${n}개 ${won(n*f.products[i].price)}`);}}
      renderText(`가상 장바구니 ${lines.length}종\n${lines.join('\n')}\n상품 합계: ${won(total)}\n※ 결제·주문 접수 아님`);};
    counts.forEach(x=>x.addEventListener('input',draw));widget.append(rows);draw();
  };
  const localISO=(offset)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const mountStay=(f)=>{
    const rooms=choice(f.rooms.map((x,i)=>[String(i),x.name]));const from=el('input','v28-input');from.type='date';const to=el('input','v28-input');to.type='date';const guests=el('input','v28-input');guests.type='number';guests.min='1';guests.max='20';guests.step='1';guests.value='2';
    from.value=localISO(1);to.value=localISO(2);from.min=localISO(0);to.min=localISO(1);
    const form=el('form','v28-form');form.noValidate=true;form.append(row('객실',rooms),row('체크인',from),row('체크아웃',to),row('인원',guests));const btn=button('예시 요금 계산 ↗',()=>calculate());btn.type='submit';form.append(btn);form.addEventListener('submit',e=>{e.preventDefault();calculate();});
    function calculate(){const room=f.rooms[Number(rooms.value)];const d1=new Date(from.value+'T12:00:00'),d2=new Date(to.value+'T12:00:00');const today=new Date(localISO(0)+'T12:00:00');const days=Math.round((d2-d1)/86400000),n=Number(guests.value);
      if(!Number.isFinite(d1.getTime())||!Number.isFinite(d2.getTime())||d1<today||days<1||days>30){renderText('체크인은 오늘 이후, 체크아웃은 체크인 이후 1~30박이어야 합니다.',false);return;}
      if(!Number.isInteger(n)||n<1||n>room.capacity){renderText(`${room.name} 객실의 가상 정원은 ${room.capacity}명입니다.`,false);return;}
      renderText(`${room.name} / ${n}명 / ${days}박\n${from.value} ~ ${to.value}\n가상 숙박비: ${won(days*room.nightly)}\n※ 예약·재고 확인·결제 없음`);
    }
    widget.append(form);calculate();
  };
  const icsEscape=s=>String(s).replace(/[\\;,\n]/g,x=>({'\\':'\\\\',';':'\\;',',':'\\,','\n':'\\n'}[x]));
  const mountICS=(f)=>{
    const list=el('div','v28-checks'),inputs=[];
    f.events.forEach((ev,i)=>{const checkbox=el('input');checkbox.type='checkbox';checkbox.checked=i===0;inputs.push(checkbox);const line=el('label','v28-check');line.append(checkbox,el('span','',`${ev.start.slice(0,10)} ${ev.start.slice(11)}–${ev.end.slice(11)} / ${ev.title}`));list.append(line);});
    const chosen=()=>f.events.filter((_,i)=>inputs[i].checked);
    const draw=()=>renderText(`캘린더에 담을 가상 세션 ${chosen().length}건\n`+chosen().map(x=>x.title+' '+x.start).join('\n'));
    inputs.forEach(x=>x.addEventListener('change',draw));const save=button('ICS 캘린더 파일 저장 ↗',()=>{
      const arr=chosen();if(!arr.length){renderText('일정을 하나 이상 선택해 주세요.',false);return;}
      const toUTC=stamp=>{const [y,m,d,h,mi]=stamp.match(/\d+/g).map(Number);return new Date(Date.UTC(y,m-1,d,h-9,mi)).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');};
      const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ALLFILEONE//V28 FICTIONAL DEMO//KO','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
      arr.forEach((x,i)=>{lines.push('BEGIN:VEVENT','UID:v28-'+i+'@allfileone.example','DTSTAMP:20261107T000000Z','DTSTART:'+toUTC(x.start),'DTEND:'+toUTC(x.end),'SUMMARY:'+icsEscape('[가상 시연] '+x.title),'LOCATION:'+icsEscape(x.place),'DESCRIPTION:'+icsEscape('가상 행사. 실제 신청·예약이 이루어진 것이 아닙니다.'),'END:VEVENT');});
      lines.push('END:VCALENDAR');download('allfileone_demo_event_schedule.ics',lines.join('\r\n')+'\r\n','text/calendar;charset=utf-8');say('가상 일정 ICS 파일을 브라우저에서 생성했습니다. 실제 행사 신청은 아닙니다.');
    });
    widget.append(list,save);draw();
  };
  function selectTab(i, focus=false){
    current=i;for(let n=0;n<buttons.length;n++){const on=n===i;buttons[n].setAttribute('aria-selected',String(on));buttons[n].tabIndex=on?0:-1;buttons[n].classList.toggle('active',on);}
    const f=group.features[i];h3.textContent=`${i+1}. ${f.title}`;desc.textContent=f.desc;widget.replaceChildren();output.textContent='';output.classList.remove('v28-warning');say('');
    brief='';canExport=false;exportBtn.disabled=true;body.setAttribute('aria-labelledby',`v28-tab-${i}`);section.dataset.v28Active=String(i);
    switch(f.kind){case'filter':mountFilter(f);break;case'calc':mountCalc(f);break;case'compare':mountCompare(f);break;case'checklist':mountChecklist(f);break;case'quiz':mountQuiz(f);break;case'timeline':mountTimeline(f);break;case'schedule':mountSchedule(f);break;case'cart':mountCart(f);break;case'staycalc':mountStay(f);break;case'ics':mountICS(f);break;default:renderText('준비되지 않은 기능입니다.',false);}
    if(focus)buttons[i].focus();
  }
  for(let i=0;i<group.features.length;i++){
    const btn=el('button','v28-tab',`${String(i+1).padStart(2,'0')} ${group.features[i].title}`);
    btn.type='button';btn.id=`v28-tab-${i}`;btn.setAttribute('role','tab');btn.setAttribute('aria-controls','v28-panel');
    btn.addEventListener('click',()=>selectTab(i));btn.addEventListener('keydown',ev=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(ev.key))return;ev.preventDefault();const to=ev.key==='Home'?0:ev.key==='End'?buttons.length-1:(i+(ev.key==='ArrowLeft'?-1:1)+buttons.length)%buttons.length;selectTab(to,true);});
    nav.append(btn);buttons.push(btn);
  }
  exportBtn.addEventListener('click',()=>{
    if(!canExport){say('저장할 결과가 없습니다.');return;}
    const f=group.features[current];const content=['올파일원 웹스튜디오 · 가상 기능 시연',`업종: ${group.name}`,`기능: ${f.title}`, '',brief,'',note].join('\n');
    download(`allfileone_v28_${industryId}_${current+1}.txt`,content);say('TXT 파일이 생성됐습니다. 서버에 전송되거나 문의가 접수되지는 않습니다.');
  });
  // V30: A visitor who clicks a specific function on the homepage lands
  // on that exact interactive tab. Reject unexpected query values.
  const selectedFeature = new URLSearchParams(window.location.search).get('feature');
  const initialTab = /^[0-3]$/.test(selectedFeature || '') ? Number(selectedFeature) : 0;
  selectTab(initialTab);
  document.body.dataset.v28Ready='true';
  if (window.location.hash === '#v28-tools') {
    // The suite is created asynchronously after the original demo loads.
    // A native hash jump can happen before the target exists.
    window.requestAnimationFrame(() => section.scrollIntoView({behavior:'auto',block:'start'}));
  }
})();
