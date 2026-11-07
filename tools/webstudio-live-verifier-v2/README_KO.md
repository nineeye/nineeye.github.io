# 올파일원 웹스튜디오 — 공개 서버 자동 진단기 V2

**대상**: `https://allfileone-webstudio.pages.dev/` · **검증 기준**: GitHub `nineeye/nineeye.github.io` 저장소의 `main/webstudio` 릴리스 파일. 2026-11-07 제작. Windows 11, Python 3.13/3.14 및 Python 3.9+ 표준 라이브러리만 사용. **추가 비용·유료 API·계정 키 없음.**

## 왜 V2를 만들었나

ChatGPT의 도구에서 `pages.dev` DNS 또는 접근이 막혀도 사용자의 브라우저에서 실제 사이트는 열립니다. 따라서 다음 세 증거를 혼동하지 않도록 설계했습니다.

1. **GitHub `main`에 있는 최신 코드** — 공개 저장소 `raw.githubusercontent.com`이 응답할 때만 최신 버전을 신뢰합니다.
2. **Cloudflare가 운영 도메인에서 실제로 반환한 파일** — TLS 인증서를 검증하며 HTML/JSON/JS/CSS 파일과 36개 데모의 HTTP 응답을 확인합니다.
3. **Cloudflare GitHub 공식 봇 댓글** — PR에 붙은 배포 미리보기 성공 기록일 뿐, 운영 도메인이 같은 버전임을 증명하지는 않습니다.

V1에서 발견한 오판 가능성(예전 V33만 알고 있을 때에도 `VERIFIED_LIVE`이라고 표시)을 수정했습니다. GitHub 최신 파일을 못 읽으면 `STATIC_HEALTH_OK_EXPECTED_UNVERIFIED`로 보고합니다.

## 사용 방법(Windows, 자동 실행)

ZIP 압축 해제 후 **`RUN_LIVE_CHECK.cmd`** 실행 → `Downloads/ALLFILEONE_WEBSTUDIO_LIVE_STATUS_LATEST.zip`과 `Downloads/ALLFILEONE_WEBSTUDIO_LIVE_CONSOLE_LATEST.txt` 자동 생성. PowerShell 서명 정책 변경 없음, 관리자 권한 없음, 콘솔 종료 후에도 파일 보존.

- 기본: 36개 데모 + 메인/문의/진단 페이지 + HTML에 실제 포함된 JS/CSS 자동 조사 + GitHub 배포 미리보기 댓글 조사.
- 빠른 점검: `RUN_QUICK_CHECK.cmd` (36개 데모 제외).
- 직접 실행: `py -3.14 live_verify.py --out "%USERPROFILE%\Downloads"` 또는 `py -3.13 live_verify.py --quick`.
- 실제 공개 인터넷 접속이 가능해야 합니다. 로컬 Python/브라우저 프록시 환경이 달라 실패하면 `REPORT_KO.txt`의 오류를 확인합니다.

## 판정 해석

| 코드 | 의미 |
| --- | --- |
| `VERIFIED_CURRENT_STATIC` | GitHub 최신 버전(신뢰 가능한 공개 응답)과 Cloudflare 운영 버전·정적 검사 일치. **실제 예약·결제·문의 수신 확인 아님**. |
| `STATIC_HEALTH_OK_EXPECTED_UNVERIFIED` | 정적 파일들은 통과했지만 GitHub 최신 버전을 외부에서 읽지 못해 ‘최신’이라고 선언하지 않음. |
| `VERSION_MISMATCH` | GitHub와 Cloudflare 버전 다름(배포 지연 또는 배포 설정·오류 점검 필요). |
| `SOURCE_BYTES_MISMATCH` | 핵심 공개 파일의 SHA256이 GitHub 최신 파일과 다름. 캐싱·변조·최적화 변환 여부를 분리 확인. |
| `PARTIAL_OR_BROKEN` | 일부 필수 경로 또는 JS/CSS 누락·HTTP 오류·HTML 오류 응답. |
| `PRODUCTION_UNREACHABLE_OR_INVALID` | 운영 도메인의 버전 파일을 읽지 못하거나 JSON 형식이 올바르지 않음. **사이트 장애로 단정하지 않음**. |

## 추가 개선 사항

- **V34 이후도 자동 추적**: GitHub `current-release.json`과 공개 서버 `release-vNN.json`을 보고 경로 구성. 신규 HTML의 실제 `script`·`stylesheet` 링크를 추출해 검사. (한 번에 최대 18개 추가 자산)
- **페이지 내용 검사**: 404 대신 `200 HTML`이 돌아온 JS/CSS 가짜 성공도 거부.
- **소스 무결성**: 공개 release JSON·중요 예시 계산 JS의 SHA256을 GitHub 원본과 비교(원본 접근 가능할 때만).
- **Cloudflare 봇 기록**: 최근 병합된 PR을 GitHub 공개 API에서 가져와 Cloudflare 봇의 **미리보기 성공** 여부를 확인. *운영 배포라고 표시하지 않음.*
- **대체 도메인**은 각각 별도 항목으로만 기록. 보유 도메인, GitHub Pages 후보 또는 과거 미리보기가 열려도 운영 서버의 성공 근거로 사용하지 않음.
- **개인정보 보호**: 인증서 검증 해제·IP 위장·제3자 중계 프록시·자동 로그인·계정 비밀번호·토큰·개인정보 업로드 없음.

## 테스트·결과 증거

`python test_live_verify.py`를 실행하면 완전히 오프라인인 모의 HTTP 응답으로 30개 회귀 검사를 실시합니다. 정상·V34·구버전·변조·누락·DNS 실패·가짜 JS/HTML·GitHub 접근 실패를 구분합니다. `status.json`, `REPORT_KO.txt`, `SHA256SUMS.txt`를 포함한 결과 ZIP과 외부 `.sha256`도 자동 검증합니다.

**현재 확실히 알고 있는 것**: GitHub `main` 파일은 V33(앞선 검증). Cloudflare 공식 봇은 PR #24에 V32 *미리보기* 배포 성공 기록을 남겼습니다. PR #25에 봇 댓글이 없다는 사실만으로 V33 운영 배포 실패라고 판단하지 않습니다.

## 공식 자료

- Cloudflare GitHub 연동과 PR 미리보기: https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/
- Cloudflare 미리보기와 Production 구분: https://developers.cloudflare.com/pages/configuration/preview-deployments/
- Cloudflare 배포 문제 확인: https://developers.cloudflare.com/pages/configuration/debugging-pages/
- 실제 PR #24 공식 배포 기록: https://github.com/nineeye/nineeye.github.io/pull/24#issuecomment-6706309739

## 남은 일

- [x] V1 접근 실패 판정과 오래된 기대 버전 오판 수정
- [x] 새 HTML에서 자산 자동 탐색 / 공식 봇 기록 조회
- [x] Windows 자동 실행·Downloads 로그·SHA256 증거
- [x] 30개 격리 회귀 테스트
- [ ] **Cloudflare 운영 도메인에서 직접 실행한 실제 보고서 확보** (현재 실행 환경은 DNS 접근 제한)
- [ ] 실제 문의 이메일 발신·수신 확인
- [ ] Stitch 전문 디자인 반영 및 판매용 시각 품질 검수
