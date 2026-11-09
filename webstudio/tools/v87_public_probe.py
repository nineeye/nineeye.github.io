#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V87 strict public body GET proof, Cloudflare and independent GitHub Pages."""
from __future__ import annotations
import argparse,datetime as dt,json,sys
from pathlib import Path
from v85_public_probe import actual_get,ALLOWED_ORIGINS,PRODUCTION_ORIGIN
SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')
CHECKS=(
 ('V87 new page','start-project-v87.html',('data-v87="WEBSTUDIO-V87-20261110"','v87-features','v87-email','v87-report','assets/v87-inquiry.js')),
 ('V87 CSS','assets/v87-inquiry.css',('.feature-grid','.request-card','.current-selection','@media(max-width:700px)')),
 ('V87 action JS','assets/v87-inquiry.js',('AFO_V87_INQUIRY_READY','v87-email','v87-save','v87-copy','nineeyes@naver.com')),
 ('home entry','index.html',('start-project-v87.html','WEBSTUDIO')),
 ('V85 entry','experience-v85.html',('start-project-v87.html','data-v85="WEBSTUDIO-V85-20261109"')),
 ('V81 deep scoping','feature-scope-v81.html',('start-project-v87.html','v81')),
 ('plans','plan-guide.html',('start-project-v87.html','29')),
 ('customer contact','contact.html',('start-project-v87.html','nineeyes@naver.com')),
 ('industry hub','industry-guide/index.html',('start-project-v87.html','manufacturing')),
 ('site map','sitemap.xml',('start-project-v87.html','industry-guide/manufacturing.html')),
 ('V86 dynamic handoff','assets/v86-guide.js',('v87-start','start-project-v87.html')),
) + tuple((k+' guide', 'industry-guide/'+k+'.html',('id="v87-start"','start-project-v87.html?industry='+k,'data-v86-industry="'+k+'"')) for k in SECTORS)

def run(origin=PRODUCTION_ORIGIN,getter=None):
 if origin not in ALLOWED_ORIGINS:raise ValueError('Unapproved public origin')
 if getter is None:getter=lambda path:actual_get(origin,path)
 rows=[]
 for label,path,markers in CHECKS:
  try:
   body=getter(path);missing=[m for m in markers if m not in body]
   ok=not missing;reason='exact published source markers' if ok else 'Missing: '+repr(missing)
  except Exception as exc:ok=False;reason=type(exc).__name__+': '+str(exc)
  rows.append({'name':label,'path':path,'pass':ok,'detail':reason[:260]})
 good=sum(r['pass'] for r in rows)
 return {'version':'V87','origin':origin,'time_utc':dt.datetime.now(dt.timezone.utc).isoformat(),
  'status':'PASS_V87_PUBLIC_FILE_BODIES_ONLY' if good==len(rows) else 'HOLD_V87_PUBLIC_FILES',
  'passed':good,'total':len(rows),'rows':rows,'real_customer_email':'NOT_VERIFIED',
  'booking_payment_database':'NOT_IMPLEMENTED','paid_api_calls':0}

def write(r,folder):
 folder=Path(folder);folder.mkdir(parents=True,exist_ok=True)
 (folder/'AFO_V87_PUBLIC.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n','utf8')
 s=['올파일원 웹스튜디오 V87 실제 공개 HTTP 본문 검사','결과: '+r['status'],
  '대상: '+r['origin'],f"통과: {r['passed']}/{r['total']}",
  '※ 고객 이메일 실수신, 계약, 결제 검증이 아닙니다.','']+[x['path']+' | '+x['detail'] for x in r['rows'] if not x['pass']]
 (folder/'AFO_V87_PUBLIC_KO.txt').write_text('\n'.join(s)+'\n','utf-8-sig')

def main(argv=None):
 p=argparse.ArgumentParser();p.add_argument('--output',required=True,type=Path)
 p.add_argument('--origin',choices=ALLOWED_ORIGINS,default=PRODUCTION_ORIGIN)
 args=p.parse_args(argv);r=run(args.origin);write(r,args.output)
 print(r['status'],str(r['passed'])+'/'+str(r['total']))
 return 0 if r['passed']==r['total'] else 3
if __name__=='__main__':sys.exit(main())
