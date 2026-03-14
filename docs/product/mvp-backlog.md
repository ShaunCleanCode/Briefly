## MVP Backlog (Implementation Tickets)

### Epic A — Foundations
- **A1. Repo bootstrap**
  - AC: 기본 프로젝트 구조 + `docs/` 포함, 환경변수 템플릿, 실행 스크립트 정의
- **A2. Auth & Roles**
  - AC: customer/admin 로그인, `/me`로 role/plan 확인
- **A3. Plan gating (Basic vs Intelligence)**
  - AC: Basic은 Daily/Market/Weekly만 접근 가능, 나머지는 403 + 업그레이드 CTA

---

### Epic B — Content CMS
- **B1. Post 모델 + 타입별 피드**
  - AC: market/weekly/setup/ticker_research/handbook 글 작성/발행/목록/상세
- **B2. Ticker Research 아카이브**
  - AC: `primarySymbol` 기준 최신순 리스트, Ticker Hub에서 노출

---

### Epic C — Daily (공용 + 개인화 3블록 + 아카이브)
- **C1. DailyIssue 생성(날짜 1개 고정)**
  - AC: 날짜별 DailyIssue unique, 상태 전이(draft→review→approved→sent)
- **C2. Daily 공용 글 작성/연결**
  - AC: 운영자가 DailyPost 연결하면 고객 Today에 공용 섹션 표시
- **C3. PersonalizedBlock 3종(초안 생성)**
  - AC: 고객당 `portfolioImpact|watchlist|checklist` 3개 생성, 편집 가능
- **C4. 운영자 검수 UI**
  - AC: 고객별 블록 리스트, 수정/승인/검색(상태 필터)
- **C5. Today 렌더링 + Archive**
  - AC: `GET /daily/today`, `GET /daily/:date`로 웹 재열람
- **C6. Email send**
  - AC: 승인된 블록 + 공용 Daily 조합으로 발송, sent 로그 기록

---

### Epic D — Heatmap (S&P 500, 1D Change)
- **D1. S&P 500 ticker seed**
  - AC: Ticker 테이블에 S&P500 심볼/섹터 로딩
- **D2. Heatmap 데이터 파이프라인(초기)**
  - AC: 1일 등락률을 제공할 수 있는 최소 데이터 소스 확보(정적 스냅샷/배치)
- **D3. Heatmap UI**
  - AC: 섹터별 타일, 색상=1D change, 클릭 시 Ticker Hub 이동

---

### Epic E — Ticker Hub (뉴스 먼저 → 리서치)
- **E1. NewsItem 저장/중복 제거**
  - AC: 같은 URL/제목 중복 방지(dedupKey), 최신순 노출
- **E2. 운영자 Ingest (Web Search)**
  - AC: 심볼 입력하면 NewsItem 후보 저장, 관리 가능
- **E3. Ticker Hub UI**
  - AC: 상단 뉴스 리스트(먼저), 하단 리서치 글 최신순

---

### Epic F — Portfolio & Trades (Intelligence only)
- **F1. Portfolio 기본 구조 + 초기 수기 입력(옵션)**
  - AC: 보유종목이 없어도 가입/콘텐츠 소비 가능, 있으면 입력하여 저장
- **F2. TradeLog(BUY/SELL) CRUD**
  - AC: memo 포함, 티커 필터/정렬
- **F3. Holding 재계산**
  - AC: BUY/SELL 입력 시 shares/avgCost 업데이트, 음수 방지
- **F4. Portfolio UI**
  - AC: Circle(비중) + List(로고/비중/상세)
  - AC: 로고 클릭 → Ticker Hub(리서치)
  - AC: 행 클릭 → 내 TradeLogs 요약

---

### Epic G — Observability & Safety
- **G1. Admin audit log (중요 작업)**
  - AC: Daily send, block approve, news ingest 기록
- **G2. Copy/Compliance 가이드**
  - AC: 투자 조언 표현 제한 문구/면책 포함(메일/웹 공통)

