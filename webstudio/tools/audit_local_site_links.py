#!/usr/bin/env python3
"""Read-only static-site relative link audit. Python stdlib, zero API/billing.

Usage: python audit_local_site_links.py --root C:\\site --output audit.json
Only href/src/action/poster on HTML are checked. JavaScript-generated URLs, APIs,
remote resources, client-side routing, CSS url() and actual HTTP are NOT validated.
"""
from __future__ import annotations
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit

MAX_FILE_BYTES = 2_000_000
CHECK_ATTRS = {'href', 'src', 'action', 'poster'}
SKIP_SCHEMES = {'http', 'https', 'mailto', 'tel', 'data', 'blob', 'sms', 'geo'}

class Links(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.add(attrs['id'])
        for name in CHECK_ATTRS:
            if name in attrs and attrs[name] is not None:
                self.links.append((name, attrs[name]))
    handle_startendtag = handle_starttag

def audit(root: Path, check_fragments: bool = False) -> dict:
    root = root.resolve(strict=True)
    errors, ignored, checked = [], 0, 0
    pages = sorted(p for p in root.rglob('*.html') if p.is_file() and not p.is_symlink())
    parse = {}
    for page in pages:
        if page.stat().st_size > MAX_FILE_BYTES:
            errors.append({'source': page.relative_to(root).as_posix(), 'kind':'oversized_html'})
            continue
        try:
            doc = Links()
            doc.feed(page.read_text(encoding='utf-8'))
            parse[page] = doc
        except (UnicodeError, ValueError, OSError) as exc:
            errors.append({'source':page.relative_to(root).as_posix(),'kind':'parse_error','detail':str(exc)[:120]})
    for page, doc in parse.items():
        rel = page.relative_to(root).as_posix()
        for attr, raw in doc.links:
            raw = raw.strip()
            if not raw or raw.startswith('//') or '${' in raw or '{{' in raw:
                ignored += 1
                continue
            try: url = urlsplit(raw)
            except ValueError:
                errors.append({'source':rel,'attribute':attr,'link':raw[:250],'kind':'bad_url'})
                continue
            if url.scheme.lower() in SKIP_SCHEMES or url.path.startswith('/api/'):
                ignored += 1
                continue
            if url.scheme:
                errors.append({'source':rel,'attribute':attr,'link':raw[:250],'kind':'unknown_scheme'})
                continue
            target = root / unquote(url.path.lstrip('/')) if url.path.startswith('/') else page.parent / unquote(url.path)
            try: resolved = target.resolve(strict=False)
            except OSError:
                errors.append({'source':rel,'attribute':attr,'link':raw[:250],'kind':'invalid_path'})
                continue
            try: resolved.relative_to(root)
            except ValueError:
                errors.append({'source':rel,'attribute':attr,'link':raw[:250],'kind':'path_escape'})
                continue
            if url.path:
                checked += 1
                if not (resolved.is_file() or (resolved.is_dir() and (resolved / 'index.html').is_file())):
                    errors.append({'source':rel,'attribute':attr,'link':raw[:250],'kind':'missing_file'})
            if check_fragments and url.fragment:
                refpage = page if not url.path else ((resolved/'index.html') if resolved.is_dir() else resolved)
                if refpage in parse and unquote(url.fragment) not in parse[refpage].ids:
                    errors.append({'source':rel,'attribute':attr,'link':raw[:250],'kind':'missing_anchor'})
    return {'root':str(root),'pages':len(pages),'parsed_pages':len(parse),'local_paths_checked':checked,
            'external_or_dynamic_ignored':ignored,'errors':errors,'status':'PASS' if not errors else 'FAIL',
            'scope':'Static HTML href/src/action/poster paths only; not browser/cloud/server end-to-end.'}

def main():
    p = argparse.ArgumentParser(description='Static HTML link audit (read only)')
    p.add_argument('--root', type=Path, required=True)
    p.add_argument('--output', type=Path)
    p.add_argument('--fragments', action='store_true')
    args = p.parse_args()
    result = audit(args.root, args.fragments)
    text = json.dumps(result, indent=2, ensure_ascii=False) + '\n'
    if args.output:
        if args.output.resolve() == args.root.resolve() or args.output.is_dir():
            p.error('output must be a JSON file path')
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding='utf-8')
    print(text)
    raise SystemExit(0 if result['status'] == 'PASS' else 1)

if __name__ == '__main__':
    main()