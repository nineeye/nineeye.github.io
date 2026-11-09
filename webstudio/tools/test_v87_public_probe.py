# -*- coding: utf-8 -*-
import unittest
from pathlib import Path
import v87_public_probe as P
R=Path(__file__).resolve().parents[1]
class Probe(unittest.TestCase):
 def test_23_local_contracts(self):
  r=P.run(getter=lambda p:(R/p).read_text('utf8'))
  self.assertEqual(r['passed'],len(P.CHECKS),str([x for x in r['rows'] if not x['pass']]))
  self.assertEqual(len(P.CHECKS),23)
 def test_missing_file_is_hold(self):
  r=P.run(getter=lambda p: (_ for _ in ()).throw(FileNotFoundError(p)))
  self.assertEqual(r['passed'],0)
 def test_home_fallback_false_200_is_hold(self):
  r=P.run(getter=lambda p:'<html><h1>index</h1></html>')
  self.assertEqual(r['passed'],0)
 def test_wrong_host_disallowed(self):
  with self.assertRaises(ValueError):P.run(origin='https://untrusted.test/',getter=lambda p:'')
 def test_email_and_payment_not_verified(self):
  r=P.run(getter=lambda p:(R/p).read_text('utf8'))
  self.assertEqual(r['real_customer_email'],'NOT_VERIFIED')
  self.assertEqual(r['booking_payment_database'],'NOT_IMPLEMENTED')
if __name__=='__main__':unittest.main()
