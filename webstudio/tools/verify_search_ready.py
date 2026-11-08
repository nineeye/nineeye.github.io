#!/usr/bin/env python3
"""Read-only V44 SEO and sector FAQ validation (Python stdlib only)."""
import argparse
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

INDUSTRIES = ('manufacturing','academy','interior')
SITE = 'https://allfileone-webstudio.pages.dev/'

def audit(root: Path):
    messages=[]
    def add(ok, what):
        messages.append({'passed':bool(ok),'item':what})
    titles=set()
    descs=set()
    for industry in INDUSTRIES:
        htmlfile=root/f'for-{industry}.html'
        if not htmlfile.is_file():
            add(False,'source exists '+industry)
            continue
        h=htmlfile.read_text(encoding='utf-8')
        url=SITE+f'for-{industry}.html'
        titles_found=re.findall(r'<title>([^<]+)</title>',h)
        descriptions=re.findall(r'<meta name="description" content="([^"]+)">',h)
        canonical=re.findall(r'<link rel="canonical" href="([^"]+)">',h)
        add(len(titles_found)==1,'unique title present '+industry)
        add(len(descriptions)==1,'description present '+industry)
        add(canonical==[url],'canonical matches deployed current host '+industry)
        if titles_found: titles.add(titles_found[0])
        if descriptions: descs.add(descriptions[0])
        js=re.findall(r'<script type="application/ld\+json">(.*?)</script>',h,flags=re.S)
        add(len(js)==1,'single structured data block '+industry)
        if js:
            try:
                structured=json.loads(js[0]);graph={node['@type']:node for node in structured['@graph']}
                valid=(graph['WebPage']['url']==url and graph['Service']['url']==url and graph['Service']['provider']['name']=='올파일원 웹스튜디오' and len(graph)==2)
                assert structured['@context']=='https://schema.org'
                add(valid,'WebPage and Service fact-aligned '+industry)
                add('FAQPage' not in str(structured) and 'aggregateRating' not in str(structured),'no unsupported rich result claim '+industry)
            except (KeyError,ValueError,TypeError,AssertionError) as exc:
                add(False,f'schema parse {industry}: {exc}')
        add(h.count('<details class="v44-faq-item">')==4,'four visible FAQs '+industry)
        add(h.count('<summary>')==4,'native accessible summary '+industry)
        add(h.count('href="#faq"')==1,'in-page FAQ jump '+industry)
        add('id="v44-faq-title"' in h,'FAQ has labeled heading '+industry)
        add('assets/v44-sector-search.css' in h,'shared CSS linked '+industry)
        add('data-v43-lab' in h,'V43 live-demo retained '+industry)
        add('data-v38-planner' in h,'V38 planner retained '+industry)
        add(f'contact.html?source=sector&industry={industry}' in h,'V39 approved CTA retained '+industry)
        add('실제 문의가 자동 발송되는 것은 아닙니다' in h,'no automated email claim '+industry)
    add(len(titles)==3,'distinct titles for 3 sectors')
    add(len(descs)==3,'distinct description for 3 sectors')
    add((root/'assets/v44-sector-search.css').is_file(),'V44 stylesheet exists')
    add((root/'assets/v38-solutions.js').is_file(),'V38 planner JavaScript available')
    add((root/'assets/v43-industry-lab.js').is_file(),'V43 demo JavaScript available')
    robots=root/'robots.txt'
    sitemap=root/'sitemap.xml'
    if robots.exists() and sitemap.exists():
        text=robots.read_text(encoding='utf-8')
        add('Sitemap: '+SITE+'sitemap.xml' in text,'robots sitemap advertised')
        add('Disallow: /' not in text.replace('Disallow: /demo/',''),'no blanket disallow')
        add('Disallow: /demo/' in text,'existing fictional demo index avoidance retained')
        tree=ET.parse(sitemap)
        entries={e.text for e in tree.getroot().iter() if e.tag.endswith('loc')}
        for industry in INDUSTRIES:
            add(SITE+f'for-{industry}.html' in entries,'site map contains '+industry)
    else:
        messages.append({'passed':None,'item':'repository-wide robots and sitemap verification skipped (partial overlay); check in full checkout'})
    return {'checks':len([m for m in messages if m['passed'] is not None]),'pass':sum(m['passed'] is True for m in messages),'fail':sum(m['passed'] is False for m in messages),'hold':sum(m['passed'] is None for m in messages),'messages':messages}

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]/'source/webstudio')
    ap.add_argument('--report',type=Path)
    ns=ap.parse_args()
    result=audit(ns.root)
    if ns.report:
        ns.report.parent.mkdir(parents=True,exist_ok=True)
        ns.report.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k!='messages'},ensure_ascii=False))
    for m in result['messages']:
        if m['passed'] is False: print('FAIL',m['item'])
        if m['passed'] is None: print('HOLD',m['item'])
    sys.exit(1 if result['fail'] else 0)
