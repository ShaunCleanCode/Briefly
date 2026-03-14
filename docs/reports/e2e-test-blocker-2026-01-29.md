# E2E Test Status Report

**Date:** 2026-01-29  
**Status:** ✅ RESOLVED  
**Assignee:** SDET Agent

---

## Summary

E2E smoke 테스트가 모두 통과합니다. ADR-0002에 따라 mocked API를 사용하여 테스트가 실행됩니다.

## Test Results

```
npm run test:e2e:smoke
```

| Suite | Tests | Duration |
|-------|-------|----------|
| Smoke | 18/18 ✅ | ~23s |
| Regression | 12/18 (6 failed) | ~33s |
| **Total** | **30/36 passed** | **~56s** |

---

## Issues Resolved

### 1. ✅ Multiple Dev Servers (Root Cause of Initial Timeouts)
- **Problem:** 2개의 `npm run dev` 프로세스가 동시에 실행되어 포트 충돌 발생
- **Solution:** 서버 재시작 후 해결

### 2. ✅ React Infinite Loop in TickerSearch
- **Problem:** `useEffect`에서 `initialTickers` prop의 배열 참조가 매 렌더마다 변경되어 무한 루프 발생
- **Solution:** `JSON.stringify`를 사용하여 배열 값을 비교하도록 수정

```typescript
// Before (infinite loop)
useEffect(() => {
  setSelectedTickers(initialTickers);
}, [initialTickers]);

// After (fixed)
useEffect(() => {
  const initialString = JSON.stringify(initialTickers);
  const currentString = JSON.stringify(selectedTickers);
  if (initialString !== currentString) {
    setSelectedTickers(initialTickers);
  }
}, [JSON.stringify(initialTickers)]);
```

### 3. ✅ Missing data-testid Attributes
- `declined/page.tsx`: `data-testid="retry-btn"` 추가
- `done/page.tsx`: `data-testid="start-btn"`, `data-testid="profile-summary-section"` 추가
- `ProfileSummary.tsx`: `data-testid` prop 지원 추가

### 4. ✅ Mock State Not Updated on Consent Edit
- **Problem:** `handleEditAnswer`에서 consent를 accept할 때 `hasConsent`가 업데이트되지 않음
- **Solution:** consent 질문 편집 시 `hasConsent` 상태 업데이트 추가

### 5. ✅ Test Logic Issues
- `completeQuickOnboarding`: done 페이지 체크를 skip 시도 전에 수행하도록 수정
- `happy-path.spec.ts`: 동일한 로직 개선 적용

---

## ADR-0002 Compliance

✅ **E2E 테스트는 Playwright route interception을 통한 mocked API를 사용합니다.**

- Backend API 실행 불필요 (smoke 테스트용)
- `tests/e2e/fixtures/api-mock.ts`가 모든 `/api/onboarding/*` 요청을 인터셉트
- 결정론적, 안정적 테스트 환경 제공

---

## Commands

```bash
# Smoke tests only (< 30s)
npm run test:e2e:smoke

# Full regression
npm run test:e2e:regression

# Contract tests (API schema validation with MSW)
npm run test:contract
```

---

## Remaining Work (Regression Tests)

6개의 regression 테스트가 실패 중입니다. 주로 다음 기능들의 상세 테스트입니다:
- Back navigation
- Multi-choice max limit
- Ticker search max limit
- Text input validation
- Progress bar updates

이들은 P1 우선순위로, smoke 테스트 통과 후 별도로 수정할 수 있습니다.

---

## Files Modified

1. `src/components/onboarding/TickerSearch.tsx` - 무한 루프 수정
2. `src/app/onboarding/declined/page.tsx` - data-testid 추가
3. `src/app/onboarding/done/page.tsx` - data-testid 추가
4. `src/components/onboarding/ProfileSummary.tsx` - data-testid prop 지원
5. `tests/e2e/fixtures/api-mock.ts` - consent edit 처리 수정
6. `tests/utils/page-objects.ts` - completeQuickOnboarding 로직 개선
7. `tests/e2e/smoke/*.spec.ts` - 테스트 로직 개선

---

## Conclusion

Smoke 테스트 인프라가 완성되었습니다. Execution Runner는 단일 명령으로 테스트를 실행할 수 있습니다:

```bash
npm run test:e2e:smoke
```

Expected output: `18 passed` (약 23초)
