## Agent Task Report

### Header
- **Date**: 2026-01-29
- **Agent**: Frontend Engineer
- **Task ID(s)**: W-004
- **Priority**: P1
- **Status**: ✅ done

---

## 1) Executive Summary (3 bullets max)
- **What changed**: Implemented client-side maxLength validation for TextInput component - users can now type beyond limit, see visual feedback, and receive validation error on submit.
- **Why it matters**: Enables proper form validation UX for text questions (job_title, etc.) and unblocks OB-TC-119 test.
- **What is unblocked now**: The OB-TC-119 test is unskipped and the implementation is complete. However, E2E tests have pre-existing infrastructure issues causing timeouts.

---

## 2) Acceptance Criteria Check
- [x] AC-1: `npm run build` passes (exit 0)
- [x] AC-2: `npm run lint` passes (exit 0, warnings only)
- [x] AC-3: `npx vitest run` passes (44/44 tests)
- [x] AC-4: `npm run test:e2e:regression` passes (21/21 tests, 0 skipped) ✅
- [x] AC-5: `npm run test:e2e:smoke` passes (18/18 tests) ✅

---

## 3) Evidence (required)

### Commands run:
| Command | Exit Code | Notes |
|---------|-----------|-------|
| `npm run build` | 0 | Build successful |
| `npm run lint` | 0 | Warnings only (pre-existing) |
| `npx vitest run` | 0 | 44/44 tests passed |
| `npm run test:e2e:smoke` | 0 | **18/18 tests passed** ✅ |
| `npm run test:e2e:regression` | 0 | **21/21 tests passed** (OB-TC-119 unskipped and passing) ✅ |

### Build output:
```
✓ Compiled successfully
✓ Generating static pages (6/6)
```

### E2E Regression output:
```
✓  16 [regression] › tests/e2e/regression/validation.spec.ts:21:7 › Input Validation @regression › OB-TC-119: text input shows validation error for max length (1.3s)

  21 passed (19.6s)
```

### E2E Smoke output:
```
  18 passed (25.6s)
```

### Note on Server Restart:
E2E 테스트 실행 전 dev 서버 재시작이 필요했습니다. 이 반복 이슈는 `docs/ops/memory-bank.md`에 기록되었습니다.

---

## 4) Files Changed

| File | Change |
|------|--------|
| `src/components/onboarding/TextInput.tsx` | Removed HTML `maxLength` attribute to allow typing beyond limit; added red styling for char count when exceeding limit; existing JS validation now triggers error on submit |
| `tests/e2e/fixtures/api-mock.ts` | Added `ValidationOverride` type, `validationOverrides` state map, `setQuestionValidation()` method for test-time validation customization |
| `tests/e2e/regression/validation.spec.ts` | Unskipped and implemented OB-TC-119 test with maxLength=20 validation |

### Implementation Details

**TextInput.tsx changes:**

1. Removed HTML `maxLength` attribute (line 143):
```typescript
// Before
maxLength={maxLength}

// After
// Removed - allows typing beyond limit
```

2. Added visual feedback for exceeding limit:
```typescript
<div 
  className={cn(
    "absolute bottom-3 right-4 text-xs transition-colors",
    charCount > maxLength 
      ? "text-red-500 dark:text-red-400 font-medium" 
      : "text-slate-400 dark:text-slate-500"
  )}
  data-testid="char-count"
>
  {charCount} / {maxLength}
</div>
```

3. Existing validation logic (unchanged, now triggered):
```typescript
if (text.length > maxLength) {
  return `최대 ${maxLength}자까지 입력 가능합니다`;
}
```

**API Mock changes:**
- Added `setQuestionValidation(questionKey, validation)` method
- Applied overrides in `getNextQuestion()` and `handleAnswer()`

---

## 5) Risks / Rollback
- **Risk**: Low — The change allows users to type beyond limit (better UX for pasting). Validation prevents submission of invalid data.
- **Rollback plan**: Re-add `maxLength={maxLength}` attribute to textarea if hard-limit UX is preferred.

---

## 6) Next Recommended Action (PM)

- **Who**: PM / QA
- **Next task**: 다른 P1/P2 작업 진행
- **Why**: W-004 완료, 모든 acceptance criteria 충족

---

## 7) Implementation Complete ✅

W-004 구현이 완료되었고 모든 테스트가 통과했습니다:
- ✅ TextInput allows typing beyond maxLength
- ✅ Character count turns red when exceeding limit
- ✅ Validation error shows on submit attempt
- ✅ Submission is prevented when validation fails
- ✅ Test OB-TC-119 is unskipped and passing
- ✅ Build, lint, unit tests pass
- ✅ E2E smoke tests pass (18/18)
- ✅ E2E regression tests pass (21/21, 0 skipped)
