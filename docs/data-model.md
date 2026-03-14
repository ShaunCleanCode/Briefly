## Data Model (Draft v1)

### 설계 원칙
- **콘텐츠는 `Post` + `type`으로 단일화**(확장/검색/권한/태깅 단순화)
- Daily는 “글 1개”가 아니라 운영 관점에서 **`DailyIssue(날짜)` + `DailyPost(공용)` + `PersonalizedBlock(고객별)`**로 모델링
- Heatmap은 S&P500 “가격 데이터”가 필요하므로, MVP에서는 외부 공급자/정적 스냅샷 중 하나로 시작 가능(구현 선택)

---

### 핵심 엔티티

#### 1) 사용자/구독
- **User**
  - id, email, role(`admin|customer`)
  - plan(`basic_10|intelligence_30`)
  - status, createdAt
- **UserProfile**
  - userId(FK)
  - knowledgeLevel(`beginner|intermediate|advanced`)
  - interests (topics/sectors freeform + normalized optional)
  - createdAt/updatedAt

#### 2) 티커/분류(S&P 500)
- **Ticker**
  - symbol (e.g., AAPL), name
  - sector, industry (GICS 기준 권장)
  - logoUrl (옵션)
  - isSp500(boolean)

#### 3) 뉴스 수집(종목 중심)
- **NewsItem**
  - id, symbol(FK->Ticker)
  - source, title, snippet, url
  - publishedAt
  - fetchedAt
  - dedupKey (중복 제거용)
  - relevanceScore (초기에는 0~1 또는 정수)

#### 4) 콘텐츠(운영자/고객 공통)
- **Post**
  - id, type:
    - `daily|market|weekly|setup|ticker_research|handbook|trade_buy|trade_sell`
  - title, body (markdown/richtext)
  - authorId(FK->User)
  - primarySymbol (옵션, ticker_research/trade에서 사용)
  - symbols[] (태그/연관 티커)
  - publishedAt, status(`draft|published`)

> NOTE: Trade 로그를 `Post`로 통합할지(`trade_buy/sell`) vs 별도 테이블(`TradeLog`)로 둘지 결정 필요.
> MVP에서는 **포트폴리오 계산**이 있으니 `TradeLog` 별도 테이블을 추천하고, UI 글 렌더링은 `Post`로 미러링(선택) 가능.

#### 5) Daily 발행/개인화
- **DailyIssue**
  - id, date(YYYY-MM-DD, unique)
  - dailyPostId(FK->Post where type=daily)
  - status(`draft|review|approved|sent`)
  - createdAt/updatedAt

- **PersonalizedBlock**
  - id, dailyIssueId(FK)
  - userId(FK)
  - blockType(`portfolioImpact|watchlist|checklist`)  // 고객당 3개 고정
  - content (markdown/richtext)
  - status(`draft|review|approved`)
  - editorNotes (운영자 메모)
  - createdAt/updatedAt

#### 6) 포트폴리오(옵션 입력, 로그 기반 갱신)
- **Portfolio**
  - id, userId(FK)
  - baseCurrency (기본 USD)
  - createdAt/updatedAt

- **Holding**
  - id, portfolioId(FK)
  - symbol(FK->Ticker)
  - shares
  - avgCost (옵션)
  - weightCached (옵션: 빠른 렌더링용)
  - updatedAt

- **TradeLog**
  - id, userId(FK), portfolioId(FK)
  - symbol(FK->Ticker)
  - side(`BUY|SELL`)
  - tradedAt (datetime)
  - shares, price
  - memo (왜 샀/팔)
  - createdAt

---

### 관계(요약)
- User 1–1 UserProfile
- User 1–1 Portfolio (MVP)
- Portfolio 1–N Holding
- User/Portfolio 1–N TradeLog
- Ticker 1–N NewsItem
- Post는 type에 따라:
  - daily: DailyIssue와 연결
  - ticker_research: primarySymbol로 Ticker Hub에 노출
  - market/weekly/setup/handbook: 섹션별 피드에 노출
- DailyIssue 1–N PersonalizedBlock (고객별 3개 * 고객 수)

---

### 핵심 워크플로우(서버 관점)

#### A) Daily 생성/검수/발송
1. 운영자: `Post(type=daily)` 작성/발행(또는 draft)
2. 시스템: `DailyIssue(date)` 생성 후, 모든 고객에 대해 PersonalizedBlock 3개 초안 생성
3. 운영자: 고객별 PersonalizedBlock 편집/승인
4. 시스템: 승인된 블록 + 공용 Daily를 조합해 메일/웹 렌더
5. `DailyIssue.status = sent`

#### B) 뉴스 수집(티커 기반)
1. 운영자 또는 배치잡: 티커 입력
2. Web Search로 기사 후보 수집 → `NewsItem` 저장
3. 중복 제거(dedupKey) 및 상위 N개만 노출(초기 룰)

#### C) TradeLog → Holding 재계산
- BUY: 해당 symbol shares 증가, avgCost 갱신(가중평균)
- SELL: shares 감소(0 이하 방지), avgCost 정책(보통 유지)
- weightCached는 최신 가격(별도)과 함께 재계산(옵션)

