from pathlib import Path
import unittest,sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'TOOLS'))
import check_cloudflare_github as audit
SHA='a'*40
BASE={'sha':SHA}

def run_data(name='Cloudflare Pages',slug='cloudflare-workers-and-pages',status='completed',conclusion='success',sha=SHA):
 return {'name':name,'app':{'slug':slug},'status':status,'conclusion':conclusion,'head_sha':sha,'html_url':'https://github.com/test/check/123'}

class TestDeployEvidence(unittest.TestCase):
 def test_good(self):
  r=audit.summarize_commit(BASE,{'check_runs':[run_data()]})
  self.assertEqual(r['status'],'CLOUDFLARE_CHECK_SUCCESS')
 def test_empty(self):
  self.assertEqual(audit.summarize_commit(BASE,{'check_runs':[]})['status'],'UNKNOWN_OR_NOT_SUCCESS')
 def test_other_app(self):
  self.assertEqual(audit.summarize_commit(BASE,{'check_runs':[run_data(slug='fake-worker')]})['status'],'UNKNOWN_OR_NOT_SUCCESS')
 def test_other_commit(self):
  self.assertEqual(audit.summarize_commit(BASE,{'check_runs':[run_data(sha='b'*40)]})['status'],'UNKNOWN_OR_NOT_SUCCESS')
 def test_not_completed(self):
  self.assertEqual(audit.summarize_commit(BASE,{'check_runs':[run_data(status='in_progress')]})['status'],'UNKNOWN_OR_NOT_SUCCESS')
 def test_failed(self):
  self.assertEqual(audit.summarize_commit(BASE,{'check_runs':[run_data(conclusion='failure')]})['status'],'UNKNOWN_OR_NOT_SUCCESS')
 def test_other_check_name(self):
  self.assertEqual(audit.summarize_commit(BASE,{'check_runs':[run_data(name='deploy')]})['status'],'UNKNOWN_OR_NOT_SUCCESS')
 def test_invalid_sha(self):
  with self.assertRaises(ValueError): audit.summarize_commit({'sha':'zzz'}, {'check_runs':[]})
 def test_missing_sha(self):
  with self.assertRaises(ValueError): audit.summarize_commit({}, {'check_runs':[]})
 def test_mixed_checks(self):
  r=audit.summarize_commit(BASE,{'check_runs':[run_data(conclusion='failure'),run_data()]})
  self.assertEqual(r['status'],'CLOUDFLARE_CHECK_SUCCESS')
 def test_failed_only(self):
  r=audit.summarize_commit(BASE,{'check_runs':[run_data(conclusion='cancelled')]})
  self.assertNotEqual(r['status'],'CLOUDFLARE_CHECK_SUCCESS')
 def test_does_not_claim_live(self):
  r=audit.summarize_commit(BASE,{'check_runs':[run_data()]})
  self.assertIn('not a successful visit',r['caveat'])

if __name__=='__main__':unittest.main()