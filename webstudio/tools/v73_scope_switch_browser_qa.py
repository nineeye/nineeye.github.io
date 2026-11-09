#!/usr/bin/env python3
"""Offline Chromium for V73. No real URL navigation, no real email sends."""
import sys, json, re
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
O=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else R.parent/'EVIDENCE'
O.mkdir(parents=True,exist_ok=True)
html=(R/'contact.html').read_text('utf-8')
cssfiles=[R/p.get('href').lstrip('./') for p in BeautifulSoup(html,'html.parser').select('link[rel=stylesheet][href]')]
cssfiles=[x for x in cssfiles if x.is_file()]
html=re.sub(r'<script\b[^>]*src=[^>]+></script>','',html)
html=re.sub(r'<link\b[^>]+(?:rel="stylesheet"|rel="icon")[^>]*>','',html)
cat=(R/'assets/v652-sector-requirements.js').read_text('utf-8')
model=(R/'assets/v33-estimate-model.js').read_text('utf-8')
v26=(R/'assets/v26-contact.js').read_text('utf-8')
v71=(R/'assets/v653-sales-bridge.js').read_text('utf-8').replace('location.search','window.__mockSearch')
v73=(R/'assets/v72-complete-contact.js').read_text('utf-8')
sectors=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')
styles=('modern','premium','editorial')
results=[]
def mark(key,ok):
 results.append({'name':key,'pass':bool(ok)})
 if not ok:print('FAIL',key,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in (390,1440):
  context=browser.new_context(viewport={'width':width,'height':880},accept_downloads=True)
  page=context.new_page()
  errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  for sector in sectors:
   for style in styles:
    errors.clear()
    page.set_content(html,wait_until='domcontentloaded')
    for css in cssfiles:page.add_style_tag(content=css.read_text('utf-8'))
    page.add_script_tag(content=cat);page.add_script_tag(content=model)
    offer={'v':653,'ts':page.evaluate('Date.now()'),'industry':sector,'theme':style,'plan':'advanced',
      'addons':['catalog','reservation','languages','cms','seo'],
      'req':{'industry':sector,'style':style,'ids':[0,1,2,3],'scale':2,'when':'soon'},'terms':['discuss']*8}
    page.evaluate('''o=>{window.__mockSearch='?source=planv653&industry='+o.industry+'&theme='+o.theme;
      window.__store={'afo.webstudio.v653.contact':JSON.stringify(o)};
      Object.defineProperty(window,'sessionStorage',{configurable:true,value:{
       getItem(k){return window.__store[k]||null},removeItem(k){delete window.__store[k]},
       setItem(k,v){window.__store[k]=v}}});
    }''',offer)
    page.add_script_tag(content=v26);page.add_script_tag(content=v71);page.add_script_tag(content=v73)
    k=f'{width} {sector}/{style}'
    pre=page.locator('#v653-full-brief')
    original=pre.inner_text()
    mark(k+' base matching initial', '[A. 현재 선택과 일치' in original and '[참고 기록:' not in original)
    mark(k+' import contains 4 original needs',all(x[0] in original for x in page.evaluate('s=>window.AFO_V652_REQUIREMENTS[s].items',sector)))
    nxt=sectors[(sectors.index(sector)+1)%len(sectors)]
    origDetails=page.locator('textarea[name="details"]').input_value()
    mark(k+' imported old details initially present',len(origDetails)>200)
    page.locator('select[name="industry"]').select_option(nxt)
    txt=pre.inner_text()
    b=txt.split('[B. 현재 고객이 선택하고 마지막으로 수정한 상담 내용]',1)[1].split('[참고 기록:',1)[0] if '[참고 기록:' in txt else ''
    mark(k+' new industry is current B',page.locator('select[name="industry"]').input_value()==nxt and '업종: '+page.locator('select[name="industry"] option:checked').inner_text() in b)
    mark(k+' old quote historical only','[참고 기록:' in txt and '이전 견적의 가격·선택 기능·계약 조건은 현재 요청에 적용되지 않으며' in txt)
    mark(k+' untouched old excerpt cleared',page.locator('textarea[name="details"]').input_value()=='' and '추가 요청: 없음' in b)
    mark(k+' warning is visible',page.locator('.v72-packet-note.v73-stale-import').is_visible())
    other=styles[(styles.index(style)+1)%3]
    page.locator('select[name="theme"]').select_option(other)
    page.locator('textarea[name="details"]').fill('고객이 새로 수정한 요청 '+nxt+' '+other)
    txt=pre.inner_text()
    mark(k+' changed design + human notes remain','고객이 새로 수정한 요청 '+nxt+' '+other in txt and '[참고 기록:' in txt)
    mark(k+' no old inherited fragment in B',origDetails[:70] not in txt.split('[참고 기록:',1)[0])
    mark(k+' no javascript exceptions',not errors)
    mark(k+' responsive no overflow',page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'))
    if sector=='manufacturing' and style=='modern':
     btn=page.locator('#v71-full-actions button:first-child');btn.hover()
     colors=btn.evaluate('el=>{const c=getComputedStyle(el);return {fg:c.color,bg:c.backgroundColor}}')
     def luminance(color):
      nums=[int(v) for v in re.findall(r'\d+',color)[:3]]
      if len(nums)!=3:return -1
      rgb=[v/255 for v in nums]
      c=[v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4 for v in rgb]
      return .2126*c[0]+.7152*c[1]+.0722*c[2]
     l1,l2=luminance(colors['fg']),luminance(colors['bg'])
     contrast=(max(l1,l2)+.05)/(min(l1,l2)+.05) if min(l1,l2)>=0 else 0
     mark(k+' hovered primary action contrast >=4.5',contrast>=4.5)
    if sector=='manufacturing' and style=='modern':
     for button,suffix in (('#brief-download','legacy'),('#v71-full-actions button:nth-of-type(2)','new')):
      with page.expect_download() as down:page.locator(button).click()
      d=down.value;dest=O/f'V73_{width}_{suffix}.txt';d.save_as(dest)
      raw=dest.read_bytes()
      mark(k+' '+suffix+' history-aware download',raw.startswith(b'\xef\xbb\xbf') and raw.decode('utf-8-sig')==pre.inner_text() and d.suggested_filename=='AllFileOne_V72_Complete_Consultation.txt')
     mark(k+' both buttons yield identical bytes',(O/f'V73_{width}_legacy.txt').read_bytes()==(O/f'V73_{width}_new.txt').read_bytes())
     page.locator('#v653-import').screenshot(path=str(O/f'V73_contact_switched_{width}.png'))
    page.locator('select[name="industry"]').select_option(sector)
    page.locator('select[name="theme"]').select_option(style)
    txt=pre.inner_text()
    mark(k+' restoring both restores active A','[A. 현재 선택과 일치' in txt and '[참고 기록:' not in txt)
    mark(k+' user-edited details still present','고객이 새로 수정한 요청' in txt)
  context.close()
 browser.close()
report={'version':'V73','passed':sum(z['pass'] for z in results),'total':len(results),'status':'PASS' if all(z['pass'] for z in results) else 'FAIL',
 'scope':'Standalone Chromium real DOM with local HTML/CSS/JS, mocked sessionStorage and navigation. Not live Cloudflare or real customer email.',
 'checks':results}
(O/'V73_SCOPE_SWITCH_DOM_QA.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('V73',report['status'],report['passed'],'/',report['total'],flush=True)
if report['status']!='PASS':sys.exit(1)