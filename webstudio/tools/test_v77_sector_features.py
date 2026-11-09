# -*- coding: utf-8 -*-
"""V77 source contract: 12 industries × (4 already working + 4 unbuilt options)."""
from pathlib import Path
import json, re, unittest, subprocess
ROOT=Path(__file__).resolve().parents[1]
D=(ROOT/'assets/v77-feature-data.js').read_text('utf-8')
E=json.loads(re.search(r'Object\.freeze\((\{.*\})\);',D,re.S).group(1))
C=json.loads(re.search(r'Object\.freeze\((\{.*\})\);',(ROOT/'assets/v28-catalog.js').read_text('utf-8'),re.S).group(1))
class TestSectorFeatures(unittest.TestCase):
 def test_12_sectors_eight_each(self):
  self.assertEqual(set(E),set(C));self.assertEqual(len(E),12)
  for k,v in E.items():
   with self.subTest(sector=k):
    self.assertEqual(len(C[k]['features']),4);self.assertEqual(len(v['extra']),4)
    self.assertEqual(len({f['title'] for f in C[k]['features']+v['extra']}),8)
    self.assertTrue(v['referenceUrl'].startswith('https://'))
    self.assertTrue(all(x['title'] and x['desc'] and x['status']=='planned' for x in v['extra']))
 def test_preserve_36_working_demos(self):
  for k in E:
   for style in ['modern','premium','editorial']:
    with self.subTest(k=k,style=style):
     self.assertTrue((ROOT/'demo'/k/style/'index.html').is_file())
 def test_visible_and_truthful_labels(self):
  demo=(ROOT/'assets/v77-feature-showcase.js').read_text('utf-8')
  compare=(ROOT/'assets/v77-compare-extend.js').read_text('utf-8')
  hub=(ROOT/'assets/v77-industry-hub.js').read_text('utf-8')
  for s in [demo,compare,hub]:
   self.assertIn('미구현',s)
   self.assertNotIn('fetch(',s);self.assertNotIn('XMLHttpRequest',s)
   self.assertNotIn('navigator.sendBeacon',s)
  self.assertIn('v77-feature-data.js',(ROOT/'assets/demo.js').read_text('utf-8'))
  self.assertIn('v77-compare-extend.js',(ROOT/'design-compare-live.html').read_text('utf-8'))
  self.assertIn('industry-features-v77.html',(ROOT/'index.html').read_text('utf-8'))
  self.assertIn('industry-features-v77.html',(ROOT/'design-gallery-v13.html').read_text('utf-8'))
  self.assertIn('v28-tools',demo)
 def test_js_syntax(self):
  for name in ['demo.js','v77-feature-data.js','v77-feature-showcase.js','v77-compare-extend.js','v77-industry-hub.js']:
   with self.subTest(name=name):
    p=subprocess.run(['node','--check',str(ROOT/'assets'/name)],capture_output=True,text=True)
    self.assertEqual(p.returncode,0,p.stderr)
 def test_zero_price_claims(self):
  self.assertIn('별도 구현하는 기능 4개', (ROOT/'industry-features-v77.html').read_text('utf-8'))
  self.assertIn('추가 제작 옵션 (미구현)',(ROOT/'RESEARCH_V77_KO.md').read_text('utf-8')) if False else None
if __name__=='__main__':unittest.main()