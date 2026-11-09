# 올파일원 웹스튜디오 V75 — 공개 배포 실기 검사 통합

**목표:** 사이트 구축이나 고객 정보를 추가하는 것이 아니라, 지금 공개 사이트의 36개 샘플·48개 기능·제작 견적·상담 흐름이 실제로 제공되는지 **Windows PC에서 검증**하고 모든 증거를 한 번에 저장합니다.

## Windows 11 첫 실행

1. 통합 ZIP을 다운로드해 압축을 풉니다.
2. `webstudio/RUN_V75_PUBLIC_QA_WINDOWS.cmd`를 더블클릭합니다.
3. 기존 Windows Edge 또는 Chrome을 격리 임시 프로필로 실행해 공개 사이트를 검사합니다. 메일 발송·예약 제출·고객 정보 전송은 하지 않습니다.
4. 결과는 항상 Windows의 `Downloads`에 저장됩니다.

| 다운로드 폴더 파일 | 용도 |
|---|---|
| `AFO_WebStudio_V75_PUBLIC_QA_LATEST_KO.txt` | 실패 원인과 결과를 한국어로 기록 |
| `AFO_WebStudio_V75_PUBLIC_QA_LATEST.zip` | 페이지 HTTP 기록, Windows Edge 실기 테스트 결과, PC·모바일 캡처, 파일 SHA를 포함 |
| `AFO_WebStudio_V75_PUBLIC_QA_LATEST.sha256` | 증거 ZIP SHA-256 |

- **추가 설치 없음**: 기존 Windows의 `py -3.14`를 먼저 검사합니다. 실패 시 `py -3.12`, `py -3.11`로만 대체하며, `python313.dll` 오류의 3.13을 자동 선택하지 않습니다.
- **실패 시 창 유지**: Python 실행 오류나 네트워크 문제를 명확히 표시합니다. 시스템 Python, PowerShell 서명 정책, Windows 환경변수를 바꾸지 않습니다.
- **추가 비용 0원**: 공개 홈페이지 HTTPS GET과 내장 Windows Edge CDP만 사용합니다. 외부 유료 API·AI 모델·별도 실행 엔진 다운로드 없음.
- **도메인**: `https://allfileone-webstudio.pages.dev/`만 검사합니다. 리다이렉션이 다른 호스트로 가면 실패 처리합니다. `allfileone.co.kr`은 동일 콘텐츠 연결 여부가 확인되지 않아 검증 대상에서 제외했습니다.
- **시연 vs 실제 판매**: 공개 HTTP와 UI 검사가 통과해도 실제 고객의 메일 수신, 결제, 계약 체결을 입증하지는 못합니다. 이메일은 사람이 보내고 실제 받은 편지함으로 확인해야 합니다.

## 검사 구성

1. 정상 공개 버전 V74, V73·V72 이전 주요 기능 표식
2. 핵심 공개 리소스 16종 및 업종별 36개 데모 = **공개 파일 52개**
3. 12개 업종 × 4개 실제 도구 정의
4. 기존 `v65_edge_live_qa.py`, `v652_live_demo_qa.py`, `v653_live_sales_qa.py`, `v66_live_design_qa.py`를 이어 실행해 PC·모바일 클릭·디자인·문의 유입을 검증
5. 오류가 있으면 `HOLD_PUBLIC_DEPLOY_OR_BROWSER`로 종료하고 실제 오류 내용과 증거 ZIP을 생성

## 차수 검증 현황

- V75 오프라인 신규 검사: **8/8 통과**.
- V74부터 이어진 전체 프로젝트 unittest: **207/207 통과**.
- 실제 공개 Cloudflare 검사: **현재 이 실행 환경은 DNS 접근 실패**, Windows 실행 결과가 필요합니다.
- 실제 이메일 수신: **HOLD / 미검증**.

이 도구는 프로그램을 설치하는 EXE가 아니라 **무의존성 Python + Windows CMD 실행기**입니다. 웹스튜디오 홈페이지 개발과 직접 연결되는 실기 QA 전용입니다.