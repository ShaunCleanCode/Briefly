# Contract Change Control Checklist

**Purpose:** Prevent drift between backend spec, frontend implementation, contract tests, and E2E mocks.

**When to use:** Any time the `/api/onboarding/*` contract changes (new field, removed field, new endpoint, error code change).

---

## The Problem

Briefly; uses a **layered testing strategy**:

1. **Backend spec** (`docs/onboarding/onboarding-backend-spec.md`) — defines the API contract
2. **Frontend implementation** (`src/hooks/useOnboarding.ts`, `src/lib/api/onboarding.ts`) — calls the API
3. **Contract tests** (`tests/contract/*.test.ts`) — verify API shape using MSW
4. **E2E mocks** (`tests/mocks/handlers.ts`, Playwright route fixtures) — simulate API for E2E tests

If any layer changes without updating the others, tests may pass locally but fail in production — or worse, pass everywhere while hiding real bugs.

---

## Change Control Process

### Step 0: Identify the Change Type

| Change Type | Example | Impact Level |
|-------------|---------|--------------|
| **New field (additive)** | Add `estimatedReadTime` to response | Low — backwards compatible |
| **Field removal** | Remove deprecated `legacyId` | Medium — may break consumers |
| **Type change** | `progress: number` → `progress: object` | High — breaking change |
| **New endpoint** | Add `DELETE /api/onboarding/session` | Medium — new feature |
| **Error code change** | Rename `INVALID_INPUT` to `VALIDATION_ERROR` | High — error handling breaks |

---

### Step 1: Update Backend Spec ✏️

**File:** `docs/onboarding/onboarding-backend-spec.md`

- [ ] Update request/response schema
- [ ] Update error codes table if applicable
- [ ] Bump version number (e.g., `v1.1` → `v1.2`)
- [ ] Add changelog entry at bottom of spec

```markdown
## Changelog

### v1.2 (2026-01-30)
- Added `estimatedReadTime` field to `POST /answer` response
```

**Owner:** Backend Engineer Agent

---

### Step 2: Update TypeScript Types 🔷

**Files:**
- `src/types/onboarding.ts`

- [ ] Update response interfaces to match new spec
- [ ] Update request interfaces if changed
- [ ] Run `npm run lint` to catch type mismatches

```typescript
// Example: Add new field
interface AnswerResponse {
  success: boolean;
  answerId: string;
  estimatedReadTime?: number; // ← NEW
  // ...
}
```

**Owner:** Frontend Engineer Agent

---

### Step 3: Update MSW Handlers 🧪

**File:** `tests/mocks/handlers.ts`

- [ ] Update mock responses to include new fields
- [ ] Update mock request validation if request shape changed
- [ ] Ensure mock returns realistic values (not just `null`)

```typescript
// Example: Add new field to mock response
return HttpResponse.json({
  success: true,
  answerId: `answer-${Date.now()}`,
  estimatedReadTime: 45, // ← NEW
  // ...
});
```

**Owner:** SDET Agent

---

### Step 4: Update Contract Tests ✅

**Files:** `tests/contract/*.contract.test.ts`

- [ ] Add test case for new field/behavior
- [ ] Update existing assertions if response shape changed
- [ ] Add negative test for new error codes

```typescript
// Example: Test new field exists
it('returns estimatedReadTime in answer response', async () => {
  const response = await submitAnswer('job_title', { value: 'Engineer' });
  expect(response.estimatedReadTime).toBeTypeOf('number');
});
```

**Owner:** SDET Agent

---

### Step 5: Update E2E Mock Fixtures 🎭

**File:** `tests/e2e/fixtures/api-mock.ts` (if using Playwright route interception)

- [ ] Mirror changes from MSW handlers
- [ ] Ensure E2E mocks match contract test mocks

> **Note:** If mocks diverge, E2E tests may pass with wrong data while contract tests catch the real issue. Keep them in sync!

**Owner:** SDET Agent

---

### Step 6: Update Frontend Implementation 🖼️

**Files:**
- `src/hooks/useOnboarding.ts`
- `src/hooks/useQuestionEngine.tsx`
- `src/lib/api/onboarding.ts`

- [ ] Consume new fields in UI if applicable
- [ ] Handle new error codes in error boundaries
- [ ] Update React Query cache invalidation if needed

**Owner:** Frontend Engineer Agent

---

### Step 7: Run Full Test Suite 🏃

```bash
# Must all pass before merge
npm run lint
npm run build
npm run test:contract
npm run test:e2e:smoke
```

| Check | Command | Expected |
|-------|---------|----------|
| Lint passes | `npm run lint` | Exit 0 |
| Build succeeds | `npm run build` | Exit 0 |
| Contract tests pass | `npm run test:contract` | 44+ tests, Exit 0 |
| E2E smoke passes | `npm run test:e2e:smoke` | Exit 0 |

**Owner:** Execution Runner Agent

---

### Step 8: QA Sign-off 🔍

- [ ] QA Agent runs demo script (`docs/quality/qa/qa-demo-script.md`)
- [ ] QA Agent verifies no regression in existing flows
- [ ] QA Agent confirms new behavior works as expected
- [ ] QA Agent updates `docs/quality/qa/qa-release-criteria.md` if criteria changed

**Owner:** QA Agent

---

### Step 9: Update Documentation 📝

- [ ] Update `docs/engineering/api-spec.md` if it exists
- [ ] Update `docs/engineering/data-model.md` if DB schema changed
- [ ] Add entry to `docs/ops/agent-workboard.md` marking task complete

**Owner:** Whoever made the change

---

## Quick Reference: File Update Matrix

| If you change... | Also update... |
|------------------|----------------|
| Backend spec | Types → MSW handlers → Contract tests → E2E mocks → Frontend |
| Frontend types | Ensure spec is already updated first |
| MSW handlers | Contract tests (they use the same handlers) |
| Contract tests | Nothing downstream, but verify handlers match spec |
| E2E mocks | Keep in sync with MSW handlers |

---

## Anti-Patterns to Avoid

### ❌ "Just update the mock, tests pass now"
If you update a mock without updating the spec, you're hiding a contract violation.

### ❌ "The backend will handle it differently"
If frontend expects field X but backend sends field Y, both sides think they're correct. The spec is the contract.

### ❌ "I'll update the other files later"
Partial updates cause cascading failures. Complete all steps before merging.

### ❌ "Contract tests are redundant with E2E"
Contract tests run in <1s and catch API shape issues. E2E tests run in 30s+ and test user flows. They serve different purposes.

---

## Checklist Template (Copy for PR Description)

```markdown
## Contract Change Checklist

- [ ] Backend spec updated (`docs/onboarding/onboarding-backend-spec.md`)
- [ ] TypeScript types updated (`src/types/onboarding.ts`)
- [ ] MSW handlers updated (`tests/mocks/handlers.ts`)
- [ ] Contract tests updated (`tests/contract/*.test.ts`)
- [ ] E2E mocks updated (`tests/e2e/fixtures/api-mock.ts`)
- [ ] Frontend implementation updated
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm run test:contract` passes
- [ ] `npm run test:e2e:smoke` passes
- [ ] QA sign-off obtained
```

---

## Related Documents

- `docs/onboarding/onboarding-backend-spec.md` — API contract source of truth
- `docs/adr/0002-e2e-strategy.md` — Why E2E uses mocks
- `docs/quality/sdet/sdet-onboarding-test-plan.md` — Full test strategy
- `docs/quality/qa/qa-release-criteria.md` — Release gates

---

*Document maintained by System Architecture Engineer Agent*
