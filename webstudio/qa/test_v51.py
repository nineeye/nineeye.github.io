#!/usr/bin/env python3
"""V51 actual V49 quick HTML/CSS/JS + new V51 JS; isolated contact fixture tests.
Does NOT claim live same-origin browser navigation or actual email receipt.
"""
from __future__ import annotations
import sys,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];WEB=ROOT/'webstudio'
PREV=WEB if (WEB/'quick-inquiry.html').is_file() else Path('/mnt/data/afo_v49/webstudio')
html=(PREV/'quick-inquiry.html').read_text('utf-8')
css=(PREV/'assets/v49-quick-inquiry.css').read_text('utf-8')
js=(PREV/'assets/v49-quick-inquiry.js').read_text('utf-8')
new=(WEB/'assets/v51-quick-handoff.js').read_text('utf-8')
newcss=(WEB/'assets/v51-quick-handoff.css').read_text('utf-8')
CONTACT='''<!doctype html><html lang="ko"><head><meta charset="utf-8"></head><body>
<section id="brief"><div class="workspace"><form id="brief-form">
<select name="industry"><option value="">미정</option><option value="manufacturing">제조</option><option value="academy">학원</option><option value="interior">시공</option></select>
<select name="goal"><option value="">미정</option><option value="lead">문의</option><option value="showcase">소개</option><option value="information">안내</option></select>
<select name="budget"><option value="unknown">미정</option><option value="under50">50미만</option><option value="50to100">50-100</option><option value="100to300">100-300</option><option value="over300">300이상</option></select>
<select name="timing"><option value="flexible">미정</option><option value="1month">1개월</option><option value="3months">3개월</option></select>
<input name="feature" value="catalog" type="checkbox"><input name="feature" value="quote" type="checkbox"><input name="feature" value="calendar" type="checkbox"><input name="feature" value="cms" type="checkbox"><input name="feature" value="portfolio" type="checkbox">
<textarea name="details" maxlength="700"></textarea><pre id="brief-output"></pre>
</form></div></section></body></html>'''
Q=[]
def ok(name,condition):
 Q.append({'test':name,'pass':bool(condition)});
 if not condition:print('FAIL',name)
MOCK='''() => {
 const cache=new Map();window.__cache=cache;
 Object.defineProperty(window,'sessionStorage',{configurable:true,value:{
   getItem:k=>cache.has(k)?cache.get(k):null,setItem:(k,v)=>cache.set(k,String(v)),removeItem:k=>cache.delete(k),get length(){return cache.size}
 }});
 window.__q='?industry=manufacturing';const Old=URLSearchParams;
 window.URLSearchParams=function(str){return new Old(str||window.__q)};
 document.addEventListener('click',e=>{if(e.target.closest('a'))e.preventDefault()},true);
}'''
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in (320,360,390,768,1280,1440):
  for sector,feature,expect in [('manufacturing','quote','quote'),('academy','schedule','calendar'),('interior','portfolio','portfolio')]:
   page=b.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(re.sub(r'<script[^>]+src="[^"]+"[^>]*></script>','',html))
   page.evaluate(MOCK);page.add_style_tag(content=css+newcss);page.add_script_tag(content=js);page.add_script_tag(content=new)
   page.locator(f'[name="industry"][value="{sector}"]').check()
   page.locator('[name=feature]').select_option(feature)
   page.locator('[name=scope]').select_option('medium')
   page.locator('[name=timing]').select_option('1개월 내 협의')
   page.locator('[name=budget]').select_option('100~300만원 검토')
   page.locator('[name=note]').fill('실제 문의 <script>alert(1)</script>')
   ok(f'{width} {sector} CTA visible',page.locator('#v51-to-detail').is_visible())
   ok(f'{width} {sector} no horizontal overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
   ok(f'{width} {sector} no JS errors',not errors)
   ok(f'{width} {sector} storage initially empty',page.evaluate('sessionStorage.length===0'))
   page.locator('#v51-to-detail').click()
   raw=page.evaluate('sessionStorage.getItem("afo.webstudio.v51.quickbrief")')
   item=json.loads(raw) if raw else {}
   ok(f'{width} {sector} handoff exact selection',item.get('industry')==sector and item.get('feature')==feature)
   ok(f'{width} {sector} no personal text in url','alert' not in page.locator('#v51-to-detail').get_attribute('href'))
   page.set_content(CONTACT)
   page.evaluate(f'window.__q="?source=quickv51&industry={sector}&theme=modern"')
   page.add_style_tag(content='*{box-sizing:border-box}body{margin:0}#brief{width:100%}.workspace{max-width:100%}form{max-width:100%;min-width:0}input,select,textarea{max-width:100%}#brief-output{white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%}')
   page.add_style_tag(content=newcss)
   page.add_script_tag(content="document.getElementById('brief-form').addEventListener('input',()=>document.getElementById('brief-output').textContent=document.querySelector('[name=details]').value)")
   page.add_script_tag(content=new)
   ok(f'{width} {sector} read-once removed',page.evaluate('sessionStorage.length===0'))
   ok(f'{width} {sector} receipt panel',page.locator('#v51-import').count()==1)
   ok(f'{width} {sector} selected industry',page.locator('[name=industry]').input_value()==sector)
   ok(f'{width} {sector} mapped feature',page.locator(f'[name=feature][value="{expect}"]').is_checked())
   ok(f'{width} {sector} budget',page.locator('[name=budget]').input_value()=='100to300')
   ok(f'{width} {sector} timing',page.locator('[name=timing]').input_value()=='1month')
   ok(f'{width} {sector} note preserved','실제 문의' in page.locator('[name=details]').input_value())
   ok(f'{width} {sector} HTML escaped',page.locator('#v51-import script').count()==0)
   ok(f'{width} {sector} contact preview refreshed','자료 규모:' in page.locator('#brief-output').inner_text())
   ok(f'{width} {sector} no overflow panel',page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
   page.set_content(CONTACT);page.add_script_tag(content=new)
   ok(f'{width} {sector} import not repeated',page.locator('#v51-import').count()==0)
   ok(f'{width} {sector} no errors after contact',not errors)
   page.close()
 for label,fix,expect in [
  ('expired','d.ts=Date.now()-1000000',False),('future','d.ts=Date.now()+120000',False),('wrong sector','d.industry="manufacturing"',False),
  ('invalid budget','d.budget="__proto__"',False),('invalid feature','d.feature="<img>"',False),
  ('long note','d.note="x".repeat(250)',False),('bad version','d.v=49',False),('invalid scope','d.scope="x"',False),
  ('control chars','control',False),('valid','',True)
 ]:
  page=b.new_page();page.set_content(CONTACT);page.evaluate(MOCK)
  page.evaluate('''(fix) => {const d={v:51,ts:Date.now(),industry:'academy',feature:'schedule',scope:'medium',timing:'미정·협의',budget:'미정·협의',note:'test'};
  if(fix==='d.ts=Date.now()-1000000')d.ts=Date.now()-1000000;
  else if(fix==='d.ts=Date.now()+120000')d.ts=Date.now()+120000;
  else if(fix==='d.industry="manufacturing"')d.industry='manufacturing';
  else if(fix==='d.budget="__proto__"')d.budget='__proto__';
  else if(fix==='d.feature="<img>"')d.feature='<img>';
  else if(fix==='d.note="x".repeat(250)')d.note='x'.repeat(250);
  else if(fix==='d.v=49')d.v=49;
  else if(fix==='d.scope="x"')d.scope='x';
  else if(fix==='control')d.note='a'+String.fromCharCode(10)+'b';
  sessionStorage.setItem('afo.webstudio.v51.quickbrief',JSON.stringify(d));window.__q='?source=quickv51&industry=academy';}''',fix)
  page.add_script_tag(content=new)
  ok(label+' accepted correctly',bool(page.locator('#v51-import').count())==expect)
  ok(label+' storage cleared',page.evaluate('sessionStorage.length===0'))
  page.close()
 b.close()
report={'release':'V51','source':'V49 full quick HTML+CSS+JS; isolated contact fixture and same-document sessionStorage shim, NOT live navigation','total':len(Q),'passed':sum(i['pass'] for i in Q),'failed':sum(not i['pass'] for i in Q),'results':Q,'real_live_navigation_verified':False,'real_email_receipt_verified':False}
(WEB/'qa/V51_BROWSER_QA_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
print(f'V51 Browser QA {report["passed"]}/{report["total"]} PASS')
sys.exit(bool(report['failed']))
