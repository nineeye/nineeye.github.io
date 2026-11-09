#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V65.3 production-versus-demo buyer funnel regression.
Source checks do not prove public website functionality; Edge checks do.
"""
import unittest
from pathlib import Path
import re, json

ROOT=Path(__file__).resolve().parents[1]
SOURCE=(ROOT/"assets/v653-sales-bridge.js").read_text(encoding="utf-8")
SECTOR=(ROOT/"assets/v652-sector-requirements.js").read_text(encoding="utf-8")
CSS=(ROOT/"assets/v653-sales-bridge.css").read_text(encoding="utf-8")
PLAN=(ROOT/"plan-guide.html").read_text(encoding="utf-8")
CONTACT=(ROOT/"contact.html").read_text(encoding="utf-8")
DEMOS=(ROOT/"assets/demo.js").read_text(encoding="utf-8")
M=re.search(r"const DATA = Object\.freeze\((\{.*?\})\);\s*const KEY",SECTOR,re.S)
DATA=json.loads(M.group(1)) if M else {}

class BuyerSalesBridge(unittest.TestCase):
    def test_catalog_and_all_demo_launches(self):
        self.assertEqual(len(DATA),12)
        self.assertIn("window.AFO_V652_REQUIREMENTS=DATA",SECTOR)
        self.assertIn("v653-to-plan",SECTOR)
        self.assertIn("afo.webstudio.v653.offer",SECTOR)
        for sector in DATA:
            for style in ("modern","premium","editorial"):
                with self.subTest(sector=sector,style=style):
                    page=ROOT/"demo"/sector/style/"index.html"
                    self.assertTrue(page.is_file())
                    self.assertIn("../../../assets/demo.js",page.read_text(encoding="utf-8"))
        self.assertIn("v652-sector-requirements.js",DEMOS)
    def test_plan_and_contact_reuse_exact_price_model(self):
        self.assertIn('assets/v33-estimate-model.js',PLAN)
        self.assertIn("assets/v653-sales-bridge.js",PLAN)
        self.assertIn("assets/v652-sector-requirements.js",PLAN)
        self.assertIn("assets/v653-sales-bridge.css",PLAN)
        self.assertIn("assets/v33-estimate-model.js",CONTACT)
        self.assertIn("assets/v653-sales-bridge.js",CONTACT)
        self.assertIn("MODEL.calculate(offer.plan,offer.addons)",SOURCE)
        self.assertIn("MODEL.calculate(r.plan,r.addons)",SOURCE)
        self.assertIn("price.addons",SOURCE)
        self.assertIn("DATA",SECTOR)
        self.assertIn("v35-plan-guide.js",PLAN)
    def test_one_time_local_storage_allowlists_and_guardrails(self):
        for token in ("sessionStorage.setItem(CONTACT_KEY",
                      "sessionStorage.getItem(key)","sessionStorage.removeItem(key)",
                      "raw.industry===q.get('industry')","raw.style===q.get('theme')",
                      "r.industry!==q.get('industry')","r.theme!==q.get('theme')",
                      "timeOk(r.ts)","validReq(r.req)","new Set(req.ids).size===req.ids.length",
                      "Array.isArray(r.terms)","!r.terms.every(x=>has(STATUSES,x))",
                      "form.dispatchEvent(new Event('input'",
                      "document.body.dataset.v653Imported='true'"):
            with self.subTest(token=token):self.assertIn(token,SOURCE)
        for forbidden in ("fetch(", "XMLHttpRequest", "sendBeacon", "document.cookie", "localStorage", "innerHTML=", "eval("):
            with self.subTest(forbidden=forbidden):self.assertNotIn(forbidden,SOURCE)
        self.assertNotIn("password",SOURCE.lower())
    def test_eight_real_precontract_topics_and_clear_nonpromises(self):
        found=re.search(r"const TERMS=Object\.freeze\(\[(.*?)\]\);",SOURCE,re.S)
        self.assertIsNotNone(found)
        self.assertEqual(found.group(1).count("['"),8)
        for term in ("ownership","source","revision","operations","privacy","acceptance"):
            self.assertIn("['"+term+"'",SOURCE)
        for word in ("확정 금액이 아닙니다","별도 협의","계약","자동 발송","결제"):
            self.assertIn(word,SOURCE)
    def test_mobile_and_keyboard(self):
        for token in ("@media(max-width:560px)","min-height:50px","focus-visible","overflow-wrap:anywhere","grid-template-columns:minmax(0,1fr)"):
            with self.subTest(token=token):self.assertIn(token,CSS)
        self.assertIn("aria-live','polite",SOURCE)
        self.assertIn("label.htmlFor",SOURCE) if "label.htmlFor" in SOURCE else self.assertIn("left.htmlFor",SOURCE)
    def test_cloudflare_exact_release_asset_guard(self):
        workflow=(ROOT.parent/".github/workflows/webstudio-v64-public-browser.yml").read_text(encoding="utf-8")
        self.assertIn("v653_patch_date",workflow)
        self.assertIn("v653_buyers_demo_to_pricing_to_consult",workflow)
        self.assertTrue(any(marker in workflow for marker in ("EXACT_V65_3_PUBLIC_MANIFEST_AND_BOTH_JAVASCRIPTS_VERIFIED","EXACT_V66_PUBLIC_MANIFEST_THREE_JS_AND_CSS_VERIFIED","EXACT_V69_PUBLIC_MANIFEST_AND_DESIGN_ASSETS_VERIFIED","EXACT_V70_PUBLIC_MANIFEST_AND_BUYER_ASSETS_VERIFIED","EXACT_V71_PUBLIC_MANIFEST_AND_FULL_BRIEF_ASSETS_VERIFIED","EXACT_V73_PUBLIC_MANIFEST_AND_SCOPE_GUARD_VERIFIED")))
        self.assertIn("v652-sector-requirements.js",workflow)
        self.assertIn("v653-sales-bridge.js",workflow)
        self.assertIn("if (-not $ready) { throw",workflow)
        edge=(ROOT/"tools/v653_live_sales_qa.py").read_text(encoding="utf-8")
        self.assertIn("comparison CTA absent from PUBLIC site",edge)
    def test_existing_sales_and_direct_contact_remain(self):
        self.assertIn("v652-primary",SECTOR)
        self.assertIn("v51-quick-handoff.js",CONTACT)
        self.assertIn("v60-scope-handoff.js",CONTACT)
        self.assertIn("v35-plan-guide.js",PLAN)
        self.assertIn("v653-to-plan",SECTOR)

if __name__=="__main__":unittest.main(verbosity=2)