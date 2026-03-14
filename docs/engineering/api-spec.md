## API Spec (Draft v1)

### 원칙
- MVP는 REST로 시작(추후 이벤트/큐 기반 확장)
- 인증: 세션/JWT 중 선택(구현 단계에서 결정)
- 권한: plan(`basic_10|intelligence_30`) + role(`admin|customer`) 조합

---

## Auth / Account
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /me`
- `PATCH /me/profile` (knowledgeLevel, interests 등)
- `PATCH /me/plan` (결제 연동 후)

---

## Daily (Today + Archive)
- `GET /daily/today`
  - returns: public DailyPost + personalized blocks(3) for current user
- `GET /daily/:date` (YYYY-MM-DD)
  - returns: DailyIssue + DailyPost + user blocks

### Admin Daily Operations
- `POST /admin/daily/:date` (create DailyIssue)
- `PUT /admin/daily/:date/post` (attach/update Post(type=daily))
- `POST /admin/daily/:date/generate-blocks` (create drafts for all users)
- `GET /admin/daily/:date/blocks?status=draft|review|approved`
- `PATCH /admin/daily/:date/blocks/:blockId` (edit content, status)
- `POST /admin/daily/:date/send` (send emails, mark sent)

---

## Posts (Market / Weekly / Setups / Research / Handbook)
- `GET /posts?type=market|weekly|setup|ticker_research|handbook&cursor=...`
- `GET /posts/:id`

### Admin CMS
- `POST /admin/posts`
- `PATCH /admin/posts/:id`
- `POST /admin/posts/:id/publish`

---

## Heatmap (S&P 500)
- `GET /heatmap/sp500?date=today`
  - returns: list of tickers with 1d change + sector + marketCap(optional)
  - note: data provider/ingest 방식은 구현 선택(초기엔 정적/배치 가능)

---

## Ticker Hub (뉴스 먼저 → 리서치)
- `GET /tickers/:symbol`
  - returns: ticker meta + latest news items + latest research posts
- `GET /tickers/:symbol/news?cursor=...`
- `GET /tickers/:symbol/research?cursor=...`

### Admin News Ingest
- `POST /admin/news/ingest`
  - body: { symbol, query?: string }
  - action: web search 수행 → NewsItem 저장
- `PATCH /admin/news/:id` (relevanceScore, pin, hide 등)

---

## Portfolio / Trades
> **Portfolio는 Intelligence($30)에서만 접근**(Basic은 접근 불가)

- `GET /portfolio`
- `POST /portfolio` (optional: 초기 수기 입력 시작)
- `PUT /portfolio/holdings` (수기 보유 입력/수정 - MVP 옵션)
- `GET /portfolio/holdings`

### Trades (BUY/SELL logs)
- `GET /trades?symbol=...&cursor=...`
- `POST /trades`
  - body: { symbol, side, tradedAt, shares, price, memo }
  - effect: Holding 재계산 트리거
- `DELETE /trades/:id` (정정용)

---

## Access Control (요약)
- **Basic $10**
  - Daily(오늘+아카이브), Market Blog, Weekly Blog
- **Intelligence $30**
  - Basic 포함 + Heatmap + Ticker Hub(뉴스/리서치) + Setups + Portfolio + Trades + (향후) Handbook
- **Admin**
  - 모든 Admin API 접근

---

## Jobs / Events (권장)
- `job.newsIngest(symbol)` (manual or scheduled)
- `job.dailyGenerateBlocks(date)` (draft 생성)
- `job.dailySend(date)` (메일 발송/로그)
- `event.tradeCreated(userId, symbol)` → `job.recalcHoldings(userId)`

