# 올파일원 웹스튜디오 V44 — 국내 검색 유입용 고객 질문 보강, 소스·QA 인계

2026-11-08 | 본래 목표: **고객이 실제 제작을 의뢰하는 업종별 홈페이지 제작사**.

## 작업 내용
- 제조·도매, 학원·교육, 인테리어·시공의 기존 판매 페이지에 각각 실제 이용자가 궁금해할 **고유 질문 4개, 총 12개**를 HTML 본문에 추가.
- 제조: 규격 필터, 사용권 있는 도면/PDF, ERP·실시간 재고/견적의 별도 연동, 관리자 상품 수정 범위.
- 학원: 학년·요일 시간표, 수정 운영 방식, 네이버 예약/카카오톡 연결의 계정 요건, 학생 개인정보 수집 기준.
- 시공: 공간별 포트폴리오, 사진 저작권, 확정 견적이 아닌 사전 안내, 실측/예약의 실제 서버 운영과의 차이.
- 모든 FAQ는 네이티브 details/summary로 키보드 접근 가능, 모바일 반응형이며 기존 V43 검색 체험·V38/V39 기능 선택·상담서 전달은 유지.
- 각 판매 페이지에 최소한의 `WebPage` / `Service` JSON-LD를 추가. 허위 가격·사업자 주소·연락처·후기·별점 등 사용하지 않음.
- **2026년 Google FAQ 리치결과 종료**를 반영해 `FAQPage` 구조화 데이터를 사용하지 않음. 검색 상위 노출 약속 없음.
- 기존 robots.txt, sitemap.xml, 고유 title/description/canonical 정상 확인. robots.txt의 `Disallow: /demo/`는 가상 시연 검색 노출 제한으로 유지.
- 별도 소유 도메인 `allfileone.co.kr`의 Cloudflare 정식 연결 확인 전에는 검색용 canonical/sitemap을 실제 배포되고 있는 pages.dev에서 바꾸지 않음.

## 자동 QA
1. 원본 V43 HTML+CSS/JS에 V44 CSS/FAQ 추가 후 격리 Chromium 테스트 **291/291 PASS**: 업종 3×6 너비(320/360/390/768/1280/1440), 질문 4개 표시·열기/닫기, 키보드, 가로 넘침, JS 오류, 원격 호출 없음, 기존 체험·상담 보존.
2. Python 표준 라이브러리 V44 검색·사용자 콘텐츠 검사 **50/50 PASS + 1 HOLD**. HOLD는 부분 소스 패키지에 robots/sitemap 원본이 없을 때이며 실제 GitHub 저장소에서 별도 확인.
3. 실제 GitHub 작업 브랜치 HTML/CSS/메인/manifest/robots/sitemap/검증기 교차검사 **41/41 PASS**. 실제 V44 수정 HTML 3개와 CSS의 Git blob SHA = 로컬 QA 원본과 동일.
4. 이 시험은 **정식 도메인 HTTP나 네이버·Google 검색 노출/유입/실제 고객 문의 증가를 검증하지 않음**. Cloudflare Pages 공식 V44 check-run은 병합 후 확인.
5. 별도 소유권 인증/계정 로그인·문의 이메일 전송 없음. 추가 유료 API 및 외부 종속 패키지 없음.

## 다음
- [x] ~~36개 디자인 및 3종 대표작 실제 체험~~
- [x] ~~V43 Cloudflare 공식 배포 성공 검증~~
- [x] ~~대표 업종 고객용 질문 12개와 정확한 구조화 데이터~~
- [x] ~~291 브라우저/50 정적/41 GitHub 파일 검증~~
- [ ] GitHub V44 머지 이후 Cloudflare Pages 공식 check-run 확인
- [ ] 네이버 서치어드바이저·Google Search Console 실제 소유권 인증/사이트맵 제출 및 색인 측정 (소유자 권한 필요)
- [ ] 별도 보유 도메인 allfileone.co.kr 실제 DNS 연결 확인 후 대표 도메인/301/canonical/sitemap 변경 여부 결정
- [ ] 공개 주소 PC/모바일 실브라우저 개별 페이지 확인 및 실제 이메일 문의 수신 검증
- [ ] 첫 고객 제작 의뢰 수주·계약·견적 사례 축적

## 공식 지침
- https://searchadvisor.naver.com/guide/seo-basic-robots
- https://searchadvisor.naver.com/guide/request-feed
- https://searchadvisor.naver.com/guide/markup-content
- https://developers.google.com/search/help/crawling-index-faq
- https://developers.google.com/search/updates
