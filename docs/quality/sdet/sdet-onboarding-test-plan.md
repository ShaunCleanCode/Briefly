# Onboarding Test Strategy & Plan (SDET)

**Version:** 1.0  
**Last Updated:** 2026-01-29  
**Author:** SDET Agent

---

## Quality Risks (Top 8)

| Risk ID | Risk Description | Impact | Likelihood | Mitigation |
|---------|-----------------|--------|------------|------------|
| QR-001 | **Consent gate bypass** - Users can store profile data without consent | Critical | Low | Contract test + E2E verification |
| QR-002 | **Session resume failure** - Users lose progress after closing browser | High | Medium | E2E resume test, session persistence check |
| QR-003 | **Back navigation corruption** - Answer history inconsistent after back nav | High | Medium | E2E back-nav tests with answer verification |
| QR-004 | **Invalid ticker acceptance** - Non-S&P500 tickers stored | Medium | Medium | Contract validation test, E2E ticker search |
| QR-005 | **Progress calculation drift** - Progress bar doesn't match actual state | Medium | Low | API response schema test |
| QR-006 | **Consent decline redirect failure** - Declined users stuck in flow | High | Low | E2E decline path test |
| QR-007 | **Branching logic error** - Conditional questions shown/hidden incorrectly | Medium | Medium | Contract test with branching scenarios |
| QR-008 | **Double-submit race condition** - Duplicate answers submitted | Medium | Medium | E2E rapid click test |

---

## Onboarding Critical Path (10 Steps)

```
1. User visits /onboarding → POST /start called → Session created/resumed
2. Consent question displayed (consent_personalization)
3. User accepts consent → POST /answer with consent_* key → Consent recorded
4. Professional context: job_title (text) → POST /answer or skip
5. Industry selection (single_choice) → POST /answer or skip
6. Experience/goals questions (single_choice) → Sequential answers
7. Multi-select questions (watchlist_sectors) → POST /answer with values[]
8. Ticker search (watchlist_tickers) → Validate against S&P500, max 10
9. Time picker (delivery_time) → POST /answer
10. Complete → POST /complete → Profile computed → Redirect to /onboarding/done
```

---

## 1. Test Pyramid for Onboarding

```
                    ┌─────────────┐
                    │   Manual    │  2%
                    │  Exploratory│
                    └─────────────┘
               ┌────────────────────────┐
               │       E2E Tests        │  15%
               │  (Playwright, Browser) │
               └────────────────────────┘
          ┌─────────────────────────────────┐
          │      Contract/API Tests         │  25%
          │   (Response Schema, Error Codes)│
          └─────────────────────────────────┘
     ┌────────────────────────────────────────────┐
     │          Integration Tests                 │  28%
     │  (API + DB, Hooks with Mock API)           │
     └────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────┐
│                    Unit Tests                         │  30%
│  (Validation logic, scoring functions, utilities)    │
└───────────────────────────────────────────────────────┘
```

### Test Distribution Rationale

| Layer | Purpose | Speed | Count |
|-------|---------|-------|-------|
| **Unit** | Validation rules, scoring algorithms, utility functions | <1s each | ~40 tests |
| **Integration** | API handlers with DB, React Query hooks | <5s each | ~25 tests |
| **Contract** | API response shape, error codes, edge cases | <2s each | ~30 tests |
| **E2E** | Full user journeys, UI interactions | 10-60s each | ~15 tests |
| **Manual** | Exploratory, accessibility, visual | N/A | As needed |

---

## 2. Scope Definition

### 2.1 In-Scope for MVP Testing

| Feature | Unit | Integration | Contract | E2E |
|---------|------|-------------|----------|-----|
| Consent flow (accept/decline) | - | ✓ | ✓ | ✓ |
| Session start/resume | - | ✓ | ✓ | ✓ |
| Single choice questions | ✓ | ✓ | ✓ | ✓ |
| Multi choice questions | ✓ | ✓ | ✓ | ✓ |
| Text input (job_title) | ✓ | ✓ | ✓ | ✓ |
| Ticker search validation | ✓ | ✓ | ✓ | ✓ |
| Time picker | ✓ | - | ✓ | ✓ |
| Skip functionality | - | ✓ | ✓ | ✓ |
| Back navigation | - | ✓ | ✓ | ✓ |
| Progress tracking | ✓ | ✓ | ✓ | ✓ |
| Profile completion | - | ✓ | ✓ | ✓ |
| Error handling | ✓ | ✓ | ✓ | ✓ |

### 2.2 Out-of-Scope for MVP

- Portfolio snapshot flow (`POST /portfolio-snapshot`)
- Admin endpoints
- Rate limiting tests (deferred to load testing)
- Multi-language (English i18n) - Korean only for MVP
- Real Supabase connection (use mocked DB)
- Mobile-specific gestures (swipe)
- Accessibility automation (manual checklist only)

---

## 3. Risk-Based Prioritization

### P0 (Critical - Must Pass)

| Test ID | Description | Type |
|---------|-------------|------|
| OB-TC-001 | Consent accept → can proceed | Contract + E2E |
| OB-TC-002 | Consent decline → redirect to declined page | Contract + E2E |
| OB-TC-003 | Answer blocked without consent (403) | Contract |
| OB-TC-004 | Session resume returns correct question | Contract + E2E |
| OB-TC-005 | Complete onboarding → profile computed | Contract + E2E |
| OB-TC-006 | Invalid ticker rejected | Contract + E2E |
| OB-TC-007 | Progress percentage matches answered/total | Contract |

### P1 (High - Should Pass)

| Test ID | Description | Type |
|---------|-------------|------|
| OB-TC-008 | Back navigation preserves previous answer | E2E |
| OB-TC-009 | Skip stores is_skipped = true | Contract |
| OB-TC-010 | Non-skippable question cannot be skipped | Contract |
| OB-TC-011 | Ticker search with dot symbol (BRK.B) | E2E |
| OB-TC-012 | Max 10 tickers enforced | Contract + E2E |
| OB-TC-013 | Text validation (max length) | Contract |
| OB-TC-014 | Edit answer via PATCH | Contract |

### P2 (Medium - Nice to Have)

| Test ID | Description | Type |
|---------|-------------|------|
| OB-TC-015 | PATCH null clears answer for back-nav | Contract |
| OB-TC-016 | Cannot clear consent via PATCH null | Contract |
| OB-TC-017 | Already completed returns 409 | Contract |
| OB-TC-018 | Conditional questions (role_function) visibility | E2E |
| OB-TC-019 | Multi-choice max selection enforced | E2E |
| OB-TC-020 | Double-click prevention | E2E |

---

## 4. Flake Prevention Rules

### 4.1 Selector Strategy

```typescript
// ✅ GOOD: Use data-testid for stability
await page.locator('[data-testid="consent-accept-btn"]').click();
await page.locator('[data-testid="choice-option-1_3"]').click();
await page.locator('[data-testid="ticker-search-input"]').fill('AAPL');

// ❌ BAD: Avoid fragile selectors
await page.locator('button.bg-indigo-600').click();
await page.locator('text=1~3년').click();
await page.locator('.ticker-input input').fill('AAPL');
```

### 4.2 Required data-testid Attributes

| Component | Attribute | Example |
|-----------|-----------|---------|
| Progress bar | `data-testid="progress-bar"` | `<div data-testid="progress-bar">` |
| Back button | `data-testid="back-btn"` | `<button data-testid="back-btn">` |
| Skip button | `data-testid="skip-btn"` | `<button data-testid="skip-btn">` |
| Consent accept | `data-testid="consent-accept-btn"` | `<button data-testid="consent-accept-btn">` |
| Consent decline | `data-testid="consent-decline-btn"` | `<button data-testid="consent-decline-btn">` |
| Choice option | `data-testid="choice-option-{value}"` | `<button data-testid="choice-option-1_3">` |
| Continue button | `data-testid="continue-btn"` | `<button data-testid="continue-btn">` |
| Ticker input | `data-testid="ticker-search-input"` | `<input data-testid="ticker-search-input">` |
| Ticker chip | `data-testid="ticker-chip-{symbol}"` | `<span data-testid="ticker-chip-AAPL">` |
| Remove chip | `data-testid="remove-ticker-{symbol}"` | `<button data-testid="remove-ticker-AAPL">` |
| Time input | `data-testid="time-picker-input"` | `<input data-testid="time-picker-input">` |
| Question title | `data-testid="question-title"` | `<h2 data-testid="question-title">` |
| Error banner | `data-testid="error-banner"` | `<div data-testid="error-banner">` |
| Loading skeleton | `data-testid="loading-skeleton"` | `<div data-testid="loading-skeleton">` |

### 4.3 Wait Strategy

```typescript
// ✅ GOOD: Wait for specific element/network
await page.waitForSelector('[data-testid="question-title"]');
await page.waitForResponse(resp => resp.url().includes('/answer'));

// ✅ GOOD: Use Playwright expect with auto-retry
await expect(page.locator('[data-testid="progress-bar"]'))
  .toHaveAttribute('aria-valuenow', '8');

// ❌ BAD: Arbitrary timeouts
await page.waitForTimeout(2000);
await new Promise(r => setTimeout(r, 1000));
```

### 4.4 Retry Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  use: {
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
});
```

---

## 5. Environment & Data Strategy

### 5.1 Test Environments

| Environment | Purpose | Backend | Database |
|-------------|---------|---------|----------|
| **Unit** | Isolated logic tests | N/A | N/A |
| **Integration** | API handlers | Mock handlers | In-memory SQLite |
| **Contract** | API shape verification | MSW mocks | N/A |
| **E2E - Local** | Full flow tests | Local Next.js | Supabase local |
| **E2E - CI** | Automated regression | Next.js + MSW | In-memory mock |

### 5.2 Supabase Local Setup

```bash
# Start Supabase local (if testing with real DB)
npx supabase start

# Seed test data
npx supabase db reset

# Environment variables for tests
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-key>
```

### 5.3 Test Database Strategy (Preferred: MSW Mocks)

For CI stability, we use **Mock Service Worker (MSW)** to intercept API calls:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/onboarding/start', () => {
    return HttpResponse.json({
      session: {
        id: 'test-session-001',
        status: 'in_progress',
        questionSetVersion: 1,
        progress: { answered: 0, total: 14, percentComplete: 0 },
      },
      consentRequired: true,
      nextQuestion: mockConsentQuestion,
    });
  }),
  // ... more handlers
];
```

### 5.4 Test User Strategy

```typescript
// tests/fixtures/users.ts
export const testUsers = {
  newUser: {
    id: 'user-new-001',
    email: 'testuser-new@example.test',
    hasCompletedOnboarding: false,
  },
  resumingUser: {
    id: 'user-resume-001',
    email: 'testuser-resume@example.test',
    hasCompletedOnboarding: false,
    currentQuestionKey: 'experience_years',
  },
  completedUser: {
    id: 'user-done-001',
    email: 'testuser-done@example.test',
    hasCompletedOnboarding: true,
    completedAt: '2026-01-20T10:00:00Z',
  },
};
```

---

## 6. Contract Test Specifications

### 6.1 Endpoint Schemas

#### POST /api/onboarding/start

```typescript
// Request
interface StartRequest {
  locale?: string; // 'ko' | 'en'
  metadata?: {
    device?: string;
    referrer?: string;
  };
}

// Response (200)
interface StartResponse {
  session: {
    id: string;
    status: 'in_progress' | 'completed';
    questionSetVersion: number;
    currentQuestionKey: string | null;
    progress: {
      answered: number;
      total: number;
      percentComplete: number;
    };
    startedAt: string;
  };
  consentRequired: boolean;
  nextQuestion: Question | null;
}

// Response (409 - Already Completed)
interface AlreadyCompletedError {
  error: 'ONBOARDING_ALREADY_COMPLETED';
  message: string;
  completedAt: string;
  canRestart: boolean;
}
```

#### POST /api/onboarding/answer

```typescript
// Request
interface AnswerRequest {
  questionKey: string;
  answer: {
    value?: string;
    values?: string[];
  };
}

// Response (200)
interface AnswerResponse {
  success: true;
  answerId: string;
  normalized?: string;
  consentRecorded?: boolean;     // for consent_* questions
  consentType?: string;          // for consent_* questions
  consentGranted?: boolean;      // for consent_* questions
  nextQuestion: Question | null;
  progress: Progress;
}

// Response (403 - Consent Required)
interface ConsentRequiredError {
  error: 'CONSENT_REQUIRED';
  message: string;
  requiredConsentType: string;
  redirectToQuestion: string;
}

// Response (400 - Validation Error)
interface ValidationError {
  error: 'VALIDATION_ERROR';
  message: string;
  details: {
    field: string;
    value: unknown;
    rule: string;
  };
}
```

#### POST /api/onboarding/skip

```typescript
// Request
interface SkipRequest {
  questionKey: string;
}

// Response (200)
interface SkipResponse {
  success: true;
  skipped: true;
  questionKey: string;
  nextQuestion: Question | null;
  progress: Progress;
}

// Response (400 - Not Skippable)
interface NotSkippableError {
  error: 'QUESTION_NOT_SKIPPABLE';
  message: string;
  questionKey: string;
}
```

#### PATCH /api/onboarding/answer/:questionKey

```typescript
// Request
interface EditAnswerRequest {
  answer: {
    value?: string;
    values?: string[];
  } | null; // null to clear for back navigation
}

// Response (200 - Edit)
interface EditResponse {
  success: true;
  answerId: string;
  previousValue: string;
  newValue: string;
  derivedFieldsUpdated?: string[];
}

// Response (200 - Clear)
interface ClearResponse {
  success: true;
  answerId: string;
  previousValue: string;
  newValue: null;
  cleared: true;
  nextQuestion: Question;
}

// Response (400 - Cannot Clear Consent)
interface CannotClearConsentError {
  error: 'CANNOT_CLEAR_CONSENT';
  message: string;
  questionKey: string;
}
```

#### POST /api/onboarding/complete

```typescript
// Request
interface CompleteRequest {
  finalConfirmation: true;
}

// Response (200)
interface CompleteResponse {
  success: true;
  profile: DerivedProfile;
  message: string;
}

// Response (400 - Incomplete)
interface IncompleteError {
  error: 'REQUIRED_QUESTIONS_INCOMPLETE';
  message: string;
  missing: string[];
}
```

### 6.2 Error Codes to Test

| Error Code | HTTP Status | Trigger Condition |
|------------|-------------|-------------------|
| `CONSENT_REQUIRED` | 403 | Submit answer without consent |
| `CONSENT_DECLINED` | 200 | Answer consent_* with decline |
| `VALIDATION_ERROR` | 400 | Invalid ticker, max exceeded |
| `QUESTION_NOT_SKIPPABLE` | 400 | Skip consent question |
| `CANNOT_CLEAR_CONSENT` | 400 | PATCH null on consent_* |
| `ONBOARDING_ALREADY_COMPLETED` | 409 | Start after completion |
| `REQUIRED_QUESTIONS_INCOMPLETE` | 400 | Complete without consent |

---

## 7. E2E Test Scenarios

### 7.1 Smoke Suite (< 3 min total)

| ID | Scenario | Est. Time |
|----|----------|-----------|
| SMOKE-01 | Happy path: consent → complete | 45s |
| SMOKE-02 | Session resume | 30s |
| SMOKE-03 | Consent decline | 20s |
| SMOKE-04 | Skip question | 25s |
| SMOKE-05 | Ticker search (basic) | 30s |

### 7.2 Full Regression Suite (~10 min)

| ID | Scenario | Priority |
|----|----------|----------|
| REG-01 | Happy path: all questions answered | P0 |
| REG-02 | Happy path: skip all skippable | P0 |
| REG-03 | Consent decline → recovery | P0 |
| REG-04 | Session resume after browser close | P0 |
| REG-05 | Back navigation: go back 3 questions | P1 |
| REG-06 | Back navigation: edit previous answer | P1 |
| REG-07 | Ticker search: valid ticker (AAPL) | P1 |
| REG-08 | Ticker search: dot ticker (BRK.B) | P1 |
| REG-09 | Ticker search: invalid ticker rejection | P1 |
| REG-10 | Ticker search: max 10 enforcement | P1 |
| REG-11 | Multi-choice: max 3 sectors | P1 |
| REG-12 | Text input: job_title max length | P2 |
| REG-13 | Time picker: preset selection | P2 |
| REG-14 | Double-click prevention | P2 |

---

## 8. Test Cases Checklist

### 8.1 Contract Tests (API)

| ID | Description | Priority | Endpoint | Expected Result |
|----|-------------|----------|----------|-----------------|
| OB-TC-001 | Consent accept records consent | P0 | POST /answer | `consentRecorded: true`, `consentGranted: true` |
| OB-TC-002 | Consent decline ends flow | P0 | POST /answer | `sessionStatus: 'consent_declined'`, `nextQuestion: null` |
| OB-TC-003 | Answer blocked without consent | P0 | POST /answer | 403, `error: 'CONSENT_REQUIRED'` |
| OB-TC-004 | Start returns existing session | P0 | POST /start | Same session ID, correct currentQuestionKey |
| OB-TC-005 | Complete computes profile | P0 | POST /complete | `profile.knowledgeLevel` present |
| OB-TC-006 | Invalid ticker rejected | P0 | POST /answer | 400, `error: 'VALIDATION_ERROR'` |
| OB-TC-007 | Progress matches answered/total | P0 | POST /answer | `progress.percentComplete` = `answered/total * 100` |
| OB-TC-008 | Skip stores is_skipped | P1 | POST /skip | `skipped: true` |
| OB-TC-009 | Non-skippable returns error | P1 | POST /skip | 400, `error: 'QUESTION_NOT_SKIPPABLE'` |
| OB-TC-010 | Max tickers enforced | P1 | POST /answer | 400 when > 10 tickers |
| OB-TC-011 | Text max length validated | P1 | POST /answer | 400 when > 100 chars |
| OB-TC-012 | PATCH updates answer | P1 | PATCH /answer/:key | `previousValue`, `newValue` correct |
| OB-TC-013 | PATCH null clears answer | P2 | PATCH /answer/:key | `cleared: true`, returns `nextQuestion` |
| OB-TC-014 | Cannot clear consent | P2 | PATCH /answer/:key | 400, `error: 'CANNOT_CLEAR_CONSENT'` |
| OB-TC-015 | Already completed returns 409 | P2 | POST /start | 409, `error: 'ONBOARDING_ALREADY_COMPLETED'` |
| OB-TC-016 | Next question follows sequence | P1 | GET /question/next | Returns question with lowest unanswered sequence_order |
| OB-TC-017 | Branching: role_function skipped if no job_title | P2 | GET /question/next | role_function not returned if job_title skipped |

### 8.2 E2E Tests (UI)

| ID | Description | Priority | Suite | Expected Result |
|----|-------------|----------|-------|-----------------|
| OB-TC-101 | Happy path completion | P0 | Smoke | Redirected to /onboarding/done |
| OB-TC-102 | Consent accept advances flow | P0 | Smoke | Next question displayed |
| OB-TC-103 | Consent decline redirects | P0 | Smoke | Redirected to /onboarding/declined |
| OB-TC-104 | Session resume shows correct question | P0 | Smoke | Shows last unanswered question |
| OB-TC-105 | Skip button visible when skippable | P1 | Regression | Skip button has `data-testid="skip-btn"` |
| OB-TC-106 | Skip button hidden on consent | P1 | Regression | No skip button visible |
| OB-TC-107 | Back button goes to previous | P1 | Regression | Previous question displayed with answer |
| OB-TC-108 | Edit answer after back nav | P1 | Regression | New answer submitted, next question shows |
| OB-TC-109 | Ticker search shows suggestions | P1 | Regression | Dropdown appears with matching tickers |
| OB-TC-110 | Add ticker creates chip | P1 | Regression | Chip with `data-testid="ticker-chip-AAPL"` |
| OB-TC-111 | Remove ticker removes chip | P1 | Regression | Chip disappears |
| OB-TC-112 | BRK.B ticker works | P1 | Regression | Chip created with "BRK.B" |
| OB-TC-113 | Invalid ticker shows error | P1 | Regression | Error banner with `data-testid="error-banner"` |
| OB-TC-114 | Max 10 tickers enforced | P1 | Regression | Input disabled or error after 10 |
| OB-TC-115 | Multi-choice max selection | P1 | Regression | Cannot select more than max |
| OB-TC-116 | Progress bar updates | P1 | Regression | `aria-valuenow` increases |
| OB-TC-117 | Loading state during submit | P2 | Regression | Button disabled, spinner shown |
| OB-TC-118 | Double-click prevented | P2 | Regression | Only one API call made |
| OB-TC-119 | Text input validation error | P2 | Regression | Shake animation, error message |
| OB-TC-120 | Completion celebration | P2 | Regression | Confetti animation, profile summary |

### 8.3 Manual Tests

| ID | Description | Priority | Checklist |
|----|-------------|----------|-----------|
| OB-TC-201 | Keyboard navigation | P1 | Arrow keys select options, Enter submits |
| OB-TC-202 | Screen reader announces progress | P2 | VoiceOver/NVDA reads "질문 3 of 14" |
| OB-TC-203 | Reduced motion mode | P2 | No jarring animations |
| OB-TC-204 | Mobile touch targets | P1 | All buttons > 48px tap area |
| OB-TC-205 | Visual design review | P2 | Matches Figma/spec |

---

## 9. Data Fixtures & Seeding

### 9.1 Test User Creation

```typescript
// tests/fixtures/createTestUser.ts
export async function createTestUser(opts: {
  hasStartedOnboarding?: boolean;
  currentQuestionKey?: string;
  hasCompletedOnboarding?: boolean;
}) {
  const userId = `test-user-${Date.now()}`;
  
  // Insert user (mock or real DB)
  const user = {
    id: userId,
    email: `${userId}@example.test`,
    created_at: new Date().toISOString(),
  };
  
  if (opts.hasStartedOnboarding) {
    // Create session with progress
  }
  
  return user;
}
```

### 9.2 Reset Between Tests

```typescript
// tests/fixtures/resetOnboarding.ts
export async function resetOnboardingState(userId: string) {
  // Option 1: API-based reset (if endpoint exists)
  await fetch(`/api/test/reset-onboarding/${userId}`, { method: 'DELETE' });
  
  // Option 2: Direct DB cleanup (Supabase local)
  await supabase.from('onboarding_answer').delete().eq('user_id', userId);
  await supabase.from('onboarding_session').delete().eq('user_id', userId);
  await supabase.from('consent_record').delete().eq('user_id', userId);
}
```

### 9.3 Mock Question Set (v1)

```typescript
// tests/fixtures/mockQuestionSet.ts
export const mockQuestionSet = {
  id: 'question-set-test-001',
  version: 1,
  questions: [
    {
      key: 'consent_personalization',
      type: 'consent',
      sequence_order: 1,
      is_required: true,
      is_skippable: false,
    },
    {
      key: 'job_title',
      type: 'text',
      sequence_order: 2,
      is_required: false,
      is_skippable: true,
      validation: { maxLength: 100 },
    },
    // ... all 14 questions
  ],
};
```

### 9.4 S&P 500 Ticker Fixture

```typescript
// tests/fixtures/sp500Tickers.ts
export const validTickers = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'BRK.B'];
export const invalidTickers = ['INVALID', 'FAKE123', 'NOTREAL'];
```

---

## 10. Execution Runner Commands

### 10.1 Installation

```bash
# Install all dependencies including test tools
npm install

# Install Playwright browsers
npx playwright install chromium
```

### 10.2 Run Commands

```bash
# Run unit tests
npm run test:unit

# Run API contract tests
npm run test:contract

# Run E2E smoke suite (< 3 min, headless)
npm run test:e2e:smoke

# Run E2E full regression (headless)
npm run test:e2e:regression

# Run E2E with visible browser (debugging)
npm run test:e2e:headed

# Run all tests
npm run test:all
```

### 10.3 Expected Exit Codes

| Command | Success | Failure |
|---------|---------|---------|
| `npm run test:unit` | 0 | 1 |
| `npm run test:contract` | 0 | 1 |
| `npm run test:e2e:smoke` | 0 | 1 |
| `npm run test:e2e:regression` | 0 | 1 |

### 10.4 CI Pipeline Example

```yaml
# .github/workflows/test.yml
name: Test Onboarding

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run contract tests
        run: npm run test:contract
      
      - name: Run E2E smoke
        run: npm run test:e2e:smoke
        env:
          CI: true
      
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 11. Definition of Done for Testing

### Checklist Before Merge

- [ ] All P0 tests passing
- [ ] All P1 tests passing (or documented exceptions)
- [ ] No flaky tests in last 3 CI runs
- [ ] Test coverage report generated
- [ ] data-testid attributes added for new UI elements
- [ ] Contract tests match API spec v1.1
- [ ] E2E smoke suite runs < 3 minutes
- [ ] No console errors during E2E runs
- [ ] Manual accessibility checklist completed

### Deployment Gate

| Metric | Threshold |
|--------|-----------|
| Unit test pass rate | 100% |
| Contract test pass rate | 100% |
| E2E smoke pass rate | 100% |
| E2E regression pass rate | > 95% |
| Total test time | < 15 min |

---

## Appendix A: File Structure

```
tests/
├── unit/
│   ├── validation.test.ts
│   ├── scoring.test.ts
│   └── utils.test.ts
├── contract/
│   ├── start.contract.test.ts
│   ├── answer.contract.test.ts
│   ├── skip.contract.test.ts
│   ├── edit.contract.test.ts
│   ├── complete.contract.test.ts
│   └── profile.contract.test.ts
├── e2e/
│   ├── smoke/
│   │   ├── happy-path.spec.ts
│   │   ├── session-resume.spec.ts
│   │   └── consent-decline.spec.ts
│   └── regression/
│       ├── back-navigation.spec.ts
│       ├── ticker-search.spec.ts
│       ├── multi-choice.spec.ts
│       └── validation.spec.ts
├── fixtures/
│   ├── users.ts
│   ├── questions.ts
│   ├── answers.ts
│   └── sp500-tickers.ts
├── mocks/
│   ├── handlers.ts
│   ├── server.ts
│   └── browser.ts
└── utils/
    ├── test-helpers.ts
    └── page-objects.ts

playwright.config.ts
vitest.config.ts
```

---

*Document maintained by SDET Agent*
