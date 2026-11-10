#!/usr/bin/env python3
"""V90 real owner origin exact HTTPS asset body proof; no customer data or API cost."""
from __future__ import annotations
import argparse,datetime,json
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlsplit
CLOUDFLARE='https://allfileone-webstudio.pages.dev/'
PAGES='https://nineeye.github.io/webstudio/'
ALLOWED=(CLOUDFLARE,PAGES)
CHECKS=(
 ('V90 full customer scope page','project-process-v90.html',('WEBSTUDIO-V90-20261110','id="v90-checklist"','id="v90-request"','assets/v90-process.js')),
 ('V90 own styles','assets/v90-process.css',('.intro-grid','.work-grid','.package-grid','.v90-check')),
 ('V90 own interactions','assets/v90-process.js',('AFO_V90_PROCESS_READY','v90-copy-area','AllFileOne_V90_','v90-progress')),
 ('V90 main-home entry link','index.html',('WEBSTUDIO-V89-20261110','./project-process-v90.html','./start-project-v87.html')),
 ('V90 V87 consultation entry link','start-project-v87.html',('WEBSTUDIO-V87-20261110','./project-process-v90.html','v88-mail-fallback.js')),
 ('V90 sitemap announcement','sitemap.xml',('project-process-v90.html','allfileone-webstudio.pages.dev')),
)
def norm(path):
 if path.endswith('/index.html'):path=path[:-10]
 elif path.endswith('.html'):path=path[:-5]
 return path.rstrip('/') or '/'
def get(origin,path):
 expected=origin.rstrip('/')+'/'+path
 req=Request(expected,headers={'User-Agent':'AFO-WebStudio-V90-ReadOnly/1','Cache-Control':'no-cache'})
 with urlopen(req,timeout=13) as resp:
  a,b=urlsplit(expected),urlsplit(resp.geturl())
  if resp.status!=200 or (a.scheme,a.netloc)!=(b.scheme,b.netloc) or norm(a.path)!=norm(b.path):raise ValueError('HTTP/source/path mismatch: '+resp.geturl()+' '+str(resp.status))
  data=resp.read(2_000_001)
  if len(data)>2_000_000:raise ValueError('over-sized response')
  return data.decode('utf-8-sig')
def check(origin=CLOUDFLARE,getter=None):
 if origin not in ALLOWED:raise ValueError('only owner-controlled HTTPS origins')
 getter=getter or (lambda p:get(origin,p))
 records=[]
 for name,path,markers in CHECKS:
  try:
   body=getter(path)
   if isinstance(body,bytes):body=body.decode('utf-8-sig')
   missing=[m for m in markers if m not in body]
   state='PASS' if not missing else 'HOLD'
   reason='exact HTTPS body markers' if not missing else 'missing: '+str(missing)[:140]
  except Exception as ex:state='HOLD';reason=type(ex).__name__+': '+str(ex)[:210]
  records.append({'check':name,'path':path,'status':state,'detail':reason})
 passed=sum(r['status']=='PASS' for r in records)
 return {'version':'WEBSTUDIO-V90-20261110','scope':'LIVE_HTTPS_FILES_ONLY','origin':origin,'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'passed':passed,'total':len(CHECKS),'status':'PASS_V90_PUBLIC_FILES_ONLY' if passed==len(CHECKS) else 'HOLD_V90_PUBLIC','records':records,'customer_mail_received':'NOT_VERIFIED','real_contracts':'NOT_VERIFIED','cloudflare_sha':'NOT_VERIFIED','paid_api':0}
def save(r,out):
 out=Path(out);out.mkdir(parents=True,exist_ok=True)
 (out/'V90_PUBLIC_FILES.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n','utf-8')
 (out/'V90_PUBLIC_FILES_KO.txt').write_text('올파일원 V90 실제 공개 HTTPS 검사\n'+r['origin']+'\n'+r['status']+f" {r['passed']}/{r['total']}\n"+'실제 고객 이메일 수신·계약·개인 PC 직접 검증 아님\n'+'\n'.join(x['status']+' '+x['path']+' '+x['detail'] for x in r['records'])+'\n','utf-8-sig')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--origin',choices=ALLOWED,default=CLOUDFLARE);p.add_argument('--output',required=True);a=p.parse_args()
 r=check(a.origin);save(r,a.output);print(r['status'],str(r['passed'])+'/'+str(r['total']));raise SystemExit(0 if r['status']=='PASS_V90_PUBLIC_FILES_ONLY' else 3)
