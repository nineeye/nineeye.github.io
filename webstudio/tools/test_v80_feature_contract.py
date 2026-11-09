# -*- coding: utf-8 -*-
"""V80 contract: 12 more fictional working browser UI demos, 7 visible demos + 1 unbuilt."""
from pathlib import Path
import json,re,subprocess,unittest
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'assets'
def load(file):
 s=(A/file).read_text('utf-8');return json.loads(re.search(r'Object\.freeze\((\{.*\})\);',s,re.S).group(1))
class V80Contract(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.E=load('v77-feature-data.js');cls.D=load('v80-simulator-data.js');cls.F78=load('v78-simulator-data.js');cls.F79=load('v79-simulator-data.js');cls.C=load('v28-catalog.js')
 def test_12_industries_84_operational_simulations_12_unbuilt(self):
  self.assertEqual(set(self.E),set(self.D));self.assertEqual(set(self.E),set(self.F78));self.assertEqual(set(self.E),set(self.F79));self.assertEqual(set(self.E),set(self.C));self.assertEqual(len(self.E),12)
  for k,v in self.D.items():
   with self.subTest(k=k):
    indexes=(self.F78[k]['index'],self.F79[k]['index'],v['index'])
    self.assertEqual(len(set(indexes)),3)
    self.assertEqual(len(self.C[k]['features']),4)
    self.assertEqual(len(self.E[k]['extra']),4)
    self.assertEqual(sum(x['status']=='simulated' for x in self.E[k]['extra']),3)
    self.assertEqual(sum(x['status']=='planned' for x in self.E[k]['extra']),1)
    self.assertEqual(self.E[k]['extra'][v['index']]['status'],'simulated')
    self.assertEqual(len({x['title'] for x in self.C[k]['features']+self.E[k]['extra']}),8)
  self.assertGreaterEqual(len({v['kind'] for v in self.D.values()}),10)
 def test_36_demos_existing_labs_kept_and_new_lab(self):
  for k in self.E:
   for style in ('modern','premium','editorial'):self.assertTrue((ROOT/'demo'/k/style/'index.html').is_file())
  for file in ('feature-lab-v78.html','feature-lab-v79.html','feature-lab-v80.html','industry-features-v77.html','design-compare-live.html'):self.assertTrue((ROOT/file).exists())
  for file in ('feature-lab-v80.html','industry-features-v77.html','design-compare-live.html'):
   s=(ROOT/file).read_text('utf-8');self.assertLess(s.index('v80-simulator-data.js'),s.index('v80-simulator.js'))
  s=(A/'demo.js').read_text('utf-8');self.assertIn('v80-simulator.js',s)
 def test_no_pii_network_or_payments(self):
  for file in ('v80-simulator.js','v80-lab.js','v77-feature-showcase.js','v77-industry-hub.js','v77-compare-extend.js'):
   source=(A/file).read_text('utf-8')
   for banned in ('fetch(', 'XMLHttpRequest','sendBeacon(','WebSocket(', 'localStorage', 'sessionStorage', 'document.cookie'):
    self.assertNotIn(banned,source,file)
  text=(A/'v80-simulator.js').read_text('utf-8');self.assertIn('가상',text);self.assertIn('실제',text)
 def test_all_js_parses(self):
  for file in ('v80-simulator.js','v80-simulator-data.js','v80-lab.js','demo.js','v77-feature-showcase.js','v77-industry-hub.js','v77-compare-extend.js','v77-feature-data.js'):
   p=subprocess.run(['node','--check',str(A/file)],capture_output=True,text=True);self.assertEqual(p.returncode,0,file+p.stderr)
 def test_truthful_release_version(self):
  m=json.loads((A/'current-release.json').read_text('utf-8'))
  self.assertEqual(m['v80_sector_count'],12);self.assertEqual(m['v80_total_browser_simulations'],84);self.assertEqual(m['v80_unbuilt_production_options'],12)
  self.assertIs(m['v80_actual_backend'],False);self.assertIs(m['v80_cloudflare_public_verified'],False);self.assertIs(m['v80_customer_email_receipt_verified'],False)
if __name__=='__main__':unittest.main()