#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Actual isolated Chromium interactions with source DOM. No Cloudflare network assertions."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import sys,json,os
R=Path(__file__).resolve().parents[1];A=R/'assets';O=R.parent/'EVIDENCE'/'V80_BROWSER';O.mkdir(parents=True,exist_ok=True)
D=json.loads((A/'v80-simulator-data.js').read_text('utf-8').split('Object.freeze(',1)[1].rsplit(');',1)[0])
base_scripts=['v28-catalog.js','v77-feature-data.js','v78-simulator-data.js','v78-simulator.js','v79-simulator-data.js','v79-simulator.js','v80-simulator-data.js','v80-simulator.js']
stylesheets=['v77-feature-showcase.css','v78-simulator.css','v79-simulator.css','v80-simulator.css']
checks=0;fails=[]
def check(test,label):
 global checks
 checks+=1
 if not test:fails.append(label)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for sector in D:
  for theme in (os.environ.get('V80_QA_THEME'),) if os.environ.get('V80_QA_THEME') else ('modern','premium','editorial'):
   for width in (390,1366):
    page=b.new_page(viewport={'width':width,'height':880},accept_downloads=True);page.set_default_timeout(2500)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(f'<head><base href="https://offline.test/demo/{sector}/{theme}/index.html"></head><body data-industry="{sector}" data-v13-style="{theme}"><header><nav id="demo-nav"><a href="#contact">문의</a></nav></header><main><div id="v28-tools"></div></main></body>')
    for css in stylesheets:page.add_style_tag(content=(A/css).read_text('utf-8'))
    for js in base_scripts+['v77-feature-showcase.js']:page.add_script_tag(content=(A/js).read_text('utf-8'))
    tag=f'{sector}/{theme}/{width}'
    check(page.evaluate('window.AFO_V80_SHOWCASE_READY===true'),tag+' ready')
    check(page.locator('.v77-card').count()==8,tag+' card 8')
    check(page.locator('[data-status="live"]').count()==7,tag+' demo 7')
    check(page.locator('[data-status="planned"]').count()==1,tag+' unbuilt 1')
    btn=page.locator('.v77-card-v78 .v77-card-action,.v77-card-v80 .v77-card-action')
    check(btn.count()==3,tag+' 3 added demos')
    if btn.count()==3:
     seen=set()
     for i in range(3):
      btn.nth(i).click();check(page.locator('.v78-widget,.v79-widget,.v80-widget').count()==1,tag+f' open demo {i}')
      for v in ('v78','v79','v80'):
       if page.locator('.'+v+'-widget').count():seen.add(v)
     check(seen=={'v78','v79','v80'},tag+' all three independent engines open')
     page.locator('.v78-bottom-close').click();check(page.locator('#v78-simulator-panel').is_hidden(),tag+' can close')
    check(page.locator('.v77-card-planned').count()==1,tag+' planned card')
    if page.locator('.v77-card-planned button').count()==1:
     page.locator('.v77-card-planned button').click();check(page.locator('.v77-primary').is_enabled(),tag+' export enabled')
     with page.expect_download() as dt:page.locator('.v77-primary').click()
     data=dt.value.path().read_bytes();check(data.startswith(b'\xef\xbb\xbf') and '미구현'.encode() in data and '추가 가상 시연 3개'.encode() in data,tag+' honest export')
    check(page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+4'),tag+' fits viewport')
    check(not errors,tag+' JS errors '+str(errors))
    if sector=='manufacturing' and theme=='premium' and width==390:page.screenshot(path=str(O/'manufacturing_premium_390.png'),full_page=True)
    page.close()
 for sector,d in D.items():
  p=b.new_page(viewport={'width':390,'height':860},accept_downloads=True);p.set_default_timeout(2500)
  p.set_content('<head><base href="https://offline.test/feature-lab-v80.html"></head><div id="target"></div>')
  for script in base_scripts:p.add_script_tag(content=(A/script).read_text('utf-8'))
  check(p.evaluate('AFO_V80_SIMULATOR.mount(document.getElementById("target"),'+json.dumps(sector)+')'),sector+' mounts')
  check(p.locator('.v80-widget').count()==1,sector+' rendered')
  old=p.locator('.v80-result').inner_text()
  kind=d['kind']
  if kind=='drawing':
   p.locator('.v80-input').select_option(index=1);check(old!=p.locator('.v80-result').inner_text(),sector+' geometry changed')
   with p.expect_download() as dt:p.locator('.v80-action').click()
   s=dt.value.path().read_text('utf-8');check(s.count('LINE')==4 and '0\nEOF\n' in s,sector+' actual 2D DXF download')
  elif kind=='brochure':
   p.locator('.v80-input').select_option(index=1);check(old!=p.locator('.v80-result').inner_text(),sector+' selected brochure')
   with p.expect_download() as dt:p.locator('.v80-action').click()
   s=dt.value.path().read_text('utf-8');check('<!doctype html>' in s and '가상' in s and '<script' not in s,sector+' real HTML document')
  elif kind=='appointment':
   p.locator('.v80-input').first.select_option(index=1);check(old!=p.locator('.v80-result').inner_text(),sector+' appointment preview changes');check('신청되지 않았습니다' in p.locator('.v80-result').inner_text(),sector+' no booking confirmed')
  elif kind=='progress':
   p.locator('.v80-check input').first.check();check('20%' in p.locator('.v80-result').inner_text(),sector+' step raises progress')
  elif kind=='materials':
   p.locator('.v80-input').select_option(index=1);check(old!=p.locator('.v80-result').inner_text(),sector+' material compare')
  elif kind=='tracking':
   p.locator('.v80-input').select_option(index=2);check('배송 진행' in p.locator('.v80-result').inner_text(),sector+' tracking stage');check(p.locator('.v80-steps .v80-done').count()==3,sector+' steps')
  elif kind=='eligibility':
   p.locator('.v80-check input').first.check();check('1/4개' in p.locator('.v80-result').inner_text(),sector+' checklist')
  elif kind=='locations':
   p.locator('.v80-input').first.select_option(index=1);check(old!=p.locator('.v80-result').inner_text(),sector+' location updates');p.locator('input[type="range"]').fill('90');check('90점' in p.locator('.v80-result').inner_text(),sector+' custom access score')
  elif kind=='reviews':
   p.locator('.v80-input').first.select_option(index=1);check('2건' in p.locator('.v80-result').inner_text(),sector+' review facet')
  elif kind=='trend':
   p.locator('.v80-input').select_option(index=1);check(old!=p.locator('.v80-result').inner_text(),sector+' chart type changed');check(p.locator('.v80-bar').count()==4,sector+' chart plotted')
  elif kind=='calendar':
   p.locator('.v80-input').select_option(index=1);check(old!=p.locator('.v80-result').inner_text(),sector+' selected calendar')
   with p.expect_download() as dt:p.locator('.v80-action').click()
   s=dt.value.path().read_text('utf-8');check('BEGIN:VCALENDAR' in s and 'BEGIN:VEVENT' in s and 'DTSTART:20270218T050000Z' in s,sector+' valid ics structure')
  check(p.evaluate('document.documentElement.scrollWidth <= window.innerWidth+4'),sector+' widget mobile no overflow')
  if sector=='event':p.screenshot(path=str(O/'v80_event_calendar_390.png'),full_page=True)
  p.close()
 # standalone V80 selector: all sectors 3 choices each
 p=b.new_page(viewport={'width':390,'height':820});p.set_content('<head><base href="https://offline.test/feature-lab-v80.html"></head><select id="v80-industry"></select><select id="v80-feature"></select><div id="v80-standalone"></div><p id="v80-status"></p><a id="v80-back"></a>')
 for script in base_scripts+['v80-lab.js']:p.add_script_tag(content=(A/script).read_text('utf-8'))
 check(p.evaluate('window.AFO_V80_LAB_READY===true'),'standalone lab ready')
 check(p.locator('#v80-industry option').count()==12,'lab all sectors')
 check(p.locator('#v80-feature option').count()==3,'lab 3 addons')
 p.locator('#v80-feature').select_option(index=2);check(p.locator('.v80-widget').count()==1,'lab V80 select renders widget')
 p.screenshot(path=str(O/'lab_v80_390.png'),full_page=True);p.close();b.close()
result={'theme':os.environ.get('V80_QA_THEME','all'),'type':'isolated_chromium_source_dom_not_public_network','assertions':checks,'passed':checks-len(fails),'failed':len(fails),'issues':fails[:30]}
print(json.dumps(result,ensure_ascii=False,indent=2));(O/('V80_BROWSER_QA_'+os.environ.get('V80_QA_THEME','all')+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
if fails:sys.exit(1)