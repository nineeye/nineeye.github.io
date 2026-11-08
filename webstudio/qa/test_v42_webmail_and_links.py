#!/usr/bin/env python3
"""Isolated Chromium and local static-site auditing for V42 changes."""
from pathlib import Path
import importlib.util
import json
import tempfile
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
def source(asset):
    # Test works in both ZIP's source folder and a full GitHub checkout.
    candidates = [ROOT/'SOURCE/webstudio/assets'/asset, ROOT/'assets'/asset, ROOT/'QA/fixtures'/asset]
    for path in candidates:
        if path.exists():
            return path.read_text(encoding='utf-8')
    raise FileNotFoundError(asset)
JS40 = source('v40-mail-fallback.js')
CSS40 = source('v40-mail-fallback.css')
JS = source('v42-webmail-guide.js')
CSS = source('v42-webmail-guide.css')

checks=[]
def check(label,value):
    checks.append({'name':label, 'pass':bool(value)})

fixture = '''<!doctype html><html lang="ko"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>
<form id="brief-form"><label>업종<select required name="industry"><option value="">선택</option><option value="manufacturing">제조·도매</option><option value="academy">학원·교육</option><option value="interior">인테리어·시공</option></select></label>
<label>목적<select name="goal" required><option value="">선택</option><option value="lead">문의 늘리기</option></select></label></form>
<aside class="preview"><pre id="brief-output">[올파일원 웹스튜디오 · 홈페이지 제작 상담 준비서]\n업종: 제조·도매\n업종 상품에서 고른 기능: 규격 검색, 견적 요청\n추가 요청: 시연에서 선택한 기능 반영</pre>
<div class="preview-actions"><button id="brief-email">메일 앱</button><button id="brief-copy">원래 요청서 복사</button></div></aside></body></html>'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    try:
        for width in [320,360,390,768,1280]:
            page=browser.new_page(viewport={'width':width,'height':840})
            page.set_content(fixture)
            page.add_style_tag(content='*,*:before,*:after{box-sizing:border-box}body,.preview{max-width:100%}pre{white-space:pre-wrap;overflow-wrap:anywhere}\n'+CSS40+'\n'+CSS)
            page.evaluate(JS40)
            page.evaluate(JS)
            check(f'{width} new panel exists',page.locator('#v42-webmail-guide').count()==1)
            check(f'{width} no duplicate old panel',page.locator('#v40-mail-fallback').count()==1)
            check(f'{width} Naver link secure',page.locator('#v42-open-webmail').get_attribute('href')=='https://mail.naver.com/' and page.locator('#v42-open-webmail').get_attribute('rel')=='noopener noreferrer')
            check(f'{width} no overflow',page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
            page.locator('#v42-copy-complete').click()
            check(f'{width} required fields stop unprepared copy','업종과 제작 목적' in page.locator('#v42-copy-feedback').inner_text())
            page.locator('select[name=industry]').select_option('manufacturing')
            page.locator('select[name=goal]').select_option('lead')
            page.evaluate('''() => Object.defineProperty(navigator, 'clipboard', {configurable:true, value:{writeText: async s => {window.__v42Copied=s;}}})''')
            page.locator('#v42-copy-complete').click()
            page.wait_for_function('typeof window.__v42Copied === "string"')
            copied=page.evaluate('window.__v42Copied')
            check(f'{width} subject copied','제목: [올파일원 웹스튜디오] 제조·도매 홈페이지 제작 문의' in copied)
            check(f'{width} modules preserved','업종 상품에서 고른 기능: 규격 검색, 견적 요청' in copied)
            check(f'{width} entire preview copied','추가 요청: 시연에서 선택한 기능 반영' in copied)
            check(f'{width} no-sending disclaimer','아직 발송되지 않았습니다' in page.locator('#v42-copy-feedback').inner_text())
            page.evaluate(JS)
            check(f'{width} idempotent re-inject',page.locator('#v42-webmail-guide').count()==1)
            page.evaluate('''() => Object.defineProperty(navigator, 'clipboard', {configurable:true, value:undefined})''')
            page.locator('#v42-copy-complete').click()
            check(f'{width} blocked clipboard fallbacks','자동 복사를 제한' in page.locator('#v42-copy-feedback').inner_text())
            if width==390:
                page.screenshot(path=str(Path(__file__).with_name('v42_webmail_mobile_390.png')),full_page=True)
            page.close()
    finally:
        browser.close()

scanner = ROOT/'TOOLS/audit_local_site_links.py'
if not scanner.exists(): scanner = ROOT/'tools/audit_local_site_links.py'
spec=importlib.util.spec_from_file_location('local_link_audit',scanner)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
with tempfile.TemporaryDirectory() as td:
    base=Path(td)
    (base/'index.html').write_text('<a href="./contact.html#brief">상담</a><img src="./assets/x.svg"><a href="https://example.com">밖</a>',encoding='utf-8')
    (base/'contact.html').write_text('<section id="brief"></section><a href="#brief">바로가기</a>',encoding='utf-8')
    (base/'assets').mkdir()
    (base/'assets/x.svg').write_text('<svg/>',encoding='utf-8')
    result=mod.audit(base,True)
    check('valid simple site',result['status']=='PASS' and result['pages']==2)
    (base/'index.html').write_text('<a href="../private.txt">탈출</a><a href="missing.html">누락</a><a href="contact.html#bad">빈 앵커</a>',encoding='utf-8')
    result=mod.audit(base,True)
    found={x['kind'] for x in result['errors']}
    check('relative link missing detected','missing_file' in found)
    check('path escape detected','path_escape' in found)
    check('missing local anchor detected','missing_anchor' in found)

summary={'total':len(checks),'passed':sum(x['pass'] for x in checks),'failed':sum(not x['pass'] for x in checks),
         'scope':'Isolated Chromium fixture with real V40/V42 JS+CSS, not publicly deployed Cloudflare; local link tool synthetic fixtures','tests':checks}
Path(__file__).with_name('V42_ISOLATED_QA.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in summary.items() if k!='tests'},ensure_ascii=False,indent=2))
if summary['failed']:
    raise SystemExit('FAILED '+str([x['name'] for x in checks if not x['pass']]))
