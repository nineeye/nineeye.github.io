#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Inject original local HTML + scripts into isolated Chromium. Not public Cloudflare test."""
from pathlib import Path
import re,json,traceback
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
OUT=R.parent/'EVIDENCE/V78_BROWSER';OUT.mkdir(parents=True,exist_ok=True)
F=json.loads(re.search(r'Object\.freeze\((\{.*\})\);',(R/'assets/v78-simulator-data.js').read_text('utf-8'),re.S).group(1))
checks=0;fails=[]
def check(v,msg):
 global checks
 checks+=1
 if not v:fails.append(msg)
def strip(path,remote):
 s=path.read_text('utf-8');s=re.sub(r'<script\b[^>]*>.*?</script>','',s,flags=re.I|re.S)
 s=re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*>','',s,flags=re.I)
 s=re.sub(r'(<img\b[^>]*?)\s+src="[^"]*"',r'\1',s,flags=re.I)
 s=s.replace('<head>','<head><base href="'+remote+'">',1)
 return s
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (1440,390):
  page=browser.new_page(viewport={'width':width,'height':900},accept_downloads=True)
  page.set_default_timeout(5000)
  page.on('pageerror',lambda e:fails.append('JS '+str(e)))
  for sector in F:
   for style in ('modern','premium','editorial'):
    path=R/'demo'/sector/style/'index.html'
    page.set_content(strip(path,'https://example.test/demo/'+sector+'/'+style+'/index.html'),wait_until='domcontentloaded')
    for css in ('demo.css','v28-tools.css','v77-feature-showcase.css','v78-simulator.css'):
     page.add_style_tag(content=(R/'assets'/css).read_text('utf-8'))
    for js in ('v28-catalog.js','v28-tools.js','v77-feature-data.js','v78-simulator-data.js','v78-simulator.js','v77-feature-showcase.js'):
     page.add_script_tag(content=(R/'assets'/js).read_text('utf-8'))
    page.wait_for_selector('#v77-showcase .v77-card')
    prefix=sector+'/'+style+'/'+str(width)
    check(page.locator('#v77-showcase .v77-card').count()==8,prefix+' 8 cards')
    check(page.locator('#v77-showcase [data-status="live"]').count()==5,prefix+' live 5')
    check(page.locator('#v77-showcase [data-status="planned"]').count()==3,prefix+' planned 3')
    check(page.locator('#v28-tools .v28-tab').count()==4,prefix+' V28 4 still work')
    check(page.locator('#v77-showcase [data-v78-new]').count()==1,prefix+' V78 exactly 1')
    button=page.locator('#v77-showcase [data-v78-new] button')
    button.click()
    check(page.locator('#v78-simulator-panel').is_visible(),prefix+' panel visible')
    check(page.locator('#v78-simulator-panel .v78-results').count()==1,prefix+' engine rendered')
    before=page.locator('#v78-simulator-panel .v78-results').inner_text()
    if F[sector]['type']=='list':
     inp=page.locator('#v78-simulator-panel .v78-search');inp.fill('이결과는없습니다z');
     after=page.locator('#v78-simulator-panel .v78-results').inner_text()
     check(before!=after and '0건' in after,prefix+' list filters')
     inp.fill('')
    elif F[sector]['type']=='stay':
     inp=page.locator('#v78-simulator-panel .v78-number');inp.fill('6')
     after=page.locator('#v78-simulator-panel .v78-results').inner_text()
     check(before!=after,prefix+' room updates')
    else:
     inp=page.locator('#v78-simulator-panel .v78-number');inp.fill('99')
     after=page.locator('#v78-simulator-panel .v78-results').inner_text()
     check(before!=after,prefix+' price or stock updates')
    check(page.locator('#v77-showcase').evaluate('(e)=>e.scrollWidth<=e.clientWidth+2'),prefix+' horizontal overflow')
    if sector=='manufacturing' and style=='premium':
     page.locator('#v77-showcase').screenshot(path=str(OUT/f'v78_manufacturing_premium_{width}.png'))
    page.locator('#v78-simulator-panel .v78-bottom-close').click()
    check(not page.locator('#v78-simulator-panel').is_visible(),prefix+' close works')
  page.close()
 # Hub independent local original scripts
 hub=browser.new_page(viewport={'width':1280,'height':920},accept_downloads=True)
 hub.set_content(strip(R/'industry-features-v77.html','https://example.test/industry-features-v77.html'))
 hub.add_style_tag(content=(R/'assets/v77-industry-hub.css').read_text('utf-8'))
 hub.add_style_tag(content=(R/'assets/v78-simulator.css').read_text('utf-8'))
 for js in ('v28-catalog.js','v77-feature-data.js','v78-simulator-data.js','v78-simulator.js','v77-industry-hub.js'):
  hub.add_script_tag(content=(R/'assets'/js).read_text('utf-8'))
 check(hub.locator('.sector-pill').count()==12,'hub selectors')
 for i,sector in enumerate(F):
  hub.locator('.sector-pill').nth(i).click()
  check(hub.locator('#sector-features article').count()==8,'hub 8 '+sector)
  check(hub.locator('#sector-features [data-status="live"]').count()==5,'hub live 5 '+sector)
  check(hub.locator('#sector-features [data-status="planned"]').count()==3,'hub unbuilt 3 '+sector)
  check(hub.locator('#sector-features [data-v78-new] a').count()==1,'hub new link '+sector)
  hub.locator('#sector-features article.plan button').first.click()
  check(not hub.locator('#save-plan').is_disabled(),'hub save enabled '+sector)
  if i==0:
   with hub.expect_download() as dl: hub.locator('#save-plan').click()
   downloaded=dl.value;dest=OUT/'hub_v78_scope.txt';downloaded.save_as(str(dest));txt=dest.read_text('utf-8-sig')
   check('가상 시연 1개' in txt and '미구현' in txt,'hub download truthful status')
 hub.screenshot(path=str(OUT/'v78_hub_1280.png'),full_page=True)
 hub.close()
 # Standalone page with embedded engine + change sector
 lab=browser.new_page(viewport={'width':390,'height':844})
 lab.set_content(strip(R/'feature-lab-v78.html','https://example.test/feature-lab-v78.html'))
 lab.add_style_tag(content=(R/'assets/v78-simulator.css').read_text('utf-8'))
 for js in ('v28-catalog.js','v77-feature-data.js','v78-simulator-data.js','v78-simulator.js'):lab.add_script_tag(content=(R/'assets'/js).read_text('utf-8'))
 check(lab.locator('#v78-industry option').count()==12,'standalone dropdown all sectors')
 for sector in F:
  lab.locator('#v78-industry').select_option(sector)
  check(lab.locator('.v78-widget').get_attribute('data-industry')==sector,'standalone render '+sector)
 check(lab.locator('.v78-widget').evaluate('(e)=>e.scrollWidth<=e.clientWidth+2'),'standalone mobile overflow')
 lab.screenshot(path=str(OUT/'v78_standalone_mobile_390.png'),full_page=True)
 lab.close();browser.close()
report={'release':'V78','mode':'Isolated local HTML CSS JS, no live Cloudflare/real transactions', 'checks':checks,'passed':checks-len(fails),'failed':len(fails),'failures':fails[:100]}
(OUT/'V78_BROWSER_REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps({k:report[k] for k in ('checks','passed','failed')},ensure_ascii=False))
if fails:
 print('\n'.join(fails[:30]));raise SystemExit(1)