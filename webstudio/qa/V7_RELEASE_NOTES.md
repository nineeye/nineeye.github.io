# ALLFILEONE WEB STUDIO V7 — ZERO COST WEBSITE DRAFT BUILDER

Date: 2026-11-07

## Work rules
1. Give exact direct-download sources when needed.
2. Inspect commercial-license-compatible free software before coding missing features.
3. Bundle many improvements in each development iteration.
4. Apply useful creative ideas proactively after feasibility and QA review.

## Scope
A browser-native website concept generator for Cloudflare Pages at /builder.html.
No new paid API, server, database or third-party SDK. Existing 36 design and 6 functional demos retained.

## Implemented improvements (27)
1. 12 industry presets
2. 3 design styles
3. 6 color palettes
4. Editable business name
5. Editable headline
6. Editable introduction
7. Optional contact email
8. HTML5 email-format validation
9. Service section toggling
10. Strength section toggling
11. Contact section toggling
12. Industry-specific three-service cards
13. Industry-specific benefit copy
14. Live DOM preview without injection
15. Desktop preview width
16. Mobile preview width
17. Responsive layout
18. Local-only browser autosave
19. Browser draft restore
20. Reset and clear local storage
21. Reapply industry preset
22. Export self-contained HTML
23. Export Korean TXT requirements brief
24. Export editable JSON
25. Import schema-validated JSON (<=256 KiB)
26. Strict palette/style allowlisting + HTML escaping
27. Explicit non-operational preview and privacy disclosure

Also: homepage launch feature and hero, portfolio crosslinks, sitemap inclusion, accessibility labels, reduced motion, noindex on generated drafts.

## Verification
- Node.js syntax check PASS.
- Node VM test suite: 231/231 PASS, including 216 industry/style/palette export combinations.
- CSS parser: 158 rules, 0 syntax errors.
- HTML duplicate-ID check: 33 unique IDs, 0 duplicates.
- Local source/GitHub blob SHA match for 3 new files.
- Real browser E2E: NOT_RUN — managed Chromium blocked local file and localhost access by policy.
- Cloudflare live deployment: NOT_VERIFIED here.
- No claim of end-to-end production booking/order/backend functionality.

## Product boundaries
The generated HTML is one-page static draft. No database, payment, login, real booking or email sending.
If the user enters a contact email, that email will be public in the saved HTML. Only a public business email should be used.
Generated file includes robots noindex until production review.
Draft is stored only in this browser's localStorage and can be cleared with reset.

## Roadmap
- [x] 42 existing demo pages preserved
- [x] Standalone website draft generator implemented
- [x] Style/palette/industry generation + exports and import
- [x] Offline JS VM syntax and generated-HTML escaping tests
- [ ] Verify published Cloudflare V7 in real PC and phone browsers
- [ ] Add secure backend and admin for first operational product
- [ ] Implement persistent order/booking/quote management where required
- [ ] Validate business/privacy/legal info for real customer intake
- [ ] Final sales and handoff acceptance tests
