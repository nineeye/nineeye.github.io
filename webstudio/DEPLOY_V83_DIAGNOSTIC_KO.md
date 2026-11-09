# 올파일원 웹스튜디오 V83 — 실공개 장애 원인 진단

## 목적과 범위
- 공개 정본은 **V82**. V83은 고객 기능을 새로 홍보하는 판이 아니라, 공개 배포 불확실성을 해소할 **읽기 전용 진단기**입니다.
- GitHub 정본: `nineeye/nineeye.github.io` → `main` → `webstudio/`.
- Cloudflare Pages Git 연동 권장: Production branch `main`, Build command `exit 0`, Build output directory `webstudio` (빌드 설정에 저장소 하위 기준이 적용되는지는 프로젝트 로그로 최종 확인).
- 모든 기본 검사는 `https://allfileone-webstudio.pages.dev/`에서 수행. `--include-owned-domain`은 `https://allfileone.co.kr/`, `https://www.allfileone.co.kr/` **연결 후보**를 별도 확인할 뿐, 이 도메인이 Pages와 연결됐다고 가정하지 않습니다.

## Windows 한 번에 실행
1. 최신 ZIP을 압축 해제합니다.
2. `webstudio/RUN_V83_PUBLIC_DIAG_WINDOWS.cmd`를 더블클릭합니다. Python 3.14 → 3.12 → 3.11을 선택하며, **python313.dll 누락 가능성이 있는 3.13을 자동 실행하지 않습니다**.
3. `C:\Users\USER\Downloads\AFO_WebStudio_V83_Public_Diagnostic\AFO_V83_PUBLIC_DIAGNOSTIC_KO.txt`를 확인합니다. 사용자 계정에 따라 USER 부분은 달라집니다.
4. JSON·TXT·증거 ZIP·SHA-256이 함께 저장됩니다. 원본 사이트에 POST, 로그인, 이메일 자동 발송, 유료 API 호출은 없습니다.

## 진단 결과별 조치
| 분류 | 다음 확인 | 판단 한계 |
|---|---|---|
| DNS_FAILURE | Pages 프로젝트 URL, DNS 및 다른 네트워크 | 진단 위치의 DNS 문제로 사이트 다운이라고 단정 불가 |
| TLS_CERTIFICATE | Pages custom domain 상태, 인증서 발급 | DNS 성공과 별개 |
| STALE_RELEASE | Production branch/마지막 배포 커밋, 출력 폴더 | GitHub 병합이 실제 배포를 증명하지 않음 |
| HTTP_NOT_FOUND | 올바른 배포 루트, URL, 최신 HTML | 다른 정적 사이트가 배포됐을 수 있음 |
| HTTP_REDIRECT | 도메인/경로 전환 설정 | 도메인 변경을 무조건 성공으로 처리하지 않음 |
| UNEXPECTED_CONTENT | `current-release.json` 경로·SPA fallback | HTTP 200만으로 PASS 불가 |
| PUBLIC_ASSET_MISMATCH | 결과 TXT의 경로별 HOLD | 선언된 파일 47건 중 일부만 맞을 수 있음 |
| PASS_PUBLIC_FILES_ONLY | 실제 브라우저 클릭 및 메일 수신 직접 확인 | 공개 파일 응답만 검증된 것 |

## 실제 판매 준비와 분리해야 할 항목
- 기존 36개 디자인과 84개 가상 시연은 운영용 예약·결제·재고 기능이 아닙니다.
- 고객 문의는 현재 `mailto:`를 통해 고객이 직접 발송하는 방식입니다. Naver 메일 도착과 상담 내용 수신은 별도 검증이 필요합니다.
- 최종 가격, 부가세 포함, 도메인·호스팅 요금, 수정 횟수·관리 권한·하자보수 기간은 개별 견적/계약서로 확정해야 합니다.

## 클라우드에서 확인할 화면
Cloudflare 대시보드 → Workers & Pages → `allfileone-webstudio` 프로젝트(이름은 확인 필요) → Deployments → Production 배포 상태·GitHub commit·빌드 로그. 최신 GitHub commit과 Cloudflare Production commit이 같고, `current-release.json`과 47개 파일이 실제 응답할 때에만 공개 파일 PASS로 판정합니다.