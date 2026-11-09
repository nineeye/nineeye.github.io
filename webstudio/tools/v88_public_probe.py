#!/usr/bin/env python3
"""V88 fail-closed 9 actual HTTPS published file bodies, no mail/network POST."""
from __future__ import annotations
import argparse,datetime as dt,json,sys
from pathlib import Path
from v85_public_probe import actual_get,ALLOWED_ORIGINS,PRODUCTION_ORIGIN
CHECKS=(
 ('customer brief with fallback','start-project-v87.html',('id="v88-copy-to"','id="v88-copy-subject"','id="v88-copy-body"','v88-mail-fallback.js','v88-mail-fallback.css','nineeyes@naver.com')),
 ('no-email-send fallback logic','assets/v88-mail-fallback.js',('AFO_V88_MANUAL_MAIL_READY','v88-copy-to','v88-copy-body','Ctrl+C','nineeyes@naver.com')),
 ('fallback CSS','assets/v88-mail-fallback.css',('.v88-fallback','.v88-copy-manual','@media(max-width:480px)')),
 ('owner interactive 30 checklist','launch-readiness-v88.html',('data-v88="V88-20261110"','data-v88-check="1-1"','data-v88-check="5-4"','v88-test-email','noindex,nofollow,noarchive')),
 ('owner checklist JS','assets/v88-launch-check.js',('AFO_V88_LAUNCH_READY','AFO_V88_LAUNCH_REPORT','v88-download','v88-clear','미확인')),
 ('owner CSS','assets/v88-launch-check.css',('.v88-hero','.v88-group','.v88-check','@media(max-width:520px)')),
 ('existing technical ops link','ops-check.html',('launch-readiness-v88.html','ops-check.js')),
 ('customer contact fallback','contact.html',('start-project-v87.html#v88-helper-heading','nineeyes@naver.com')),
 ('V88 scope policy handoff','README_V88_KO.md',('실제 메일 수신','수동 확인','검증')),
)
def check(origin=PRODUCTION_ORIGIN,getter=None):
 if origin not in ALLOWED_ORIGINS:raise ValueError('Origin not allowlisted')
 if getter is None:getter=lambda path:actual_get(origin,path)
 rows=[]
 for name,path,markers in CHECKS:
  try:
   body=getter(path);missing=[x for x in markers if x not in body];ok=not missing;info='Exact source body markers' if ok else 'Missing '+repr(missing)
  except Exception as e:ok=False;info=type(e).__name__+': '+str(e)
  rows.append({'name':name,'path':path,'pass':ok,'reason':info[:320]})
 n=sum(x['pass'] for x in rows)
 return {'version':'V88','origin':origin,'checked_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
   'status':'PASS_V88_PUBLIC_FILES_ONLY' if n==len(rows) else 'HOLD_V88_PUBLIC_FILES','passed':n,'total':len(rows),
   'rows':rows,'mail_sent':'NOT_TESTED','mail_received':'NOT_VERIFIED','contracted_customer':'NOT_VERIFIED','paid_api_calls':0}
def report(out,r):
 out=Path(out);out.mkdir(parents=True,exist_ok=True)
 (out/'AFO_V88_PUBLIC_FILES.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n','utf-8')
 (out/'AFO_V88_PUBLIC_FILES_KO.txt').write_text('\n'.join(['V88 실제 공개 HTTPS 본문 무변경 검사','대상: '+r['origin'],'결과: '+r['status'],f"파일 검사 {r['passed']}/{r['total']}",'실제 네이버 메일 송수신/계약/납품은 미검증.','']+[x['path']+' : '+x['reason'] for x in r['rows'] if not x['pass']])+'\n','utf-8-sig')
def main():
 p=argparse.ArgumentParser();p.add_argument('--origin',choices=ALLOWED_ORIGINS,default=PRODUCTION_ORIGIN);p.add_argument('--output',type=Path,required=True);a=p.parse_args();r=check(a.origin);report(a.output,r);print(r['status'],str(r['passed'])+'/'+str(r['total']));return 0 if r['passed']==r['total'] else 3
if __name__=='__main__':sys.exit(main())
