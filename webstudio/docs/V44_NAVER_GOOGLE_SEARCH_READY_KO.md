# 올파일원 웹스튜디오 V44 — 네이버·Google 검색 유입 준비 안내

## 실제 적용 내용

- 제조·도매, 학원·교육, 인테리어·시공 판매페이지 각각 **고유한 질문 4개, 총 12개**를 이용자에게 보이는 HTML 본문으로 작성했습니다.
- 전체 FAQ는 브라우저 기본 `<details>/<summary>` 요소로 열고 닫을 수 있습니다. 부정확한 자동 견적, 실시간 예약, 실적·수익 보장 표현이 없습니다.
- 동일 페이지의 서비스 내용과 일치하는 최소한의 `WebPage` 및 `Service` JSON-LD를 추가했습니다. 임의의 주소·전화번호·별점·후기·확정 가격을 넣지 않았습니다.
- **Google은 2026년 FAQ 리치결과 기능을 종료**했기 때문에 `FAQPage` JSON-LD를 추가하지 않았습니다. FAQ는 검색 노출 편법이 아닌 고객 의사결정 콘텐츠입니다.
- 이미 존재하는 각 페이지의 `<title>`, 고유한 meta description, canonical URL, `robots.txt`, 사이트맵의 3개 판매 페이지 URL을 확인했고 유지했습니다.
- `robots.txt`의 `/demo/` 크롤링 제외는 가상 브랜드 데모의 불필요한 색인을 피하려던 기존 의도를 보존합니다. 3개 실질 판매 URL은 크롤링 허용 대상입니다.

## 사용자가 소유자 권한으로 할 작업 (자동 수행하지 않음)

1. 공개 정식 도메인과 Cloudflare Pages의 배포/HTTPS 상태를 먼저 확인하세요. `allfileone.co.kr` 등 별도 보유 도메인을 실제로 연결하기 전에는 canonical·sitemap을 해당 도메인으로 미리 바꾸지 마세요.
2. [네이버 서치어드바이저](https://searchadvisor.naver.com/)에서 현재 실제 공개 도메인을 등록하고 소유 확인을 완료한 다음 `https://allfileone-webstudio.pages.dev/sitemap.xml`을 제출합니다. 
3. [Google Search Console](https://search.google.com/search-console)에도 사이트 소유권을 확인해 sitemap을 제출합니다.
4. 제조·도매, 학원·교육, 인테리어·시공 세 판매 URL의 색인·실제 검색 결과와 유입을 주기적으로 확인합니다. `site:` 검색만으로 색인 확정 여부를 판단하지 말고 공식 대시보드를 참조합니다.
5. 실제 고객 상담이 이루어진 후 제목·콘텐츠·FAQ 문구를 실제 피드백에 맞춰 개선합니다. **색인·순위·문의 증가를 보장하지 않습니다.**

## 우선 제출 주소

- https://allfileone-webstudio.pages.dev/for-manufacturing.html
- https://allfileone-webstudio.pages.dev/for-academy.html
- https://allfileone-webstudio.pages.dev/for-interior.html
- https://allfileone-webstudio.pages.dev/sitemap.xml
- https://allfileone-webstudio.pages.dev/robots.txt

## 공식 지침 (2026-11-08 확인)

- Naver robots.txt: https://searchadvisor.naver.com/guide/seo-basic-robots
- Naver Sitemap: https://searchadvisor.naver.com/guide/request-feed
- Naver title/description: https://searchadvisor.naver.com/guide/markup-content
- Google crawling and indexing: https://developers.google.com/search/help/crawling-index-faq
- Google structured data policy: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Google updates: https://developers.google.com/search/updates

이 문서는 등록·로그인·웹마스터 인증·메일 발송·운영 계정 변경을 자동 실행하지 않습니다.
