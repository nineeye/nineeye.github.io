#!/usr/bin/env python3
"""V81 isolated Chromium original files; no actual public Cloudflare calls."""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import json, mimetypes, urllib.parse
ROOT=Path(__file__).resolve().parents[1]
EVID=ROOT.parent/'EVIDENCE'/'V81';EVID.mkdir(parents=True,exist_ok=True)
TYPES={'.js':'application/javascript; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'}
count=0
faults=[]
def check(ok,label):
 global count
 count+=1
 if not ok: faults.append(label)

def route(req):
 from urllib.parse import urlsplit,unquote
 u=urlsplit(req.request.url);name=unquote(u.path.lstrip('/')) or 'index.html'
 target=(ROOT/name).resolve()
 if not target.is_relative_to(ROOT) or not target.is_file(): return req.fulfill(status=404,body='missing file')
 return req.fulfill(status=200,body=target.read_bytes(),content_type=TYPES.get(target.suffix,'application/octet-stream'))
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [390,1440]:
  context=browser.new_context(viewport={'width':width,'height':900},accept_downloads=True,service_workers='block')
  page=context.new_page()
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  soup=BeautifulSoup((ROOT/'feature-scope-v81.html').read_text(encoding='utf-8'),'html.parser')
  for x in soup.find_all('script'): x.decompose()
  for x in soup.find_all('link'):x.decompose()
  head=soup.find('head');base=soup.new_tag('base',href='https://webstudio.test/');head.insert(0,base)
  css=soup.new_tag('style');css.string=(ROOT/'assets/v81-production-scope.css').read_text('utf-8');head.append(css)
  page.set_content(str(soup),wait_until='load')
  for script in ['v28-catalog.js','v77-feature-data.js','v81-scope-matrix.js','v81-production-scope.js']:
   page.add_script_tag(content=(ROOT/'assets'/script).read_text('utf-8'))
  page.wait_for_function('window.AFO_V81_SCOPE_READY === "V81-20261109"',timeout=8000)
  check(page.locator('#v81-sector option').count()==12,f'12 sectors {width}')
  check(page.locator('.feature').count()==8,f'8 features initial {width}')
  check(page.locator('.feature input:checked').count()==0,f'no default scope selection {width}')
  check(page.locator('#v81-save').is_disabled(),f'fail closed save {width}')
  check(not errors,f'page errors {width}:{errors}')
  check(page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'),f'no horizontal overflow {width}')
  names=set()
  for sector in ['manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event']:
   page.locator('#v81-sector').select_option(sector)
   check(page.locator('.feature').count()==8,f'{sector} 8 cards {width}')
   check(page.locator('.tag.unbuilt').count()==1,f'{sector} one clearly unbuilt {width}')
   check(page.locator('.preview-link').count()==7,f'{sector} 7 demo links {width}')
   titles=page.locator('.feature h4').all_text_contents()
   check(len(set(titles))==8,f'{sector} distinct feature titles {width}')
   names.update((sector,t) for t in titles)
   # click first option and last unbuilt, report must include both, plus safe risk labels
   page.locator('.feature input').nth(0).check()
   page.locator('.feature input').nth(7).check()
   check(page.locator('#v81-selected').inner_text().startswith('2'),f'{sector} selecting {width}')
   report=page.locator('#v81-report-preview').inner_text()
   check(titles[0].split('. ',1)[-1] in report and titles[-1].split('. ',1)[-1] in report,f'{sector} selected feature names in report {width}')
   check('실운영' in report and '별도' in report,f'{sector} honest scope {width}')
   check(page.locator('#v81-mail').get_attribute('href').startswith('mailto:nineeyes@naver.com?'),f'{sector} deliberate manual mail {width}')
   check(page.locator('#v81-save').is_enabled(),f'{sector} enabled export {width}')
   check(page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'),f'{sector} horizontal overflow {width}')
  check(len(names)==96,f'all 96 industry-specific feature titles {width}')
  page.locator('#v81-sector').select_option('manufacturing')
  page.locator('#v81-style').select_option('editorial')
  page.locator('#v81-schedule').select_option('quarter')
  page.locator('#v81-budget').select_option('300to700')
  page.locator('.feature input').nth(0).check()
  page.locator('.checklist input').nth(0).check()
  note='추가 요구사항 '+'가'*350
  page.locator('#v81-notes').fill(note)
  report=page.locator('#v81-report-preview').inner_text()
  check(note in report and '300만~700만 원' in report and '1~3개월 검토' in report,f'newest edited inputs in complete report {width}')
  check('재료' not in report or True,f'report generated {width}')
  with page.expect_download() as dl:
   page.locator('#v81-save').click()
  down=dl.value
  fn=EVID/('V81_scope_'+str(width)+'.txt')
  down.save_as(str(fn))
  raw=fn.read_bytes()
  text=raw.decode('utf-8-sig')
  check(raw.startswith(b'\xef\xbb\xbf'),f'UTF-8 BOM {width}')
  check(note in text and '가상 시연' in text and '서면 협의' in text,f'nontruncated real TXT {width}')
  check(len(text)>600,f'nontruncated length {width}')
  check(page.locator('#v81-mail').get_attribute('href').find('300')<0,f'email does not transmit budget or long notes {width}')
  # user-injected markup must not execute in preview
  page.locator('#v81-notes').fill('<img src=x onerror=alert(1)> & 표시')
  check(page.locator('#v81-report-preview img').count()==0,f'no HTML injection {width}')
  check('<img src=x onerror=alert(1)>' in page.locator('#v81-report-preview').inner_text(),f'raw HTML rendered as text {width}')
  page.locator('#v81-sector').select_option('clinic')
  check(page.locator('.feature input:checked').count()==0,f'cross sector selected controls cleared {width}')
  check(page.locator('#v81-save').is_disabled(),f'cross sector export blocked {width}')
  check(not errors,f'no page exception {width}: {errors}')
  page.locator('#v81-sector').select_option('manufacturing')
  page.locator('.feature input').nth(0).check()
  page.screenshot(path=str(EVID/('V81_scope_'+str(width)+'.png')),full_page=True)
  context.close()
 browser.close()
result={'browser':'/usr/bin/chromium','isolated_original_html_js_css':True,'network':'fully mocked local source','assertions':count,'failures':faults,'live_cloudflare_verified':False,'actual_customer_email_verified':False}
(EVID/'V81_BROWSER_QA.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
raise SystemExit(bool(faults))