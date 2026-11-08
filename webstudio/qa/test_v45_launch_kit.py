#!/usr/bin/env python3
"""V45 client kit local/browser checks. Offline, read-only, no paid services."""
from __future__ import annotations
import json, re, sys, threading, functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / 'launch-kit.html'
CSS = ROOT / 'assets/v45-launch-kit.css'
JS = ROOT / 'assets/v45-launch-kit.js'
results = []
def assert_ok(label, ok):
    results.append({'name':label,'pass':bool(ok)})
    if not ok: print('FAIL', label)

html = HTML.read_text(encoding='utf-8')
script = JS.read_text(encoding='utf-8')
styles = CSS.read_text(encoding='utf-8')
for p in (HTML,CSS,JS): assert_ok('exists '+p.name,p.is_file() and p.stat().st_size>100)
for p in ('assets/v45-launch-kit.css','assets/v45-launch-kit.js'):
    assert_ok('html references '+p,p in html)
for token in ('https://allfileone-webstudio.pages.dev/launch-kit.html','<meta name="description"','aria-live','id="checklist"','id="downloadTxt"'):
    assert_ok('html content '+token[:35],token in html)
assert_ok('no external asset dependencies',not re.search(r'<script[^>]+src="https?://',html) and not re.search(r'<link[^>]+rel="stylesheet"[^>]+href="https?://',html))
assert_ok('no fetch/ajax',not re.search(r'\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage)\s*[.(]',script))

handler=functools.partial(SimpleHTTPRequestHandler,directory=str(ROOT))
server=ThreadingHTTPServer(('127.0.0.1',0),handler)
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
BASE=f'http://127.0.0.1:{server.server_port}/launch-kit.html'
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width in (360,768,1440):
        page=browser.new_page(viewport={'width':width,'height':900},accept_downloads=True)
        errors=[]
        page.on('pageerror',lambda ex: errors.append(str(ex)))
        page.set_content(re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>', '', html))
        page.add_style_tag(content=styles)
        page.add_script_tag(content=script)
        assert_ok(f'{width}px no JS errors',not errors)
        assert_ok(f'{width}px title',page.title()=='홈페이지 제작 준비 키트 | 올파일원 웹스튜디오')
        assert_ok(f'{width}px no horizontal overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
        assert_ok(f'{width}px 10 initial checks',page.locator('.check-row').count()==10)
        assert_ok(f'{width}px initial count',page.locator('#progressLabel').inner_text()=='0 / 10개 준비 완료 체크')
        page.locator('.check-row input').nth(0).check()
        page.locator('.check-row input').nth(4).check()
        assert_ok(f'{width}px progress updates',page.locator('#progress').get_attribute('aria-valuenow')=='20')
        assert_ok(f'{width}px missing 8',page.locator('#missingList li').count()==8)
        page.locator('[data-sector="academy"]').click()
        assert_ok(f'{width}px change academy',page.locator('#sectorTitle').inner_text()=='학원·교육 홈페이지 준비자료')
        assert_ok(f'{width}px sector isolated',page.locator('#progress').get_attribute('aria-valuenow')=='0')
        assert_ok(f'{width}px correct inquiry handoff','industry=academy' in page.locator('#contactLink').get_attribute('href'))
        page.locator('.check-row input').nth(1).check()
        page.locator('[data-sector="manufacturing"]').click()
        assert_ok(f'{width}px retain manufacturer state',page.locator('#progress').get_attribute('aria-valuenow')=='20')
        page.locator('#projectName').fill('회사 이름 & <script>alert(1)</script>')
        page.locator('#projectMemo').fill('상담 희망 / 포함 내용 & <unsafe>')
        with page.expect_download() as item:
            page.locator('#downloadTxt').click()
        download=item.value
        assert_ok(f'{width}px filename',download.suggested_filename=='AllFileOne_Project_StartKit_manufacturing_V45.txt')
        saved=ROOT / 'qa' / ('_test_'+str(width)+'.txt');download.save_as(saved)
        txt=saved.read_text(encoding='utf-8-sig');saved.unlink()
        assert_ok(f'{width}px text includes raw input','<script>alert(1)</script>' in txt)
        assert_ok(f'{width}px correct section','재질·규격·품번 정보' in txt)
        assert_ok(f'{width}px no HTML injection',page.locator('script').count()==1)
        page.locator('#clearChecks').click()
        assert_ok(f'{width}px cleared',page.locator('#progress').get_attribute('aria-valuenow')=='0')
        page.close()
    page=browser.new_page(viewport={'width':1280,'height':800})
    page.set_content(re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>', '', html))
    page.add_style_tag(content=styles);page.add_script_tag(content=script)
    page.locator('[data-sector="interior"]').click()
    assert_ok('interior selector valid',page.locator('#summarySector').inner_text()=='인테리어 · 시공')
    for i in range(10): page.locator('.check-row input').nth(i).check()
    assert_ok('100 percent after all checks',page.locator('#progress').get_attribute('aria-valuenow')=='100')
    assert_ok('all done note visible',page.locator('#readyNote').is_visible())
    assert_ok('no missing list when complete',page.locator('#missingList').is_hidden())
    page.screenshot(path=str(ROOT/'qa'/'V45_preview_desktop.png'),full_page=True)
    page.close();browser.close()
server.shutdown()

count=sum(x['pass'] for x in results)
report={'release':'V45','source':'isolated Chromium with inline local assets (navigation restricted)','browser':'/usr/bin/chromium','total':len(results),'pass':count,'fail':len(results)-count,'results':results}
(ROOT/'qa'/'V45_QA_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'V45 QA {count}/{len(results)} PASS, {len(results)-count} FAIL')
if count!=len(results): sys.exit(1)
