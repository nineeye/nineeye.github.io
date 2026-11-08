from pathlib import Path
import json, re, zipfile, hashlib, io, os
from playwright.sync_api import sync_playwright
BASE=Path(__file__).resolve().parents[1]
WEB=BASE/'source/webstudio'
basezip=BASE/'baseline/AllFileOne_WebStudio_V42_Webmail_LinkAudit_QA_LATEST.zip'
if basezip.exists():
  with zipfile.ZipFile(basezip) as parent:
    v41=parent.read('BASELINE/V41_LATEST.zip')
  base_stream=io.BytesIO(v41)
else:
  basezip=Path('/mnt/data/AllFileOne_WebStudio_V41_Transparent_Sales_QA_LATEST.zip')
  base_stream=basezip
with zipfile.ZipFile(base_stream) as z:
  v38css=z.read('SOURCE/webstudio/v38-solutions.css').decode('utf-8')
  v38js=z.read('SOURCE/webstudio/v38-solutions.js').decode('utf-8')
css=(WEB/'assets/v43-industry-lab.css').read_text()
js=(WEB/'assets/v43-industry-lab.js').read_text()
industries=['manufacturing','academy','interior']
widths=[320,360,390,768,1280,1440]
results=[];shots=BASE/'qa/screenshots';shots.mkdir(parents=True,exist_ok=True)

def chk(name,condition):
    results.append({'check':name,'pass':bool(condition)})
    if not condition: print('FAIL',name)

def html_doc(i):
    t=(WEB/f'for-{i}.html').read_text()
    t=re.sub(r'<script\b[^>]*\bsrc=[^>]*></script>','',t,flags=re.I)
    t=re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*>','',t,flags=re.I)
    return t

with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=os.environ.get('AFO_CHROME_PATH') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None),headless=True,args=['--no-sandbox','--disable-gpu'])
  for industry in industries:
    for width in widths:
      context=browser.new_context(viewport={'width':width,'height':1000},accept_downloads=True)
      page=context.new_page()
      errors=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      # Bridge script will run after the real V38 planner creates its links.
      page.set_content(html_doc(industry),wait_until='domcontentloaded')
      page.add_style_tag(content=v38css)
      page.add_style_tag(content=css)
      page.evaluate('''() => Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text => { window.__copied = text; }}})''')
      page.add_script_tag(content=v38js)
      page.add_script_tag(content=js)
      prefix=f'{industry}/{width}'
      chk(prefix+' V43 mounted',page.locator('[data-v43-lab][data-v43-ready="yes"]').count()==1)
      chk(prefix+' 8 sample cards',page.locator('.v43-card').count()==8)
      chk(prefix+' screenshot horizontal not overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2'))
      chk(prefix+' 36 demo preserved',page.locator(f'a[href="./demo/{industry}/modern/index.html"]').count()==1)
      chk(prefix+' prior planner preserved',page.locator('[data-v38-planner] input[name="module"]').count()==4)
      chk(prefix+' no JS errors',not errors)
      page.locator('.v43-select').first.click()
      chk(prefix+' add selection',page.locator('[data-v43-selected-count]').inner_text()=='1개 선택')
      chk(prefix+' toggled correct',page.locator('.v43-select[aria-pressed="true"]').count()==1)
      choice={'manufacturing':'quote','academy':'timetable','interior':'portfolio'}[industry]
      chk(prefix+' existing planner activated',page.locator(f'[data-v38-planner] input[value="{choice}"]').is_checked())
      href=page.locator('.v43-actions a.v43-primary').get_attribute('href')
      chk(prefix+' consultation correct',('theme=modern' in href) and ('industry='+industry) in href and href.startswith('./contact.html?'))
      links=page.locator('a[href*="contact.html?source=sector"]')
      # At least existing CTA should inherit the approved feature through V38.
      chk(prefix+' V38 consultation links scope',any(choice in (links.nth(j).get_attribute('href') or '') for j in range(links.count()) if links.nth(j).get_attribute('href') and 'scope=' in links.nth(j).get_attribute('href')))
      page.locator('[data-v43-copy]').click()
      chk(prefix+' copied sample notes',{'manufacturing':'제조·도매','academy':'학원·교육','interior':'인테리어·시공'}[industry] in page.evaluate('window.__copied') and '가상 견본' in page.evaluate('window.__copied'))
      # Filtering really changes the dataset, rather than showing decorative cards.
      first={'manufacturing':'pipe','academy':'middle','interior':'residential'}[industry]
      second={'manufacturing':'steel','academy':'mon','interior':'partial'}[industry]
      page.locator('[data-v43-primary]').select_option(first)
      chk(prefix+' first facet narrows',page.locator('.v43-card').count()=={'manufacturing':3,'academy':3,'interior':3}[industry])
      page.locator('[data-v43-secondary]').select_option(second)
      chk(prefix+' second facet narrows',page.locator('.v43-card').count()=={'manufacturing':1,'academy':1,'interior':2}[industry])
      page.locator('[data-v43-search]').fill('nonexistent-zzzzz')
      chk(prefix+' no sample empty state',page.locator('.v43-card').count()==0 and page.locator('.v43-no-result').count()==1)
      page.locator('[data-v43-reset]').click()
      chk(prefix+' reset keeps current selection',page.locator('[data-v43-selected-count]').inner_text()=='1개 선택')
      chk(prefix+' reset returns 8',page.locator('.v43-card').count()==8)
      page.locator('.v43-remove').first.click()
      chk(prefix+' removed',page.locator('[data-v43-selected-count]').inner_text()=='0개 선택')
      page.locator('[data-v43-copy]').click()
      chk(prefix+' empty copy blocked','하나 이상 선택' in page.locator('[data-v43-feedback]').inner_text())
      page.locator('.v43-select').first.click()
      with page.expect_download() as dl:
        page.locator('[data-v43-download]').click()
      download=dl.value
      chk(prefix+' TXT filename',download.suggested_filename.endswith('_sample_brief.txt'))
      if width in (390,1280):
        page.locator('[data-v43-lab]').scroll_into_view_if_needed()
        page.screenshot(path=str(shots/f'v43_{industry}_{width}.png'),full_page=True)
      context.close()
  browser.close()

assert len(results)==len(industries)*len(widths)*20, (len(results),len(industries)*len(widths)*20)
failed=[x for x in results if not x['pass']]
summary={'total':len(results),'passed':len(results)-len(failed),'failed':len(failed),'cases_failed':failed[:25],
 'method':'Actual V41 sales HTML edited for V43 + real V38 JS/CSS + V43 JS/CSS on isolated Chromium; not production HTTP',
 'viewports':widths,'industries':industries}
(BASE/'qa/V43_BROWSER_QA.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False))
print(json.dumps({k:v for k,v in summary.items() if k not in ('cases_failed',)},ensure_ascii=False,indent=2))
if failed:raise SystemExit(1)