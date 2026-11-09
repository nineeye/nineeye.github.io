#!/usr/bin/env python3
"""Find broken local HTML anchors/resources with no web/DNS requests."""
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import unquote,urlsplit
import json
root=Path(__file__).resolve().parents[1]
pages=list(root.rglob('*.html'));links=0;missing=[]
for page in pages:
 s=BeautifulSoup(page.read_text('utf-8'),'html.parser')
 for el in s.find_all(True):
  for attr in ('href','src'):
   ref=el.get(attr)
   if not ref or ref.startswith(('http:','https:','mailto:','tel:','data:','javascript:','blob:','//','#')):continue
   p=urlsplit(ref).path
   if not p:continue
   if p.startswith('/'):
    target=root/p.lstrip('/')
   else:target=(page.parent/unquote(p)).resolve()
   links+=1
   if not target.exists():missing.append({'page':str(page.relative_to(root)),'link':ref})
report={'html_pages':len(pages),'local_links':links,'missing':missing}
out=root.parent/'EVIDENCE/V77_STATIC_LINK_AUDIT.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(report,indent=2,ensure_ascii=False),'utf-8')
print('HTML',len(pages),'links',links,'missing',len(missing))
if missing:print(missing[:20]);raise SystemExit(1)