#!/usr/bin/env python3
"""Validate all direct relative dependency URLs from new V52 pages against package/new known repo files."""
import json
from pathlib import Path
from html.parser import HTMLParser
class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,name,attrs):
        if name in ("link","script","a","img"):self.links.append((name,dict(attrs)))
root=Path(__file__).resolve().parents[1]
existing={'assets/favicon.svg','for-manufacturing.html','for-academy.html','for-interior.html','quick-inquiry.html'}
checks=[]
for id in ('manufacturing','academy','interior'):
    doc=root/'flagship'/f'{id}.html'
    soup=Links();soup.feed(doc.read_text('utf-8'))
    for name,node in soup.links:
        key='href' if name in ('link','a') else 'src'
        uri=node.get(key)
        if not uri or uri.startswith(('#','http:','https:','mailto:')):continue
        relative=uri.split('#')[0].split('?')[0]
        dest=(doc.parent/relative).resolve()
        if dest.is_file():passed=True
        else:passed=dest.relative_to(root.resolve()).as_posix() in existing
        checks.append({'name':f'{id} {name} {relative}', 'pass':passed})
report={'release':'V52','total':len(checks),'passed':sum(x['pass'] for x in checks),'failed':sum(not x['pass'] for x in checks),'results':checks}
(root/'qa/V52_LINK_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('LINKS',report['passed'],'/',report['total'])
raise SystemExit(bool(report['failed']))
