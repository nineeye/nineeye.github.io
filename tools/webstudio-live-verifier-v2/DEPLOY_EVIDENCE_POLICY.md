# WebStudio 배포 근거 분류 및 자동 진단 정책

- GitHub source branch SHA는 **코드 병합 증거**이지 Cloudflare Pages 프로덕션 서빙 증거가 아니다.
- Cloudflare GitHub 봇의 `Deploy successful` 댓글은 **특정 PR 브랜치 미리보기 성공** 증거이다. PR 봇 댓글이 없다는 이유만으로 배포 실패라 결론 내리지 않는다.
- 정식 Production 성공은 Cloudflare 대시보드의 Production 배포 상태 및 커밋, 또는 동일 운영 도메인에서 받은 정적 HTTP 응답과 기대 릴리스 파일 비교가 필요하다.
- URL에 `?utm_source=...`가 붙어도 같은 사이트이며 진단기는 루트 URL과 릴리스 파일 경로를 독립적으로 조회한다.
- HTTP·DNS 조회 제한이 있는 ChatGPT 도구에서 `DisabledError`가 나와도 사용자 PC의 정상 접속을 부정하지 않는다.
- 우회 IP, 인증서 검증 무시, 인증 우회 프록시는 금지한다. 인증된 Cloudflare API 연결이 가능하면 공식 배포 기록을 조회하는 방식이 우선이다.
- 릴리스마다 웹스튜디오 `assets/current-release.json`과 표기 기본값, release-vNN.json, 사이트 진단기를 함께 갱신한다.

## 공식 참고
https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/
https://developers.cloudflare.com/pages/configuration/preview-deployments/
https://developers.cloudflare.com/pages/configuration/debugging-pages/
