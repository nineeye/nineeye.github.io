#!/usr/bin/env python3
"""V52 static+source+link scope assertions, no live network."""
from pathlib import Path
import json,re,subprocess
from html.parser import HTMLParser
class Tags(HTMLParser):
    def __init__(self): super().__init__();self.tags=[]
    def handle_starttag(self,name,attrs): self.tags.append((name,dict(attrs)))
    def find_all(self,name): return [a for n,a in self.tags if n==name]
    def find_one(self,name,attr,value): return next((a for n,a in self.tags if n==name and a.get(attr)==value),None)
ROOT=Path(__file__).resolve().parents[1];report=[]
def check(name,cond):
    report.append({'name':name,'pass':bool(cond)})
    if not cond:print('FAIL',name)
for sector in ('manufacturing','academy','interior'):
    p=ROOT/'flagship'/f'{sector}.html';s=p.read_text('utf-8');soup=Tags();soup.feed(s)
    check(sector+' HTML parsed',len(soup.find_all('html'))==1 and len(soup.find_all('head'))==1)
    check(sector+' unique title',len(soup.find_all('title'))==1 and len(re.search(r'<title>([^<]+)</title>',s).group(1))>10)
    check(sector+' noindex truthful',(soup.find_one('meta','name','robots') or {}).get('content')=='noindex,follow')
    check(sector+' own JS loaded',any('v52-'+sector+'.js' in (el.get('src') or '') for el in soup.find_all('script')))
    check(sector+' no external script',not any(str(el.get('src','')).startswith('http') for el in soup.find_all('script')))
    check(sector+' no external image',not any(str(el.get('src','')).startswith('http') for el in soup.find_all('img')))
    check(sector+' no form with server action',not any(el.get('action') for el in soup.find_all('form')))
    check(sector+' user-facing fictional disclosure','가상' in s)
    check(sector+' back link',any('../for-'+sector+'.html'==a.get('href') for a in soup.find_all('a')))
    check(sector+' studio inquiry',any('quick-inquiry.html?industry='+sector in (a.get('href') or '') for a in soup.find_all('a')))
    check(sector+' single body',len(soup.find_all('body'))==1)
    check(sector+' unique IDs',len([x.get('id') for n,x in soup.tags if x.get('id')])==len(set(x.get('id') for n,x in soup.tags if x.get('id'))))
    js=(ROOT/'assets'/f'v52-{sector}.js').read_text('utf-8')
    check(sector+' no network APIs',all(tok not in js for tok in ('fetch(', 'XMLHttpRequest','sendBeacon','localStorage','eval(','new Function(')))
    check(sector+' no embedded mail recipient',not re.search(r'[\w.]+@[\w.]+\.[a-z]{2,}',js))
    check(sector+' Node syntax',subprocess.run(['node','--check',str(ROOT/'assets'/f'v52-{sector}.js')],capture_output=True).returncode==0)
for path in [ROOT/'assets/v52-flagship.css',ROOT/'assets/v52-showcase-entry.css']:
    check(path.name+' nonempty',path.stat().st_size>300)
    check(path.name+' no external imports','@import' not in path.read_text('utf-8'))
css=(ROOT/'assets/v52-flagship.css').read_text('utf-8')
for token in ['.manufacturing','.academy','.interior','.m-product','.a-course','.i-compare-art','@media(max-width:480px)']:
    check('distinct CSS '+token,token in css)
# Different scopes: not one generic grid or same feature keys
checks={'manufacturing':['m-group','m-material','m-selected'],'academy':['a-course-grid','a-day-list','a-conflicts'],'interior':['i-projects','i-range','i-form']}
for sector,anchors in checks.items():
    source=(ROOT/'flagship'/f'{sector}.html').read_text('utf-8')
    for anchor in anchors:check(sector+' distinct '+anchor,'id="'+anchor+'"' in source)
results={'release':'V52','scope':'three independent sample sites, explicit fake-data, preserved gallery integration done via patch','total':len(report),'passed':sum(x['pass'] for x in report),'failed':sum(not x['pass'] for x in report),'results':report}
(ROOT/'qa'/'V52_STATIC_RESULTS.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print('STATIC',results['passed'],'/',results['total']);raise SystemExit(bool(results['failed']))
