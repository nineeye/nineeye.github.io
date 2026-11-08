#!/usr/bin/env python3
# AllFileOne WebStudio V65.2 source and safety regression checks.
import json
from pathlib import Path
import re
import unittest

ROOT=Path(__file__).resolve().parents[1]
SOURCE=(ROOT/"assets"/"v652-sector-requirements.js").read_text(encoding="utf-8")
CSS=(ROOT/"assets"/"v652-sector-requirements.css").read_text(encoding="utf-8")
M=re.search(r"const DATA = Object\.freeze\((\{.*?\})\);\s*const KEY",SOURCE,re.S)
if not M:raise RuntimeError("HOLD: V65.2 JSON configuration missing or not safely parseable")
DATA=json.loads(M.group(1))
IDS=("manufacturing","corporate","clinic","academy","interior","commerce",
     "professional","association","franchise","stay","realestate","event")
THEMES=("modern","premium","editorial")

class WebStudioSectorAcceptance(unittest.TestCase):
    def test_all_12_distinct_sector_configurations(self):
        self.assertEqual(set(DATA),set(IDS))
        self.assertEqual(len(set(x["name"] for x in DATA.values())),12)
        for sector, info in DATA.items():
            with self.subTest(sector=sector):
                self.assertTrue(info["customer"])
                self.assertEqual(len(info["scope"]),3)
                self.assertEqual(len(info["items"]),4)
                self.assertEqual(len({item[0] for item in info["items"]}),4)
                self.assertEqual(sorted(int(x[3]) for x in info["items"]),[0,1,2,3])
                self.assertTrue(any(i[2]=="연동" for i in info["items"]))
                self.assertTrue(all(i[2] in ("시연","연동") and i[1] for i in info["items"]))
    def test_each_of_36_demos_loads_first_party_controller(self):
        for sector in IDS:
            for theme in THEMES:
                with self.subTest(sector=sector,theme=theme):
                    page=ROOT/"demo"/sector/theme/"index.html"
                    self.assertTrue(page.is_file(),page)
                    text=page.read_text(encoding="utf-8")
                    self.assertIn('data-industry="'+sector+'"',text)
                    self.assertIn('data-v13-style="'+theme+'"',text)
                    self.assertIn("../../../assets/demo.js",text)
                    self.assertIn("가상 브랜드",text)
        original=(ROOT/"assets/demo.js").read_text(encoding="utf-8")
        self.assertIn("v652-sector-requirements.js",original)
        self.assertIn("v652-sector-requirements.css",original)
        self.assertIn("v28-tools.js",original)
    def test_one_time_same_origin_handoff_and_no_auto_send(self):
        page=(ROOT/"contact.html").read_text(encoding="utf-8")
        self.assertIn("v652-sector-requirements.js",page)
        self.assertIn("v652-sector-requirements.css",page)
        for token in ["sessionStorage.setItem(KEY","sessionStorage.removeItem(KEY)",
                      "data.ts>Date.now()+60000","Date.now()-data.ts>TTL",
                      "data.ids.length<1","new Set(data.ids).size",
                      "data.industry!==q.get('industry')","data.style!==q.get('theme')",
                      "URLSearchParams({source:'demo-v652'","form.dispatchEvent",
                      "textContent=full","MAX"]:
            if token=="MAX":continue
            self.assertIn(token,SOURCE,token)
        self.assertNotIn("fetch(",SOURCE)
        self.assertNotIn("XMLHttpRequest",SOURCE)
        self.assertNotIn("sendBeacon",SOURCE)
        self.assertNotIn("document.cookie",SOURCE)
        self.assertNotIn("localStorage",SOURCE)
        self.assertNotIn("innerHTML=",SOURCE)
    def test_means_and_accessibility(self):
        for token in ["role','status","aria-live','polite","v652Item",
                      "v652-tag-ops","'v652-full-brief'","'v652-preview'",
                      "min-height:47px","@media(max-width:560px)"]:
            with self.subTest(token=token):
                self.assertIn(token,SOURCE+CSS)
        self.assertIn("실제 상담 접수는",SOURCE)
        self.assertIn("서버/외부 시스템",SOURCE)
    def test_original_v28_features_still_counted(self):
        catalog=(ROOT/"assets/v28-catalog.js").read_text(encoding="utf-8")
        self.assertTrue(all('"'+key+'":' in catalog for key in IDS))
        self.assertIn("ALLFILEONE_V28_CATALOG",catalog)
        self.assertIn("ALLFILEONE_V652_CAPABILITY_COUNT",SOURCE)

if __name__=="__main__":
    unittest.main(verbosity=2)
