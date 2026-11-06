# ALLFILEONE WEB STUDIO — V6 Release Notes
2026-11-07 / Stage: GitHub source verified; live Cloudflare deployment not independently confirmed.

## Work rules (must start every iteration)
1. When source material is needed, provide a direct download link.
2. Search license-compatible free public sources first and build only what is missing.
3. Bundle a large set of meaningful related improvements per iteration.

## Purpose
Make ALLFILEONE look and behave like a capable commercial website studio without invented customer credentials, fake testimonials, or deceptive claims.

## Delivered this iteration
- New `portfolio.html` with six **real HTML function demos**: B2B wholesale, academy booking, renovation estimator, accommodation schedule, association board, multi-clinic filtering.
- A case-study structure for each: business problem, proposed user journey, working functions, demo link.
- 3 homepage feature-led cards (quote / booking / operations).
- Navigation to selected work, direct demo links, production-scope explanation and transparent demo labels.
- Interactive category filter, industry/keyword search, no-results message and live visible-count update.
- Multi-select reference-list builder with persistent in-page state only.
- One-click reference list copy, UTF-8 BOM text download and mailto: inquiry to nineeyes@naver.com.
- No backend data collection, visitor login, analytics tracker or paid API.
- Input content rendered with textContent; no user string injection into HTML.
- Responsive layout, keyboard focus highlights, screen-reader status messages, skip link, reduced-motion.
- Distinct canonical/meta descriptions, XML sitemap and robots discoverability.
- All existing 36 design demo and 6 specialty demo files preserved.

## Source license
Research checked free MIT Motion and Swiper and ISC Lucide; none of these libraries were bundled in V6. V6 additions are original HTML/CSS/native JS, without external runtime dependencies. Reference links:
- https://github.com/motiondivision/motion
- https://github.com/nolimits4web/swiper
- https://github.com/lucide-icons/lucide

## Verification
43/43 structural, path, CSP compatibility, JS syntax, accessibility and privacy checks passed against connected GitHub files, including fetching all six specialty demo paths from the stage branch.
Not included: real-browser E2E, cross-device user acceptance, Cloudflare deploy status, end-to-end customer email delivery, production payment / live booking.
These unverified items must not be reported PASS.

## Product boundaries
All examples use fictional businesses; they are not paid client deliveries. Real booking confirmation, payment, admin authentication and persistent server storage are not connected. Requests open the visitor's email app, which still requires the visitor to press Send.

## Roadmap
- [x] Honest, evidence-led case study gallery with working demo links.
- [x] Dynamic filters, reference list, TXT export and email inquiry draft.
- [x] Mobile layouts, keyboard/accessibility and reduced motion.
- [x] Remote structural and syntax tests.
- [ ] Confirm Cloudflare published version and browse all key routes on PC/mobile.
- [ ] Finish secure backend, auth, database and live functionality validation for a first sellable product.
- [ ] Verify legal business identity and privacy notices before taking customer data.
- [ ] Validate external integrations and ongoing hosting resource consumption.
