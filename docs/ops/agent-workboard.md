## Agent Workboard (PM Control Center)

### 목적
- **에이전트 운영을 “한 장”에서 관리**한다.
- 스펙/계약/테스트/실행 결과를 연결해, **누가 무엇을 언제까지** 책임지는지 명확히 한다.
- PM이 “다음 태스크를 누구에게” 줄지 즉시 판단 가능하게 한다.

---

## 1) Source of Truth (절대 기준 문서)
- **Backend contract**: `docs/onboarding/onboarding-backend-spec.md`
- **Frontend UX spec**: `docs/onboarding/onboarding-frontend-spec.md`
- **SDET test plan**: `docs/quality/sdet/sdet-onboarding-test-plan.md`
- **QA package**:
  - `docs/quality/qa/qa-onboarding-checklist.md`
  - `docs/quality/qa/qa-demo-script.md`
  - `docs/quality/qa/qa-edge-cases.md`
  - `docs/quality/qa/qa-release-criteria.md`
  - `docs/quality/qa/qa-bug-template.md`
- **Execution report**: `docs/ops/execution-run-report.md`

---

## 2) Roles & Responsibilities (RACI-lite)

### Product Manager (PM)
- **Owns**: scope, priority, acceptance criteria, release decision
- **Approves**: spec changes and severity rules

### Backend Engineer Agent
- **Owns**: `/api/onboarding/*` behavior, DB schema, contract correctness, deterministic question engine rule
- **Outputs**: updated `docs/onboarding/onboarding-backend-spec.md`, API implementation, migrations, seeds

### Frontend Engineer Agent
- **Owns**: onboarding UX implementation, question renderer, consent UX, back/resume UX, S&P500 dataset usage
- **Outputs**: working UI + build passing + aligns with backend contract

### SDET Agent
- **Owns**: automated testing strategy + contract tests + E2E tests stability
- **Outputs**: `docs/quality/sdet/sdet-onboarding-test-plan.md` + runnable tests + flake rules

### QA Agent
- **Owns**: manual QA, UX/copy quality, edge cases, release sign-off criteria
- **Outputs**: QA docs + bug reports (template format)

### Execution Runner Agent
- **Owns**: build/run/test/demo execution only (no design/code changes)
- **Outputs**: `docs/ops/execution-run-report.md` + logs under `logs/execution/YYYY-MM-DD/`

### System Architecture Engineer Agent (Architecture Steward)
- **Owns**: repository/documentation structure, ADRs, contract coherence, module boundaries
- **Outputs**:
  - `docs/architecture/overview.md`
  - `docs/architecture/repo-structure.md`
  - ADRs under `docs/adr/`

---

## 3) Current Status Snapshot (2026-03-05)

### ✅ Completed
- 스펙/QA/SDET/Runner 문서 생성 완료
- Contract tests: **44/44 PASS**
- Lint: PASS (warnings only)
- Dev server: PASS
- Dashboard MVP: Portfolio wheel + positions + Logs (W-200~W-204 done)

### 🚨 Blockers (P0)
None. All P0 gates passed.

---

## 4) Active Work Items (assignable tasks)
> Status options: `todo | doing | blocked | done`

### Dashboard MVP Status Snapshot (2026-03-04)
- `/dashboard` MVP implemented (Portfolio wheel + positions + Logs)
- Build: PASS (`npm run build`)
- Type-check: PASS (`npm run type-check`)

### P0 — Ship blockers

#### W-001 — Fix TS build error in onboarding hooks (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: `npm run build` succeeds
- **Acceptance Criteria**
  - `npm run build` exit code 0
  - No TypeScript errors in `src/hooks/useOnboarding.ts`
- **Artifacts**
  - Link in PR/commit message to the fix
  - Updated `docs/ops/execution-run-report.md` after rerun

#### W-002 — Make E2E smoke deterministic (SDET + FE/BE + Runner)
- **Owner**: SDET Agent
- **Status**: done
- **Decision**: Mode B (Mocked API) — `docs/adr/0002-e2e-strategy.md`
- **Acceptance Criteria**
  - `npm run test:e2e:smoke` completes within target time and passes
  - Clear instructions for Runner in the runbook
- **Artifacts**
  - Update `docs/quality/sdet/sdet-onboarding-test-plan.md` with the chosen mode
  - Add/update `package.json` scripts if required

#### W-003 — Fix E2E regression suite failures (SDET)
- **Owner**: SDET Agent
- **Status**: done
- **Goal**: reduce regression failures (resolved; 1 skipped as known issue)
- **Acceptance Criteria**
  - `npm run test:e2e:regression` unexpected failures → 0 (known issue may be skipped with follow-up ID)
  - Keep smoke suite stable (no new flakes)

---

### P1 — Quality improvements (after P0)

#### W-004 — TextInput maxLength validation (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: unskip and pass OB-TC-119 (text maxLength validation)
- **Acceptance Criteria**
  - `npm run test:e2e:regression` passes with 0 skipped
  - `npm run test:e2e:smoke` still passes

#### W-101 — Fix React hook exhaustive-deps warnings (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: remove warnings without changing behavior

#### W-302 — Formalize Memory Bank operations (Architecture)
- **Owner**: System Architecture Engineer Agent
- **Status**: done
- **Goal**: make `docs/ops/memory-bank.md` an official operational asset (ownership, entry template, references)
- **Acceptance Criteria**
  - `docs/ops/memory-bank.md` has a standard entry format + ownership rules
  - `docs/README.md`, `docs/agents/README.md`, and `docs/reports/templates/README.md` reference the memory bank
  - (Optional) ADR `docs/adr/0003-memory-bank-policy.md` if deemed irreversible
- **Artifacts**
  - `docs/reports/agents/architecture/W-302-architecture-report-2026-01-29.md`

#### W-102 — Replace partial S&P500 list with full static dataset (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: ticker search completion rate / accuracy
- **Acceptance Criteria**
  - Full S&P500 symbols available, including dot tickers
- **Artifacts**
  - `docs/reports/agents/frontend/W-102-frontend-report-2026-01-29.md`

#### W-103 — Next.js viewport metadata warning cleanup (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Artifacts**
  - `docs/reports/agents/frontend/W-103-frontend-report-2026-01-29.md`

---

### P0 — Dashboard MVP (Portfolio + Logs)

#### W-200 — Create `/dashboard` route + tabs shell (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: onboarding 완료 후 사용자가 착지할 “대시보드” 기본 화면 제공
- **Acceptance Criteria**
  - `/dashboard` 라우트가 존재하고 렌더링된다
  - Portfolio/LOG 탭 전환이 동작한다
- **Artifacts**
  - `src/app/dashboard/page.tsx`

#### W-201 — Portfolio wheel (donut) with labels (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: 이미지처럼 “도넛 + 티커 라벨”로 비중을 직관적으로 표시
- **Acceptance Criteria**
  - 라벨/리더라인/도넛이 잘리지 않는다
  - 조각 이음새 아티팩트가 보이지 않는다(채움 슬라이스 방식)
- **Artifacts**
  - `src/components/dashboard/PortfolioDonut.tsx`

#### W-202 — Logs CRUD UX polish (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: 로그(매수/매도) 작성/수정/삭제 UX를 “과하지 않게” 제공
- **Acceptance Criteria**
  - 카드 롱프레스(길게 누름) 후 Edit/Delete 액션 노출
  - NEW LOG 버튼은 상단 고정 CTA 없이, LOG 리스트 내부에서만 제공(+) 
  - 작성/편집은 오른쪽 패널(모달/시트)에서 수행
- **Artifacts**
  - `src/components/dashboard/TradeLogList.tsx`
  - `src/components/dashboard/TradeLogComposer.tsx`
  - `src/app/dashboard/page.tsx`

#### W-203 — Customer portfolio seed + “current value” manual input (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: 고객 포트폴리오를 “매수금액(원가)” 기준으로 화면에 반영하고, 현재 평가금액은 비워두고 사용자가 입력 가능
- **Acceptance Criteria**
  - 최초 진입 시 seed된 포지션이 표시된다
  - 각 포지션의 “현재 평가금액(원)” 입력란이 비어있고, 입력 시 즉시 저장/반영된다
  - “현재가 비우기”로 모든 현재 평가금액을 null로 초기화 가능
- **Artifacts**
  - `src/hooks/usePortfolioPositionsLocal.ts`
  - `src/components/dashboard/PositionsPanel.tsx`
  - `src/types/portfolio.ts` (`PortfolioPosition`)

#### W-204 — Logs filter dropdown + SELL realized P/L row (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: LOG에서 All/BUY/SELL 필터 드롭다운(체크 표시) 제공 + SELL 행에 실현손익(금액/%) 한 줄 요약 + Finviz-like tint
- **Acceptance Criteria**
  - 필터가 드롭다운 리스트 형태로 동작하고 선택값에 체크가 표시된다
  - SELL 로그는 Avg cost 기준 실현손익(금액/%)이 표시된다
  - 배경 tint는 과도하게 쨍하지 않으며(투명도/최대강도 제한), 텍스트 가독성이 유지된다
- **Artifacts**
  - `src/components/dashboard/TradeLogList.tsx`
  - `src/lib/portfolio/trade-metrics.ts`

---

### P1 — Market data auto-refresh (Finnhub)

#### W-205 — Market quotes API route + caching (BE)
- **Owner**: Backend Engineer Agent
- **Status**: todo
- **Goal**: Finnhub 기반 미국 주식 현재가(quote) 조회를 서버에서 수행하고 캐싱(TTL)으로 레이트리밋을 방어
- **Scope**
  - 신규 API: `GET /api/market/quotes?symbols=AAPL,MSFT,...`
  - 서버에서 Finnhub 호출(토큰은 env), 심볼별 캐시(TTL 60~120s)
  - 429/오류 시 graceful fallback(캐시 있으면 캐시 반환)
- **Acceptance Criteria**
  - 동일 심볼 다중 요청은 캐시로 합쳐져 외부 호출이 폭증하지 않는다
  - 최소 20명 규모에서 “첫 진입/새로고침” 패턴으로도 429가 나지 않도록 방어 로직이 존재한다(캐시 + 쿨다운)
  - README 또는 runbook에 `FINNHUB_API_KEY` 환경변수 설정 방법이 기록된다
- **Artifacts**
  - `src/app/api/market/quotes/route.ts` (new)
  - (optional) `src/lib/cache/*` (if extracted)

#### W-206 — FE auto-fill current values on load + refresh (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: todo
- **Goal**: Portfolio 탭 진입 시 자동으로 미국 주식 포지션의 현재 평가금액이 채워지고, pull-to-refresh/새로고침 시 갱신
- **Scope**
  - FE는 `GET /api/market/quotes`만 호출(직접 Finnhub 호출 금지)
  - 포지션 중 미국 티커만 자동 업데이트(예: SCHD/VOO/VST/AMZN/AVGO)
  - “당겨서 새로고침”은 웹에서는 Refresh 버튼/재시도 UI로 대체(쿨다운 포함)
- **Acceptance Criteria**
  - 첫 진입 시(Portfolio 탭) 자동 fetch가 1회 실행되고 UI가 업데이트된다
  - 사용자가 수동으로 새로고침/갱신을 요청하면 TTL 이후에만 재조회되거나, TTL 내에는 “최근 갱신됨” 상태를 보여준다
  - 외부 API 실패 시에도 화면이 깨지지 않고 마지막 캐시/기존 값을 유지한다
- **Artifacts**
  - `src/hooks/usePortfolioPositionsLocal.ts` (extend)
  - `src/app/dashboard/page.tsx` (wire)

---

### P1 — Briefly Character WebGL (브리플리)

> 스펙: `docs/product/briefly-character-spec.md`

#### W-400 — 기본 구체 + 반투명 머티리얼 (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: R3F + drei 설치, MeshTransmissionMaterial로 반투명/홀로그램 구체 렌더링, Next.js dynamic import 통합
- **Scope**
  - `@react-three/fiber`, `@react-three/drei`, `three` 패키지 설치
  - `src/components/character/` 디렉토리 생성
  - 기본 구체 + 환경맵 + 포인트라이트
  - dynamic import (`ssr: false`) + 기존 이모지 fallback
- **Acceptance Criteria**
  - `npm run build` 성공 (Three.js 번들 별도 chunk)
  - 반투명 유리 구체가 화면에 렌더링된다
  - WebGL 미지원 환경에서 기존 이모지 캐릭터로 fallback
- **Artifacts**
  - `src/components/character/BrieflyCharacter3D.tsx`
  - `src/components/character/BrieflyScene.tsx`
  - `src/components/character/BrieflySphere.tsx`

#### W-401 — 프로시저럴 눈 + 기본 표정 (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: 프로시저럴 눈 메시 생성 + idle 깜빡임 + neutral/happy/thinking 3가지 감정
- **Acceptance Criteria**
  - 구체 위에 흰색 눈 2개가 렌더링된다
  - idle 깜빡임 애니메이션이 주기적으로 동작한다
  - emotion prop으로 neutral/happy/thinking 전환 가능
- **Artifacts**
  - `src/components/character/BrieflyEyes.tsx`
  - `src/components/character/useEmotionState.ts`

#### W-402 — 감정 시스템 확장 (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: 8가지 감정 전체 구현 (색 전환 hue lerp + 윙크/찡그림 표정)
- **Acceptance Criteria**
  - 8가지 감정별로 색과 표정이 모두 다르게 표현된다
  - 감정 전환 시 0.5초 이내 smooth transition
- **Artifacts**
  - `src/components/character/constants.ts`

#### W-403 — 마이크로 인터랙션 (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: 호버/클릭/스크롤 반응 + idle 부유 애니메이션
- **Acceptance Criteria**
  - 마우스 호버 시 구체가 살짝 기울어진다
  - 클릭 시 윙크 + scale bounce
  - idle 상태에서 부드러운 상하 부유

#### W-404 — 후처리 + 성능 최적화 + QA (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: Bloom/색수차 후처리, celebrating 파티클, 성능 최적화, 크로스 브라우저 QA
- **Acceptance Criteria**
  - 모바일 30fps+, 데스크톱 60fps
  - Three.js chunk < 200KB gzipped
  - viewport 밖에서 렌더링 중지
  - `useReducedMotion` 존중

#### W-405 — 커비 볼 빵빵 + 입 메시 (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: done
- **Goal**: "puffed" 감정 추가 — 커비처럼 볼을 빵빵하게 부풀리고 입을 살짝 벌린 표정
- **Scope**
  - `BrieflyMouth.tsx` 신규 생성 (프로시저럴 입 메시)
  - `puffed` 감정을 useEmotionState에 추가 (구체 팽창 + 입 열림 + 눈 축소)
  - BrieflyScene에 mouth 통합
  - dev 페이지에 Puffed 버튼 추가
- **Acceptance Criteria**
  - `puffed` 감정 시 구체가 ~8% 팽창하고 입이 살짝 벌어진다
  - 다른 감정에서 입은 보이지 않거나 매우 작다
  - 감정 전환 시 smooth lerp
  - `npm run build` 통과
- **Artifacts**
  - `src/components/character/BrieflyMouth.tsx`
  - `src/components/character/useEmotionState.ts` (수정)
  - `src/components/character/BrieflySphere.tsx` (수정)

---

## 5) Runner Command Checklist (for daily reruns)
Runner must execute and attach logs:
- `npm install`
- `npm run lint`
- `npm run build`
- `npx vitest run`
- `npm run dev` (or start prod build if required)
- `npm run test:e2e:smoke`
- Follow `docs/quality/qa/qa-demo-script.md`

---

## 6) PM Decision Gates
- **Gate A (Build)**: build passes (W-001 done)
- **Gate B (E2E Smoke)**: e2e smoke passes (W-002 done)
- **Gate C (Demo)**: QA demo script verified by Runner
- **Ship**: must satisfy `docs/quality/qa/qa-release-criteria.md` (P0=0 open)

