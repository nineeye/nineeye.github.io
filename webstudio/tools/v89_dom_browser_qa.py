"""Read-only V89 first-party source DOM chromium, 12 industries x desktop/mobile.
No access to public Cloudflare or real customers; no mail or API.
"""
from pathlib import Path
import base64,json,sys,time
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1];O=R.parent/'QA'/'V89';O.mkdir(parents=True,exist_ok=True)
soup=BeautifulSoup((R/'index.html').read_text('utf-8'),'html.parser')
for link in list(soup.find_all('link',rel='stylesheet')):
 url=link.get('href','');path=R/url.removeprefix('./');tag=soup.new_tag('style');tag.string=path.read_text('utf-8');link.replace_with(tag)
for script in list(soup.find_all('script',src=True)):
 path=R/script['src'].removeprefix('./');tag=soup.new_tag('script');tag.string=path.read_text('utf-8');script.decompose();soup.body.append(tag)
for img in soup.find_all('img'):
 url=img.get('src','');path=R/url.removeprefix('./');mime={'png':'image/png','webp':'image/webp','svg':'image/svg+xml'}.get(path.suffix.lower().removeprefix('.'),'application/octet-stream')
 img['src']=f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode('ascii')
# Ensure screenshot's current image remains data-backed even when srcset is added later.
page_html=str(soup)
keys=['manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event']
checks=[];fails=[];screens=[]
def check(ok,name):
 checks.append(name)
 if not ok:fails.append(name)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (390,1280):
  page=browser.new_page(viewport={'width':width,'height':850},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(page_html,wait_until='load');page.wait_for_timeout(100)
  check(page.evaluate('window.AFO_V89_HOME_READY===true'),f'{width}/READY')
  check(page.locator('nav.nav a').count()==4,f'{width}/nav-4')
  check(page.locator('main section').count()==6,f'{width}/six-sections')
  check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+3'),f'{width}/no-horizontal-overflow')
  check(page.locator('.sample-card').count()==3,f'{width}/three-live-demos')
  check(page.locator('.sample-image img').count()==3,f'{width}/owned-demo-images')
  for key in keys:
   page.select_option('#v89-sector',key)
   state=page.evaluate('''()=>({key:document.querySelector('#v89-sector').value,tag:document.querySelector('#v89-sector-tag').textContent,head:document.querySelector('#v89-sector-head').textContent,desc:document.querySelector('#v89-sector-desc').textContent,demo:document.querySelector('#v89-sector-demo').getAttribute('href'),guide:document.querySelector('#v89-sector-guide').getAttribute('href'),w:document.documentElement.scrollWidth,view:innerWidth})''')
   check(state['key']==key,f'{width}/{key}/selected')
   check(bool(state['tag']),f'{width}/{key}/tag')
   check(bool(state['head']) and bool(state['desc']),f'{width}/{key}/help')
   check(state['demo']==f'./experience-v85.html?industry={key}',f'{width}/{key}/demo-link')
   check(state['guide']==f'./industry-guide/{key}.html',f'{width}/{key}/guide-link')
   check(state['w']<=width+3,f'{width}/{key}/fits')
  page.select_option('#v89-sector','manufacturing')
  if width==390:page.screenshot(path=str(O/'V89_HOME_MOBILE_390.png'),full_page=True);screens.append('V89_HOME_MOBILE_390.png')
  else:page.screenshot(path=str(O/'V89_HOME_DESKTOP_1280.png'),full_page=True);screens.append('V89_HOME_DESKTOP_1280.png')
  check(not errors,f'{width}/no-script-errors:'+','.join(errors[:3]))
  page.close()
 browser.close()
result={'scope':'V89_ISOLATED_CHROMIUM_SOURCE_DOM_ONLY_NOT_PUBLIC_CLOUDFLARE','checks':len(checks),'passed':len(checks)-len(fails),'failed':len(fails),'failures':fails,'screenshots':screens,'actual_email_receipt':'NOT_TESTED','actual_public_deploy':'NOT_TESTED','paid_api_calls':0}
(O/'V89_LOCAL_BROWSER_QA.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
(O/'V89_LOCAL_BROWSER_QA_KO.txt').write_text('올파일원 웹스튜디오 V89 소스 격리 Chromium QA\n'+f"통과: {result['passed']}/{result['checks']} | 실패: {result['failed']}\n"+'실공개·메일 수신·계약 시험 아님\n'+'\n'.join(fails),'utf-8')
print(json.dumps(result,ensure_ascii=False))
if fails:sys.exit(1)
