#!/usr/bin/env python3
"""Free, read-only deployment evidence from GitHub's public REST endpoints.
No login, paid API, Cloudflare token, private credentials or write actions.
A successful check does not by itself verify live website rendering or mail delivery.
"""
from __future__ import annotations
import json
import sys
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

HOST = 'https://api.github.com'
REPO = 'nineeye/nineeye.github.io'
USER_AGENT = 'AllFileOne-WebStudio-Public-Deploy-Verifier/1.0'

def get_json(url: str) -> dict:
    if not url.startswith(HOST + '/repos/' + REPO + '/'):
        raise ValueError('Only the approved public repository may be queried')
    req = Request(url, headers={'Accept':'application/vnd.github+json','User-Agent':USER_AGENT})
    with urlopen(req, timeout=12) as response:
        return json.load(response)

def summarize_commit(commit: dict, check_results: dict) -> dict:
    sha = str(commit.get('sha',''))
    if len(sha)!=40 or not all(x in '0123456789abcdef' for x in sha.lower()):
        raise ValueError('GitHub commit SHA is missing or invalid')
    matching = []
    for entry in check_results.get('check_runs', []):
        if entry.get('name')!='Cloudflare Pages': continue
        app = entry.get('app') or {}
        if app.get('slug') != 'cloudflare-workers-and-pages': continue
        if entry.get('head_sha') != sha: continue
        matching.append(entry)
    successful = [x for x in matching if x.get('status')=='completed' and x.get('conclusion')=='success']
    status = 'CLOUDFLARE_CHECK_SUCCESS' if successful else 'UNKNOWN_OR_NOT_SUCCESS'
    last = successful[-1] if successful else (matching[-1] if matching else None)
    return {
       'repository': REPO, 'commit': sha, 'status': status,
       'check_run_url': last.get('html_url') if last else None,
       'check_name': last.get('name') if last else None,
       'check_conclusion': last.get('conclusion') if last else None,
       'caveat': 'This is official GitHub/Cloudflare build evidence, not a successful visit or an email receipt.'
    }

def main() -> int:
    try:
        commit=get_json(HOST+'/repos/'+REPO+'/commits/main')
        sha=commit['sha']
        checks=get_json(HOST+'/repos/'+REPO+'/commits/'+sha+'/check-runs?per_page=100')
        report=summarize_commit(commit,checks)
    except (KeyError, ValueError, URLError, HTTPError, TimeoutError, OSError, json.JSONDecodeError) as e:
        report={'repository':REPO,'status':'UNVERIFIED','reason':str(e)[:250],
                'caveat':'A failed check or network error is not proof that the site is unavailable.'}
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return 0 if report['status']=='CLOUDFLARE_CHECK_SUCCESS' else 2

if __name__=='__main__': sys.exit(main())