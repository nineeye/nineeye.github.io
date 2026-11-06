# ALLFILEONE WEB STUDIO V8 — FUNCTION COMPOSER
2026-11-07 — Status: GitHub source QA PASS; deployed Cloudflare browser NOT independently verified.

## Mandatory development rules
1. Provide exact direct download links if materials are needed.
2. Research commercial-license-compatible free sources first; build only missing parts.
3. Bundle many related improvements per iteration rather than one or two.
4. Proactively evaluate and implement useful ideas after feasibility and verification.

## Buyer goal
Demonstrate specific business website capability before taking a paid inquiry without misleading claims of customer deliveries, reservations, or real card payments.

## V8 delivery
1. 30 interactive selectable functional modules: 6 categories × 5 each.
2. Grouping: 18 browser demo concepts, 8 server implementation requirements, 4 external-service integrations.
3. Industry context (9 presets), optional brand/project and primary goal.
4. Industry presets with one-click selection and individually removable features.
5. Search and per-category/per-implementation filters, empty state and clear control.
6. Selected modules with automatically calculated counts by implementation type.
7. Risk summaries for DB, permission/authentication, concurrency, privacy, payments, and third-party fees.
8. 3 actual client-side simulations: quantity-based quote, appointment date/time selection, notice list search.
9. TXT project brief, JSON export and validated import (64KiB cap, allowlists, version schema).
10. Client-side email draft to nineeyes@naver.com (visitor must send).
11. Draft memory only in local browser storage with one-click reset and disclosure.
12. Accessible keyboard focus, pressed state, status messages, headings and responsive CSS.
13. No paid API, CDN, or new hosting / build tool dependency.
14. Links from homepage, V7 design builder, V6 portfolio, contact page and sitemap.

## Actual verification
- Chromium via Playwright using set_content + injected exact JS/CSS: 134/134 PASS across 1440, 1024, 768, 390 and 320 px. This is actual browser interaction but NOT HTTP navigation or Cloudflare deployed-site E2E (local files and navigation blocked by execution policy).
- Python/BeautifulSoup/tinycss2 static checks: 52/52 PASS.
- Connected GitHub remote branch: 14/14 existence, content, SHA, link and prior 6 demo preservation checks PASS.
- Node.js --check modules.js: PASS.
- Source Git blob SHA for three new files equals test source after restoring final newline.

## Boundaries
None of the 30 cards means the operational backend is completed. All client-side examples use imaginary data; no real quotes, confirmations, payments, messages, member data, or authoritative booking inventory are recorded.
The feature composer makes a proposal and request document, not a signed contract, fixed price quote, or accepted inquiry.
Mailto opens the visitor's mail application. No automatically successful send claim.
External services including payment providers and SMS can require contracts and fees.
Free Cloudflare Pages static traffic is not equivalent to unlimited free backend requests.

## Remaining roadmap
- [x] Existing 42 demos preserved.
- [x] New 30-function composition lab built.
- [x] Live browser simulations / TXT + JSON outputs.
- [x] Offline browser and static tests.
- [ ] Cloudflare published-site version and Windows/Android/iOS user testing.
- [ ] Secure operational backend + admin / auth / D1 + retention & recovery for first product.
- [ ] Real invoice/quote submission with persistence and owner-visible inbox.
- [ ] Legal notices, privacy policy, contract and maintenance scope.
- [ ] Client-owned deployment and supported handoff packaging.
