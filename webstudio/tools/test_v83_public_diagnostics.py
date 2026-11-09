# -*- coding: utf-8 -*-
"""V83 fail-closed public-deployment diagnosis, no network involved in tests."""
import json
import socket
import ssl
import tempfile
import unittest
import urllib.error
import zipfile
from pathlib import Path
import v83_public_diagnostics as M

ROOT=Path(__file__).resolve().parents[1]

def local_get(path):
    return (ROOT/path).read_text('utf-8')

def no_dns(_):
    return None

class V83PublicDiagnosisTests(unittest.TestCase):
    def test_exact_local_source_47_pass_does_not_prove_email(self):
        got=M.probe_one(M.PRIMARY,dns=no_dns,get=local_get)
        self.assertEqual((got['status'],got['passed'],got['expected']),('PASS_PUBLIC_FILES_ONLY',47,47))
        self.assertEqual(got['actual_customer_email'],'NOT_VERIFIED')
    def test_multi_origin_does_not_make_candidate_root_authoritative(self):
        r=M.report_for((M.PRIMARY,'https://allfileone.co.kr/'),dns=no_dns,get_factory=lambda origin:local_get if origin==M.PRIMARY else (lambda p:'{}'))
        self.assertEqual(r['overall'],'PASS_PRIMARY_PUBLIC_FILES_ONLY')
        self.assertEqual(r['origins'][1]['cause'],'UNEXPECTED_CONTENT')
    def test_dns_error_fails_before_http(self):
        hits=[]
        def fail_dns(_):raise socket.gaierror(-2,'Name or service not known')
        r=M.probe_one(M.PRIMARY,dns=fail_dns,get=lambda p:hits.append(p))
        self.assertEqual(r['cause'],'DNS_FAILURE');self.assertEqual(hits,[])
    def test_tls_failure_is_not_classed_as_dns(self):
        r=M.probe_one(M.PRIMARY,dns=no_dns,get=lambda p:(_ for _ in ()).throw(ssl.SSLError('certificate expired')))
        self.assertEqual(r['cause'],'TLS_CERTIFICATE')
    def test_stale_manifest_is_not_success(self):
        def stale(path):return json.dumps({'product':'AllFileOne WebStudio','version':'V81','release_id':'old'})
        r=M.probe_one(M.PRIMARY,dns=no_dns,get=stale)
        self.assertEqual((r['cause'],r['passed']),('STALE_RELEASE',0))
    def test_200_html_fallback_is_not_success(self):
        r=M.probe_one(M.PRIMARY,dns=no_dns,get=lambda p:'<!doctype html><title>Home</title>')
        self.assertEqual(r['cause'],'UNEXPECTED_CONTENT')
    def test_other_site_json_is_not_accepted(self):
        r=M.probe_one(M.PRIMARY,dns=no_dns,get=lambda p:'{"product":"Unrelated","version":"V82"}')
        self.assertEqual(r['cause'],'UNEXPECTED_CONTENT')
    def test_http_404_is_not_generic_network_error(self):
        r=M.probe_one(M.PRIMARY,dns=no_dns,get=lambda p:(_ for _ in ()).throw(urllib.error.HTTPError(p,404,'not found',None,None)))
        self.assertEqual(r['cause'],'HTTP_NOT_FOUND')
    def test_http_403_explained(self):
        r=M.probe_one(M.PRIMARY,dns=no_dns,get=lambda p:(_ for _ in ()).throw(urllib.error.HTTPError(p,403,'denied',None,None)))
        self.assertEqual(r['cause'],'HTTP_AUTH')
    def test_http_502_explained(self):
        r=M.probe_one(M.PRIMARY,dns=no_dns,get=lambda p:(_ for _ in ()).throw(urllib.error.HTTPError(p,502,'bad gateway',None,None)))
        self.assertEqual(r['cause'],'HTTP_SERVER')
    def test_missing_design_asset_never_pass(self):
        def missing(path):
            if path=='demo/manufacturing/modern/index.html':raise FileNotFoundError(path)
            return local_get(path)
        r=M.probe_one(M.PRIMARY,dns=no_dns,get=missing)
        self.assertEqual(r['cause'],'PUBLIC_ASSET_MISMATCH')
        self.assertEqual((r['passed'],r['expected']),(46,47))
    def test_url_allowlist_and_tls_enforced(self):
        accepted=['https://allfileone-webstudio.pages.dev','https://allfileone.co.kr/','https://www.allfileone.co.kr/']
        for u in accepted:self.assertIn(M.normalized_origin(u),M.ALLOWED_ORIGINS)
        for u in ['http://allfileone-webstudio.pages.dev/','https://evil.com/','https://allfileone-webstudio.pages.dev/admin','https://allfileone.co.kr/?a=1','https://user:pass@allfileone.co.kr/']:
            with self.subTest(url=u),self.assertRaises(ValueError):M.normalized_origin(u)
    def test_canonical_200_and_redirect_error(self):
        cause,_=M.describe_error(RuntimeError('다른 출처 리디렉션'))
        self.assertEqual(cause,'HTTP_REDIRECT')
    def test_evidence_reports_no_email_claim_and_valid_crc(self):
        report=M.report_for((M.PRIMARY,),dns=no_dns,get_factory=lambda _:local_get)
        with tempfile.TemporaryDirectory() as d:
            files=M.write_evidence(report,Path(d))
            txt=Path(files['txt']).read_text('utf-8-sig')
            self.assertIn('실제 고객 이메일',txt)
            with zipfile.ZipFile(files['zip']) as z:
                self.assertIsNone(z.testzip())
                self.assertEqual(len(z.namelist()),2)
                self.assertIn('NOT_VERIFIED',z.read('AFO_V83_PUBLIC_DIAGNOSTIC.json').decode('utf-8'))
    def test_stdlib_only_and_no_side_effects(self):
        s=(ROOT/'tools/v83_public_diagnostics.py').read_text('utf-8')
        for term in ('smtplib','method="POST"','requests.post(','sendBeacon(', 'subprocess', 'os.system('):self.assertNotIn(term,s)
    def test_windows_launcher_no_broken_python313(self):
        s=(ROOT/'RUN_V83_PUBLIC_DIAG_WINDOWS.cmd').read_text('utf-8')
        self.assertIn('3.14 3.12 3.11',s)
        self.assertIn('Downloads\\AFO_WebStudio_V83_Public_Diagnostic',s)
        self.assertIn('timeout /t 10 /nobreak',s)
        self.assertNotIn('pause',s)
        self.assertNotIn('ExecutionPolicy Bypass',s)

if __name__=='__main__':unittest.main(verbosity=2)