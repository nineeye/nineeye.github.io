Converter Mall - PROJECT.md
프로젝트명

Converter Mall

프로젝트 목표

브라우저에서 모든 파일을 처리하는 AI 기반 파일 변환 플랫폼.

단순한 변환기가 아니라 업로드된 파일을 자동 분석하여 가장 적합한 작업을 추천하는 AI File Workspace를 목표로 한다.

핵심 원칙
모든 작업은 브라우저에서 처리
서버 업로드 최소화
무료 우선
모바일 지원
SEO 최적화
확장 가능한 구조
파일별 리팩토링
부분 수정 금지
항상 완성 파일 단위로 작업
현재 구조

Converter-Mall/

index.html

assets/

css/

main.css

toast.css

js/

app.js

toast.js

workspace-engine.js

tool-registry.js

...

converters/

...

현재 개발 방향

파일 업로드

↓

AI 파일 분석

↓

추천 변환기 표시

↓

Workspace 생성

↓

원클릭 변환

↓

다운로드

완료된 기능
메인 UI
검색창
카테고리
인기 변환기
최근 사용 UI
즐겨찾기 UI
AI 추천 영역
Workspace 구조
Toast 구조
수정 예정
app.js 리팩토링
중복 코드 제거
searchBox 중복 선언 제거
toolCards 중복 제거
Recent 중복 제거
Favorite 중복 제거
drag \& drop 수정
클릭 업로드 수정
콘솔 오류 제거
앞으로 추가할 기능
AI File Analyzer
PDF 분석
이미지 분석
OCR 분석
변환 성공률 예측
예상 시간
예상 품질
최근 사용(LocalStorage)
즐겨찾기(LocalStorage)
Tool Registry 자동 연결
JSON 기반 Converter Registry
AI Workspace
개발 규칙
설명보다 코드 우선
항상 파일 단위 완성본
부분 코드 금지
기존 기능 유지
리팩토링 후 기능 추가
콘솔 오류 0개 유지
작업 우선순위
app.js
index.html
main.css
workspace-engine.js
tool-registry.js
AI Analyzer
Converter 연결
장기 목표

300개 이상의 변환기

AI File Workspace

SEO 최적화

PWA

모바일 앱 수준 UX

브라우저 내 모든 처리

Converter Mall를 세계적인 파일 변환 플랫폼으로 성장시키는 것을 목표로 한다.



가장 중요한 규치

추가 개발 규칙 (최우선)

반드시 지킬 원칙



이 프로젝트는 앞으로 모든 JavaScript를 모듈화한다.



더 이상 거대한 app.js 하나에 모든 기능을 작성하지 않는다.



구조



assets/js/



app.js (메인 진입 파일)

upload.js

search.js

workspace.js

theme.js

recent.js

favorite.js

animation.js

analyzer.js

tool-registry.js

toast.js



app.js는 초기화(init)와 모듈 연결만 담당한다.



각 기능은 반드시 별도 파일에서 관리한다.



새로운 기능은 기존 app.js에 추가하지 말고 새로운 모듈 파일을 생성하여 연결한다.



리팩토링 원칙

app.js는 가능한 100\~150줄 이하를 유지한다.

각 모듈은 하나의 기능만 담당한다.

파일 하나가 너무 커지면 다시 분리한다.

항상 "파일 단위 완성본"으로 작업한다.

부분 코드 수정 방식은 사용하지 않는다.

기존 기능을 유지하면서 리팩토링한다.

AI 작업 규칙



응답 길이 제한 때문에 긴 파일 하나를 계속 수정하지 않는다.



대신 기능별 모듈로 분리하여 작업한다.



예를 들어 upload.js만 수정하면 upload.js 완성본만 출력한다.



search.js만 수정하면 search.js 완성본만 출력한다.



이 규칙을 프로젝트 종료 시까지 유지한다





현재 진행중인 작업

\# Converter Mall



현재 버전

v0.3



현재 완료 기능

\- Home

\- Router

\- PNG→JPG

\- PDF→Word

\- Dedup Engine



다음 작업

\- AI Workspace

\- Batch Queue



주의사항

\- app.js 수정 금지

\- uploadManager 유지

\- ES Module 유지



## v1.6.0 PNG Professional Codec Pack 1
- Added PNG → TGA, TIFF, PCX, CUR.


## v1.6.0 PNG Professional Codec Pack 2
- PNG → AVIF capability-detected browser encoder
- PNG → DDS BGRA8 encoder
- PNG → PSD flattened RGBA encoder
- Fixed duplicate upload drop-zone ID in special-tool template


## v1.20.0 전문화 상태
- Netpbm 계열(PNM/PPM/PGM/PBM/PAM) 실제 규격별 옵션 적용
- XBM 개발자용 C 코드 출력 설정 적용
- 다음 전문화 후보: Base64/HTML/ZIP 유틸리티, AVIF 지원 안내, 일반 입력 이미지 변환기 품질 정비


## v1.21.0 전문화 상태
- PNG → Base64 개발자 출력 형식 전문화
- PNG → HTML 독립 갤러리 템플릿 전문화
- PNG → ZIP 업무 패키징 규칙 전문화
- 공통 결과 복사 기능과 유틸리티 예상 용량 표시 추가

## v1.26.0 전문화 감사 결론

기존 작동 도구 50개의 형식별 전문화 1차가 완료되었다. 이후 기존 도구 수정은 실제 QA와 사용자 피드백 기반으로 진행하며, 신규 개발은 PDF 도구 확장 로드맵으로 전환한다. `scripts/qa-specialization.py`를 배포 전 필수 검사로 사용한다.


## v1.26.0 Smart Planner Copy & Grid
- 도구별 추천 문구를 형식 특성에 맞게 차별화
- 업로드 분석 결과(투명도·사진형·파일 수)를 추천 문구에 반영
- 스마트 변환 플래너를 데스크톱 3열, 태블릿 2열, 모바일 1열로 개편
- 최적 균형·용량/호환 대안·목적별 추천 3개를 비교 표시
- 추천 카드를 클릭하면 파일과 추천 설정을 해당 변환기로 전달


## v1.27.0 Recommendation Card Layout
- 추천/열기 버튼 하단 고정
- 형식별 인라인 SVG 아이콘
- 텍스트 영역 확장 및 동일 행 카드 정렬 개선


## v1.32.0
PDF 문서 관리 도구 5종 추가: 머리글·바닥글, 페이지 자르기, 양식 평탄화, 빈 페이지 삽입, 흑백 변환.


## v1.34.0
PDF 보안·배포 도구 5개 추가. 전체 등록 71개, 실제 작동 70개, PDF 도구 30개.

## Checkpoint v1.38.0
PDF 구조·리소스 분석 도구 5종 추가. 전체 81개 등록, 80개 작동, PDF 도구 55개.


### PDF 런타임 진단
`/pdf-runtime-check/`에서 PDF 편집·렌더링 엔진과 Worker 상태를 확인할 수 있습니다.
