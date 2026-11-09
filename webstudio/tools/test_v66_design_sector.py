#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V66 source acceptance: layout contrast, 12 sector entrypoints, 36 preserved sites."""
import unittest
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
JS=(ROOT/"assets/v66-sector-artdirection.js").read_text(encoding="utf-8")
CSS=(ROOT/"assets/v66-distinct-designs.css").read_text(encoding="utf-8")
DEMO=(ROOT/"assets/demo.js").read_text(encoding="utf-8")
OLD=(ROOT/"assets/v652-sector-requirements.js").read_text(encoding="utf-8")
SECTORS=("manufacturing","corporate","clinic","academy","interior",
         "commerce","professional","association","franchise","stay",
         "realestate","event")
STYLES=("modern","premium","editorial")
class V66StylesAndSectors(unittest.TestCase):
 def test_twelve_sector_personas_not_generic_copy(self):
  self.assertIn("window.AFO_V66_SECTOR_COUNT=Object.keys(INDUSTRIES).length;",JS)
  starts=[]
  for key in SECTORS:
   match=re.search(r"\n "+key+r":\{name:'([^']+)',tag:'([^']+)',targets:\[(.*?)\],\s*headlines:\[(.*?)\],lead:'(.*?)'\}",JS,re.S)
   self.assertIsNotNone(match,key)
   self.assertEqual(match.group(3).count("','")+1,4,key+" four genuine action descriptions")
   self.assertEqual(match.group(4).count("','")+1,3,key+" three DIFFERENT hero headlines")
   self.assertTrue(len(set(re.findall(r"'([^']+)'",match.group(4))))==3,key)
   self.assertIn("실제로",JS)
   starts.append(match.group(5))
  self.assertEqual(len(set(starts)),12)
 def test_36_pages_keep_existing_modules(self):
  for key in SECTORS:
   for style in STYLES:
    with self.subTest(key=key,style=style):
     path=ROOT/"demo"/key/style/"index.html"
     self.assertTrue(path.is_file())
     html=path.read_text(encoding="utf-8")
     self.assertIn('data-v13-style="'+style+'"',html)
     self.assertIn('data-industry="'+key+'"',html)
     self.assertIn("../../../assets/demo.js",html)
  for name in ("v28-catalog.js","v28-tools.js","v652-sector-requirements.js","v66-sector-artdirection.js"):
   self.assertIn(name,DEMO)
  self.assertIn("v653-to-plan",OLD)
 def test_three_distinct_bodies_beyond_hero_colours(self):
  for style,expected in (
   ("modern",[".theme-modern .service-grid{grid-template-columns:repeat(12",
              ".theme-modern .service-card:nth-child(3){grid-column:span 12",
              ".theme-modern .v66-sector-card:nth-child(4)"]),
   ("premium",[".theme-premium .service-grid{grid-template-columns:repeat(3",
               ".theme-premium .service-card{border:none",
               ".theme-premium .v66-sector-grid{gap:1px"]),
   ("editorial",[".theme-editorial .service-grid{display:grid;grid-template-columns:minmax(0,1fr)",
                 ".theme-editorial .service-card{border:none",
                 ".theme-editorial .service-card .mini-swatch{grid-column:3"])):
   for token in expected:
    with self.subTest(style=style,token=token):self.assertIn(token,CSS)
 def test_mobile_tablet_nav_and_mobile_grid(self):
  self.assertIn("@media(max-width:1180px)",CSS)
  self.assertIn(".site-head nav.open{display:grid!important}",CSS)
  self.assertIn(".mobile-menu{display:block!important;",CSS)
  self.assertIn("@media(max-width:700px)",CSS)
  self.assertIn("@media(max-width:430px)",CSS)
  self.assertIn("prefers-reduced-motion",CSS)
  self.assertIn("focus-visible",CSS)
  self.assertIn("overflow:hidden",CSS)
 def test_real_working_v28_tabs_not_fake_function_links(self):
  self.assertIn("document.getElementById('v28-tab-'+i)",JS)
  self.assertIn("tab.click()",JS)
  self.assertIn("location.assign(target.href)",JS)
  self.assertIn("target.searchParams.set('feature',String(i))",JS)
  self.assertIn("data-v66-feature",JS) if "data-v66-feature" in JS else self.assertIn("dataset.v66Feature=String(i)",JS)
  self.assertIn("body.dataset.v66Ready='true'",JS)
  self.assertIn("실시간 데이터 연동은 제공하지 않습니다",JS)
 def test_no_remote_deps_or_customer_info(self):
  for forbidden in ("fetch(","XMLHttpRequest","sendBeacon","document.cookie","localStorage","innerHTML=","eval("):
   with self.subTest(forbidden=forbidden):
    self.assertNotIn(forbidden,JS)
  self.assertIn("가상 자료",JS)
  self.assertIn("실제",JS)
if __name__=="__main__":unittest.main(verbosity=2)
