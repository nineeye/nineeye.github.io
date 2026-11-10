#!/usr/bin/env python3
"""Real public owner-origin HTTPS V91 assets, no POST or paid APIs."""
from __future__ import annotations
import argparse,datetime,json
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlsplit
CLOUDFLARE='https://allfileone-webstudio.pages.dev/'
PAGES='https://nineeye.github.io/webstudio/'
ALLOWED=(CLOUDFLARE,PAGES)
CHECKS=(
 ('V91 exact new customer page','quote-scope-v91.html',('WEBSTUDIO-V91-20261110','id="v91-industry"','id="v91-summary"','v91-quote.css','v91-quote.js')),
 ('V91 responsive CSS','assets/v91-quote.css',('.hero-grid','.work-grid','.preview-area','@media(max-width:740px)')),
 ('V91 functional script','assets/v91-quote.js',('AFO_V91_QUOTE_READY','v91-save','v91-copy','v91-reset','nineeyes@naver.com')),
 ('V91 compact homepage entry','index.html',('site-current-version','./quote-scope-v91.html','./start-project-v87.html')),
 ('V91 pre-contract process entry','project-process-v90.html',('WEBSTUDIO-V90-20261110','./quote-scope-v91.html')),
 ('V91 buyer inquiry entry','start-project-v87.html',('WEBSTUDIO-V87-20261110','./quote-scope-v91.html')),
 ('V91 sitemap listing','sitemap.xml',('quote-scope-v91.html','allfileone-webstudio.pages.dev')),
)
def norm(path):
 if path.endswith('/index.html'):path=path[:-10]
 elif path.endswith('.html'):path=path[:-5]
 return path.rstrip('/') or '/'
def fetch(origin,path):
 url=origin.rstrip('/')+'/'+path
 req=Request(url,headers={'User-Agent':'AFO-WebStudio-V91-ReadOnly/1','Cache-Control':'no-cache'})
 with urlopen(req,timeout=13) as resp:
  a,b=urlsplit(url),urlsplit(resp.geturl())
  if resp.status!=200 or (a.scheme,a.netloc)!=(b.scheme,b.netloc) or norm(a.path)!=norm(b.path):
   raise ValueError('HTTP/origin/route mismatch: '+resp.geturl()+' '+str(resp.status))
  blob=resp.read(2_000_001)
  if len(blob)>2_000_000:raise ValueError('asset response oversize')
  return blob.decode('utf-8-sig')
def check(origin=CLOUDFLARE,getter=None):
 if origin not in ALLOWED:raise ValueError('only two owned HTTPS origins permitted')
 getter=getter or (lambda p:fetch(origin,p))
 rows=[]
 for title,path,markers in CHECKS:
  try:
   html=getter(path)
   if isinstance(html,bytes):html=html.decode('utf-8-sig')
   missing=[x for x in markers if x not in html]
   rows.append({'title':title,'path':path,'status':'PASS' if not missing else 'HOLD','detail':'exact source markers' if not missing else 'missing '+repr(missing)[:200]})
  except Exception as e:rows.append({'title':title,'path':path,'status':'HOLD','detail':(type(e).__name__+': '+str(e))[:280]})
 passed=sum(x['status']=='PASS' for x in rows)
 return {'release':'WEBSTUDIO-V91-20261110','scope':'READ_ONLY_EXACT_PUBLIC_HTTPS_BODY','origin':origin,'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
         'status':'PASS_V91_PUBLIC_FILES_ONLY' if passed==len(rows) else 'HOLD_V91_PUBLIC','passed':passed,'total':len(rows),'rows':rows,
         'naver_mail_receipt':'NOT_VERIFIED','actual_signed_contract':'NOT_VERIFIED','real_payment':'NOT_IMPLEMENTED','paid_apis':0}
def save(r,out):
 out=Path(out);out.mkdir(parents=True,exist_ok=True)
 (out/'V91_PUBLIC.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n','utf-8')
 txt=['V91 올파일원 실제 공개 HTTPS 7개 파일 검사',r['origin'],r['status']+f" {r['passed']}/{r['total']}",'메일 실수신·계약·고객 PC 검증과 별개','']
 txt.extend(f"{x['status']} | {x['path']} | {x['detail']}" for x in r['rows'])
 (out/'V91_PUBLIC_KO.txt').write_text('\n'.join(txt)+'\n','utf-8-sig')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--origin',choices=ALLOWED,default=CLOUDFLARE);p.add_argument('--output',required=True);a=p.parse_args()
 r=check(a.origin);save(r,a.output);print(r['status'],f"{r['passed']}/{r['total']}");raise SystemExit(0 if r['status']=='PASS_V91_PUBLIC_FILES_ONLY' else 3)
