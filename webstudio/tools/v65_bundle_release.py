#!/usr/bin/env python3
# AllFileOne WebStudio V65.1: dependency-free, fail-closed complete source + QA packager.
# Intended for GitHub's free public-repository standard Windows runner.
import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import sys
import zipfile

BASENAME = "AllFileOne_WebStudio_V65_1_AllInOne_LATEST.zip"
BANNED = {".git", "__pycache__", ".env", ".env.local", "node_modules", ".venv", "venv"}
BANNED_EXTENSIONS = {".pyc", ".pfx", ".p12", ".pem", ".key"}
EVIDENCE_NAMES = (
    "V65_LIVE_BROWSER_RESULT.json",
    "V65_LIVE_BROWSER_RESULT_KO.txt",
    "HOME_MOBILE_390.png",
    "HOME_PC_1280.png",
    "V65_SHA256_MANIFEST.json",
)
MAX_FILE = 25_000_000
MAX_TOTAL = 500_000_000

def digest(data):
    return hashlib.sha256(data).hexdigest()

def choose_files(source):
    if not (source / "index.html").is_file():
        raise RuntimeError("HOLD: webstudio/index.html not found")
    release = json.loads((source / "assets" / "current-release.json").read_text(encoding="utf-8"))
    if release.get("version") != "V65" or release.get("release_id") != "WEBSTUDIO-V65-20261108":
        raise RuntimeError("HOLD: source is not the expected V65 release")
    selected = []
    total = 0
    for path in sorted(source.rglob("*")):
        if any(segment in BANNED for segment in path.relative_to(source).parts):
            continue
        if path.is_symlink():
            raise RuntimeError("HOLD: symlink found in source: " + str(path))
        if not path.is_file():
            continue
        if path.suffix.lower() in BANNED_EXTENSIONS:
            continue
        if not str(path.resolve()).startswith(str(source.resolve()) + os.sep):
            raise RuntimeError("HOLD: source path escaped root")
        size = path.stat().st_size
        if size > MAX_FILE:
            raise RuntimeError("HOLD: unexpected oversized source file: " + str(path))
        total += size
        if total > MAX_TOTAL:
            raise RuntimeError("HOLD: package size budget exceeded")
        selected.append((path, "webstudio/" + path.relative_to(source).as_posix()))
    if not selected:
        raise RuntimeError("HOLD: no source files")
    return selected

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--evidence-dir", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    args = parser.parse_args()
    source = args.source.resolve()
    evidence = args.evidence_dir.resolve()
    out = args.out_dir.resolve()
    out.mkdir(parents=True, exist_ok=True)
    archive = out / BASENAME
    files = choose_files(source)
    for name in EVIDENCE_NAMES:
        f = evidence / name
        if f.is_file():
            files.append((f, "EVIDENCE/" + name))
    manifest = {
        "product": "AllFileOne WebStudio",
        "site_release": "V65",
        "package": "V65.1 Windows Edge proof race correction",
        "packaging_scope": "complete webstudio source + available actual public browser evidence",
        "customer_mail_receipt": "NOT_VERIFIED",
        "public_browser_status": "READ_INCLUDED_EVIDENCE_NOT_A_SALE_CLAIM",
        "files": {}
    }
    how_to = (
        "ALLFILEONE WEB STUDIO V65.1 - COMPLETE SOURCE / PUBLIC-BROWSER QA\n"
        "Deploy the 'webstudio' folder contents as Cloudflare Pages static files.\n"
        "The site demo data and client inquiries are NOT real orders.\n"
        "Read EVIDENCE/V65_LIVE_BROWSER_RESULT_KO.txt for actual pass/hold results.\n"
        "The exact V65 site release is preserved; V65.1 fixes the QA wait race.\n"
        "No paid API, Codex, or installer required. No form/email is auto-sent.\n"
    ).encode("utf-8")
    def add(z, name, data):
        info = zipfile.ZipInfo(name, date_time=(2026, 11, 9, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o644 << 16)
        z.writestr(info, data)
    with zipfile.ZipFile(archive, "w", allowZip64=False) as z:
        for path, name in files:
            data = path.read_bytes()
            manifest["files"][name] = {"sha256": digest(data), "size_bytes": len(data)}
            add(z, name, data)
        add(z, "README_RELEASE_KO.txt", how_to)
        add(z, "SOURCE_SHA256_MANIFEST.json", json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8"))
    with zipfile.ZipFile(archive) as z:
        names = z.namelist()
        if len(names) != len(set(names)) or z.testzip() is not None:
            raise RuntimeError("HOLD: ZIP duplicate path or CRC failure")
        for name, detail in manifest["files"].items():
            if digest(z.read(name)) != detail["sha256"]:
                raise RuntimeError("HOLD: inner SHA mismatch: " + name)
    checksum = digest(archive.read_bytes())
    (out / (BASENAME + ".sha256")).write_text(checksum + "  " + BASENAME + "\n", encoding="utf-8")
    (out / "V65_1_ALLINONE_RESULT_KO.txt").write_text(
        "올파일원 웹스튜디오 V65.1 소스 통합 ZIP 검사: PASS\n"
        "원본 전체 소스 + 공개 브라우저 검사 증거 묶음\n"
        "원본 파일 수: " + str(len(files)) + "\n"
        "ZIP CRC: PASS / ZIP 내부 SHA256: PASS\n"
        "전체 ZIP SHA256: " + checksum + "\n"
        "주의: 공개 브라우저 검사 PASS/HOLD는 반드시 V65 결과 파일에서 확인.\n"
        "이메일 실제 수신/실제 고객 납품: 검증 안 됨.\n",
        encoding="utf-8"
    )
    print("V65_1_BUNDLE_PASS", len(files), archive, checksum)

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(3)
