# -*- coding: utf-8 -*-
"""Fail-closed tests for V75 real-public Windows owner acceptance (no internet)."""
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

HERE=Path(__file__).resolve().parent
SPEC=importlib.util.spec_from_file_location('v75_public_owner_qa',HERE/'v75_public_owner_qa.py')
QA=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(QA)
ROOT=HERE.parent

class PublicOwnerQA(unittest.TestCase):
 def test_exact_public_routes_not_arbitrary_redirects(self):
  base='https://allfileone-webstudio.pages.dev/'
  self.assertTrue(QA.exact_route(base+'contact',base+'contact.html'))
  self.assertTrue(QA.exact_route(base,base+'index.html'))
  self.assertFalse(QA.exact_route('https://random.example/contact',base+'contact.html'))
  self.assertFalse(QA.exact_route(base+'index.html',base+'contact.html'))
  self.assertFalse(QA.exact_route(base+'contact.html?ref=bad',base+'contact.html'))
  self.assertFalse(QA.exact_route('http://allfileone-webstudio.pages.dev/contact.html',base+'contact.html'))
 def test_real_http_get_uses_https_exact_status_and_body_limit(self):
  class FakeResponse:
   def __init__(self,st=200,url='https://allfileone-webstudio.pages.dev/contact.html',data=b'OK'):
    self.st,self.url,self.data=st,url,data
   def __enter__(self):return self
   def __exit__(self,*args):pass
   def getcode(self):return self.st
   def geturl(self):return self.url
   def read(self,n):return self.data[:n]
  self.assertEqual(QA.get_public('contact.html',lambda req,timeout:FakeResponse()),'OK')
  for bad in (FakeResponse(st=404),FakeResponse(url='https://outside.example/contact.html'),FakeResponse(data=b'A'*2_000_001)):
   with self.assertRaises(ValueError):QA.get_public('contact.html',lambda req,timeout,bad=bad:bad)
 def test_all_52_local_public_files_meet_exact_contract(self):
  items=QA.probes()
  self.assertEqual(len(items),52)
  self.assertEqual(len({x[1] for x in items}),len(items))
  for i in items:
   with self.subTest(file=i[1]):
    result=QA.check_one(i,lambda path:(ROOT/path).read_text('utf-8'))
    self.assertTrue(result['pass'],result)
 def test_stale_and_200_html_fallback_rejected(self):
  def getter(path):
   if path=='assets/current-release.json':
    m=json.loads((ROOT/path).read_text('utf-8'))
    m.pop('v74_public_proof_version',None)
    return json.dumps(m)
   if path=='demo/manufacturing/modern/index.html':return (ROOT/'index.html').read_text('utf-8')
   return (ROOT/path).read_text('utf-8')
  bad=[QA.check_one(x,getter) for x in QA.probes()]
  misses=[x['path'] for x in bad if not x['pass']]
  self.assertEqual(set(misses),{'assets/current-release.json','demo/manufacturing/modern/index.html'})
 def test_file_not_found_and_bad_json_fail_closed(self):
  for item in (QA.probes()[0],QA.probes()[-1]):
   self.assertFalse(QA.check_one(item,lambda p:'404 Not Found')['pass'])
   self.assertFalse(QA.check_one(item,lambda p:(_ for _ in ()).throw(OSError('DNS 실패')))['pass'])
 def test_not_reporting_real_email_or_paid_api(self):
  s=(HERE/'v75_public_owner_qa.py').read_text('utf-8')
  self.assertIn("'email_receipt':'NOT_VERIFIED'",s)
  self.assertIn("'customer_transaction':'NOT_VERIFIED'",s)
  self.assertIn("'paid_api_calls':0",s)
  self.assertNotIn('ExecutionPolicy Bypass',s)
  self.assertNotIn('requests.post',s)
  self.assertNotIn('send_email(',s)
 def test_one_click_broken_python313_is_avoided(self):
  s=(ROOT/'RUN_V75_PUBLIC_QA_WINDOWS.cmd').read_text('utf-8')
  self.assertIn('3.14 3.12 3.11',s)
  self.assertNotIn('3.13 ',s.split('for %%V in (',1)[1].split(')',1)[0])
  self.assertIn('AFO_WebStudio_V75_PUBLIC_QA_LATEST',s)
  self.assertIn('pause',s)
 def test_evidence_zip_manifest_sha_and_crc(self):
  with tempfile.TemporaryDirectory() as d:
   path=Path(d);e=path/'work';e.mkdir()
   result={'timestamp':'2026-11-09','result':'HOLD_PUBLIC_DEPLOY_OR_BROWSER',
    'http_pass':0,'http_total':52,'http_checks':[{'name':'public','path':'index.html','pass':False,'detail':'DNS 실패'}],
    'browser':[{'suite':s,'status':'HOLD','exit_code':None,'detail':'HTTP failed'} for s in QA.SCRIPT_SUITES]}
   z=path/'Downloads'/'AFO_WebStudio_V75_PUBLIC_QA_LATEST.zip'
   manifest=QA.pack(e,z,result)
   self.assertTrue(z.is_file());self.assertEqual(manifest['status'],result['result'])
   with zipfile.ZipFile(z) as f:
    self.assertIsNone(f.testzip())
    for fname,m in manifest['files'].items():
     import hashlib
     self.assertEqual(m['sha256'],hashlib.sha256(f.read(fname)).hexdigest())
    self.assertIn('V75_PUBLIC_QA_RESULT_KO.txt',f.namelist())
   self.assertTrue((z.parent/'AFO_WebStudio_V75_PUBLIC_QA_LATEST.sha256').exists())

if __name__=='__main__':unittest.main(verbosity=2)