"""Local synthetic-only tests: never treats fixtures as live deployment evidence."""
import base64
import importlib.util
import json
from pathlib import Path
import unittest
from urllib.error import URLError

SCRIPT=Path(__file__).resolve().parents[1]/'tools/v59_publication_proof.py'
spec=importlib.util.spec_from_file_location('v59proof', SCRIPT)
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
SHA='a'*40
VERSION='V59'

def fixture(version=VERSION, cf_status='success', missing=None, wrong_page=None):
    manifest={'product':'AllFileOne WebStudio','version':version,'release_id':'WEBSTUDIO-'+version+'-20261108'}
    items={
        mod.API+'/commits/main': {'sha':SHA},
        mod.API+'/contents/webstudio/assets/current-release.json?ref='+SHA:{'encoding':'base64','content':base64.b64encode(json.dumps(manifest).encode()).decode()},
        mod.API+'/commits/'+SHA+'/check-runs?per_page=100':{'check_runs':[{'name':'Cloudflare Pages','status':'completed','conclusion':cf_status,'head_sha':SHA,'html_url':'https://github.com/example/ci'}]},
    }
    items[mod.LIVE+'/assets/current-release.json']=json.dumps(manifest)
    items[mod.LIVE+'/index.html']='<html>site-current-version quick-inquiry.html WEBSTUDIO-'+version+'-20261108</html>'
    items[mod.LIVE+'/quick-inquiry.html']=' '.join('name="industry" value="'+s+'"' for s in mod.SECTORS)
    items[mod.LIVE+'/launch-kit.html']=' '.join('data-sector="'+s+'"' for s in mod.SECTORS)
    items[mod.LIVE+'/contact.html']='<html><form id="brief-form"></form></html>'
    for sec in mod.SECTORS:
        items[mod.LIVE+'/for-'+sec+'.html']='<a href="quick-inquiry.html?industry='+sec+'">문의</a><a href="contact.html">상세</a>'
    if missing:items.pop(mod.LIVE+'/'+missing, None)
    if wrong_page:items[mod.LIVE+'/'+wrong_page]='<html>wrong</html>'
    return items

def fake(mapping):
    def fetch(url):
        if url not in mapping: raise URLError('injected unreachable')
        v=mapping[url]
        return json.dumps(v) if isinstance(v,dict) else v
    return fetch

class ProofTests(unittest.TestCase):
    def test_complete_success(self):
        x=mod.analyze(fake(fixture()))
        self.assertEqual(x['technical_status'],'PASS_TECHNICAL_ONLY')
        self.assertEqual(len(x['live']['checks']),11)
        self.assertEqual(x['real_mail'],'NOT_TESTED')
    def test_cf_failure_holds(self):
        x=mod.analyze(fake(fixture(cf_status='failure')))
        self.assertEqual(x['ci']['status'],'HOLD')
        self.assertEqual(x['technical_status'],'HOLD')
    def test_cf_missing_holds(self):
        t=fixture();t[mod.API+'/commits/'+SHA+'/check-runs?per_page=100']={'check_runs':[]}
        self.assertEqual(mod.analyze(fake(t))['ci']['status'],'HOLD')
    def test_github_unreachable_holds(self):
        x=mod.analyze(fake({}))
        self.assertIsNone(x['release'])
        self.assertEqual(x['technical_status'],'HOLD')
    def test_missing_page_holds(self):
        x=mod.analyze(fake(fixture(missing='for-beauty.html')))
        self.assertEqual(x['live']['status'],'HOLD')
    def test_spa_fallback_wrong_page_holds(self):
        x=mod.analyze(fake(fixture(wrong_page='for-logistics.html')))
        self.assertEqual(x['live']['status'],'HOLD')
    def test_missing_quick_industry_holds(self):
        t=fixture();t[mod.LIVE+'/quick-inquiry.html']='name="industry" value="manufacturing" only'
        self.assertEqual(mod.analyze(fake(t))['technical_status'],'HOLD')
    def test_stale_live_version_holds(self):
        t=fixture();t[mod.LIVE+'/assets/current-release.json']=json.dumps({'version':'V58'})
        self.assertEqual(mod.analyze(fake(t))['live']['status'],'HOLD')
    def test_no_cf_false_positive_when_other_checks_success(self):
        t=fixture();t[mod.API+'/commits/'+SHA+'/check-runs?per_page=100']={'check_runs':[{'name':'GitHub Pages','status':'completed','conclusion':'success'}]}
        self.assertEqual(mod.analyze(fake(t))['ci']['status'],'HOLD')
    def test_invalid_sha_holds(self):
        t=fixture();t[mod.API+'/commits/main']={'sha':'broken'}
        self.assertIsNone(mod.analyze(fake(t))['commit_sha'])
    def test_no_external_redirect(self):
        class MockRequest:
            def __init__(self):self.full_url=mod.LIVE+'/index.html'
        with self.assertRaises(ValueError):
            mod.SafeRedirect().redirect_request(MockRequest(),None,302,'found',{},'https://attacker.invalid/')
    def test_text_explains_mail_not_tested(self):
        x=mod.ko_text(mod.analyze(fake(fixture())))
        self.assertIn('이메일 실제 수신: 미검증',x)
    def test_does_not_mark_sales_ready(self):
        x=mod.analyze(fake(fixture()))
        self.assertNotIn('SALES_READY',x['technical_status'])
    def test_no_secret_access(self):
        source=SCRIPT.read_text(encoding='utf-8')
        self.assertNotIn('os.environ',source)
        self.assertNotIn('input(',source)
    def test_path_allowlist(self):
        with self.assertRaises(ValueError):mod.get('http://api.github.com')
        with self.assertRaises(ValueError):mod.get('https://attacker.invalid')

if __name__=='__main__':unittest.main(verbosity=2)
