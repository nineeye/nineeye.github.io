# -*- coding: utf-8 -*-
"""V71 buyer contact mail handoff: no silent truncation of the complete brief."""
from pathlib import Path
import re
import unittest
ROOT=Path(__file__).resolve().parents[1]
J=(ROOT/'assets/v653-sales-bridge.js').read_text('utf-8')
C=(ROOT/'assets/v653-sales-bridge.css').read_text('utf-8')
HTML=(ROOT/'contact.html').read_text('utf-8')
PLAN=(ROOT/'plan-guide.html').read_text('utf-8')

class V71FullBriefContract(unittest.TestCase):
 def test_actual_original_contact_limit(self):
  self.assertRegex(HTML, r'<textarea[^>]*name="details"[^>]*maxlength="700"')
  self.assertIn("details.value=merged.length<=max?merged:",J)
  self.assertIn("const full=lines.join('\\n')",J)
 def test_preserve_complete_export_instead_of_silent_crop(self):
  for term in ('v71-full-actions','fullMailto()',"['\\ufeff',full]",'AllFileOne_V71_Full_Buyer_Brief.txt',
               "await navigator.clipboard.writeText(full)",'상담서의 추가 요청 입력란은 700자로 제한'):
   with self.subTest(term=term):self.assertIn(term,J)
  self.assertIn('panel.dataset.v71FullBrief=',J)
 def test_mail_has_explicit_owner_action_and_cap(self):
  self.assertIn('mailto:nineeyes@naver.com?subject=',J)
  self.assertIn('if(url.length>1800)',J)
  self.assertIn('전체 내용은 TXT를 별도로 첨부하거나 복사해야',J)
  self.assertIn('아직 메일은 전송되지 않았습니다',J)
  self.assertIn('전체 준비서 복사',J)
 def test_real_plan_v70_contract_retained(self):
  self.assertIn("const OFFER_KEY='afo.webstudio.v653.offer', CONTACT_KEY='afo.webstudio.v653.contact'",J)
  self.assertIn("location.assign('./contact.html?'+query.toString()+'#brief')",J)
  self.assertIn('window.AFO_V653_TERMS_COUNT=TERMS.length',J)
  self.assertIn('window.AFO_V71_FULL_BRIEF=',J)
  self.assertIn('assets/v653-sales-bridge.js',HTML)
  self.assertIn('assets/v653-sales-bridge.js',PLAN)
 def test_no_auto_submission_or_network(self):
  for forbidden in ('fetch(', 'XMLHttpRequest','sendBeacon(', 'localStorage.', 'eval(', 'smtp.', 'api.openai.com'):
   with self.subTest(term=forbidden):self.assertNotIn(forbidden,J)
  self.assertNotIn('location.assign(mail',J)
 def test_responsive_export_buttons(self):
  self.assertIn('.v71-full-actions',C)
  self.assertIn('.v71-mailto',C)
  self.assertIn('@media(max-width:560px)',C)
 def test_commercial_precontract_disclosures(self):
  self.assertIn('실제 계약·결제·예약 접수가 아닙니다.',J)
  self.assertIn('계약 전 8개 확인 조건',J)
  self.assertIn('견적',J)

if __name__=='__main__': unittest.main(verbosity=2)