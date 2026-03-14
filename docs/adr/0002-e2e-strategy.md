# ADR-0002: E2E Testing Strategy — Playwright with Mocked API

**Status:** Accepted  
**Date:** 2026-01-29  
**Author:** System Architecture Engineer Agent  
**Supersedes:** N/A

---

## Context

The Briefly; onboarding MVP is a **frontend-first** project. As of this writing:

- **Contract tests pass (44/44)** using MSW (Mock Service Worker) to simulate `/api/onboarding/*` responses.
- **E2E tests timeout** because they hit real endpoints (`/api/onboarding/start`, `/answer`, etc.) that have no Next.js route implementation.
- **No backend exists** in this repository; the backend spec (`docs/onboarding/onboarding-backend-spec.md`) defines the contract, but implementation is out-of-scope for the current phase.

We need a deterministic, fast E2E strategy that:
1. Validates full user journeys (consent → questions → completion).
2. Works without a real backend.
3. Avoids flakiness from network or database variability.
4. Enables the Execution Runner to pass smoke tests in CI.

---

## Decision

**E2E tests run with mocked API responses via Playwright route interception.**

- Reuse the existing MSW handler logic from `tests/mocks/handlers.ts`.
- Intercept `/api/onboarding/*` routes at the Playwright level using `page.route()`.
- Keep contract tests as the authoritative verification of API shapes.
- E2E tests focus on **UI behavior, state transitions, and user flows** — not API correctness.

---

## Implementation

### 1. Create a Playwright API Mock Fixture

```typescript
// tests/e2e/fixtures/api-mock.ts
import { Page } from '@playwright/test';
import { handlers } from '../../mocks/handlers';

/**
 * Intercept API calls in Playwright using the same handler logic as MSW.
 * This keeps E2E mocks consistent with contract tests.
 */
export async function setupApiMocks(page: Page) {
  // In-memory state (mirrors MSW handlers)
  let sessionState = {
    hasConsent: false,
    currentQuestionIndex: 0,
    answers: new Map<string, { value?: string; values?: string[]; skipped: boolean }>(),
    isCompleted: false,
    completedAt: null as string | null,
  };

  // Import mock questions
  const { mockQuestions } = await import('../../fixtures/questions');

  // Helper functions
  const getNextQuestion = () => {
    for (const q of mockQuestions) {
      const answer = sessionState.answers.get(q.key);
      if (!answer || (!answer.value && !answer.values && !answer.skipped)) {
        return q;
      }
    }
    return null;
  };

  const calculateProgress = () => {
    const answered = Array.from(sessionState.answers.values()).filter(
      (a) => a.value || a.values || a.skipped
    ).length;
    return {
      answered,
      total: mockQuestions.length,
      percentComplete: Math.round((answered / mockQuestions.length) * 100),
    };
  };

  // Route: POST /api/onboarding/start
  await page.route('**/api/onboarding/start', async (route) => {
    if (sessionState.isCompleted) {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'ONBOARDING_ALREADY_COMPLETED',
          message: 'Onboarding was completed',
          completedAt: sessionState.completedAt,
          canRestart: false,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        session: {
          id: 'e2e-session-001',
          status: 'in_progress',
          questionSetVersion: 1,
          currentQuestionKey: getNextQuestion()?.key ?? null,
          progress: calculateProgress(),
          startedAt: new Date().toISOString(),
        },
        consentRequired: !sessionState.hasConsent,
        nextQuestion: getNextQuestion(),
      }),
    });
  });

  // Route: POST /api/onboarding/answer
  await page.route('**/api/onboarding/answer', async (route, request) => {
    const body = JSON.parse(request.postData() || '{}');
    const { questionKey, answer } = body;

    // Consent check
    if (!sessionState.hasConsent && !questionKey.startsWith('consent_')) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'CONSENT_REQUIRED',
          message: 'Cannot store data without consent',
          requiredConsentType: 'personalization_data',
          redirectToQuestion: 'consent_personalization',
        }),
      });
      return;
    }

    // Handle consent
    if (questionKey.startsWith('consent_')) {
      const granted = answer.value === 'accept';
      sessionState.hasConsent = granted;
      sessionState.answers.set(questionKey, { value: answer.value, skipped: false });

      if (!granted) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            answerId: `answer-${Date.now()}`,
            consentRecorded: true,
            consentGranted: false,
            sessionStatus: 'consent_declined',
            nextQuestion: null,
            progress: calculateProgress(),
          }),
        });
        return;
      }
    }

    // Store answer
    sessionState.answers.set(questionKey, { ...answer, skipped: false });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        answerId: `answer-${Date.now()}`,
        nextQuestion: getNextQuestion(),
        progress: calculateProgress(),
        ...(questionKey.startsWith('consent_') && {
          consentRecorded: true,
          consentGranted: true,
        }),
      }),
    });
  });

  // Route: POST /api/onboarding/skip
  await page.route('**/api/onboarding/skip', async (route, request) => {
    const body = JSON.parse(request.postData() || '{}');
    const { questionKey } = body;

    if (!sessionState.hasConsent) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'CONSENT_REQUIRED' }),
      });
      return;
    }

    const question = mockQuestions.find((q) => q.key === questionKey);
    if (question && !question.isSkippable) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'QUESTION_NOT_SKIPPABLE',
          questionKey,
        }),
      });
      return;
    }

    sessionState.answers.set(questionKey, { skipped: true });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        skipped: true,
        questionKey,
        nextQuestion: getNextQuestion(),
        progress: calculateProgress(),
      }),
    });
  });

  // Route: POST /api/onboarding/complete
  await page.route('**/api/onboarding/complete', async (route) => {
    if (!sessionState.hasConsent) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'REQUIRED_QUESTIONS_INCOMPLETE',
          missing: ['consent_personalization'],
        }),
      });
      return;
    }

    sessionState.isCompleted = true;
    sessionState.completedAt = new Date().toISOString();

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        profile: {
          knowledgeLevel: 'intermediate',
          investorSegment: 'long_term',
          deliverySchedule: { timezone: 'Asia/Seoul', time: '07:00' },
          personalizationInputs: { watchlistTickers: [], watchlistSectors: ['Technology'] },
          onboardingCompletedAt: sessionState.completedAt,
        },
        message: '환영합니다!',
      }),
    });
  });

  // Route: GET /api/onboarding/profile
  await page.route('**/api/onboarding/profile', async (route) => {
    if (!sessionState.isCompleted) {
      await route.fulfill({ status: 404, body: JSON.stringify({ error: 'NOT_FOUND' }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: {
          knowledgeLevel: 'intermediate',
          investorSegment: 'long_term',
        },
        canEdit: true,
      }),
    });
  });

  // Return reset function for test isolation
  return {
    reset: () => {
      sessionState = {
        hasConsent: false,
        currentQuestionIndex: 0,
        answers: new Map(),
        isCompleted: false,
        completedAt: null,
      };
    },
  };
}
```

### 2. Use Fixture in Tests

```typescript
// tests/e2e/smoke/happy-path.spec.ts
import { test, expect } from '@playwright/test';
import { setupApiMocks } from '../fixtures/api-mock';

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
});

test('completes onboarding flow', async ({ page }) => {
  await page.goto('/onboarding');
  // ... test continues
});
```

### 3. Runner Commands

| Command | Description |
|---------|-------------|
| `npm run test:e2e:smoke` | Run smoke tests (< 3 min, mocked API) |
| `npm run test:e2e:regression` | Run full regression (mocked API) |
| `npm run test:e2e:headed` | Debug with visible browser |

### 4. Flakiness Prevention

| Rule | Implementation |
|------|----------------|
| **No arbitrary waits** | Use `page.waitForResponse()` or `expect().toBeVisible()` |
| **Stable selectors** | All interactive elements have `data-testid` attributes |
| **Test isolation** | Call `apiMock.reset()` in `beforeEach` |
| **Deterministic state** | In-memory mock state, no external DB |
| **Retry on CI** | `retries: 2` in `playwright.config.ts` for CI only |

---

## Consequences

### Positive
- **Immediate unblock**: E2E tests can pass without backend implementation.
- **Fast execution**: No network latency to real services.
- **Deterministic**: Same mock responses every run.
- **Aligned with MVP**: Keeps focus on frontend; backend tested separately later.
- **Reusable mocks**: Same handler logic as contract tests (single source of truth).

### Negative
- **No true integration test**: Won't catch backend bugs. Mitigated by contract tests.
- **Mock maintenance**: If API spec changes, must update both MSW handlers and Playwright routes. See `docs/architecture/contract-change-checklist.md`.
- **Gap until backend exists**: Full E2E (Option A) deferred until backend is implemented.

### Neutral
- When backend is ready, we can add a **separate "integration E2E" suite** that runs against real routes. The mocked E2E suite remains for fast feedback.

---

## Alternatives Considered

### Option A: E2E Against Real Local `/api/*`
- **Rejected for now**: Backend not implemented; would block MVP.
- **Future consideration**: When backend lands, add `integration-e2e` project in Playwright config pointing to real endpoints.

### Hybrid: MSW in Browser via `playwright-msw`
- **Considered**: The `playwright-msw` package can inject MSW into the browser context.
- **Rejected**: Adds complexity; Playwright's native `page.route()` is simpler and sufficient.

---

## Related Documents

- `docs/quality/sdet/sdet-onboarding-test-plan.md` — Test pyramid and flake prevention rules
- `docs/onboarding/onboarding-backend-spec.md` — API contract definitions
- `docs/architecture/contract-change-checklist.md` — Preventing mock drift
- `tests/mocks/handlers.ts` — MSW handlers (source of truth for mocks)

---

*ADR authored by System Architecture Engineer Agent*
