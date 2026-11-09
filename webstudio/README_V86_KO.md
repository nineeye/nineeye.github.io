# 올파일원 웹스튜디오 V86 — 고객이 실제 계약 전 살펴볼 12개 업종별 제작 솔루션

V85가 실제 HTML의 디자인 차이와 84개 가상 기능 시연을 보여주었다면 V86은 **각 업종 구매자의 문제를 설명하고, 필요한 기능을 고르게 하며, 신뢰할 수 있는 상담 범위로 안내**합니다.

- 판매형 허브: `industry-guide/index.html`.
- 12개의 고유 업종 페이지: `industry-guide/{manufacturing,corporate,clinic,academy,interior,commerce,professional,association,franchise,stay,realestate,event}.html`.
- 하나의 공통 CSS/JS (`assets/v86-guide.css`/`assets/v86-guide.js`)를 무료·독립 구현하고 업종별 본문은 모두 다른 첫 문장, 3가지 목표, 3가지 준비 절차 및 7개 가상 시연 기능 제목/설명으로 구성.
- 목표 선택 시 관련 기능 3개 강조, 디자인 선택 시 V85/V81 연결 링크 자동 수정, 4개 준비 항목 체크 및 UTF-8 BOM 한글 TXT 직접 다운로드. 외부 API·고객정보 수집·이메일 자동 전송·결제 없음.
- 상업적 사용 여부: 이 코드는 프로젝트용 창작 CSS/JS와 기존 본인 사이트의 카탈로그/이미지만 사용. 외부 브랜드 실적·고객 리뷰·가상 수익성을 진짜처럼 표시하지 않음.
- 실제 예약·결제·회원·고객DB·실시간 재고는 미구현; 계약 가격·VAT·유지보수는 별도 확인.
- QA: `python webstudio/tools/test_v86_sector_guides.py`와 기존 전체 회귀를 실행. 공개 검사 통과만으로 실제 고객 이메일 수신을 주장하지 않음.
