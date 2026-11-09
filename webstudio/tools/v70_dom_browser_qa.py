#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Local Chromium DOM test of actual V70 UI using deliberately mocked navigation.
The runtime prohibits any browser navigation (including localhost). Therefore
this test loads first-party HTML/CSS/JS into about:blank and ONLY replaces
location.search, location.href and location.assign transport with test stubs.
It NEVER claims live network QA, production email delivery or real URL routing.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
BASE='https://offline-test.invalid/'
OUTPUT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else ROOT.parent/'EVIDENCE'
OUTPUT.mkdir(exist_ok=True,parents=True)
HTML=(ROOT/'design-compare-live.html').read_text('utf-8')
HTML=re.sub(r'<script\b[^>]*src=[^>]+></script>','',HTML)
HTML=re.sub(r'<link\b[^>]+(?:rel="stylesheet"|rel="icon")[^>]*>','',HTML)
V652=(ROOT/'assets/v652-sector-requirements.js').read_text('utf-8')
JS=(ROOT/'assets/v70-buyer-bridge.js').read_text('utf-8')
JS=JS.replace('location.search','window.__testSearch').replace('location.href','window.__testBase').replace('location.assign(url.href)','window.__testNavigation=url.href')
assert 'window.__testNavigation=url.href' in JS
results=[]
def mark(desc,ok,note=''):
 results.append({'name':desc,'pass':bool(ok),'note':note[:180]})
 if not ok:print('FAIL:',desc,note[:180])
with sync_playwright() as play:
 browser=play.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for w in (1440,768,390):
  context=browser.new_context(viewport={'width':w,'height':900},accept_downloads=True)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='domcontentloaded')
  page.add_style_tag(content=(ROOT/'assets/v67-compare.css').read_text('utf-8'))
  page.add_style_tag(content=(ROOT/'assets/v70-buyer-bridge.css').read_text('utf-8'))
  page.add_script_tag(content=V652)
  page.evaluate("window.__testSearch='?industry=manufacturing&style=modern';window.__testBase='https://offline-test.invalid/design-compare-live.html';window.__testNavigation='';")
  page.add_script_tag(content=JS)
  mark(f'{w}px V70 initialized',page.evaluate('window.AFO_V70_BUYER_READY===true'))
  for sector in ('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event'):
   for style in ('modern','premium','editorial'):
    page.evaluate("([i,s])=>{window.__testSearch='?industry='+i+'&style='+s;window.dispatchEvent(new Event('afo:v70-selection'));}",[sector,style])
    title=page.locator('#v70-current-selection').inner_text()
    mark(f'{w}px {sector} {style} 4 tailored requirements',page.locator('[data-v70-requirement]').count()==4 and page.evaluate('(i)=>document.querySelector("#v70-current-selection").textContent.includes(window.AFO_V652_REQUIREMENTS[i].name)',sector) and len(title)>3)
    mark(f'{w}px {sector} {style} no overflow',page.evaluate('document.querySelector("#v70-buyer").scrollWidth <= document.querySelector("#v70-buyer").clientWidth+2'))
  page.evaluate("window.__testSearch='?industry=academy&style=premium';window.dispatchEvent(new Event('afo:v70-selection'))")
  page.locator('[data-v70-requirement="0"]').uncheck()
  mark(f'{w}px empty feature selection blocks next',page.locator('#v70-to-plan').is_disabled())
  page.locator('[data-v70-requirement="2"]').check()
  page.select_option('#v70-scale','1')
  page.select_option('#v70-when','soon')
  mark(f'{w}px scope and timing reflected', '1개월 내 협의' in page.locator('#v70-summary').inner_text() and page.locator('#v70-count').inner_text()=='1/4')
  # About:blank sessionStorage is not a durable origin: use an in-memory fake.
  page.evaluate('''window.__store={};Object.defineProperty(window,'sessionStorage',{configurable:true,value:{setItem(k,v){window.__store[k]=v},getItem(k){return window.__store[k]||null},removeItem(k){delete window.__store[k]}}});''')
  page.locator('#v70-to-plan').click()
  payload=page.evaluate("JSON.parse(window.__store['afo.webstudio.v653.offer'])")
  mark(f'{w}px exact V653 handoff payload',payload['industry']=='academy' and payload['style']=='premium' and payload['ids']==[2] and payload['scale']==1 and payload['when']=='soon')
  mark(f'{w}px PII-free route',page.evaluate("window.__testNavigation.includes('source=demo-v653') && window.__testNavigation.includes('theme=premium') && window.__testNavigation.includes('industry=academy')"))
  mark(f'{w}px no JS exceptions',not errors,str(errors))
  # Contract consumer check: load the REAL V65.3 price/contract preparation UI
  # in a separate about:blank document with ONLY the URL source mocked.
  planhtml=(ROOT/'plan-guide.html').read_text('utf-8')
  planhtml=re.sub(r'<script\b[^>]*src=[^>]+></script>','',planhtml)
  planhtml=re.sub(r'<link\b[^>]+(?:rel="stylesheet"|rel="icon")[^>]*>','',planhtml)
  buyerpage=context.new_page();buyererrors=[]
  buyerpage.on('pageerror',lambda e:buyererrors.append(str(e)))
  buyerpage.set_content(planhtml,wait_until='domcontentloaded')
  buyerpage.evaluate('''p=>{window.__testSearch='?source=demo-v653&industry=academy&theme=premium';window.__store={'afo.webstudio.v653.offer':JSON.stringify(p)};Object.defineProperty(window,'sessionStorage',{configurable:true,value:{setItem(k,v){window.__store[k]=v},getItem(k){return window.__store[k]||null},removeItem(k){delete window.__store[k]}}});}''',payload)
  buyerpage.add_script_tag(content=V652)
  buyerpage.add_script_tag(content=(ROOT/'assets/v33-estimate-model.js').read_text('utf-8'))
  v653=(ROOT/'assets/v653-sales-bridge.js').read_text('utf-8').replace('location.search','window.__testSearch')
  buyerpage.add_script_tag(content=v653)
  mark(f'{w}px V653 actually reads selected requirements',buyerpage.locator('#v653-buyer').count()==1 and '수강료' in buyerpage.locator('#v653-requirements-list').inner_text())
  mark(f'{w}px V653 form retains academy premium',buyerpage.locator('#pg-industry').input_value()=='academy' and buyerpage.locator('#pg-theme').input_value()=='premium')
  mark(f'{w}px V653 once-only storage removed',buyerpage.evaluate("!Object.prototype.hasOwnProperty.call(window.__store,'afo.webstudio.v653.offer')"))
  mark(f'{w}px V653 consumer JS no exceptions',not buyererrors,str(buyererrors))
  buyerpage.close()
  if w==1440:
   page.locator('#v70-buyer').screenshot(path=str(OUTPUT/'V70_BUYER_DESKTOP.png'))
  if w==390:
   page.locator('#v70-buyer').screenshot(path=str(OUTPUT/'V70_BUYER_MOBILE.png'))
  context.close()
 browser.close()
result={'status':'PASS' if all(x['pass'] for x in results) else 'FAIL','passed':sum(x['pass'] for x in results),'total':len(results),'scope':'offline Chromium DOM with stubbed location and sessionStorage; no live URL validation','checks':results}
(OUTPUT/'V70_DOM_QA.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print('V70 DOM:',result['passed'],'/',result['total'],result['status'])
if result['status']!='PASS':sys.exit(1)