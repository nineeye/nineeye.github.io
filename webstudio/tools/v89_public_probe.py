#!/usr/bin/env python3
"""V89 strict read-only real HTTPS release proof (not screenshots, email or sales)."""
from __future__ import annotations
import argparse,datetime,json
from pathlib import Path
from urllib.request import urlopen,Request
from urllib.parse import urlsplit

CLOUDFLARE='https://allfileone-webstudio.pages.dev/'
GITHUB_PAGES='https://nineeye.github.io/webstudio/'
ALLOWED=(CLOUDFLARE,GITHUB_PAGES)
PNG=b'\x89PNG\r\n\x1a\n'
WEBP=b'RIFF'
CHECKS=(
 ('V89 홈페이지','index.html',('WEBSTUDIO-V89-20261110','./start-project-v87.html','./experience-v85.html','./assets/v89-home.css')),
 ('V89 단순화 디자인','assets/v89-home.css',('.hero-grid','.sample-grid','.sector-selector','.nav-cta')),
 ('V89 12업종 변경 엔진','assets/v89-home.js',('AFO_V89_HOME_READY','v89-sector-demo','v89-sector-guide')),
 ('제조업 원본 캡처','assets/v89-preview-manufacturing.webp',WEBP),
 ('학원 원본 캡처','assets/v89-preview-academy.webp',WEBP),
 ('인테리어 원본 캡처','assets/v89-preview-interior.webp',WEBP),
 ('공유 1200x630 카드','assets/v89-social-card.png',PNG),
 ('이전 긴 홈 보관','home-archive-v88.html',('noindex,nofollow','v22-home')),
 ('실제 HTML 비교','experience-v85.html',('WEBSTUDIO-V85-20261109','v85-sector')),
 ('실제 제작 문의','start-project-v87.html',('WEBSTUDIO-V87-20261110','v88-mail-fallback.js')),
)
def normalized(path):
 if path.endswith('/index.html'):path=path[:-10]
 elif path.endswith('.html'):path=path[:-5]
 return path.rstrip('/') or '/'
def get_public(origin,path):
 req_url=origin.rstrip('/')+'/'+path
 req=Request(req_url,headers={'User-Agent':'AFO-V89-Public-ReadOnly/1','Cache-Control':'no-cache'})
 with urlopen(req,timeout=14) as r:
  a,b=urlsplit(req_url),urlsplit(r.geturl())
  if r.status!=200 or (a.scheme,a.netloc)!=(b.scheme,b.netloc) or normalized(a.path)!=normalized(b.path):
   raise RuntimeError('not exact 200: '+r.geturl()+': '+str(r.status))
  body=r.read(3_000_001)
  if len(body)>3_000_000:raise RuntimeError('response exceeds size cap')
  return body
def check(getter=None,origin=CLOUDFLARE):
 if origin not in ALLOWED:raise ValueError('Only owner-controlled HTTPS origins allowed')
 getter=getter or (lambda p:get_public(origin,p))
 records=[]
 for name,path,markers in CHECKS:
  try:
   body=getter(path)
   if isinstance(markers,bytes):ok=body.startswith(markers) and (markers!=WEBP or body[8:12]==b'WEBP')
   else:
    data=body.decode('utf-8-sig')
    ok=all(marker in data for marker in markers)
   state='PASS' if ok else 'HOLD'
   reason='correct origin/path/status and body' if ok else 'content marker mismatch or 200-homepage-fallback'
  except Exception as e:state='HOLD';reason=type(e).__name__+': '+str(e)[:180]
  records.append({'name':name,'path':path,'state':state,'reason':reason})
 passed=sum(x['state']=='PASS' for x in records)
 return {'scope':'V89_REAL_PUBLIC_HTTPS_10_EXACT_FILES_NO_CUSTOMER','origin':origin,'timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'status':'PASS_V89_PUBLIC_FILES_ONLY' if passed==len(CHECKS) else 'HOLD_V89_PUBLIC','passed':passed,'total':len(CHECKS),'records':records,
  'email_received':'NOT_VERIFIED','paid_api_calls':0,'clicks':'SEPARATE_EDGE_BROWSER_TEST','cloudflare_git_commit':'NOT_VERIFIED'}
def save(report,output):
 out=Path(output);out.mkdir(parents=True,exist_ok=True)
 (out/'V89_PUBLIC_ASSETS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf-8')
 lines=['올파일원 웹스튜디오 V89 실제 공개 HTTPS 파일 증거','사이트: '+report['origin'],'결과: '+report['status'],f"통과: {report['passed']}/{report['total']}",
 '실제 고객 문의 수신·계약·Cloudflare Production SHA·실제 GUI 클릭은 별도 확인','']
 lines += [r['state']+' '+r['path']+' '+r['reason'] for r in report['records']]
 (out/'V89_PUBLIC_ASSETS_KO.txt').write_text('\n'.join(lines)+'\n','utf-8-sig')
def main():
 p=argparse.ArgumentParser();p.add_argument('--output',required=True);p.add_argument('--origin',choices=ALLOWED,default=CLOUDFLARE);a=p.parse_args()
 r=check(origin=a.origin);save(r,a.output);print(r['status'],f"{r['passed']}/{r['total']}")
 return 0 if r['status']=='PASS_V89_PUBLIC_FILES_ONLY' else 3
if __name__=='__main__':raise SystemExit(main())
