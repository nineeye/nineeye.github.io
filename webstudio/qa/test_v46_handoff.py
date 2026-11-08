#!/usr/bin/env python3
"""Offline V46 regression tests. Isolated Chromium set_content with a minimal storage shim.
The sandbox blocks all page navigation; real origin/sessionStorage and Cloudflare remain HOLD.
"""
from __future__ import annotations
import json,re,sys, tempfile,zipfile,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
SOURCE=Path(__file__).resolve().parents[2];ROOT=SOURCE/'webstudio'
ZIP=Path('/mnt/data/AllFileOne_WebStudio_V45_MarketSales_StartKit_AllInOne_LATEST.zip')
RESULTS=[]
def ok(n,test):
    RESULTS.append({'test':n,'pass':bool(test)})
    if not test: print('FAIL:',n)
CONTACT='''<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>홈페이지 제작 상담</title></head><body><main>
<section id="brief"><div class="workspace"><form id="brief-form">
<select name="industry"><option value="">미정</option><option value="manufacturing">제조</option><option value="academy">학원</option><option value="interior">인테리어</option></select>
<select name="goal"><option value="">미정</option><option value="lead">문의</option><option value="showcase">소개</option><option value="booking">예약</option><option value="brand">브랜드</option></select>
<textarea name="details" maxlength="700"></textarea><pre id="brief-output"></pre>
</form></div></section></main></body></html>'''
MOCK_JS='''() => {
 const box = new Map(); window.__storage = {
  get length(){return box.size},getItem(key){return box.has(key)?box.get(key):null},
  setItem(key,value){box.set(String(key),String(value))},removeItem(key){box.delete(key)},clear(){box.clear()}
 };
 Object.defineProperty(window,'sessionStorage',{configurable:true,value:window.__storage});
 window.__testQuery='?industry=academy';
 const _URLSearchParams=window.URLSearchParams;
 window.URLSearchParams=function(text){return new _URLSearchParams(text||window.__testQuery)};
 document.addEventListener('click', e=>{if(e.target.closest?.('a'))e.preventDefault();},true);
}'''
with tempfile.TemporaryDirectory(prefix='afo-v46-') as temp:
    root=Path(temp);w=root/'webstudio';(w/'assets').mkdir(parents=True)
    selected=('webstudio/launch-kit.html','webstudio/assets/v45-launch-kit.js','webstudio/assets/v45-launch-kit.css')
    if all((SOURCE/name).is_file() for name in selected):
        for name in selected: shutil.copyfile(SOURCE/name,root/name)
    elif ZIP.is_file():
        with zipfile.ZipFile(ZIP) as z:
            for name in selected: (root/name).write_bytes(z.read(name))
    else:
        raise RuntimeError('V45+ repository source or V45 package not found. Test cannot start.')
    (w/'contact.html').write_text(CONTACT,encoding='utf-8')
    (w/'assets/current-release.json').write_text('{"version":"V45","demo_count":36}',encoding='utf-8')
    sys.path.insert(0,str(ROOT/'tools'));sys.path.insert(0,str(SOURCE));from apply_v46 import patch
    metadata=patch(root)
    ok('V46 patch expected files',len(metadata['files'])==5)
    originals={p:p.read_bytes() for p in (w/'contact.html',w/'launch-kit.html',w/'assets/current-release.json')}
    patch(root)
    ok('idempotent source integration',all(p.read_bytes()==v for p,v in originals.items()))
    h=(w/'launch-kit.html').read_text('utf-8');c=(w/'contact.html').read_text('utf-8')
    kitJS=(w/'assets/v45-launch-kit.js').read_text('utf-8');kitCSS=(w/'assets/v45-launch-kit.css').read_text('utf-8')
    js=(w/'assets/v46-handoff.js').read_text('utf-8');css=(w/'assets/v46-handoff.css').read_text('utf-8')
    for name,flag in [('V45 script retained','v45-launch-kit.js' in h),('V46 script both pages','v46-handoff.js' in h and 'v46-handoff.js' in c),
                      ('V46 style in contact','v46-handoff.css' in c),('privacy explanation','같은 탭에 준비 내용을 한 번 임시 보관' in h),
                      ('manifest version',json.loads((w/'assets/current-release.json').read_text('utf-8'))['version']=='V46')]:ok(name,flag)
    for disallowed in ('fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'innerHTML=', 'https://api.'):
        ok('no '+disallowed,disallowed not in js)
    launchMarkup=re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>','',h)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        for width in (360,768,1440):
            page=browser.new_page(viewport={'width':width,'height':900})
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content(launchMarkup)
            page.evaluate(MOCK_JS)
            page.add_style_tag(content=kitCSS)
            page.add_script_tag(content=kitJS)
            page.add_script_tag(content=js)
            ok(f'{width} no initial JS errors',not errors)
            ok(f'{width} academy initial state',page.locator('[data-sector="academy"]').get_attribute('aria-pressed')=='true')
            ok(f'{width} handoff CTA visible','준비내용 포함' in page.locator('#contactLink').inner_text())
            ok(f'{width} storage empty before click',page.evaluate('sessionStorage.length===0'))
            ok(f'{width} launch no overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
            page.locator('#projectName').fill('우리 학원 <img src=x onerror=alert(7)>')
            page.locator('#projectGoal').select_option(label='신규 상담·견적 문의')
            page.locator('#projectMemo').fill('2026 상담 문의 <b>강조</b>')
            page.locator('.check-row input').nth(0).check();page.locator('.check-row input').nth(1).check()
            page.locator('#contactLink').click()
            row=page.evaluate('JSON.parse(sessionStorage.getItem("afo.webstudio.v46.handoff"))')
            ok(f'{width} stored 2/10 count',len(row['done'])==2 and len(row['missing'])==8)
            ok(f'{width} sensitive data omitted URL','2026' not in page.locator('#contactLink').get_attribute('href'))
            ok(f'{width} stored project and memo',row['project'].startswith('우리 학원') and row['memo'].startswith('2026'))
            ok(f'{width} click-only storage',row['v']==46 and row['industry']=='academy')
            page.set_content(CONTACT)
            page.evaluate("window.__testQuery='?source=startkit&industry=academy&theme=modern'")
            page.add_style_tag(content=css)
            page.add_style_tag(content='html{box-sizing:border-box}*,*:before,*:after{box-sizing:inherit}body{margin:0}#brief-form{width:100%;max-width:100%;overflow-wrap:anywhere}#brief-output{white-space:pre-wrap;overflow-wrap:anywhere}textarea{max-width:100%}')
            page.add_script_tag(content="document.querySelector('#brief-form').addEventListener('input',()=>{document.querySelector('#brief-output').textContent=document.querySelector('[name=details]').value});")
            page.add_script_tag(content=js)
            ok(f'{width} one-use data deleted on contact',page.evaluate('sessionStorage.length===0'))
            ok(f'{width} summary panel shown',page.locator('#v46-import').count()==1)
            ok(f'{width} selected industry',page.locator('[name=industry]').input_value()=='academy')
            ok(f'{width} goal prefilled',page.locator('[name=goal]').input_value()=='lead')
            ok(f'{width} project appears in details','우리 학원' in page.locator('[name=details]').input_value())
            ok(f'{width} memo preserved','2026 상담 문의' in page.locator('[name=details]').input_value())
            ok(f'{width} generated preview refreshed','준비자료' in page.locator('#brief-output').inner_text())
            ok(f'{width} HTML escaping safe',page.locator('#v46-import img').count()==0 and page.locator('#v46-import b').count()==0)
            ok(f'{width} full summary contains 8 missing',page.locator('#v46-full-report').inner_text().count('미준비:')==1)
            ok(f'{width} contact textarea <=700',len(page.locator('[name=details]').input_value())<=700)
            ok(f'{width} contact no horizontal overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
            page.set_content(CONTACT)
            page.add_script_tag(content=js)
            ok(f'{width} no repeated import',page.locator('#v46-import').count()==0)
            ok(f'{width} no page errors',not errors)
            page.close()
        page=browser.new_page()
        page.set_content(CONTACT);page.evaluate(MOCK_JS)
        import time
        record={'v':46,'ts':int(time.time()*1000),'industry':'manufacturing','project':'SAFE','goal':'신규 상담·견적 문의','memo':'hi','done':[],'missing':['a']*10}
        cases=[('expired',dict(record,ts=1)),('wrong sector',dict(record,industry='academy')),('wrong version',dict(record,v=45)),
               ('invalid list',dict(record,done=['extra'],missing=['extra'])),('oversized user memo',dict(record,memo='x'*301)),
               ('future timestamp',dict(record,ts=int(time.time()*1000)+600000))]
        for name,datum in cases:
            page.evaluate('x=>sessionStorage.setItem("afo.webstudio.v46.handoff",JSON.stringify(x))',datum)
            page.evaluate("window.__testQuery='?source=startkit&industry=manufacturing'")
            page.add_script_tag(content=js)
            ok(name+' rejected',page.locator('#v46-import').count()==0)
            ok(name+' cleared',page.evaluate('sessionStorage.length===0'))
        page.close();browser.close()
passed=sum(x['pass'] for x in RESULTS)
report={'release':'V46','source':'V45 genuine launch HTML/CSS/JS + V46 overlay; contact V26-shaped isolated fixture',
 'browser':'Chromium set_content; sessionStorage shim because browser navigation is blocked by sandbox',
 'total':len(RESULTS),'passed':passed,'failed':len(RESULTS)-passed,
 'real_same_origin_navigation_verified':False,'real_production_email_verified':False,'official_cloudflare_verified':False,
 'results':RESULTS}
(ROOT/'qa/V46_QA_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'V46 Chromium isolated QA {passed}/{len(RESULTS)} PASS; {len(RESULTS)-passed} FAIL')
if passed!=len(RESULTS):sys.exit(1)
