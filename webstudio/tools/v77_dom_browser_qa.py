#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Render isolated original HTML/CSS/JS without claiming public Cloudflare access."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re, traceback
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT.parent/'EVIDENCE/V77_BROWSER';OUT.mkdir(parents=True,exist_ok=True)
sectors=list(json.loads(re.search(r'Object\.freeze\((\{.*\})\);',(ROOT/'assets/v77-feature-data.js').read_text('utf-8'),re.S).group(1)))
checks=0;failures=[];screens=[]
def assertion(ok,why):
 global checks
 checks+=1
 if not ok:failures.append(why)
def stripped(path,base):
 s=path.read_text('utf-8');s=re.sub(r'<script\b[^>]*>.*?</script>','',s,flags=re.I|re.S)
 s=re.sub(r'<link\b[^>]*rel=\"stylesheet\"[^>]*>', '', s, flags=re.I)
 s=re.sub(r'(<img\b[^>]*?)\s+src=\"[^\"]*\"', r'\1', s, flags=re.I)
 s=s.replace('<head>','<head><base href="'+base+'">',1)
 return s
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for viewport in [{'width':1440,'height':900},{'width':390,'height':844}]:
  page=browser.new_page(viewport=viewport,accept_downloads=True)
  page.set_default_timeout(2500)
  page.on('pageerror',lambda error:failures.append('JS_EXCEPTION '+str(error)))
  for sector in sectors:
   for style in ('modern','premium','editorial'):
    url=f'https://allfileone-webstudio.pages.dev/demo/{sector}/{style}/index.html'
    page.set_content(stripped(ROOT/'demo'/sector/style/'index.html',url),wait_until='domcontentloaded')
    for css in ('demo.css','v28-tools.css','v77-feature-showcase.css'):
     page.add_style_tag(content=(ROOT/'assets'/css).read_text('utf-8'))
    for js in ('v28-catalog.js','v28-tools.js','v77-feature-data.js','v77-feature-showcase.js'):
     page.add_script_tag(content=(ROOT/'assets'/js).read_text('utf-8'))
    page.wait_for_selector('#v77-showcase .v77-card',timeout=4000)
    assertion(page.locator('#v77-showcase .v77-card').count()==8,sector+'/'+style+' missing 8')
    assertion(page.locator('#v77-showcase [data-status="live"]').count()==4,sector+'/'+style+' live count')
    assertion(page.locator('#v77-showcase [data-status="planned"]').count()==4,sector+'/'+style+' planned count')
    assertion(page.locator('#v28-tools .v28-tab').count()==4,sector+'/'+style+' original 4 broken')
    assertion(page.locator('#v77-showcase .v77-card-planned button').count()==4,sector+'/'+style+' planned toggle')
    first=page.locator('#v77-showcase .v77-card-planned button').first
    first.click();assertion(first.get_attribute('aria-pressed')=='true',sector+'/'+style+' selection')
    assertion(not page.locator('#v77-showcase .v77-primary').is_disabled(),sector+'/'+style+' export disabled')
    if sector=='manufacturing' and style=='premium':
     page.locator('#v77-showcase').screenshot(path=str(OUT/f'manufacturing_premium_{viewport["width"]}.png'));screens.append(str(OUT/f'manufacturing_premium_{viewport["width"]}.png'))
    first.click();assertion(first.get_attribute('aria-pressed')=='false',sector+'/'+style+' deselection')
    # CSS overflow is a real document check; some old hero overflow independent of new block.
    assertion(page.locator('#v77-showcase').evaluate('(e)=>e.scrollWidth<=e.clientWidth+2'),sector+'/'+style+' showcase horizontal overflow')
  page.close()
 # Hub synthetic navigation, no user IP or network requests involved
 hub=browser.new_page(viewport={'width':1280,'height':900},accept_downloads=True)
 hub.set_default_timeout(2500)
 hub.on('pageerror',lambda error:failures.append('HUB_EXCEPTION '+str(error)))
 hub.set_content(stripped(ROOT/'industry-features-v77.html','https://allfileone-webstudio.pages.dev/industry-features-v77.html'))
 hub.add_style_tag(content=(ROOT/'assets/v77-industry-hub.css').read_text('utf-8'))
 for js in ('v28-catalog.js','v77-feature-data.js','v77-industry-hub.js'):
  hub.add_script_tag(content=(ROOT/'assets'/js).read_text('utf-8'))
 assertion(hub.locator('.sector-pill').count()==12,'hub sector selectors')
 for idx in range(12):
  hub.locator('.sector-pill').nth(idx).click()
  assertion(hub.locator('#sector-features article').count()==8,'hub count '+str(idx))
  assertion(hub.locator('#sector-features [data-status="planned"]').count()==4,'hub planned '+str(idx))
  hub.locator('#sector-features article.plan button').first.click()
  assertion(not hub.locator('#save-plan').is_disabled(),'hub save disabled '+str(idx))
  assertion(hub.locator('#source-link').get_attribute('href').startswith('https://'),'hub reference '+str(idx))
  if idx==0:
   with hub.expect_download(timeout=5000) as di:hub.locator('#save-plan').click()
   download=di.value;path=OUT/'hub_real_txt.txt';download.save_as(str(path))
   data=path.read_bytes();assertion(data.startswith(b'\xef\xbb\xbf') and '형번별' in data.decode('utf-8-sig'),'hub real TXT missing selection')
 hub.screenshot(path=str(OUT/'hub_1280.png'),full_page=True);screens.append(str(OUT/'hub_1280.png'))
 hub.close()
 # Compare-page addition: assert 12 distinct industry-specific sets, no fake "live" links.
 cmp=browser.new_page(viewport={'width':1180,'height':850})
 cmp.set_content('<head><base href="https://allfileone-webstudio.pages.dev/design-compare-live.html"></head><body>'+
  '<select id="industry-select">'+''.join('<option value="'+k+'">'+k+'</option>' for k in sectors)+'</select>'+
  '<h2 id="workflow-title">4 tools</h2><p id="v77-workflow-notice"></p><div id="feature-links">'+
  ''.join('<a class="prior" href="#">Existing simulated tool '+str(i)+'</a>' for i in range(4))+'</div></body>')
 cmp.add_style_tag(content=(ROOT/'assets/v77-compare-extend.css').read_text('utf-8'))
 for js in ('v77-feature-data.js','v77-compare-extend.js'):
  cmp.add_script_tag(content=(ROOT/'assets'/js).read_text('utf-8'))
 for k in sectors:
  cmp.locator('#industry-select').select_option(k)
  cmp.evaluate("window.dispatchEvent(new CustomEvent('afo:v70-selection'))")
  assertion(cmp.locator('#feature-links .prior').count()==4,'compare old links '+k)
  assertion(cmp.locator('#feature-links [data-v77-plan]').count()==4,'compare new options '+k)
  assertion(cmp.locator('#workflow-title').inner_text().endswith('8가지 기능'),'compare title '+k)
  assertion(all('미구현' in x for x in cmp.locator('#feature-links [data-v77-plan] small').all_inner_texts()),'compare status '+k)
 cmp.close();browser.close()
report={'version':'V77','mode':'isolated DOM with real Chromium source; no real public navigation','checks':checks,'failed':len(failures),'failures':failures[:100],'screenshots':screens}
(OUT/'QA_V77.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps({k:report[k] for k in ('version','checks','failed')},ensure_ascii=False))
if failures:
 print('\n'.join(failures[:25]));raise SystemExit(1)