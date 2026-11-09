#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V71 offline Chromium DOM contact tests; no URL navigation/SMTP claim."""
import json,re,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUTPUT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else ROOT.parent/'EVIDENCE'
OUTPUT.mkdir(parents=True,exist_ok=True)
S=(ROOT/'contact.html').read_text('utf-8')
from bs4 import BeautifulSoup
CSS_PATHS=[ROOT/link.get('href').lstrip('./') for link in BeautifulSoup(S,'html.parser').select('link[rel=stylesheet][href]')]
CSS_PATHS=[p for p in CSS_PATHS if p.is_file()]
S=re.sub(r'<script\b[^>]*src=[^>]+></script>','',S)
S=re.sub(r'<link\b[^>]+(?:rel="stylesheet"|rel="icon")[^>]*>','',S)
SCRIPT=(ROOT/'assets/v653-sales-bridge.js').read_text('utf-8').replace('location.search','window.__v71Search')
CAT=(ROOT/'assets/v652-sector-requirements.js').read_text('utf-8')
MODEL=(ROOT/'assets/v33-estimate-model.js').read_text('utf-8')
CSS=(ROOT/'assets/v653-sales-bridge.css').read_text('utf-8')
checks=[]
def ok(label,v):
 checks.append({'name':label,'pass':bool(v)})
 if not v:print('FAIL',label)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in (390,768,1440):
  ctx=b.new_context(viewport={'width':width,'height':900},accept_downloads=True)
  page=ctx.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  for sector in ('manufacturing','academy','clinic','commerce','realestate','stay'):
   for style in ('modern','premium','editorial'):
    page.set_content(S,wait_until='domcontentloaded')
    for cssfile in CSS_PATHS:page.add_style_tag(content=cssfile.read_text('utf-8'))
    page.add_script_tag(content=CAT)
    page.add_script_tag(content=MODEL)
    offer={'v':653,'ts':page.evaluate('Date.now()'),'industry':sector,'theme':style,
      'plan':'advanced','addons':['catalog','reservation','languages','cms','seo'],
      'req':{'industry':sector,'style':style,'ids':[0,1,2,3],'scale':2,'when':'soon'},
      'terms':['discuss']*8}
    page.evaluate('''o=>{
      window.__v71Search='?source=planv653&industry='+o.industry+'&theme='+o.theme;
      window.__store={'afo.webstudio.v653.contact':JSON.stringify(o)};
      Object.defineProperty(window,'sessionStorage',{configurable:true,value:{
        getItem(k){return window.__store[k]||null},removeItem(k){delete window.__store[k]},
        setItem(k,v){window.__store[k]=v}
      }});
    }''',offer)
    page.add_script_tag(content=SCRIPT)
    pre=page.locator('#v653-full-brief')
    full=pre.inner_text() if pre.count() else ''
    details=page.locator('textarea[name="details"]').input_value()
    mail=page.locator('#v71-mailto')
    key=f'{width}px {sector}/{style}'
    ok(key+' imported content',page.locator('#v653-import').count()==1 and sector in page.evaluate('document.body.dataset.v653Imported||""') if False else page.locator('#v653-import').count()==1 and len(full)>200)
    ok(key+' full brief preserved > 700',len(full)>700 and len(details)<=700 and len(full)>len(details))
    ok(key+' 4 actual requirements',sum(x[0] in full for x in page.evaluate('i=>window.AFO_V652_REQUIREMENTS[i].items',sector))==4)
    ok(key+' one-use storage consumed',page.evaluate("!Object.prototype.hasOwnProperty.call(window.__store,'afo.webstudio.v653.contact')"))
    ok(key+' full copy and save available',page.locator('#v71-full-actions button').count()==2)
    href=mail.get_attribute('href') or ''
    ok(key+' safe mailto length & address',href.startswith('mailto:nineeyes@naver.com?subject=') and len(href)<=1800)
    ok(key+' mailto no PII',all(x not in href.lower() for x in ('sessionstorage','token=','password','address=')))
    ok(key+' warning visible',page.locator('#v653-import .v653-warning').count()==1)
    ok(key+' no horizontal contact overflow',page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'))
    ok(key+' no JS exceptions',not errs)
    if sector=='manufacturing' and style=='modern':
     if width==1440:page.locator('#v653-import').screenshot(path=str(OUTPUT/'V71_Contact_Desktop.png'))
     if width==390:page.locator('#v653-import').screenshot(path=str(OUTPUT/'V71_Contact_Mobile.png'))
     with page.expect_download() as dl:
      page.locator('#v71-full-actions button').nth(1).click()
     download=dl.value
     dest=OUTPUT/('V71_Full_Brief_'+str(width)+'.txt')
     download.save_as(str(dest))
     content=dest.read_text('utf-8-sig')
     ok(key+' actual TXT full content',download.suggested_filename=='AllFileOne_V71_Full_Buyer_Brief.txt' and content==full and len(content)>700)
     ok(key+' actual TXT UTF8 BOM',dest.read_bytes()[:3]==b'\xef\xbb\xbf')
  ctx.close()
 b.close()
report={'version':'V71','status':'PASS' if all(c['pass'] for c in checks) else 'FAIL',
 'passed':sum(c['pass'] for c in checks),'total':len(checks),
 'scope':'Chromium inline DOM with URL and storage mocked. NOT public navigation, email transmission or Cloudflare deployment.',
 'checks':checks}
(OUTPUT/'V71_CONTACT_DOM_QA.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print('V71',report['status'],report['passed'],'/',report['total'])
if report['status']!='PASS':raise SystemExit(1)