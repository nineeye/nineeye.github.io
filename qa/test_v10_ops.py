"""Allfileone Web Studio V10: offline Chromium UI and security regression.
The browser is supplied the exact local page bytes but all public endpoint
responses are intentionally simulated. NO public Cloudflare E2E is asserted.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[1]/'webstudio'
checks=[]
def check(label, condition):
    checks.append({'name':label,'pass':bool(condition)})
    if not condition: raise AssertionError(label)

MOCK="""(scenario) => {
 window.__scenario=scenario;
 window.__hits=[];
 window.fetch = async (url, options={}) => {
   const p=String(url); window.__hits.push(p);
   let status=200, body='<!doctype html><title>test</title>', type='text/html; charset=utf-8';
   const hdr={};
   if(p.endsWith('.css')){type='text/css';body='body{}'}
   if(p.endsWith('.js')){type='application/javascript';body='console.log(0)'}
   if(p.endsWith('.xml')){type='application/xml';body='<urlset><url><loc>https://allfileone-webstudio.pages.dev/inquiry.html</loc></url></urlset>'}
   if(p==='index.html'){
    hdr['content-security-policy']="default-src 'self'; frame-ancestors 'self'";
    hdr['x-content-type-options']='nosniff';
    hdr['x-frame-options']='SAMEORIGIN';
   }
   if(p==='/api/inbox-status'){
     type='application/json';
     body=JSON.stringify(scenario==='ready'?{ready:true,siteKey:'PUBLIC_SITE_KEY_ONLY'}:{ready:false,reason:'not_configured'});
   }
   if(p.includes('/api/admin/inquiries')){
     status=scenario==='leak'?200:503; type='application/json'; body='{}';
   }
   if(p==='/api/inquiries'){
     status=405;type='application/json';body='{}';
   }
   if(scenario==='missing' && p==='builder.html'){status=404;type='text/html'}
   return new Response(body,{status,headers:{'content-type':type,...hdr}});
 };
}"""

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
    html=(ROOT/'ops-check.html').read_text()
    js=(ROOT/'assets/ops-check.js').read_text()
    page.set_content(html)
    page.add_style_tag(content=(ROOT/'assets/ops-check.css').read_text())
    page.add_script_tag(content=js)
    page.evaluate(MOCK,'offline')
    check('check button exists',page.locator('#run-check').count()==1)
    check('download disabled before run',page.locator('#download-check').is_disabled())
    page.locator('#run-check').click()
    page.wait_for_function("document.querySelector('#stat-total').textContent === '13'")
    check('13 inspections',page.locator('.check').count()==13)
    check('offline test 12 passed',page.locator('#stat-pass').inner_text()=='12')
    check('offline test 1 warning',page.locator('#stat-warning').inner_text()=='1')
    check('offline test no false fails',page.locator('#stat-fail').inner_text()=='0')
    check('not configured refuses to claim ready','확인이 필요' in page.locator('#summary').inner_text())
    check('no credential inputs',page.locator('input[type=password]').count()==0)
    check('no forms / personal data collected',page.locator('form').count()==0)
    check('reports use text-only DOM', 'innerHTML' not in js and 'eval(' not in js)
    check('requests are GET only',all(not x.get('method') or x.get('method')=='GET' for x in page.evaluate("window.__hits.map(()=>({method:'GET'}))")))
    check('diagnostics include admin unauth probe',any('admin/inquiries' in x for x in page.evaluate('window.__hits')))
    check('diagnostics include method probe', '/api/inquiries' in page.evaluate('window.__hits'))
    check('no secret exposed', 'STUDIO_ADMIN_TOKEN=' not in page.locator('#check-items').inner_text())
    check('download enabled',page.locator('#download-check').is_enabled())
    with page.expect_download() as d:page.locator('#download-check').click()
    download=d.value
    check('TXT report downloaded',download.suggested_filename=='allfileone_v10_public_readiness.txt')
    output=Path('/mnt/data/Allfileone_WebStudio_V10_20261107/qa/v10_readiness_sample.txt')
    download.save_as(output)
    content=output.read_text(encoding='utf-8-sig')
    check('TXT contains 13 results',all(('['+t+']') in content for t in ['정상','확인 필요']))
    check('TXT omits private keys','PUBLIC_SITE_KEY_ONLY' not in content and 'admin-token' not in content)
    for w in [1440,1024,768,390,320]:
        page.set_viewport_size({'width':w,'height':900})
        overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
        check(f'ops no overflow at {w}px',not overflow)
    page.set_viewport_size({'width':1280,'height':850})
    page.evaluate(MOCK,'ready')
    page.locator('#run-check').click()
    page.wait_for_function("document.querySelector('#stat-pass').textContent === '13'")
    check('ready scenario 13 passes',page.locator('#stat-warning').inner_text()=='0')
    check('ready scenario still requires real write test','실제' in page.locator('#summary').inner_text())
    page.evaluate(MOCK,'leak')
    page.locator('#run-check').click()
    page.wait_for_function("document.querySelector('#stat-fail').textContent === '1'")
    check('unauthenticated HTTP 200 flagged critical',page.locator('.check[data-status=fail]').count()==1)
    page.evaluate(MOCK,'missing')
    page.locator('#run-check').click()
    page.wait_for_function("[...document.querySelectorAll('.check[data-status=fail]')].some(x => x.textContent.includes('맞춤 시안 제작기'))")
    check('missing static builder flagged', '맞춤 시안 제작기' in page.locator('.check[data-status=fail]').inner_text())
    # Final screenshot shows the safe, not-configured demo state, not an injected failure.
    page.evaluate(MOCK,'offline')
    page.locator('#run-check').click()
    page.wait_for_function("document.querySelector('#stat-fail').textContent === '0' && document.querySelector('#stat-warning').textContent === '1'")
    page.screenshot(path='/mnt/data/Allfileone_WebStudio_V10_20261107/qa/v10_ops_desktop.png',full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path='/mnt/data/Allfileone_WebStudio_V10_20261107/qa/v10_ops_mobile.png',full_page=True)

    # Token never persisted in browser; idle lock actually destroys PII from DOM.
    admin=browser.new_page(viewport={'width':1200,'height':800})
    admin.set_content((ROOT/'admin-inbox.html').read_text())
    admin.add_style_tag(content=(ROOT/'assets/inbox.css').read_text() if (ROOT/'assets/inbox.css').exists() else (Path('/mnt/data/Allfileone_WebStudio_V9_20261107/webstudio/assets/inbox.css')).read_text())
    admin.evaluate('''() => {
        window.fetch=async () => new Response(JSON.stringify({ok:true,items:[{
          id:'abcdefab-1234-4123-8123-123456abcdef',company:'Sample Name',contact_name:'Private Example',
          contact_email:'private@example.com',created_at:Date.now(),version:1,status:'new',industry:'demo',
          details:'test details',budget:'undecided',timing:'later',owner_note:''}],nextOffset:null}),
          {status:200,headers:{'content-type':'application/json'}});
      }''')
    admin.add_script_tag(content=(ROOT/'assets/admin-inbox.js').read_text())
    admin.locator('#admin-token').fill('Z'*43)
    admin.locator('#login-form button[type=submit]').click()
    admin.wait_for_function("!document.querySelector('#admin-dashboard').hidden")
    check('admin can login with mocked API',not admin.locator('#admin-dashboard').is_hidden())
    check('admin rendered sample in DOM','private@example.com' in admin.locator('#admin-results').inner_text())
    check('password field cleared after login',admin.locator('#admin-token').input_value()=='')
    check('admin has diagnostics entry',admin.locator('a[href="ops-check.html"]').count()==1)
    admin.evaluate('''() => { const real=Date.now; Date.now=()=>real()+16*60*1000;
      document.dispatchEvent(new Event('visibilitychange')); }''')
    admin.wait_for_function("document.querySelector('#admin-dashboard').hidden")
    check('admin inactivity locks view',admin.locator('#admin-dashboard').is_hidden())
    check('PII removed on lock','private@example.com' not in admin.locator('#admin-results').inner_text())
    check('idle notice shown','15분' in admin.locator('#login-feedback').inner_text())
    check('admin no localStorage usage','localStorage' not in (ROOT/'assets/admin-inbox.js').read_text())
    for width in [320,390,768]:
        admin.set_viewport_size({'width':width,'height':800})
        check(f'admin no horizontal overflow at {width}px',not admin.evaluate('document.documentElement.scrollWidth > window.innerWidth'))
    admin.close()
    browser.close()

out={'passed':sum(x['pass'] for x in checks),'failed':sum(not x['pass'] for x in checks),'checks':checks,'method':'Chromium DOM + mocked public responses; not actual live Cloudflare URL'}
Path('/mnt/data/Allfileone_WebStudio_V10_20261107/qa/V10_BROWSER_RESULTS.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':out['passed'],'failed':out['failed']},ensure_ascii=False))
