## Agent Workboard (PM Control Center)

### 목적
- **에이전트 운영을 “한 장”에서 관리**한다.
- 스펙/계약/테스트/실행 결과를 연결해, **누가 무엇을 언제까지** 책임지는지 명확히 한다.
- PM이 “다음 태스크를 누구에게” 줄지 즉시 판단 가능하게 한다.

---

## 1) Source of Truth (절대 기준 문서)
- **Backend contract**: `docs/onboarding-backend-spec.md`
- **Frontend UX spec**: `docs/onboarding-frontend-spec.md`
- **SDET test plan**: `docs/sdet-onboarding-test-plan.md`
- **QA package**:
  - `docs/qa-onboarding-checklist.md`
  - `docs/qa-demo-script.md`
  - `docs/qa-edge-cases.md`
  - `docs/qa-release-criteria.md`
  - `docs/qa-bug-template.md`
- **Execution report**: `docs/execution-run-report.md`

---

## 2) Roles & Responsibilities (RACI-lite)

### Product Manager (PM)
- **Owns**: scope, priority, acceptance criteria, release decision
- **Approves**: spec changes and severity rules

### Backend Engineer Agent
- **Owns**: `/api/onboarding/*` behavior, DB schema, contract correctness, deterministic question engine rule
- **Outputs**: updated `docs/onboarding-backend-spec.md`, API implementation, migrations, seeds

### Frontend Engineer Agent
- **Owns**: onboarding UX implementation, question renderer, consent UX, back/resume UX, S&P500 dataset usage
- **Outputs**: working UI + build passing + aligns with backend contract

### SDET Agent
- **Owns**: automated testing strategy + contract tests + E2E tests stability
- **Outputs**: `docs/sdet-onboarding-test-plan.md` + runnable tests + flake rules

### QA Agent
- **Owns**: manual QA, UX/copy quality, edge cases, release sign-off criteria
- **Outputs**: QA docs + bug reports (template format)

### Execution Runner Agent
- **Owns**: build/run/test/demo execution only (no design/code changes)
- **Outputs**: `docs/execution-run-report.md` + logs under `logs/execution/YYYY-MM-DD/`

### System Architecture Engineer Agent (Architecture Steward)
- **Owns**: repository/documentation structure, ADRs, contract coherence, module boundaries
- **Outputs**:
  - `docs/architecture/overview.md`
  - `docs/architecture/repo-structure.md`
  - ADRs under `docs/adr/`

---

## 3) Current Status Snapshot (2026-01-29)

### ✅ Completed
- 스펙/QA/SDET/Runner 문서 생성 완료
- Contract tests: **44/44 PASS**
- Lint: PASS (warnings only)
- Dev server: PASS

### 🚨 Blockers (P0)
1) **Build FAIL**: TypeScript error
   - location: `src/hooks/useOnboarding.ts:90`
   - symptom: `Spread types may only be created from object types.`
2) **E2E Smoke TIMEOUT**
   - symptom: Playwright smoke tests time out waiting for `/api/onboarding/*`
   - likely: backend endpoint availability or mock layer not active in E2E

---

## 4) Active Work Items (assignable tasks)
> Status options: `todo | doing | blocked | done`

### P0 — Ship blockers

#### W-001 — Fix TS build error in onboarding hooks (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: todo
- **Goal**: `npm run build` succeeds
- **Acceptance Criteria**
  - `npm run build` exit code 0
  - No TypeScript errors in `src/hooks/useOnboarding.ts`
- **Artifacts**
  - Link in PR/commit message to the fix
  - Updated `docs/execution-run-report.md` after rerun

#### W-002 — Make E2E smoke deterministic (SDET + FE/BE + Runner)
- **Owner**: SDET Agent
- **Status**: todo
- **Decision needed** (choose one, document in SDET plan + runner)
  - **Mode A**: E2E runs against real local API (`/api/onboarding/*`)
  - **Mode B**: E2E runs against mocked API (MSW/Playwright route intercept)
- **Acceptance Criteria**
  - `npm run test:e2e:smoke` completes within target time and passes
  - Clear instructions for Runner in the runbook
- **Artifacts**
  - Update `docs/sdet-onboarding-test-plan.md` with the chosen mode
  - Add/update `package.json` scripts if required

#### W-003 — Confirm local onboarding API availability for E2E (BE)
- **Owner**: Backend Engineer Agent
- **Status**: todo
- **Goal**: ensure `/api/onboarding/*` endpoints exist and respond in local dev (or provide mock server contract)
- **Acceptance Criteria**
  - For Mode A: `curl` to key endpoints returns valid JSON (start/session/next/answer/skip/complete/profile)
  - For Mode B: provide mock responses and disable network dependency

---

### P1 — Quality improvements (after P0)

#### W-101 — Fix React hook exhaustive-deps warnings (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: todo
- **Goal**: remove warnings without changing behavior

#### W-102 — Replace partial S&P500 list with full static dataset (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: todo
- **Goal**: ticker search completion rate / accuracy
- **Acceptance Criteria**
  - Full S&P500 symbols available, including dot tickers

#### W-103 — Next.js viewport metadata warning cleanup (FE)
- **Owner**: Frontend Engineer Agent
- **Status**: todo

---

## 5) Runner Command Checklist (for daily reruns)
Runner must execute and attach logs:
- `npm install`
- `npm run lint`
- `npm run build`
- `npx vitest run`
- `npm run dev` (or start prod build if required)
- `npm run test:e2e:smoke`
- Follow `docs/qa-demo-script.md`

---

## 6) PM Decision Gates
- **Gate A (Build)**: build passes (W-001 done)
- **Gate B (E2E Smoke)**: e2e smoke passes (W-002 done)
- **Gate C (Demo)**: QA demo script verified by Runner
- **Ship**: must satisfy `docs/qa-release-criteria.md` (P0=0 open)

