## Architecture Overview (Draft v0.1)

### Scope (current)
- Onboarding (Duolingo-like UI) + onboarding backend contract
- Test/QA/Execution operations

### Near-term scope (next)
- DailyIssue + PersonalizedBlock generation + editor review
- Heatmap (S&P500) with static snapshot data

### Components (MVP)
- **Web App (Next.js)**: onboarding UI, content UI
- **API (Next.js routes)**: `/api/onboarding/*` and future content endpoints
- **DB (Postgres / Supabase)**: sessions, answers, consent, profile, audit
- **Testing**:
  - Contract tests (Vitest + MSW) — verify API response shapes
  - E2E tests (Playwright + route mocks) — verify user journeys
  - See: `docs/adr/0002-e2e-strategy.md`
- **Ops**:
  - Execution Runner logs + run report

### Key Architectural Decisions
- **ADR-0001**: Documentation & agent artifacts in `docs/`
- **ADR-0002**: E2E tests use Playwright route interception (mocked API) for MVP velocity

### Change Control
- All API contract changes must follow `docs/architecture/contract-change-checklist.md`
- This prevents drift between spec → types → mocks → tests → frontend
