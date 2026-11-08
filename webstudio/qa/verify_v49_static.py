#!/usr/bin/env python3
"""V49 zero-dependency static inspection. Uses original package files."""
from __future__ import annotations
import json,re,sys
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'quick-inquiry.html').read_text('utf-8')
JS=(ROOT/'assets/v49-quick-inquiry.js').read_text('utf-8')
CSS=(ROOT/'assets/v49-quick-inquiry.css').read_text('utf-8')
ENTRY=(ROOT/'assets/v49-entry.css').read_text('utf-8')
RESULTS=[]
def verify(name,predicate):
 RESULTS.append({'name':name,'pass':bool(predicate)})
 if not predicate:print('FAIL:',name)
class Inspect(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.links=[];self.inputs=[];self.tags=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs);self.tags.append(tag)
  if d.get('id'):self.ids.append(d['id'])
  if tag in ('a','link','script'):self.links.append((tag,d.get('href') or d.get('src',''),d))
  if tag in ('input','textarea','select'):self.inputs.append((tag,d))
parser=Inspect();parser.feed(HTML)
verify('doctype',HTML.lstrip().startswith('<!doctype html>'))
verify('lang ko','<html lang="ko">' in HTML)
verify('viewport','name="viewport"' in HTML)
verify('correct canonical','rel="canonical" href="https://allfileone-webstudio.pages.dev/quick-inquiry.html"' in HTML)
verify('sensible title','<title>1분 홈페이지 제작 문의' in HTML)
verify('SEO description','name="description" content="' in HTML)
verify('no duplicate HTML IDs',len(parser.ids)==len(set(parser.ids)))
verify('required main',HTML.count('<main>')==1 and HTML.count('</main>')==1)
verify('main heading',HTML.count('<h1>')==1)
verify('no html form external submit',not re.search(r'<form[^>]*action=',HTML))
verify('CSS local',any(href=='./assets/v49-quick-inquiry.css' for _,href,_ in parser.links))
verify('JS local',any(href=='./assets/v49-quick-inquiry.js' for _,href,_ in parser.links))
verify('three known industries',all(f'value="{x}"' in HTML for x in ('manufacturing','academy','interior')))
verify('one checked by default',len(re.findall(r'<input[^>]+type="radio"[^>]+checked',HTML))==1)
verify('note capped', 'maxlength="240"' in HTML)
verify('input labeling',HTML.count('<label')>=6)
verify('real-email disclaimer','서버로 자동 전송되지' in HTML or '서버 자동 전송 없이' in HTML)
verify('copier has button', 'id="v49-copy" type="button"' in HTML)
verify('save has button', 'id="v49-download" type="button"' in HTML)
verify('mailto has button', 'id="v49-mailto" type="button"' in HTML)
verify('webmail uses noopener', 'target="_blank" rel="noopener noreferrer"' in HTML)
verify('receipt not fabricated','접수가 완료되었습니다' not in HTML)
verify('JS no network',all(x not in JS for x in ('fetch(', 'XMLHttpRequest', 'sendBeacon','WebSocket','EventSource')))
verify('JS no persistent storage',all(x not in JS for x in ('localStorage','sessionStorage','indexedDB','document.cookie')))
verify('JS no eval/innerHTML',all(x not in JS for x in ('eval(','innerHTML','new Function(')))
verify('JS safe DOM text', 'output.textContent=whole()' in JS)
verify('JS safe URL allowlist','if (has(DATA,urlValue))' in JS)
verify('JS native validity','form.checkValidity()' in JS)
verify('JS email URI cap','uri.length>1900' in JS)
verify('JS download and BOM','new Blob([' in JS and "'\\ufeff'" in JS)
verify('JS manual send statement','아직 접수되지 않았습니다' in JS)
verify('No third party stylesheet',not re.search(r'@import\s+url\(https?://',CSS))
verify('No remote font load',not re.search(r'@font-face\s*\{',CSS))
verify('CSS focus styles',':focus-visible' in CSS)
verify('CSS mobile layout','@media(max-width:640px)' in CSS)
verify('CSS reduced motion','prefers-reduced-motion' in CSS)
verify('Entry CSS mobile CTA','@media(max-width:570px)' in ENTRY)
verify('Entry CSS focus style',':focus-visible' in ENTRY)
verify('No outside images',not re.search(r'url\(https?://',CSS+ENTRY))
result={'release':'V49','total':len(RESULTS),'passed':sum(x['pass'] for x in RESULTS),'failed':sum(not x['pass'] for x in RESULTS),'results':RESULTS,'scope':'Python stdlib static code/markup checks only'}
(ROOT/'qa/V49_STATIC_QA_RESULTS.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f"V49 static {result['passed']}/{result['total']}")
sys.exit(int(result['failed']!=0))
