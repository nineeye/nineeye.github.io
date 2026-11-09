"""False-PASS prevention for V82 GitHub-hosted real public HTTPS probe."""
from pathlib import Path
import importlib.util,json,tempfile,unittest,zipfile
PATH=Path(__file__).with_name('v82_live_public_probe.py')
spec=importlib.util.spec_from_file_location('afo_v82_live',PATH)
M=importlib.util.module_from_spec(spec);spec.loader.exec_module(M)
ROOT=Path(__file__).resolve().parents[1]
class V82LiveProbeTests(unittest.TestCase):
 def test_exact_current_source_47_of_47(self):
  checks=M.once(lambda path:(ROOT/path).read_text('utf-8'))
  self.assertEqual(len(checks),47)
  self.assertEqual(sum(x['status']=='PASS' for x in checks),47)
  self.assertEqual(M.summarize(checks,M.PRODUCTION_ORIGIN,1)['result'],'PASS_PUBLIC_FILES_ONLY')
 def test_stale_manifest_stops_before_any_secondary_request(self):
  called=[]
  def getter(path):
   called.append(path)
   return json.dumps({'product':'AllFileOne WebStudio','version':'V81'})
  records=M.once(getter)
  self.assertEqual(called,['assets/current-release.json'])
  self.assertEqual(records[0]['status'],'HOLD')
  self.assertEqual(M.summarize(records,M.PRODUCTION_ORIGIN,1)['result'],'HOLD_PUBLIC_DEPLOY')
 def test_missing_demo_must_hold_not_false_pass(self):
  def getter(path):
   if path=='demo/manufacturing/modern/index.html':raise FileNotFoundError('missing')
   return (ROOT/path).read_text('utf-8')
  records=M.once(getter)
  self.assertEqual(len(records),47)
  self.assertEqual(sum(x['status']=='HOLD' for x in records),1)
  self.assertEqual(M.summarize(records,M.PRODUCTION_ORIGIN,1)['result'],'HOLD_PUBLIC_DEPLOY')
 def test_cloudflare_index_html_to_root_canonicalization(self):
  self.assertEqual(M.norm_route('/index.html'),M.norm_route('/'))
  self.assertEqual(M.norm_route('/contact.html'),M.norm_route('/contact'))
 def test_actual_report_and_zip_never_claim_customer_receipt(self):
  rows=M.once(lambda path:(ROOT/path).read_text('utf-8'))
  result=M.summarize(rows,M.PRODUCTION_ORIGIN,1)
  with tempfile.TemporaryDirectory() as td:
   txt,j,archive=M.write_report(result,Path(td))
   self.assertIn('실제 이메일 수신',txt.read_text('utf-8-sig'))
   self.assertEqual(json.loads(j.read_text())['actual_customer_email'],'NOT_VERIFIED')
   with zipfile.ZipFile(archive) as z:self.assertIsNone(z.testzip())
 def test_no_sending_actions_or_other_remote_origin_in_source(self):
  s=PATH.read_text('utf-8')
  for forbidden in ('Request(data=', "method='POST'",'smtplib.SMTP','send_email(','openai.com/api'):
   self.assertNotIn(forbidden,s)

 def test_nested_cloudflare_pretty_url_is_exact_same_directory_only(self):
  self.assertEqual(M.norm_route('/demo/manufacturing/modern/index.html'),
                   M.norm_route('/demo/manufacturing/modern/'))
  self.assertEqual(M.norm_route('/demo/manufacturing/modern/index.html'),
                   M.norm_route('/demo/manufacturing/modern'))
  self.assertNotEqual(M.norm_route('/demo/manufacturing/modern/index.html'),
                      M.norm_route('/demo/manufacturing/premium/'))
  self.assertNotEqual(M.norm_route('/demo/manufacturing/modern/index.html'),
                      M.norm_route('/'))
  self.assertNotEqual(M.norm_route('/demo/manufacturing/modern/index.html'),
                      M.norm_route('/demo/manufacturing/modern/oops.html'))

 def test_nested_redirect_keeps_body_and_origin_guards(self):
  from unittest.mock import patch
  origin=M.PRODUCTION_ORIGIN
  requested='demo/manufacturing/modern/index.html'
  class FakeResponse:
   status=200
   def __init__(self, actual):self.actual=actual
   def __enter__(self):return self
   def __exit__(self,typ,val,tb):return False
   def geturl(self):return self.actual
   def read(self,limit):return b'<html>REAL_DEMO_MARKER</html>'
  def fetch(final):
   with patch.object(M,'urlopen',return_value=FakeResponse(final)):
    return M.actual_get(origin,requested)
  self.assertIn('REAL_DEMO_MARKER',fetch(origin+'demo/manufacturing/modern/'))
  with self.assertRaisesRegex(RuntimeError,'다른 경로'):
   fetch(origin+'demo/manufacturing/premium/')
  with self.assertRaisesRegex(RuntimeError,'다른 경로'):
   fetch(origin)
  with self.assertRaisesRegex(RuntimeError,'다른 출처'):
   fetch('https://untrusted.example/demo/manufacturing/modern/')

if __name__=='__main__':unittest.main(verbosity=2)