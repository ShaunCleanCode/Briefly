# W-103 | P2: Next.js viewport metadata warning cleanup

## Task Summary
| 항목 | 내용 |
|------|------|
| Task ID | W-103 |
| Priority | P2 |
| Status | ✅ Complete |
| Date | 2026-01-29 |
| Agent | Frontend Engineer |

## Objective
Next.js 빌드 시 발생하는 deprecated `metadata.viewport` 경고 제거

## Before (경고 있음)
```
 ⚠ Unsupported metadata viewport is configured in metadata export in /onboarding/done. Please move it to viewport export instead.
 ⚠ Unsupported metadata viewport is configured in metadata export in /_not-found. Please move it to viewport export instead.
 ⚠ Unsupported metadata viewport is configured in metadata export in /onboarding/declined. Please move it to viewport export instead.
```

## After (경고 없음)
```
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (6/6)
   Finalizing page optimization ...
```

## Changes Made

### `src/app/layout.tsx`

**Before:**
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Briefly; - 맞춤형 시장 콘텐츠',
  description: '매일 아침, 당신만을 위한 시장 인사이트를 받아보세요.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
  },
};
```

**After:**
```typescript
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Briefly; - 맞춤형 시장 콘텐츠',
  description: '매일 아침, 당신만을 위한 시장 인사이트를 받아보세요.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};
```

## Test Results

| Command | Exit Code | Result |
|---------|-----------|--------|
| `npm run lint` | 0 | ✅ No warnings/errors |
| `npm run build` | 0 | ✅ No viewport warnings |
| `npm run test:e2e:smoke` | 0 | ✅ 18/18 passed |
| `npm run test:e2e:regression` | 0 | ✅ 21/21 passed |

## Acceptance Criteria

| Criteria | Status |
|----------|--------|
| Viewport metadata warning removed | ✅ |
| No UX/runtime behavior changes | ✅ |
| Build passes without warnings | ✅ |
| E2E tests pass | ✅ |

## Files Changed
- `src/app/layout.tsx` - Moved viewport from metadata to separate export

## Notes
- Next.js App Router에서는 `metadata.viewport` 대신 별도의 `viewport` export를 사용해야 함
- 이 변경은 Next.js 14+ best practice를 따름
- 런타임 동작에는 변화 없음 (viewport meta tag 동일하게 생성됨)
