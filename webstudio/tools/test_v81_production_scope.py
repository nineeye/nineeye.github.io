"""First-party production-scoping integrity checks (no public HTTP assertions)."""
from pathlib import Path
import json,re,subprocess,unittest
ROOT=Path(__file__).resolve().parents[1]
AS=ROOT/'assets'
class V81ScopeContract(unittest.TestCase):
 def test_reuses_the_eight_existing_features_for_all_twelve_sectors(self):
  script="""const fs=require('fs'),vm=require('vm');let win={};vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),{window:win});vm.runInNewContext(fs.readFileSync(process.argv[2],'utf8'),{window:win});vm.runInNewContext(fs.readFileSync(process.argv[3],'utf8'),{window:win});const C=win.ALLFILEONE_V28_CATALOG,E=win.AFO_V77_FEATURE_EXTENSION,M=win.AFO_V81_SCOPE_MATRIX;const names=Object.keys(C);console.log(JSON.stringify({count:names.length,data:names.map(k=>({sector:k,baseline:C[k].features.map(x=>x.title),ext:E[k].extra.map(x=>({title:x.title,status:x.status})),risk:M[k].needs,unique:new Set([...C[k].features.map(x=>x.title),...E[k].extra.map(x=>x.title)]).size}))}));"""
  r=subprocess.run(['node','-e',script,str(AS/'v28-catalog.js'),str(AS/'v77-feature-data.js'),str(AS/'v81-scope-matrix.js')],capture_output=True,text=True,check=True)
  data=json.loads(r.stdout);self.assertEqual(data['count'],12)
  kinds=set()
  for item in data['data']:
   with self.subTest(sector=item['sector']):
    self.assertEqual(len(item['baseline']),4);self.assertEqual(len(item['ext']),4)
    self.assertEqual(item['unique'],8)
    self.assertEqual(len(item['risk']),8)
    self.assertEqual(sum(x['status']=='simulated' for x in item['ext']),3)
    self.assertEqual(sum(x['status']=='planned' for x in item['ext']),1)
    kinds.update(item['risk'])
  self.assertGreaterEqual(len(kinds),7)
 def test_page_and_scripts_are_local_and_syntax_clean(self):
  html=(ROOT/'feature-scope-v81.html').read_text('utf-8')
  for p in ('v28-catalog.js','v77-feature-data.js','v81-scope-matrix.js','v81-production-scope.js','v81-production-scope.css'):
   self.assertIn('assets/'+p,html);self.assertTrue((AS/p).is_file())
  for path in [AS/'v81-scope-matrix.js',AS/'v81-production-scope.js',AS/'v81-compare-link.js',AS/'demo.js']:
   r=subprocess.run(['node','--check',str(path)],capture_output=True,text=True)
   self.assertEqual(r.returncode,0,r.stderr)
 def test_no_auto_submission_paid_api_or_hidden_storage(self):
  js=(AS/'v81-production-scope.js').read_text('utf-8');html=(ROOT/'feature-scope-v81.html').read_text('utf-8')
  for token in ('fetch(', 'XMLHttpRequest', 'sendBeacon(', 'localStorage', 'sessionStorage', 'https://api.openai.com', 'form method="post"'):
   self.assertNotIn(token,js+html)
  self.assertIn('mailto:nineeyes@naver.com',js)
  self.assertIn('직접 발송',js+html)
  self.assertIn('서면 협의',js)
  self.assertIn('v81-notes',html)
 def test_full_report_and_manual_export_paths(self):
  js=(AS/'v81-production-scope.js').read_text('utf-8')
  for token in ('function buildReport()', '선택한 실운영 적용 희망 기능', 'requiredChecks', 'new Blob', 'v81-copy', 'v81-print','v81-mail','document.createElement','textContent=latestText'):
   self.assertIn(token,js)
  self.assertIn('maxlength="600"',(ROOT/'feature-scope-v81.html').read_text('utf-8'))
 def test_no_accidental_form_integration_or_contract_claim(self):
  html=(ROOT/'feature-scope-v81.html').read_text('utf-8')
  self.assertIn('실제 납품',html)
  self.assertIn('가격',html)
  self.assertIn('현재 미구현',(AS/'v81-production-scope.js').read_text('utf-8'))
  self.assertTrue(json.loads((AS/'release-v81.json').read_text('utf-8'))['real_cloudflare_public_deployment_verified'] is False)
 def test_navigation_across_existing_sales_and_design_sites(self):
  for path in ['index.html','plan-guide.html','industry-features-v77.html']:
   self.assertIn('feature-scope-v81.html',(ROOT/path).read_text('utf-8'))
  self.assertIn('v81-compare-link.js',(ROOT/'design-compare-live.html').read_text('utf-8'))
  self.assertIn('feature-scope-v81.html',(AS/'demo.js').read_text('utf-8'))
 def test_all_36_demos_still_present(self):
  sectors=['manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event']
  for k in sectors:
   for style in ['modern','premium','editorial']:
    self.assertTrue((ROOT/'demo'/k/style/'index.html').is_file(),(k,style))
 def test_public_version_guard_declared(self):
  rel=json.loads((AS/'current-release.json').read_text('utf-8'))
  self.assertEqual(rel['v81_scope_version'],'V81-20261109')
  self.assertEqual(rel['v81_scope_items'],96)
  self.assertFalse(rel['v81_public_cloudflare_verified'])
  self.assertFalse(rel['v81_actual_booking_email_backend'])
if __name__=='__main__':unittest.main(verbosity=2)