#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V72 OFFLINE Chromium checks with inline HTML/CSS and known mocked query/storage.
Never claim real network/public deployment or customer-email transmission."""
from pathlib import Path
import json,re,sys
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1]
E=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else R.parent/'EVIDENCE'; E.mkdir(parents=True,exist_ok=True)
html=(R/'contact.html').read_text('utf8')
cssfiles=[R/p.get('href').lstrip('./') for p in BeautifulSoup(html,'html.parser').select('link[rel=stylesheet][href]')]
cssfiles=[x for x in cssfiles if x.exists()]
html=re.sub(r'<script\b[^>]*src=[^>]+></script>','',html)
html=re.sub(r'<link\b[^>]+(?:rel="stylesheet"|rel="icon")[^>]*>','',html)
cat=(R/'assets/v652-sector-requirements.js').read_text('utf8')
model=(R/'assets/v33-estimate-model.js').read_text('utf8')
v26=(R/'assets/v26-contact.js').read_text('utf8')
v71=(R/'assets/v653-sales-bridge.js').read_text('utf8').replace('location.search','window.__mockSearch')
v72=(R/'assets/v72-complete-contact.js').read_text('utf8')
results=[]
def check(name,v):
 results.append({'name':name,'pass':bool(v)})
 if not v:print('FAIL',name,flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in (390,1440):
  context=b.new_context(viewport={'width':width,'height':940},accept_downloads=True)
  page=context.new_page(); errors=[]; page.on('pageerror',lambda err:errors.append(str(err)))
  for sector in ('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event'):
   for style in ('modern','premium','editorial'):
    errors.clear();page.set_content(html,wait_until='domcontentloaded')
    for css in cssfiles:page.add_style_tag(content=css.read_text('utf8'))
    page.add_script_tag(content=cat);page.add_script_tag(content=model)
    offer={'v':653,'ts':page.evaluate('Date.now()'),'industry':sector,'theme':style,'plan':'advanced',
      'addons':['catalog','reservation','languages','cms','seo'],
      'req':{'industry':sector,'style':style,'ids':[0,1,2,3],'scale':2,'when':'soon'},'terms':['discuss']*8}
    page.evaluate('''o=>{window.__mockSearch='?source=planv653&industry='+o.industry+'&theme='+o.theme;
      window.__store={'afo.webstudio.v653.contact':JSON.stringify(o)};
      Object.defineProperty(window,'sessionStorage',{configurable:true,value:{
       getItem(k){return window.__store[k]||null},removeItem(k){delete window.__store[k]},
       setItem(k,v){window.__store[k]=v}
      }});
    }''',offer)
    page.add_script_tag(content=v26);page.add_script_tag(content=v71);page.add_script_tag(content=v72)
    key=f'{width} {sector}/{style}'
    full=page.locator('#v653-full-brief').inner_text() if page.locator('#v653-full-brief').count() else ''
    check(key+' importer and live packet',page.evaluate("document.body.dataset.v72Packet==='true'"))
    check(key+' original requirements intact',all(x[0] in full for x in page.evaluate('s=>window.AFO_V652_REQUIREMENTS[s].items',sector)))
    check(key+' complete > 700',len(full)>700)
    check(key+' expected name',sector in page.locator('select[name="industry"]').input_value())
    # Explicit final editing after import, verify full view changes.
    page.locator('select[name="goal"]').select_option('booking')
    page.locator('select[name="budget"]').select_option('over300')
    page.locator('textarea[name="details"]').fill('최종 수정내용 확인 V72-'+sector+'-'+style)
    updated=page.locator('#v653-full-brief').inner_text()
    check(key+' latest edits appear', '최종 수정내용 확인 V72-'+sector+'-'+style in updated and '300만원 이상' in updated and '방문·예약 연결' in updated)
    check(key+' full form output included',page.locator('#brief-output').inner_text() in updated)
    check(key+' all five actions',page.locator('#v71-full-actions button').count()==2 and all(page.locator('#'+id).count()==1 for id in ('brief-copy','brief-download','brief-email')))
    check(key+' cap and accurate email',page.locator('#v71-mailto').get_attribute('href').startswith('mailto:nineeyes@naver.com?') and len(page.locator('#v71-mailto').get_attribute('href'))<=1750)
    check(key+' offline UI no exceptions',not errors)
    check(key+' no overflow',page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'))
    if sector=='manufacturing' and style=='modern':
     # Both old and new download buttons must produce EXACT same complete packet.
     for button,suffix in (('#brief-download','legacy'),('#v71-full-actions button:nth-of-type(2)','new')):
      with page.expect_download() as download_info:page.locator(button).click()
      d=download_info.value;target=E/f'V72_{width}_{suffix}.txt';d.save_as(target)
      raw=target.read_bytes()
      check(key+' '+suffix+' downloaded whole updated packet',raw.startswith(b'\xef\xbb\xbf') and raw.decode('utf-8-sig')==updated and d.suggested_filename=='AllFileOne_V72_Complete_Consultation.txt')
     page.locator('#v653-import').screenshot(path=str(E/f'V72_Contact_{width}.png'))
  context.close()
 b.close()
report={'version':'V72','status':'PASS' if all(x['pass'] for x in results) else 'FAIL',
 'passed':sum(x['pass'] for x in results),'total':len(results),
 'scope':'Inline local Chromium HTML/CSS/JS with mocked navigation and 15-minute session data. NO live Cloudflare, actual customer email or server evidence.',
 'checks':results}
(E/'V72_CONTACT_DOM_QA.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('V72',report['status'],report['passed'],'/',report['total'])
if report['status']!='PASS':sys.exit(1)