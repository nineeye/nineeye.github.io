#!/usr/bin/env python3
"""V53 read-only release check: local links, required pages and release metadata."""
import argparse
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import re

REQUIRED = ("index.html", "contact.html", "builder.html", "assets/current-release.json")

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []
        self.ids = set()
        self.lang = False
        self.in_title = False
        self.title = ""
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html" and attrs.get("lang") == "ko": self.lang = True
        if tag == "title": self.in_title = True
        if attrs.get("id"): self.ids.add(attrs["id"])
        for key in ("href", "src"):
            if key in attrs: self.refs.append(attrs[key])
    def handle_endtag(self, tag):
        if tag == "title": self.in_title = False
    def handle_data(self, data):
        if self.in_title: self.title += data

def check(root):
    root = root.resolve()
    problems = []
    def add(level, code, source, detail):
        problems.append({"severity": level, "code": code, "file": str(source), "detail": str(detail)})
    for required in REQUIRED:
        if not (root / required).is_file():
            add("FAIL", "REQUIRED_MISSING", required, "required file missing")
    release = root / "assets/current-release.json"
    if release.is_file():
        try:
            data = json.loads(release.read_text(encoding="utf-8-sig"))
            if not re.fullmatch(r"V\d+", str(data.get("version", ""))):
                add("FAIL", "VERSION_INVALID", "assets/current-release.json", "release version must be V-number")
        except (OSError, ValueError) as err:
            add("FAIL", "MANIFEST_INVALID", "assets/current-release.json", err)
    checked = 0
    for page in sorted(root.rglob("*.html")):
        if any(part in (".git", "node_modules", "vendor") for part in page.relative_to(root).parts):
            continue
        checked += 1
        rel = page.relative_to(root)
        try:
            p = Parser()
            p.feed(page.read_text(encoding="utf-8-sig"))
        except (OSError, UnicodeError) as err:
            add("FAIL", "HTML_UNREADABLE", rel, err)
            continue
        if not p.lang: add("WARN", "KOREAN_LANG_MISSING", rel, 'html lang="ko" missing')
        if not p.title.strip(): add("WARN", "TITLE_MISSING", rel, "page title missing")
        for raw in p.refs:
            raw = raw.strip()
            if not raw or raw.startswith(("mailto:", "tel:", "data:", "javascript:", "//")): continue
            parsed = urlsplit(raw)
            if parsed.scheme or parsed.netloc: continue
            target = (root / unquote(parsed.path).lstrip("/")) if parsed.path.startswith("/") else (page.parent / unquote(parsed.path))
            try:
                target = target.resolve()
                target.relative_to(root)
            except (ValueError, OSError):
                add("FAIL", "PATH_ESCAPE", rel, raw)
                continue
            if parsed.path and not (target.is_file() or (target.is_dir() and (target / "index.html").is_file())):
                add("FAIL", "BROKEN_LOCAL_LINK", rel, raw)
            if not parsed.path and parsed.fragment and parsed.fragment not in p.ids:
                add("WARN", "MISSING_SELF_ANCHOR", rel, raw)
    status = "FAIL" if any(x["severity"] == "FAIL" for x in problems) else "PASS"
    return {"status": status, "pages_checked": checked, "issues": problems, "offline_only": True,
            "external_links": "NOT_CHECKED", "cloudflare": "NOT_CHECKED"}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("site_root", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = check(args.site_root)
    result = json.dumps(report, ensure_ascii=False, indent=2)
    print(result)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(result + "\n", encoding="utf-8")
    return int(report["status"] == "FAIL")

if __name__ == "__main__":
    raise SystemExit(main())
