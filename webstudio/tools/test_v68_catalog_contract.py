#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V68: the 12 industry pages link to 48 actual, named V28 simulation tools."""
from pathlib import Path
import json, unittest, subprocess
ROOT=Path(__file__).resolve().parents[1]
JS=(ROOT/'assets/v67-compare.js').read_text('utf-8')
HTML=(ROOT/'design-compare-live.html').read_text('utf-8')
CATALOG=json.loads((ROOT/'assets/v28-catalog.js').read_text('utf-8').split('Object.freeze(',1)[1].rsplit(');',1)[0])
SECTORS=json.loads((ROOT/'assets/v67-industry-data.js').read_text('utf-8').split('=',1)[1].strip().rstrip(';'))
class CatalogContract(unittest.TestCase):
 def test_12_sectors_48_real_catalog_tools(self):
  self.assertEqual(set(CATALOG),set(SECTORS))
  self.assertEqual(len(CATALOG),12)
  kinds=set()
  for sector,d in CATALOG.items():
   with self.subTest(sector=sector):
    self.assertEqual(len(d['features']),4)
    self.assertEqual(len({f['title'] for f in d['features']}),4)
    self.assertTrue(all(f['title'] and f['desc'] for f in d['features']))
    kinds.update(f['kind'] for f in d['features'])
    for style in ('modern','premium','editorial'):
     self.assertTrue((ROOT/'demo'/sector/style/'index.html').is_file())
  self.assertGreaterEqual(len(kinds),8)
 def test_reuse_real_source_instead_of_duplicate_names(self):
  self.assertIn('<script src="assets/v28-catalog.js" defer></script>',HTML)
  self.assertLess(HTML.index('assets/v28-catalog.js'),HTML.index('assets/v67-compare.js'))
  for token in ('window.ALLFILEONE_V28_CATALOG','actualFeatures(industry)','feature.title','feature.desc','feature.kind','link.href=demoUrl(style,i)','if(!features)'):
   self.assertIn(token,JS)
  self.assertNotIn('data.targets.forEach',JS)
  self.assertNotIn('d.targets.map',JS)
 def test_safe_public_links_and_no_auto_upload(self):
  self.assertIn("url.searchParams.set('feature',String(feature))",JS)
  self.assertIn('roots.estimate.href=',JS)
  main=(ROOT/'assets/main.js').read_text('utf-8')
  self.assertIn("qs.get('industry')",main)
  self.assertIn("qs.get('theme')",main)
  for forbidden in ('fetch(', 'XMLHttpRequest','sendBeacon','localStorage','sessionStorage','document.cookie'):
   self.assertNotIn(forbidden,JS)
  self.assertEqual(subprocess.run(['node','--check',str(ROOT/'assets/v67-compare.js')],capture_output=True).returncode,0)
if __name__=='__main__': unittest.main(verbosity=2)
