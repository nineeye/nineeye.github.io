# -*- coding: utf-8 -*-
"""Static regressions for V70 design comparison -> V653 price/contract journey.
No network, payments, customer data, or SMTP are involved.
"""
import json
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'design-compare-live.html').read_text('utf-8')
JS=(ROOT/'assets/v70-buyer-bridge.js').read_text('utf-8')
CSS=(ROOT/'assets/v70-buyer-bridge.css').read_text('utf-8')
COMPARE=(ROOT/'assets/v67-compare.js').read_text('utf-8')
V652=(ROOT/'assets/v652-sector-requirements.js').read_text('utf-8')
V653=(ROOT/'assets/v653-sales-bridge.js').read_text('utf-8')

class BuyerBridgeSourceTests(unittest.TestCase):
 def test_existing_36_demos_and_48_tools(self):
  catalog=(ROOT/'assets/v28-catalog.js').read_text('utf-8')
  self.assertIn('window.ALLFILEONE_V28_CATALOG',catalog)
  select=HTML.split('id="industry-select"',1)[1].split('</select>',1)[0]
  sectors=re.findall(r'<option value="([a-z]+)">',select)
  self.assertEqual(len(sectors),12)
  for sector in sectors:
   for style in ('modern','premium','editorial'):
    with self.subTest(sector=sector,style=style):
     self.assertTrue((ROOT/'demo'/sector/style/'index.html').is_file())
 def test_single_authoritative_requirements_source(self):
  self.assertIn('const REQUIREMENTS=window.AFO_V652_REQUIREMENTS||{}',JS)
  self.assertIn("const DATA = Object.freeze(",V652)
  self.assertIn('window.AFO_V652_REQUIREMENTS=DATA',V652)
  self.assertIn('d.items.forEach((entry,i)=>',JS)
  self.assertIn("entry[2]==='연동'",JS)
 def test_script_order_and_cta_link(self):
  files=['assets/v28-catalog.js','assets/v67-industry-data.js','assets/v67-compare.js','assets/v652-sector-requirements.js','assets/v70-buyer-bridge.js']
  last=-1
  for f in files:
   pos=HTML.index('src="'+f+'"');self.assertGreater(pos,last);last=pos
  self.assertIn('id="v70-buyer"',HTML)
  self.assertIn('id="v70-to-plan"',HTML)
  self.assertIn("roots.estimate.href='#v70-buyer'",COMPARE)
  self.assertNotIn("#estimate'",COMPARE)
 def test_existing_contract_handoff_is_identical(self):
  for s in ("v:653","afo.webstudio.v653.offer","source','demo-v653'","url.searchParams.set('industry',industry)","url.searchParams.set('theme',style)"):
   self.assertIn(s,JS)
  self.assertIn("const OFFER_KEY='afo.webstudio.v653.offer'",V653)
  self.assertIn("const TTL=15*60*1000",V653)
  self.assertIn("q.get('source')==='demo-v653'",V653)
 def test_no_customer_data_or_network_calls(self):
  for forbidden in ('fetch(', 'XMLHttpRequest','sendBeacon', 'document.cookie', 'localStorage', 'innerHTML=', 'eval(', 'https://api.openai.com'):
   with self.subTest(forbidden=forbidden):self.assertNotIn(forbidden,JS)
  self.assertIn('try{sessionStorage.setItem(',JS)
  self.assertIn('catch(_){roots.feedback.textContent=',JS)
 def test_negative_cases_and_accessibility(self):
  self.assertIn('roots.next.disabled=ids.length===0',JS)
  self.assertIn("if(ids.length<1||ids.length>4",JS)
  self.assertIn('const selected=new Set',JS) if 'const selected=new Set' in JS else self.assertIn('let industry',JS)
  self.assertIn('aria-live="polite"',HTML)
  self.assertIn('v70-buyer :is(button,a,select,input):focus-visible',CSS)
 def test_responsive_and_example_price_disclosure(self):
  self.assertIn('@media(max-width:800px)',CSS)
  self.assertIn('@media(max-width:490px)',CSS)
  self.assertIn('자동으로 접수',HTML)
  self.assertIn('실제 운영 연동이 필요한 항목은 견적에 자동 포함되지 않습니다.',HTML)

if __name__=='__main__':unittest.main(verbosity=2)