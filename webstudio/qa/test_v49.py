#!/usr/bin/env python3
"""V49 genuine HTML/CSS/JS in isolated Chromium. No localhost/public-site claims."""
from __future__ import annotations
import json, re, sys, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'quick-inquiry.html').read_text('utf-8')
CSS=(ROOT/'assets/v49-quick-inquiry.css').read_text('utf-8')
JS=(ROOT/'assets/v49-quick-inquiry.js').read_text('utf-8')
RESULTS=[]
def check(name,value):
    RESULTS.append({'test':name,'pass':bool(value)})
    if not value:print('FAIL:',name)
for name in ('quick-inquiry.html','assets/v49-quick-inquiry.css','assets/v49-quick-inquiry.js','assets/v49-entry.css'):
    check('new asset exists '+name,(ROOT/name).is_file())
check('html canonical', 'rel="canonical" href="https://allfileone-webstudio.pages.dev/quick-inquiry.html"' in HTML)
check('html no extra network dependencies',not re.search(r'<(?:script[^>]+src|link[^>]+rel="stylesheet"[^>]+href)="https?://',HTML))
for banned in ('fetch(', 'XMLHttpRequest','sendBeacon','localStorage','sessionStorage','innerHTML','eval(', 'https://api.'):
    check('no '+banned,banned not in JS)
check('static disclosure actual send', '직접 보내기' in HTML)
check('no fake success claim', '접수되었습니다' not in JS)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width in (320,360,390,768,1024,1440):
        page=browser.new_page(viewport={'width':width,'height':900},accept_downloads=True)
        errors=[]
        page.on('pageerror',lambda err:errors.append(str(err)))
        page.set_content(re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>','',HTML))
        page.add_style_tag(content=CSS)
        page.add_script_tag(content=JS)
        check(f'{width}px no js errors initial',not errors)
        check(f'{width}px title',page.title()=='1분 홈페이지 제작 문의 | 올파일원 웹스튜디오')
        check(f'{width}px no horizontal overflow initial',page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
        check(f'{width}px default sector',page.locator('input[value="manufacturing"]').is_checked())
        check(f'{width}px initial message manufacturer', '제조 · 도매' in page.locator('#v49-output').inner_text())
        check(f'{width}px initial feature 4',page.locator('#v49-feature option').count()==4)
        check(f'{width}px initial scope 4',page.locator('#v49-scope option').count()==4)
        for sec,keyword in [('academy','학원 · 교육'),('interior','인테리어 · 시공'),('manufacturing','제조 · 도매')]:
            page.locator(f'input[value="{sec}"]').check()
            check(f'{width}px {sec} message',keyword in page.locator('#v49-output').inner_text())
            check(f'{width}px {sec} options',page.locator('#v49-feature option').count()==4)
        page.locator('input[value="interior"]').check()
        page.locator('#v49-feature').select_option('quote')
        page.locator('#v49-scope').select_option('medium')
        page.locator('#v49-note').fill('시공 업무 <img src=x onerror=alert(3)>와 보수사항 협의')
        check(f'{width}px appropriate feature quote','지역·면적별 견적' in page.locator('#v49-output').inner_text())
        check(f'{width}px scope medium','사례 11~30건' in page.locator('#v49-output').inner_text())
        check(f'{width}px HTML injection escaped',page.locator('#v49-output img').count()==0)
        check(f'{width}px no horizontal overflow filled',page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
        with page.expect_download() as info:
            page.locator('#v49-download').click()
        d=info.value
        check(f'{width}px download filename',d.suggested_filename=='AllFileOne_Quick_Inquiry_V49.txt')
        with tempfile.TemporaryDirectory(prefix='afo-v49-') as tmp:
            downloaded=Path(tmp)/'test.txt';d.save_as(downloaded)
            blob=downloaded.read_text('utf-8-sig')
        check(f'{width}px file contains details', '시공 업무 <img src=x onerror=alert(3)>' in blob)
        check(f'{width}px file includes recipient','받는 사람: nineeyes@naver.com' in blob)
        check(f'{width}px file no sent claim','접수가 완료' not in blob)
        check(f'{width}px download explicitly not sent','접수는 아직' in page.locator('#v49-status').inner_text())
        page.locator('#v49-copy').click()
        check(f'{width}px blocked clipboard fallback', '자동 복사가 제한' in page.locator('#v49-status').inner_text() or '복사했습니다' in page.locator('#v49-status').inner_text())
        check(f'{width}px preserved no JS errors',not errors)
        if width==390:page.screenshot(path=str(ROOT/'qa'/'V49_mobile_preview.png'),full_page=True)
        if width==1440:page.screenshot(path=str(ROOT/'qa'/'V49_desktop_preview.png'),full_page=True)
        page.close()
    browser.close()
report={'version':'V49','verified_scope':'real V49 HTML/CSS/JS injected into isolated Chromium about:blank; NO real public site, live email or SEO index verification','total':len(RESULTS),'passed':sum(x['pass'] for x in RESULTS),'failed':sum(not x['pass'] for x in RESULTS),'results':RESULTS}
(ROOT/'qa'/'V49_BROWSER_QA_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f"V49 isolated browser {report['passed']}/{report['total']} PASS")
sys.exit(int(report['failed']!=0))
