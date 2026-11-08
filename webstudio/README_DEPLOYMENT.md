# AllFileOne WebStudio — deployment and commercial readiness (V64)

> **Source of truth:** `main/webstudio/` in `nineeye/nineeye.github.io`.
> This document is a technical handoff, **not** a guarantee of live operation, contractual pricing, search ranking, or customer sales.

## What exists

- Six industry-specific sales pages: manufacturing, academy, interior, restaurant, beauty, logistics.
- 36 existing design demos plus separate offline fictional functionality demos. Demo companies, menus, prices, appointments and testimonials are not real customer work.
- A six-sector quick-inquiry form, an optional detailed project brief, a six-sector ten-item launch kit, and an optional six-sector delivery/acceptance scope worksheet. Customer inputs are not automatically sent. Email drafts must be explicitly sent from the visitor's mail app/webmail.
- Read-only owner checks at `/site-check.html` and `/owner-launch.html`.
- A separately provisioned optional Cloudflare D1/Turnstile intake implementation exists in the repository but **must not** be described as active without verifying privacy approval, environment bindings, and live functionality. Its default state is not a verified public inbox.

## Distinguish evidence sources

1. **GitHub source SHA:** proves only which code is merged to `main`.
2. **Cloudflare Pages check-run:** `Cloudflare Pages = success` against the **same SHA** proves the provider's deployment check reported success. It does not prove that a user can navigate the public domain.
3. **Live HTTP page checks:** prove the browser/computer could read each expected public HTML/manifest response. Generic `200 OK` alone is insufficient: the file must contain expected content.
4. **Actual inquiry receipt:** requires an authorized end-to-end sent-and-received test in the intended mailbox, including spam folder. Neither an opened mail draft nor generated TXT proves receipt.
5. **Search indexing:** verified in Naver Search Advisor and Google Search Console separately; sitemap submission is not proof of indexing.

For read-only evidence collection, run `RUN_V59_PUBLICATION_PROOF.cmd` (from the standalone V59 ZIP) on Windows. It writes Korean TXT and JSON reports to `Downloads`, with no API keys and no additional paid services. Equivalent source: `tools/v59_publication_proof.py`. If GitHub API or Pages is inaccessible, the result is `HOLD`, not a fabricated `PASS`.

## Safe deployment checks

- Verify Cloudflare Pages project build settings and output directory **in the Cloudflare dashboard**; do not infer them from GitHub Pages' separate deployment.
- Check the deployment SHA and official GitHub Check Runs for the exact `main` commit.
- Open `/assets/current-release.json` on the public domain and compare `version` and `release_id` to the source.
- Check `/index.html`, `/quick-inquiry.html`, `/launch-kit.html`, `/contact.html`, and `for-*.html` for the six flagship industries. Verify interactions and mobile layout on a real browser separately.
- Do not enable D1, paid services, automated email, customer data collection, or new secrets without explicit permission, appropriate privacy documents, and a verified test plan.
- Before a paid engagement, determine actual scope, price including VAT policy, customer-provided content rights, paid third-party services, source/domain ownership, revision count, schedule, acceptance criteria, cancellation/refund terms, and post-launch support **in a mutually approved written agreement**. Current examples do not constitute a binding offer.

## V60 buyer-facing scope worksheet

- /delivery-scope.html: six industries x seven differentiated feature decisions, plus eight delivery/ownership/maintenance terms. All defaults are **review needed**, not a contractual promise.
- Each of six industry sales pages links with a public industry ID only. /guide.html, /plan-guide.html and the home page link to the worksheet.
- Draft export: TXT, copy, print/PDF. No account, analytics, payment, form server submission, paid API or automatic email.
- Optional same-tab, 15-minute, one-time sessionStorage handoff into /contact.html. The receiving page strictly allowlists industry, seven feature IDs, statuses and eight term IDs and deletes the temporary item before validation. The URL has no personal details.
- Source-backed isolated Chromium checks: 79/79. GitHub source QA predicates: 90/90. Neither demonstrates public Cloudflare HTTP, real email arrival or contract signing.
- GitHub Cloudflare Pages check for V60 merge commit 40eb06ccaa2de510aade8da15850243c22b2469f reported success 2026-11-08; V61 needs its own check.

## V61 customer inquiry and repeatable source integrity
- The optional D1/Turnstile inquiry form now displays restaurant, beauty and logistics choices alongside manufacturing/academy/interior. It accepts only public industry IDs in the query, never customer names, email or notes in URLs.
- **If server-side intake is NOT configured**, /inquiry.html still shows an honest no-submission warning and clearly links to /quick-inquiry.html, /contact.html, and /delivery-scope.html. No fake submission/receipt.
- /tools/v61_site_integrity.py checks local HTML/CSS assets, internal links, anchors/duplicate IDs, image alt warnings, sitemap paths and exact release manifest using Python stdlib only. /RUN_V61_SITE_AUDIT.cmd fetches public main GitHub source with Git and saves Korean TXT/JSON reports in Windows Downloads.
- Source-only GitHub tree checks: 77 HTML files; 913 static href/src references; 0 missing static targets (JavaScript-generated URLs are NOT covered). 31/31 tool unittests PASS; industry preselection fake-DOM tests 10/10 PASS.
- V60 Cloudflare Pages GitHub check for commit 40eb06ccaa2de510aade8da15850243c22b2469f reported success 2026-11-08. This is **historical** and not V61 live navigation, email receipt, or current CI proof.

## V62: manual email submission without desktop mail-app dependency

- On /quick-inquiry.html, the six industry choices and V49 draft builder remain unchanged.
- The visitor can copy a recipient, subject and body separately, or continue using the preexisting full-copy and TXT export. Naver webmail and Gmail are ordinary outbound navigation links only, never automatic send actions.
- New assets: assets/v62-webmail.js (read-only draft parser, clipboard write only, selectable textarea fallback on denial), assets/v62-webmail.css (responsive guide).
- **Safety:** no customer input is stored or sent by V62, no new forms submit to a backend, no mail credential access or paid API. Browser clipboard permission may be unavailable; an explicit manual-copy fallback remains.
- **Testing:** isolated local Chromium source tests 84/84 (three viewport widths, six representative industry drafts, malformed text, recipient mismatch, denied clipboard); GitHub branch source rule checks 110/110; stale/altered-source negatives 7/7. These are NOT end-to-end tests of the deployed public site or real email receipt.
- V62 Cloudflare Pages check must be read independently after merging the V62 commit. Previous V61 CI success cannot be reused as V62 evidence.

## V63 local Windows Edge live-browser evidence

- New original Python standard-library tools/v63_edge_live_qa.py and Windows RUN_V63_EDGE_LIVE_QA.cmd; no pip install, added paid APIs or remote administration. Existing browser profiles are never reused. The user launches the tool on their Windows PC after approving a new script.
- Test target is the public https://allfileone-webstudio.pages.dev/ only; test-only fixture overrides accept localhost, never another remote domain. Checks actual HTTP 2xx document responses via Chromium DevTools, 390/1280 responsive widths, six seller pages, 1-minute inquiry, V62 manual webmail controls and same-tab one-time detailed consultation handoff.
- Reports are saved to Windows Downloads as Korean TXT, JSON, per-file SHA manifest, screenshots and CRC-valid ZIP. On any missing Edge, blocked browser network, bad HTTP, bad UI or timed-out handoff it explicitly reports HOLD_BROWSER_OR_NETWORK, never PASS.
- Synthetic browser program does not submit forms, send emails or access credentials. PASS_PUBLIC_BROWSER_SMOKE_ONLY does not certify receipt, customer data persistence, SEO, payment or contracts.
- Offline Chromium CDP protocol/source tests: 22/22 PASS. In this assistant container even local HTTP browser navigation is blocked by administrator, so real public domain PASS could not be established. User Windows run is still required for real proof.

## V64 public GitHub Actions Windows browser evidence (no paid API)

- GitHub repository nineeye/nineeye.github.io is public. Official GitHub documentation says **standard GitHub-hosted runners in public repositories are free**; this workflow uses only windows-2025, not a larger runner. No external metered APIs, Codex, AI credits, API tokens, extra services, cron or self-hosted runners.
- Workflow `.github/workflows/webstudio-v64-public-browser.yml` runs on pushes to main that modify webstudio/ (and can be explicitly manually dispatched). GitHub permissions: contents read; checkout persists no token; concurrency cancels superseded runs. No automatic recurring schedule.
- `tools/v64_edge_live_qa.py` is source-derived from V63 and expanded to test all six quick inquiry categories on both 390px mobile and 1280px desktop. Each sector's detailed handoff must show the same industry, an imported panel and an actual HTTP 2xx HTML document. The version must be exactly V64.
- Before running the browser, an 18-attempt public-release probe checks V64 manifest propagation; browser checks still run and fail closed if that preflight cannot confirm publication. **Never** interpret workflow success from GitHub build alone as a public-page pass.
- The workflow runs Python stdlib `tools/test_v64_edge_protocol.py` (28 isolated fixture tests), then a read-only public browser smoke test; a failing test exits nonzero, and uploads a 1-day retained proof ZIP+Korean TXT/JSON/PNG+SHA in workflow artifacts (no user-input PII).
- **Two separate truth gates:** V64 Cloudflare Pages deployment check (provider/CI) and separate V64 `Windows Edge public site and six-sector inquiry` job (user-visible public page). Neither proves actual email receipt, indexing, account registration or contract acceptance. If GitHub permission prevents the job from running, state HOLD.
- No customer form POST, mailto send, analytics, credentials, purchases or real reservations. Fixture unit tests are **not** counted as live public browser success.

## V64 operating links

- CI and manual run access: https://github.com/nineeye/nineeye.github.io/actions/workflows/webstudio-v64-public-browser.yml
- Source workflow: https://github.com/nineeye/nineeye.github.io/blob/main/.github/workflows/webstudio-v64-public-browser.yml
- Windows standalone alternative: `/RUN_V64_EDGE_LIVE_QA.cmd` in the repository `webstudio/` folder, or the same CMD at the V64 ZIP root. It writes TXT, JSON, PNG and ZIP to Windows Downloads and never changes global PowerShell policy.

## Operator links

- Site: https://allfileone-webstudio.pages.dev/
- GitHub workflow/check history: https://github.com/nineeye/nineeye.github.io/actions
- Cloudflare technical docs: https://developers.cloudflare.com/pages/
- Customer-facing production guidance: `/guide.html` and `/plan-guide.html`
- Local release proof: `tools/v59_publication_proof.py` and V59 ZIP runner (historical, change expected release to verify V64)

## Known holds

- The assistant's public browsing environment did not independently open the Cloudflare URL on 2026-11-08. This is not evidence that the site is down.
- V63 merged code has Cloudflare Pages check success on 2026-11-08. That is historical and does not prove V64 public HTTP behavior.
- Live end-to-end email receipt, website analytics conversion, customer engagements, and search indexation are unverified.
