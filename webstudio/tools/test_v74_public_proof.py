# -*- coding: utf-8 -*-
"""Static, offline gates: V74 public proof is safe, version-accurate, and fail-closed."""
import json, re, subprocess, unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
HTML=(R/'site-proof-v74.html').read_text('utf-8')
JS=(R/'assets/v74-public-proof.js').read_text('utf-8')
CSS=(R/'assets/v74-public-proof.css').read_text('utf-8')
M=json.loads((R/'assets/current-release.json').read_text('utf-8'))
V=json.loads((R/'assets/release-v74.json').read_text('utf-8'))
S=(R/'site-check.html').read_text('utf-8')
O=(R/'owner-launch.html').read_text('utf-8')
class PublicProof(unittest.TestCase):
 def test_v74_exact_version_and_clear_distinction(self):
  self.assertEqual(M['v74_public_proof_version'],'V74-20261109')
  self.assertEqual(V['release'],'V74-20261109')
  self.assertTrue(V['public_proof'])
  self.assertFalse(V['mail_receipt_verified'])
  self.assertFalse(M['v74_verified_cloudflare_public'])
  self.assertFalse(M['v74_verified_real_customer_mail'])
  self.assertTrue(M['v74_public_audit_no_mail_receipt_claim'])
  self.assertTrue(M['v73_scope_guard_version'])
  self.assertIn('m.v74_public_proof_version===exactVersion',JS)
  self.assertIn("m.v73_scope_guard_version==='V73-20261109'",JS)
  self.assertIn("m.v72_complete_packet_version==='V72-20261109'",JS)
 def test_all_36_actual_static_demo_pages(self):
  # The ordered array is a static source of truth; reject accidental deletion.
  sectors=['manufacturing','corporate','clinic','academy','interior','commerce','professional','association','franchise','stay','realestate','event']
  self.assertIn("const sectors=Object.freeze([",JS)
  for industry in sectors:
   self.assertIn("'"+industry+"'",JS)
   for style in ('modern','premium','editorial'):
    p=R/'demo'/industry/style/'index.html'
    self.assertTrue(p.is_file(),str(p))
    self.assertIn('data-industry="'+industry+'"',p.read_text('utf-8'))
  self.assertIn("html.includes('data-v13-style=",JS)
  self.assertIn('../../../assets/demo.js',JS)
 def test_catalog_12_times_4_real_features(self):
  source=(R/'assets/v28-catalog.js').read_text('utf-8')
  m=re.search(r'Object.freeze\((\{.*\})\);',source)
  self.assertIsNotNone(m)
  d=json.loads(m.group(1));self.assertEqual(len(d),12)
  self.assertEqual(sum(len(x['features']) for x in d.values()),48)
  self.assertIn('window.ALLFILEONE_V28_CATALOG',JS)
  self.assertIn('catalog[id].features.length===4',JS)
  self.assertIn('assets/v28-catalog.js',HTML)
 def test_no_external_upload_and_false_positive_guards(self):
  for marker in ('AbortController','cache:\'no-store\'','r.ok','data.length>2000000','target.origin!==root.origin','new URL(r.url).origin!==root.origin'):
   self.assertIn(marker,JS)
  for marker in ('실제 이메일 송수신','메일','실제','미검증'):
   self.assertIn(marker,JS+HTML)
  for forbidden in ('sendBeacon(', 'XMLHttpRequest', 'localStorage.', 'sessionStorage.', 'document.cookie'):
   self.assertNotIn(forbidden,JS)
  self.assertNotIn('innerHTML=',JS)
  self.assertIn('HTTP 응답은 받았으나 해당 버전의 본문이 아닙니다',JS)
  self.assertIn("state.version.startsWith('V74')",JS)
 def test_both_site_owner_paths_and_accessibility(self):
  self.assertIn('site-proof-v74.html',S)
  self.assertIn('site-proof-v74.html',O)
  self.assertIn('id="check-all"',HTML)
  self.assertIn('id="proof-save"',HTML)
  self.assertIn('role="status" aria-live="polite"',HTML)
  self.assertIn('max-width:530px',CSS)
  self.assertIn('prefers-reduced-motion',CSS)
 def test_javascript_parse_and_nonindex(self):
  result=subprocess.run(['node','--check',str(R/'assets/v74-public-proof.js')],capture_output=True,text=True)
  self.assertEqual(result.returncode,0,result.stderr)
  self.assertIn('noindex,nofollow',HTML)
  self.assertIn('rel="canonical"',HTML)
if __name__=='__main__':unittest.main(verbosity=2)