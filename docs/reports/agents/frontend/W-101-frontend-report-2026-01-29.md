## Agent Task Report

### Header
- **Date**: 2026-01-29
- **Agent**: Frontend Engineer
- **Task ID(s)**: W-101
- **Priority**: P1
- **Status**: ✅ done

---

## 1) Executive Summary (3 bullets max)
- **What changed**: Fixed all React Hook exhaustive-deps warnings in `TickerSearch.tsx` and `useQuestionEngine.tsx` using stable patterns (useRef, useCallback reordering).
- **Why it matters**: Clean lint output improves code quality and prevents potential stale closure bugs.
- **What is unblocked now**: ESLint now shows "No ESLint warnings or errors" - codebase is lint-clean.

---

## 2) Acceptance Criteria Check
- [x] AC-1: Hook warnings resolved — **✅ Zero warnings now**
- [x] AC-2: `npm run build` passes (exit 0)
- [x] AC-3: `npm run test:e2e:smoke` passes (18/18)
- [x] AC-4: `npm run test:e2e:regression` passes (21/21)

---

## 3) Evidence (required)

### Commands run:
| Command | Exit Code | Notes |
|---------|-----------|-------|
| `npm run lint` | 0 | **"No ESLint warnings or errors"** ✅ |
| `npm run build` | 0 | Build successful |
| `npm run test:e2e:smoke` | 0 | 18/18 passed (23.6s) |
| `npm run test:e2e:regression` | 0 | 21/21 passed (16.0s) |

### Before (warnings):
```
./src/components/onboarding/TickerSearch.tsx
43:6  Warning: React Hook useEffect has missing dependencies
43:7  Warning: React Hook useEffect has a complex expression in the dependency array

./src/hooks/useQuestionEngine.tsx
231:6  Warning: React Hook useCallback has a missing dependency: 'completeOnboarding'
267:6  Warning: React Hook useCallback has a missing dependency: 'completeOnboarding'
```

### After:
```
✔ No ESLint warnings or errors
```

---

## 4) Files Changed

| File | Change |
|------|--------|
| `src/components/onboarding/TickerSearch.tsx` | Replaced `JSON.stringify()` in dependency array with `useRef` pattern to track previous value |
| `src/hooks/useQuestionEngine.tsx` | Wrapped `completeOnboarding` in `useCallback`, moved it before dependent hooks, added to dependency arrays |

### TickerSearch.tsx fix:
```typescript
// Before (warning: complex expression in dependency array)
useEffect(() => {
  const initialString = JSON.stringify(initialTickers);
  const currentString = JSON.stringify(selectedTickers);
  if (initialString !== currentString) {
    setSelectedTickers(initialTickers);
  }
}, [JSON.stringify(initialTickers)]); // ❌ Complex expression

// After (stable pattern with useRef)
const prevInitialRef = useRef<string>(JSON.stringify(initialTickers));

useEffect(() => {
  const newKey = JSON.stringify(initialTickers);
  if (newKey !== prevInitialRef.current) {
    prevInitialRef.current = newKey;
    setSelectedTickers(initialTickers);
  }
}, [initialTickers]); // ✅ Simple dependency
```

### useQuestionEngine.tsx fix:
```typescript
// Before: completeOnboarding was a regular async function defined after handleAnswer
const handleAnswer = useCallback(async () => {
  // ... calls completeOnboarding()
}, [currentQuestion, isSubmitting, router]); // ❌ Missing completeOnboarding

// After: completeOnboarding wrapped in useCallback and moved before handleAnswer
const completeOnboarding = useCallback(async () => {
  // ... implementation
}, [queryClient, router]);

const handleAnswer = useCallback(async () => {
  // ... calls completeOnboarding()
}, [currentQuestion, isSubmitting, router, completeOnboarding]); // ✅ Included
```

---

## 5) Risks / Rollback
- **Risk**: Very low — Changes only affect hook dependency arrays, no runtime behavior change.
- **Rollback plan**: Revert the two file changes with git.

---

## 6) Next Recommended Action (PM)
- **Who**: PM / QA
- **Next task**: 다른 P1/P2 작업 진행 또는 Next.js viewport metadata 경고 수정 (P2)
- **Why**: W-101 완료, 코드베이스 lint-clean 상태

---

## 7) Notes

### Memory Bank Reference
E2E 테스트 실행 전 서버 재시작이 필요했습니다. `docs/ops/memory-bank.md` 체크리스트 참조.

### Remaining (P2, out of scope):
Next.js metadata viewport warnings — 빌드 시 경고만 표시되며 차단 이슈 아님.
