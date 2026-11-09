# -*- coding: utf-8 -*-
"""Source gates for the actual V69 design and safe 36-demo enhancement."""
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
STYLE=(ROOT/'assets/v69-artdirection.css').read_text('utf-8')
JS=(ROOT/'assets/v69-artdirection.js').read_text('utf-8')
LOADER=(ROOT/'assets/demo.js').read_text('utf-8')
STYLE_NAMES=('modern','premium','editorial')
SECTORS=('manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event')
class V69DesignAcceptance(unittest.TestCase):
 def test_layouts_are_three_actual_different_rendered_grammars(self):
  for style in STYLE_NAMES:
   self.assertIn('.theme-'+style+' .v23-hero-shell',STYLE)
   self.assertIn('.theme-'+style+' .v23-hero-copy',STYLE)
   self.assertIn('.theme-'+style+' .v23-hero-visual',STYLE)
  self.assertIn('grid-template-columns:minmax(0,44%) minmax(0,56%)',STYLE)
  self.assertIn('grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(735px,auto)',STYLE)
  self.assertIn('grid-template-columns:minmax(0,60%) minmax(0,40%)',STYLE)
  self.assertIn('position:absolute!important;inset:0!important',STYLE)
  self.assertIn("content:'EDITION 03'",STYLE)
 def test_all_36_existing_samples_preserved(self):
  for sector in SECTORS:
   for style in STYLE_NAMES:
    with self.subTest(sector=sector,style=style):
     html=(ROOT/'demo'/sector/style/'index.html').read_text('utf-8')
     self.assertIn('data-v13-industry="'+sector+'"',html)
     self.assertIn('data-v13-style="'+style+'"',html)
     self.assertIn('assets/demo.js',html)
 def test_dynamic_real_hero_and_safe_text(self):
  self.assertIn("document.querySelector('.hero.v23-hero')",JS)
  self.assertIn('new MutationObserver',JS)
  self.assertIn("body.dataset.v69Ready='true'",JS)
  self.assertIn("window.AFO_V69_DESIGN_EDITION='v69.0'",JS)
  self.assertIn("n.textContent=text",JS)
  for token in ('fetch(', 'XMLHttpRequest','sendBeacon', 'localStorage', 'sessionStorage','document.cookie','innerHTML','eval('):
   self.assertNotIn(token,JS)
 def test_does_not_replace_original_tools_or_ask_for_paid_api(self):
  self.assertIn("v69-artdirection.css",LOADER)
  self.assertIn("v69-artdirection.js",LOADER)
  for item in ('v23-industry.js','v28-catalog.js','v28-tools.js','v66-sector-artdirection.js'):
   self.assertIn(item,LOADER)
  self.assertNotIn('https://',STYLE+JS)
 def test_mobile_focus_motion_and_header_readability(self):
  for token in ('max-width:1050px','max-width:620px','prefers-reduced-motion:reduce','focus-visible',
   '.theme-premium .site-head .head-cta{background:#efe2c8!important;color:#152930!important'):
   self.assertIn(token,STYLE)
if __name__=='__main__':unittest.main()