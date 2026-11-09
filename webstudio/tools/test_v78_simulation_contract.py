# -*- coding: utf-8 -*-
"""V78 source contracts: 12 new deterministic fictional interactive demos, no backend.
This test makes no claims about production orders, stock, public site, or real mail.
"""
from pathlib import Path
import json,re,subprocess,unittest
R=Path(__file__).resolve().parents[1]

def load(name):
 s=(R/'assets'/name).read_text('utf-8')
 m=re.search(r'Object\.freeze\((\{.*\})\);',s,re.S)
 if not m:raise ValueError(name)
 return json.loads(m.group(1))
class TestV78(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.a=load('v77-feature-data.js');cls.f=load('v78-simulator-data.js');cls.c=load('v28-catalog.js')
 def test_12_sector_fifth_is_interactive_and_3_unbuilt(self):
  self.assertEqual(len(self.f),12);self.assertEqual(set(self.c),set(self.f));self.assertEqual(set(self.a),set(self.f))
  for k in self.f:
   with self.subTest(sector=k):
    self.assertEqual(len(self.c[k]['features']),4)
    self.assertEqual(len(self.a[k]['extra']),4)
    i=self.f[k]['index'];self.assertIn(i,range(4))
    self.assertEqual(self.a[k]['extra'][i]['status'],'simulated')
    self.assertEqual([x['status'] for x in self.a[k]['extra']].count('planned'),1)
    self.assertTrue(self.f[k]['lead']);self.assertTrue(self.f[k]['type'] in ('stock','stay','calc','list'))
 def test_36_demo_paths_keep_original_tools(self):
  for k in self.f:
   for style in ('modern','premium','editorial'):
    self.assertTrue((R/'demo'/k/style/'index.html').exists())
  self.assertIn('v28-tools.js',(R/'assets/demo.js').read_text('utf-8'))
  self.assertIn('v78-simulator.js',(R/'assets/demo.js').read_text('utf-8'))
  self.assertIn('v77-feature-showcase.js',(R/'assets/demo.js').read_text('utf-8'))
 def test_all_three_surfaces_show_five_simulations_three_scopes(self):
  for name in ['v77-feature-showcase.js','v77-compare-extend.js','v77-industry-hub.js']:
   s=(R/'assets'/name).read_text('utf-8')
   self.assertIn('simulated',s);self.assertIn('planned',s)
   for forbidden in ('fetch(', 'XMLHttpRequest', 'sendBeacon(', 'localStorage', 'sessionStorage'):
    self.assertNotIn(forbidden,s)
  self.assertTrue((R/'feature-lab-v78.html').exists())
 def test_no_data_upload_and_no_persistence(self):
  s=(R/'assets/v78-simulator.js').read_text('utf-8')
  for forbidden in ('fetch(', 'XMLHttpRequest', 'sendBeacon(', 'localStorage', 'sessionStorage', 'document.cookie','WebSocket('):
   self.assertNotIn(forbidden,s)
  self.assertIn('가상',s);self.assertIn('실제 예약 불가',s)
 def test_valid_javascript(self):
  for n in ['v28-catalog.js','v77-feature-data.js','v77-feature-showcase.js','v77-industry-hub.js','v77-compare-extend.js','v78-simulator-data.js','v78-simulator.js','demo.js']:
   p=subprocess.run(['node','--check',str(R/'assets'/n)],capture_output=True,text=True)
   self.assertEqual(p.returncode,0,p.stderr)
 def test_standalone_and_hub_deferred_js_load_order(self):
  for file in ['feature-lab-v78.html','industry-features-v77.html','design-compare-live.html']:
   s=(R/file).read_text('utf-8')
   self.assertLess(s.index('v78-simulator-data.js'),s.index('v78-simulator.js'))
   self.assertIn('실제',s)
if __name__=='__main__':unittest.main(verbosity=2)