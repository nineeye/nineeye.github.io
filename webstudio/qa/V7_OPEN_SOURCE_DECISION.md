# V7 Free-source evaluation and license decision

Official sources checked:
- GrapesJS framework: BSD 3-Clause — https://github.com/GrapesJS/grapesjs
- Puck React visual editor: MIT — https://github.com/puckeditor/puck
- Cloudflare Pages static HTML guide — https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

Decision: neither dependency is bundled in V7. Our current site is plain static HTML and already hosts 42 demos. The extra React/backend/build complexity of embedding Puck or GrapesJS is not needed for a guided preview-and-export interface. We instead authored native HTML/CSS/JavaScript, avoiding external asset downloads, licenses from indirect dependencies, GitHub Actions, paid APIs and hosting build changes. Reconsider these open-source builders if actual drag/drop authoring becomes a validated customer requirement.

Licensing note: free-to-download is not equal to free-for-resale. Evaluate direct and transitive licenses of any source, photo, font, icon and theme before adding them.

Free resources do not guarantee unrestricted operation: Cloudflare request/storage quotas and any external commercial payment or SMS services may still limit production functionality. 
