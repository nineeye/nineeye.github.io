#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V67 offline source/route/CSP, 12 x 3 and no third-party/PII regression tests."""
from pathlib import Path
import json, re, unittest, subprocess
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
S=(ROOT/'assets/v67-compare.js').read_text('utf-8')
H=(ROOT/'design-compare-live.html').read_text('utf-8')
CSS=(ROOT/'assets/v67-compare.css').read_text('utf-8')
DAT=(ROOT/'assets/v67-industry-data.js').read_text('utf-8')
BASE=(ROOT/'assets/v66-sector-artdirection.js').read_text('utf-8')
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.links=[];self.scripts=[];self.iframes=[]
 def handle_starttag(self,tag,atts):
  d=dict(atts)
  if 'id' in d:self.ids.append(d['id'])
  if tag=='a' and d.get('href'):self.links.append(d['href'])
  if tag=='script' and d.get('src'):self.scripts.append(d['src'])
  if tag=='iframe':self.iframes.append(d)
p=Parser();p.feed(H)
class CompareChecks(unittest.TestCase):
 def test_standalone_html_and_all_relative_link_targets(self):
  self.assertEqual(len(p.ids),len(set(p.ids)))
  self.assertEqual(len(p.iframes),4)
  self.assertIn('industry-select',p.ids)
  self.assertIn('interactive-demo',p.ids)
  self.assertIn('download-scope',p.ids)
  for path in p.scripts:
   self.assertTrue((ROOT/path).is_file(),path)
  for path in p.links:
   if path.startswith('./') and '?' not in path and '#' not in path:
    self.assertTrue((ROOT/path).is_file(),path)
 def test_36_real_industry_style_pages_are_not_fake_iframes(self):
  body=json.loads(DAT.split('=',1)[1].strip().rstrip(';'))
  self.assertEqual(len(body),12)
  self.assertIn('frame.setAttribute(\'src\',url)',S)
  self.assertIn("roots.interactive.src=demoUrl(style)",S)
  self.assertIn('width:1280px',CSS)
  for sector,datum in body.items():
   with self.subTest(sector=sector):
    self.assertEqual(len(datum['targets']),4)
    self.assertEqual(len(set(datum['headlines'])),3)
    self.assertIn("\n "+sector+":{name:",BASE)
    for style in ('modern','premium','editorial'):
     f=ROOT/'demo'/sector/style/'index.html'
     self.assertTrue(f.is_file(),str(f))
     html=f.read_text('utf-8')
     self.assertIn('data-v13-industry="'+sector+'"',html)
     self.assertIn('data-v13-style="'+style+'"',html)
 def test_feature_links_use_real_selected_tab_and_allowlist(self):
  self.assertIn("url.searchParams.set('feature',String(feature))",S)
  self.assertIn("url.hash='v28-tools'",S)
  tab=(ROOT/'assets/v28-tools.js').read_text('utf-8')
  self.assertIn("/^[0-3]$/.test(selectedFeature",tab)
  self.assertIn('selectTab(initialTab)',tab)
  self.assertIn('v28Active',tab)
 def test_actual_desktop_visual_layout_splits(self):
  v66=(ROOT/'assets/v66-distinct-designs.css').read_text('utf-8')
  for mode in ('modern','premium','editorial'):
   self.assertIn('.theme-'+mode+' .v23-hero-shell',v66)
  self.assertIn('grid-template-columns:minmax(0,51%)',v66)
  self.assertIn('flex-direction:column;min-height:0!important',v66)
  self.assertIn('grid-template-columns:minmax(0,60%)',v66)
  self.assertIn('theme=modern',H)
 def test_csp_allows_same_origin_frames_but_not_untrusted_domains(self):
  headers=(ROOT/'_headers').read_text('utf-8')
  self.assertIn("X-Frame-Options: SAMEORIGIN",headers)
  self.assertIn("frame-src 'self' https://challenges.cloudflare.com",headers)
  self.assertIn("frame-ancestors 'self'",headers)
  self.assertNotIn("frame-src *",headers)
  self.assertIn("object-src 'none'",headers)
 def test_zero_cost_privacy_and_truthful_labels(self):
  self.assertIn('실제 예약·결제·진료·고객 문의 접수는 처리하지 않습니다',H)
  self.assertIn('가상 데이터',H)
  for word in ('api.openai.com','stripe.com','openai','<script src="https://'):
   self.assertNotIn(word,H+S+CSS+DAT)
  for word in ('localStorage','document.cookie','sessionStorage','sendBeacon','fetch(','XMLHttpRequest'):
   self.assertNotIn(word,S)
  self.assertIn('Blob([content]',S)
  self.assertIn('URL.createObjectURL(blob)',S)
  self.assertIn('encodeURIComponent(industry)',S)
  self.assertIn('keys.includes(params.get(',S)
  self.assertIn('STYLES.includes(params.get(',S)
 def test_responsive_and_keyboard(self):
  self.assertIn('max-width:740px',CSS)
  self.assertIn('max-width:390px',CSS)
  self.assertIn('prefers-reduced-motion:reduce',CSS)
  self.assertIn(':focus-visible',CSS)
  self.assertIn('<label',H)
  self.assertIn('aria-live="polite"',H)
 def test_homepage_access_to_live_compare(self):
  home=(ROOT/'index.html').read_text('utf-8')
  self.assertGreaterEqual(home.count('design-compare-live.html'),2)
  for name in ('assets/demo.js','assets/main.js'):
   self.assertTrue((ROOT/name).is_file())
 def test_javascript_syntax(self):
  for f in ('assets/v67-industry-data.js','assets/v67-compare.js'):
   self.assertEqual(subprocess.run(['node','--check',str(ROOT/f)],capture_output=True).returncode,0,f)
if __name__=='__main__':unittest.main(verbosity=2)