# 올파일원 웹스튜디오 — 11개 프로젝트 소스 재사용 추적 원장

기록일 2026-11-07 · 기준 GitHub V35 · **읽기 전용 원본 검토 / 직접 복사 금지**

## 근거와 목표

QA1 이전 `QA1_V17_RUN_LOG.txt`에 검토된 9개 프로젝트
(`bxpro`, `filedeliveryguard`, `docflowguard`, `movieeditpro`,
`cadreviewpro`, `baljubridge`, `ansimboan`, `sajinhangyeol`, `converters`),
추가 `FieldSector` 및 QA1 자체 실행기 총 11개를 재사용 조사 대상으로 삼는다.
당시 후보 99개 및 AST OK 93/BLOCKED 3/추가 위험 검토 14는 과거 보고값이며 최신 완료를 의미하지 않는다.

이미 웹스튜디오 V30 `ARCHIVE_REUSE_AUDIT.md`에서 웹스튜디오 과거 V18~V21/관련 프로젝트를 조사,
음식점·뷰티·물류 3업종 × 4개 = 12개 시연 기능을 `reuse-lab.html`로 독자 재구성하였다.
기존 12업종×4기능 48개와 합계 시연 기능 60개이다.
**11개 프로젝트 제품 자체가 웹에서 실행되거나 판매 검증됐다는 뜻이 아니다.**

## 조사 원장 (11개)

| 프로젝트 | 확인된 라이브러리 보관물 | 이번 차수 검증 상태 | 웹 활용 후보 |
|---|---|---|---|
| BXPRO | `/BXPRO/BXPRO_Go_Windows_Builder_MVP64_QA1_BUILD_HANDOFF_HOLD.zip` | 목록만 | 소스 인계·빌드 증거 형식 |
| FileDeliveryGuard | `/FileDeliveryGuard_PRO/FDG975_Native_Product_BXPRO_QA1_Research_HOLD_AllInOne.zip` | 목록만 | 브라우저 파일 SHA·결과 내보내기 검증 |
| DocFlowGuard | `/DocFlowGuard_PRO/DocFlowGuard_FastSalesFocus_20261102_AllInOne_HOLD.zip` | 목록만 | 문서 자료 준비·내보내기 체크리스트 |
| Movie Edit PRO | `/Movie_Edit_PRO/MovieEditPRO_R456_Windows_SHAReplay_OfflineQA1_HOLD_AllInOne.zip` | ZIP CRC/경로 PASS | 납품 보고서·파일 SHA 대조. FFmpeg 자동 포함 금지 |
| CADReview PRO | `/CADReviewPro/CADReviewPRO_R388_Windows_AutoQA_AllInOne_HOLD.zip` | ZIP CRC/경로 PASS | 2D 도면 변경 보고서 구조. DXF 웹 엔진 미승인 |
| BaljuBridge PRO | `/BaljuBridge_PRO/BaljuBridge_PRO_C676_WindowsNative_GitHubReadbackPASS_SaleHOLD_AllInOne.zip` | 목록만 | 구매 품목·견적 요청 워크플로 |
| AnsimBoan PRO | `/Ansimboan_PRO/AnsimBoan_C710_PinnedCommit_Fetch_AllInOne_HOLD.zip` | ZIP CRC/경로 PASS | SHA 출처 검증 개념. 공개 사이트에서 Git clone/fetch 금지 |
| SajinHangyeol PRO | `/SajinHangyeol_PRO/SajinHangyeol_PRO_HG1378_QA1_Readback_And_DropFix_Windows_HOLD_AllInOne.zip` | ZIP CRC/경로 PASS | 상품이미지·SKU 검수 흐름의 클라이언트 웹 재구현 후보 |
| FileTool PRO 57 | `/FileTool_PRO_57/FileTool_PRO57_C302_Native4SKU_GUIMessageQA_AllInOne_HOLD.zip` | ZIP CRC/경로 PASS | CSV/JSON/TSV 웹 변환·안전 입력 검수 후보 |
| FieldSector | `/FieldSectorSuite/FieldSectorSuite_C305_PROGRESS_TRACKER.md` | 목록만 | 현장 체크리스트 UI |
| QA Robot 1 | `/QA_Robot_KR/QA1_Common_Windows_LocalHub_V25_FastEvidenceReuse_RealVendorHelpGate_OneClick_HOLD.zip` | 목록만 | Self-Preflight·회귀·증거 원칙 |

'목록만'은 Library 당시 폴더의 파일명 존재를 뜻하며 소스 열람/기능 검증이 아니다.
'ZIP CRC/경로 PASS'도 보관 파일 구조만 검사한 것으로 동작·사용권·판매 승인이 아니다.

## 실제 읽은 ZIP SHA256

- Movie Edit R456: `e33fbe179006a4bbfecab550511746c44bd4fc87467ec0481d6f22a63611e2e1`
- CADReview R388: `488a85d97344426116b9a67c5174067adc2d218b2ee22d0f79bfd602652dcbfc`
- AnsimBoan C710: `da849fb175a4637cb575f240b85be8934948d58c5646cb19fb605f43301d5f2a`
- SajinHangyeol HG1378: `ed237cab3e8f82d9e4d25025898ba00c78af24426f20b01478fafa79cc11686a`
- FileTool C302: `0c64f0aa1af8de342cdf577ede0d2535e4b95d8daa3ab4998e702295195181a3`

다섯 ZIP의 CRC 검사·경로 순회/심볼릭 링크 진입 검사 PASS. 코드 실행이나 임의 추출 없음.

## 우선 적용 및 남은 단계

- [x] QA1 기록에서 11개 프로젝트 조사 대상과 과거 99후보 조사 추적
- [x] V30 이미 반영된 3업종 12개 시연 기능의 중복 이식 금지
- [x] Library 11폴더/후보 파일명 조사
- [x] 5 ZIP 직접 CRC·안전경로·목록·라이선스 문서 위치 점검
- [ ] 나머지 6 프로젝트 최신 원본 파일 확보 후 해시/라이선스·코드 검토
- [ ] FileTool CSV/JSON/TSV 및 사진한결 상품이미지/SKU 중복 검토 후 브라우저로 독자 재구성
- [ ] 발주브릿지 B2B 주문서 UX, 문서안심/파일딜리버리 데이터 무결성 적용성 조사
- [ ] 320~1440px UI, 정/반례·개인정보·접근성·실자료 자체 QA
- [ ] GitHub 별도 PR로 승인된 순수 웹 코드만 편입 및 Cloudflare 공개 실배포 별도 확인

**원칙:** 사용자 원본/최신 프로젝트 삭제 금지. Go/Python/Windows EXE를 그대로 홈페이지에 붙이지 않는다.
외부 바이너리·유료 API·대형 AI 모델·라이선스 확인 안 된 사진/폰트는 도입하지 않는다.
비용 0원, 자체 QA 우선, 실제 예약·결제·고객 납품 실적을 시연 기능과 혼동하지 않는다.
