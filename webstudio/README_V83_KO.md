# 올파일원 웹스튜디오 V83 — 공개 배포 증명 보조 도구

- **사이트 공개 콘텐츠 기준 버전: V82** (`WEBSTUDIO-V82-20261109`). V83은 배포 확인 문제를 해결하기 위한 운영자 진단 모듈입니다. 새 고객 기능이 완성되었다는 뜻이 아닙니다.
- **기존 제품 보존:** 12개 업종, 36개 디자인, 브라우저 가상 시연 84개, 실제 고객 운영 기능은 별도 구축.
- **Windows 실행:** ZIP을 압축 해제한 뒤 `webstudio/RUN_V83_PUBLIC_DIAG_WINDOWS.cmd` 더블클릭. Windows Python launcher에서 정상 동작하는 3.14 → 3.12 → 3.11을 선택합니다. 전역 PowerShell 정책은 바꾸지 않습니다.
- **결과 경로:** `%USERPROFILE%\Downloads\AFO_WebStudio_V83_Public_Diagnostic\`. 오류와 정상 완료 모두 시작·종료 보고서를 남깁니다. 자동 실행 후 키 입력 없이 종료합니다.
- **확인 범위:** pages.dev 공개 원점과 사용자 지정 도메인 연결 후보는 별도 평가, DNS·인증서·HTTP 오류·잘못된 200 HTML·V81 이하 구버전·일부 파일 누락 구분. V82 정본의 47개 파일 검사를 재사용합니다.
- **기능을 넘어서 주장하지 않음:** 실제 고객 이메일 도착, 계약/결제, PC·모바일 전체 버튼 동작, Cloudflare Production GitHub SHA 일치는 별도 확인 항목입니다.
- **검증 근거:** `tools/test_v83_public_diagnostics.py` 및 기존 259개 회귀검사. 배포 점검은 사용자가 실제 Windows·클라우드 네트워크에서 실행해야 합니다.
- **추가 비용:** 별도 AI API·유료 호스팅·Cloudflare 설정 자동 변경 없음. URL에 읽기 전용 GET만 보냅니다.
- **소유자에게 필요한 추가 확인:** 실제 Pages 프로젝트에 `main` + `webstudio`가 구성되어 있는지 Cloudflare 대시보드에서 확인. 현재 환경의 DNS HOLD를 사이트 장애로 단정하지 않습니다.