#!/usr/bin/env python3
"""Safe, offline, idempotent V48 patch for a V47 WebStudio source checkout."""
from __future__ import annotations
import argparse,json,shutil,tempfile
from pathlib import Path
REL_FILES=('assets/v48-sales-audit.js','assets/v48-sales-audit.css',
           'docs/V48_SALES_FFUNNEL_QA_KO.md','qa/test_v48_sales_audit.py',
           'qa/test_v48_static.py','qa/V48_QA_RESULTS.json')
LINK='<link rel="stylesheet" href="assets/v48-sales-audit.css">'
SCRIPT='<script defer src="assets/v48-sales-audit.js"></script>'
META='<meta name="webstudio-release-v48" content="WEBSTUDIO-V48-20261108">'
SECTION='<section class="body-section" aria-label="최신 판매 동선 진단"><div class="wrap"><div id="v48-sales-audit"></div></div></section>'

def patch(target:Path,package:Path)->dict:
    web=target/'webstudio';src=package/'webstudio'
    page=web/'site-check.html';manifest=web/'assets/current-release.json';packet=web/'assets/v47-mail-packet.js'
    if not all(x.is_file() for x in (page,manifest,packet)):
        raise RuntimeError('V47 checkout prerequisites absent. No modification made.')
    html=page.read_text(encoding='utf-8');data=json.loads(manifest.read_text(encoding='utf-8'))
    if data.get('version') not in ('V47','V48') or data.get('product')!='AllFileOne WebStudio':
        raise RuntimeError('Unexpected release manifest, V47 or V48 required. No modification made.')
    if '<head>' not in html or '</head>' not in html or '</main>' not in html or 'id="run-quick"' not in html:
        raise RuntimeError('Unknown site-check layout. No modification made.')
    if not all((src/r).is_file() for r in REL_FILES):
        raise RuntimeError('V48 package incomplete. No modification made.')
    for tag in (LINK,SCRIPT,META):
        if tag not in html:html=html.replace('</head>',tag+'\n</head>',1)
    if 'id="v48-sales-audit"' not in html:
        html=html.replace('</main>',SECTION+'\n</main>',1)
    # Stage all updates in-memory before changing source files.
    data.update({'version':'V48','release_id':'WEBSTUDIO-V48-20261108','release_date':'2026-11-08',
      'previous_release':'V47',
      'release_note':'Read-only, no-cost V48 live public sales funnel audit on site-check. 16 static retrieval/content checks, TXT report, Naver/Google links. V47 client inquiry preserved.',
      'verification':'V48_ISOLATED_BROWSER_QA_PASS; V48_CLOUDFLARE_PENDING; REAL_EMAIL_RECEIPT_NOT_TESTED; SEARCH_INDEX_NOT_TESTED',
      'sales_audit_url':'/site-check.html#v48-sales-audit',
      'sales_audit_public_checks':16,'sales_audit_no_auth_or_personal_data':True})
    payload=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
    # Copy source additions first; then write only two integration files.
    for rel in REL_FILES:
        to=web/rel;to.parent.mkdir(parents=True,exist_ok=True)
        content=(src/rel).read_bytes()
        if not to.exists() or to.read_bytes()!=content:to.write_bytes(content)
    for to,content in ((page,html),(manifest,payload),(web/'assets/release-v48.json',payload)):
        if not to.exists() or to.read_text(encoding='utf-8')!=content:to.write_text(content,encoding='utf-8')
    return {'release':'V48','new_assets':len(REL_FILES),'latest_manifest':'V48','site_check_added':html.count('id="v48-sales-audit"')==1}
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--target-root',type=Path,required=True)
    ap.add_argument('--package-root',type=Path,default=Path(__file__).resolve().parents[2]);a=ap.parse_args()
    print(json.dumps(patch(a.target_root,a.package_root),ensure_ascii=False))
