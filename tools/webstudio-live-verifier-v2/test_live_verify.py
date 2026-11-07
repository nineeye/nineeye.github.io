"""Deterministic, offline, mock-HTTP regression for LiveVerifier V2."""
import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import zipfile
import live_verify as m


def response(text,ctype='text/plain',status=200):
    return {'ok':status==200,'status':status,'text':text,'content_type':ctype,
            'sha256':hashlib.sha256(text.encode('utf-8')).hexdigest(),
            'elapsed_ms':1}


def release(v):
    return json.dumps({'product':'AllFileOne WebStudio','version':v,'release_id':f'WEBSTUDIO-{v}-20261107'},ensure_ascii=False)


def setup(*, github_v='V33',public_v='V33',missing=(),tamper=False,
          inaccessible_github=False,all_demos=True,malformed_asset=False,preview=True):
    mapping={}
    def add(url,text,ctype='text/plain'):
        mapping[url]=response(text,ctype)
    if not inaccessible_github:add(m.GITHUB_ROOT+'assets/current-release.json',release(github_v),'application/json')
    add(m.PRODUCTION+'assets/current-release.json',release(public_v),'application/json')
    add(m.PRODUCTION+f'assets/release-{public_v.lower()}.json',release(public_v),'application/json')
    main=f'''<!doctype html><html><head><meta name="webstudio-release" content="WEBSTUDIO-{public_v}-20261107">
    <script src="assets/v33-estimate-model.js"></script><script src="assets/version-badge.js"></script>
    <link rel="stylesheet" href="assets/v33-estimate.css"></head>
    <body><strong id="site-current-version">{public_v}</strong></body></html>'''
    contact='''<!doctype html><html><head><script src="assets/v26-contact.js"></script></head>
    <body><form id="brief-form"></form></body></html>'''
    add(m.PRODUCTION+'index.html',main,'text/html')
    add(m.PRODUCTION+'contact.html',contact,'text/html')
    add(m.PRODUCTION+'site-check.html','<html><script src="assets/v25-audit.js"></script></html>','text/html')
    js='window.WEBSTUDIO_ESTIMATE_MODEL = { calculate:true, parse:true };'
    add(m.PRODUCTION+'assets/v33-estimate-model.js', '<html>200 fallback</html>' if malformed_asset else ('// tampered\n'+js if tamper else js),'text/javascript')
    add(m.GITHUB_ROOT+'assets/v33-estimate-model.js',js,'text/javascript')
    add(m.PRODUCTION+'assets/version-badge.js','/* version badge */','application/javascript')
    add(m.PRODUCTION+'assets/v33-estimate.css','.v33{color:red}','text/css')
    add(m.PRODUCTION+'assets/v26-contact.js','/* form JS */','text/javascript')
    if all_demos:
        for industry in m.INDUSTRIES:
            for style in m.STYLES:
                add(m.PRODUCTION+f'demo/{industry}/{style}/index.html','<html><script src="assets/demo.js"></script></html>','text/html')
    for label,url in m.ALTERNATES:
        add(url+'assets/current-release.json',release('V32'),'application/json')
    cloudflare_comment=[{'user':{'login':'cloudflare-workers-and-pages[bot]'},
        'body':'''## Deploying allfileone-webstudio\nLatest commit: <code>ece1be7</code> Status: ✅ Deploy successful!\nPreview URL: https://3d945038.allfileone-webstudio.pages.dev''',
        'html_url':'https://github.com/nineeye/nineeye.github.io/pull/24#issuecomment-1'}] if preview else []
    add(m.GITHUB_API+'pulls?state=closed&sort=updated&direction=desc&per_page=8',
        json.dumps([{'number':25,'merged_at':'2026-11-07T13:00:00Z'},
                    {'number':24,'merged_at':'2026-11-07T12:00:00Z'}]),'application/json')
    add(m.GITHUB_API+'issues/24/comments?per_page=100',json.dumps(cloudflare_comment),'application/json')
    add(m.GITHUB_API+'issues/25/comments?per_page=100','[]','application/json')
    for x in missing:mapping.pop(m.PRODUCTION+x,None)
    def fetch(url,nonce):
        return mapping.get(url,{'ok':False,'status':404,'error':'mock deliberately absent'})
    return fetch


def run():
    records=[]
    def check(name,actual,expected):
        if actual!=expected:raise AssertionError(f'{name}: actual={actual!r}, expected={expected!r}')
        records.append(name+' PASS')
    current=m.inspect(fetch=setup(),all_demos=True)
    check('V33 source-verified',current['status'],'VERIFIED_CURRENT_STATIC')
    check('V33 36 demo routes + dynamic scripts',current['checks_total'],45)  # 5 + 36 + 4 discovered
    check('V33 all route passes',current['checks_passed'],45)
    check('GitHub expected trusted',current['github_expected_authoritative'],True)
    pr24=next(x for x in current['cloudflare_pr_preview_evidence'] if x['pr']==24)
    check('Cloudflare preview recorded',pr24['previews'][0]['preview_success'],True)
    check('Preview not production',pr24['previews'][0]['proof_scope'],'PR_PREVIEW_ONLY_NOT_PRODUCTION')
    check('Other URLs not production',all(x['production_attestation']==False for x in current['alternate_paths']),True)
    check('Auto discovers current script',any(x['path']=='assets/v33-estimate-model.js' for x in current['checks']),True)
    check('Source JS bytes match',any(x['path']=='assets/v33-estimate-model.js' and x['match'] is True for x in current['source_byte_comparison']),True)

    future=m.inspect(fetch=setup(github_v='V34',public_v='V34'),all_demos=False)
    check('Automatically supports V34 next release',future['status'],'VERIFIED_CURRENT_STATIC')
    check('V34 public manifest inspected',future['checked_static_version'],'V34')
    stale=m.inspect(fetch=setup(github_v='V34',public_v='V33'),all_demos=False)
    check('Old public version correctly identified',stale['status'],'VERSION_MISMATCH')
    check('Public release preserved',stale['production_declared_version'],'V33')
    check('GitHub release newer',stale['github_expected_version'],'V34')

    fallback=m.inspect(fetch=setup(inaccessible_github=True),all_demos=False)
    check('No false latest when GitHub unreadable',fallback['status'],'STATIC_HEALTH_OK_EXPECTED_UNVERIFIED')
    check('Fallback expected untrusted',fallback['github_expected_authoritative'],False)

    mismatch=m.inspect(fetch=setup(tamper=True),all_demos=False)
    check('Tampered JS compared byte-for-byte',mismatch['status'],'SOURCE_BYTES_MISMATCH')
    invalid_asset=m.inspect(fetch=setup(malformed_asset=True),all_demos=False)
    check('HTML fallback masquerading as JavaScript rejected',invalid_asset['status'],'PARTIAL_OR_BROKEN')
    check('Source comparison still flagged',any(x['match'] is False for x in invalid_asset['source_byte_comparison']),True)

    missing=m.inspect(fetch=setup(missing=['assets/v33-estimate-model.js']),all_demos=False)
    check('Required asset 404 rejected',missing['status'],'PARTIAL_OR_BROKEN')
    no_network=lambda u,n:{'ok':False,'status':0,'error':'DNS/TLS prevented'}
    blocked=m.inspect(fetch=no_network,all_demos=False)
    check('Network failure never called deployed',blocked['status'],'PRODUCTION_UNREACHABLE_OR_INVALID')
    check('No fake GitHub verification on failure',blocked['github_expected_authoritative'],False)

    main_html='''<html><script src="assets/app.js"></script><script src="https://third.example/x.js"></script>
    <link rel="stylesheet" href="assets/ok.css"><script src="../secret.js"></script></html>'''
    h=m.Assets();h.feed(main_html)
    check('HTML imports only local safe paths',h.assets,['assets/app.js','assets/ok.css'])
    check('Strict version number','V34' if m.numbered('V34')==34 else 'BAD','V34')
    check('No invalid version number',m.numbered('V0'),None)
    check('Nonce query preservation',m.append_query('https://a.example/p?q=1','probe'),'https://a.example/p?q=1&_afow_probe=probe')
    with TemporaryDirectory() as td:
        z,sh=m.create_artifacts(current,Path(td))
        check('ZIP checksum saved',hashlib.sha256(z.read_bytes()).hexdigest() in sh.read_text(),True)
        with zipfile.ZipFile(z) as f:
            check('ZIP members CRC pass',f.testzip(),None)
            check('Report JSON version',json.loads(f.read('status.json'))['status'],'VERIFIED_CURRENT_STATIC')
            check('No sensitive file bundled',sorted(f.namelist()),['REPORT_KO.txt','SHA256SUMS.txt','status.json'])
    return '\n'.join(records)+'\nTOTAL='+str(len(records))+' PASS / 0 FAIL\n'

if __name__=='__main__':print(run())
