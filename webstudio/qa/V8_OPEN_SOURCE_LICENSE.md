# V8 Open Source and Zero-Extra-Cost Review
Date: 2026-11-07

## Reviewed but NOT bundled
- GrapesJS visual builder — BSD-3-Clause; direct source: https://github.com/GrapesJS/grapesjs ; license: https://github.com/GrapesJS/grapesjs/blob/dev/packages/core/LICENSE
- Puck editor — MIT; source: https://github.com/puckeditor/puck

## Decision
The existing product is an already-hosted static HTML/CSS/JS website with 42 demos and a V7 draft generator. For selecting feature requirements and exporting a client proposal, the cost of adding a full visual editor, dependency/build pipeline, and ongoing maintenance exceeds the benefit. V8 is therefore authored in plain JavaScript/CSS/HTML (no third-party assets, runtime, fonts, or API).

## Deployment and cost
Cloudflare Pages static asset requests are free/unlimited on free/paid plans when they do not trigger Functions: https://developers.cloudflare.com/pages/functions/pricing/
Pages Free deployments have plan quotas: https://developers.cloudflare.com/pages/platform/limits/
Cloudflare _headers CSP: https://developers.cloudflare.com/pages/configuration/headers/
An eventual backend, authentication, payment, SMS, or storage service may incur rate limits, service fees or usage charges and requires advance scope approval.

## Copyright and sales
A publicly viewable GitHub template is not automatically licensed for commercial resale. If later imported, inspect each source, theme, images, fonts and dependencies; preserve notices, attribution and redistribution obligations. No unapproved external source was included in V8.
