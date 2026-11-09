#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Isolated Chromium UI tests: original JS/CSS injected into in-memory DOM, NOT deployed Cloudflare tests."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
W=Path(__file__).resolve().parents[1];A=W/'assets';EVID=W.parent/'EVIDENCE'/'V79_BROWSER';EVID.mkdir(parents=True,exist_ok=True)
files=['v28-catalog.js','v77-feature-data.js','v78-simulator-data.js','v78-simulator.js','v79-simulator-data.js','v79-simulator.js']
styles=['v77-feature-showcase.css','v78-simulator.css','v79-simulator.css']
sectors=json.loads((A/'v79-simulator-data.js').read_text('utf-8').split('Object.freeze(',1)[1].rsplit(');',1)[0])
checks=0;errs=[]
def check(cond,label):
 global checks
 checks+=1
 if not cond:errs.append(label)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for sector in sectors:
  for style in ('modern','premium','editorial'):
   for width in (390,1366):
    p=b.new_page(viewport={'width':width,'height':920},accept_downloads=True)
    perr=[];p.on('pageerror',lambda exc:perr.append(str(exc)))
    p.set_default_timeout(2400)
    p.set_content(f'<html lang="ko"><head><base href="https://offline.test/demo/{sector}/{style}/index.html"></head><body data-industry="{sector}" data-v13-style="{style}"><header><nav id="demo-nav"><a href="#contact">상담</a></nav></header><main><div id="v28-tools"></div></main></body></html>')
    for css in styles:p.add_style_tag(content=(A/css).read_text('utf-8'))
    for name in files:p.add_script_tag(content=(A/name).read_text('utf-8'))
    p.add_script_tag(content=(A/'v77-feature-showcase.js').read_text('utf-8'))
    head=f'{sector}/{style}/{width}'
    check(p.evaluate('window.AFO_V79_SHOWCASE_READY === true'),head+' showroom ready')
    check(p.locator('#v77-showcase .v77-card').count()==8,head+' eight cards')
    check(p.locator('#v77-showcase [data-status="live"]').count()==6,head+' six actual client-side demos')
    check(p.locator('#v77-showcase [data-status="planned"]').count()==2,head+' two unbuilt')
    buttons=p.locator('.v77-card-v78 button.v77-card-action');check(buttons.count()==2,head+' two demo buttons')
    if buttons.count()==2:
     buttons.nth(0).click();check(p.locator('.v78-widget').count()+p.locator('.v79-widget').count()==1,head+' first live view')
     buttons.nth(1).click();check(p.locator('.v78-widget').count()+p.locator('.v79-widget').count()==1,head+' switch second view')
     check(buttons.nth(0).get_attribute('aria-expanded')=='false' and buttons.nth(1).get_attribute('aria-expanded')=='true',head+' aria state')
     p.locator('.v78-bottom-close').click();check(p.locator('#v78-simulator-panel').is_hidden(),head+' bottom close works')
    planned=p.locator('.v77-card-planned button');check(planned.count()==2,head+' unbuilt selection count')
    if planned.count()==2:
     planned.nth(0).click();check(p.locator('.v77-primary').is_enabled(),head+' export enabled')
     with p.expect_download(timeout=5000) as info:p.locator('.v77-primary').click()
     dl=info.value;data=dl.path().read_bytes();check(data.startswith(b'\xef\xbb\xbf') and '미구현'.encode('utf-8') in data,head+' UTF8 export honest')
    check(len(perr)==0,head+' JS errors '+str(perr))
    check(p.evaluate('document.documentElement.scrollWidth<=innerWidth+4'),head+' no horizontal overflow')
    if sector=='manufacturing' and style=='premium' and width==390:p.screenshot(path=str(EVID/'manufacturing_premium_390.png'),full_page=True)
    p.close()
 # Independent V79 engine for ALL sectors, including interactive modifications.
 for sector,d in sectors.items():
  p=b.new_page(viewport={'width':390,'height':800});p.set_default_timeout(2400);p.set_content('<head><base href="https://offline.test/feature-lab-v79.html"></head><div id="target"></div>')
  for x in files:p.add_script_tag(content=(A/x).read_text('utf-8'))
  ok=p.evaluate('AFO_V79_SIMULATOR.mount(document.getElementById("target"),'+json.dumps(sector)+')')
  check(ok,sector+' V79 engine mounts');check(p.locator('.v79-widget').count()==1,sector+' widget appears')
  k=d['kind']
  if k in ('search','faq'):
   q=p.locator('.v79-search');q.fill('zzzx__nomatch');check('0건' in p.locator('.v79-count').inner_text(),sector+' live keyword filter')
  elif k=='bulk':
   q=p.locator('.v79-area');q.fill('M-101,20');check('92,000원' in p.locator('.v79-count').inner_text(),sector+' quantity calculation');q.fill('M-101,1');check(p.locator('.v79-errors li').count()==1,sector+' below MOQ rejected')
  elif k=='detail':
   s=p.locator('.v79-select');s.select_option(label=d['items'][1][0]);check(d['items'][1][0] in p.locator('.v79-count').inner_text(),sector+' detail changes')
  elif k in ('favorites','watchlist'):
   btn=p.locator('.v79-choose').first;btn.click();check('1개' in p.locator('.v79-count').inner_text(),sector+' toggles')
  elif k=='compare':
   p.locator('.v79-range').fill('100');check('시공 후' in p.locator('.v79-count').inner_text(),sector+' before/after')
  elif k=='seats':
   p.locator('.v79-seat').first.click();check('45,000원' in p.locator('.v79-count').inner_text(),sector+' seat-price total')
  p.close()
 # Standalone dual-function switch without actual file:// navigation.
 p=b.new_page(viewport={'width':390,'height':820});p.set_default_timeout(2400)
 p.set_content('<head><base href="https://offline.test/feature-lab-v79.html"></head><select id="v79-industry"></select><select id="v79-feature"></select><div id="v79-standalone"></div><p id="v79-status"></p><a id="v79-back"></a>')
 for x in files:p.add_script_tag(content=(A/x).read_text('utf-8'))
 p.add_script_tag(content=(A/'v79-lab.js').read_text('utf-8'))
 check(p.evaluate('window.AFO_V79_LAB_READY === true'),'V79 lab ready')
 check(p.locator('#v79-industry option').count()==12,'V79 lab 12 options')
 check(p.locator('#v79-feature option').count()==2,'V79 lab two demo choices')
 p.locator('#v79-feature').select_option(index=1);check(p.locator('.v79-widget').count()==1,'V79 lab can switch to new demo')
 p.close();b.close()
print(json.dumps({'kind':'isolated_chromium_no_public_network','tests':checks,'failed':len(errs),'issues':errs[:30]},ensure_ascii=False,indent=2))
(EVID/'V79_CHROMIUM_QA.json').write_text(json.dumps({'tests':checks,'failed':len(errs),'issues':errs},ensure_ascii=False,indent=2),'utf-8')
if errs:sys.exit(1)