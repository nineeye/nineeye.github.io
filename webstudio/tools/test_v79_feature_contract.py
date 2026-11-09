# -*- coding: utf-8 -*-
"""V79 deterministic, offline, 12 sectors × 6 simulations + 2 openly unbuilt options."""
from pathlib import Path
import json,re,unittest,subprocess
W=Path(__file__).resolve().parents[1];A=W/'assets'
def jsdata(name):
    txt=(A/name).read_text('utf-8')
    m=re.search(r'Object\.freeze\((\{.*\})\);',txt,re.S)
    if not m: raise RuntimeError(name)
    return json.loads(m.group(1))
class V79Contract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.c=jsdata('v28-catalog.js');cls.e=jsdata('v77-feature-data.js');cls.v78=jsdata('v78-simulator-data.js');cls.v79=jsdata('v79-simulator-data.js')
    def test_twelve_unique_industries_and_96_cards(self):
        self.assertEqual(set(self.c),set(self.e));self.assertEqual(set(self.c),set(self.v78));self.assertEqual(set(self.c),set(self.v79));self.assertEqual(len(self.c),12)
        for sector in self.c:
            with self.subTest(sector=sector):
                base=self.c[sector]['features'];extra=self.e[sector]['extra'];a=self.v78[sector]['index'];b=self.v79[sector]['index']
                self.assertEqual(len(base),4);self.assertEqual(len(extra),4)
                self.assertNotEqual(a,b)
                self.assertIn(a,range(4));self.assertIn(b,range(4))
                self.assertEqual([f['status'] for f in extra].count('simulated'),2)
                self.assertEqual([f['status'] for f in extra].count('planned'),2)
                self.assertEqual(extra[a]['status'],'simulated');self.assertEqual(extra[b]['status'],'simulated')
                self.assertEqual(len({f['title'] for f in base+extra}),8)
    def test_demos_preserved_and_v79_module_loaded_in_all_three_surfaces(self):
        self.assertEqual(sum((W/'demo'/s/t/'index.html').is_file() for s in self.c for t in ('modern','premium','editorial')),36)
        for name in ['v77-feature-showcase.js','v77-industry-hub.js','v77-compare-extend.js']:
            t=(A/name).read_text('utf-8');self.assertIn('simulated',t);self.assertIn('planned',t)
        self.assertIn('v79-simulator.js',(A/'demo.js').read_text('utf-8'))
        for page in ['feature-lab-v79.html','industry-features-v77.html','design-compare-live.html']:
            s=(W/page).read_text('utf-8');self.assertLess(s.index('v79-simulator-data.js'),s.index('v79-simulator.js'));self.assertIn('v79-simulator.js',s)
    def test_no_network_no_account_no_real_transactions(self):
        for name in ['v79-simulator.js','v79-lab.js','v77-feature-showcase.js','v77-compare-extend.js','v77-industry-hub.js']:
            s=(A/name).read_text('utf-8')
            for bad in ('fetch(', 'XMLHttpRequest','sendBeacon(', 'localStorage','sessionStorage','WebSocket(', 'document.cookie'):
                self.assertNotIn(bad,s,name+' '+bad)
        js=(A/'v79-simulator.js').read_text('utf-8');self.assertIn('가상',js);self.assertIn('실제',js)
    def test_valid_js_for_all_relevant_assets(self):
        for n in ['v79-simulator-data.js','v79-simulator.js','v79-lab.js','v77-feature-showcase.js','v77-industry-hub.js','v77-compare-extend.js','v77-feature-data.js','demo.js']:
            p=subprocess.run(['node','--check',str(A/n)],capture_output=True,text=True);self.assertEqual(p.returncode,0,n+':'+p.stderr)
    def test_release_truth(self):
        j=json.loads((A/'current-release.json').read_text('utf-8'))
        self.assertEqual(j['v79_total_browser_simulations'],72)
        self.assertEqual(j['v79_planned_unbuilt_feature_count'],24)
        self.assertIs(j['v79_public_cloudflare_verified'],False)
        self.assertIs(j['v79_real_customer_mail_verified'],False)
        self.assertIs(j['v79_production_backend_available'],False)
if __name__=='__main__':unittest.main(verbosity=2)