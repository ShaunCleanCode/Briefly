import { http, HttpResponse } from 'msw';
import { mockQuestions } from '../fixtures/questions';
import type {
  StartSessionResponse,
  AnswerResponse,
  SkipResponse,
  CompleteResponse,
  ProfileResponse,
  NextQuestionResponse,
} from '@/types/onboarding';

const API_BASE = '/api/onboarding';

// In-memory state for tests
let sessionState = {
  hasConsent: false,
  currentQuestionIndex: 0,
  answers: new Map<string, { value?: string; values?: string[]; skipped: boolean }>(),
  isCompleted: false,
  completedAt: null as string | null,
};

// Reset state helper (export for tests)
export function resetMockState() {
  sessionState = {
    hasConsent: false,
    currentQuestionIndex: 0,
    answers: new Map(),
    isCompleted: false,
    completedAt: null,
  };
}

// Helper to get next unanswered question
function getNextQuestion() {
  for (let i = 0; i < mockQuestions.length; i++) {
    const q = mockQuestions[i];
    const answer = sessionState.answers.get(q.key);
    if (!answer || (answer.value === undefined && answer.values === undefined && !answer.skipped)) {
      return { question: q, index: i };
    }
  }
  return { question: null, index: mockQuestions.length };
}

// Helper to calculate progress
function calculateProgress() {
  const answeredCount = Array.from(sessionState.answers.values()).filter(
    (a) => a.value !== undefined || a.values !== undefined || a.skipped
  ).length;
  return {
    answered: answeredCount,
    total: mockQuestions.length,
    percentComplete: Math.round((answeredCount / mockQuestions.length) * 100),
  };
}

export const handlers = [
  // POST /api/onboarding/start
  http.post(`${API_BASE}/start`, async () => {
    // Check if already completed
    if (sessionState.isCompleted) {
      return HttpResponse.json(
        {
          error: 'ONBOARDING_ALREADY_COMPLETED',
          message: 'Onboarding was completed',
          completedAt: sessionState.completedAt,
          canRestart: false,
        },
        { status: 409 }
      );
    }

    const { question } = getNextQuestion();
    const progress = calculateProgress();

    const response: StartSessionResponse = {
      session: {
        id: 'test-session-001',
        status: 'in_progress',
        questionSetVersion: 1,
        currentQuestionKey: question?.key ?? null,
        progress,
        startedAt: new Date().toISOString(),
      },
      consentRequired: !sessionState.hasConsent,
      nextQuestion: question,
    };

    return HttpResponse.json(response);
  }),

  // GET /api/onboarding/session
  http.get(`${API_BASE}/session`, async () => {
    const { question } = getNextQuestion();
    const progress = calculateProgress();

    const response: StartSessionResponse = {
      session: {
        id: 'test-session-001',
        status: sessionState.isCompleted ? 'completed' : 'in_progress',
        questionSetVersion: 1,
        currentQuestionKey: question?.key ?? null,
        progress,
        startedAt: new Date().toISOString(),
      },
      consentRequired: !sessionState.hasConsent,
      nextQuestion: question,
    };

    return HttpResponse.json(response);
  }),

  // GET /api/onboarding/question/next
  http.get(`${API_BASE}/question/next`, async () => {
    const { question } = getNextQuestion();
    const progress = calculateProgress();

    const previousAnswers: Record<string, { value?: string; values?: string[]; skipped: boolean }> = {};
    sessionState.answers.forEach((value, key) => {
      previousAnswers[key] = value;
    });

    const response: NextQuestionResponse = {
      question,
      progress,
      previousAnswers,
      isComplete: question === null,
    };

    return HttpResponse.json(response);
  }),

  // POST /api/onboarding/answer
  http.post(`${API_BASE}/answer`, async ({ request }) => {
    const body = (await request.json()) as { questionKey: string; answer: { value?: string; values?: string[] } };
    const { questionKey, answer } = body;

    // Check consent requirement
    if (!sessionState.hasConsent && !questionKey.startsWith('consent_')) {
      return HttpResponse.json(
        {
          error: 'CONSENT_REQUIRED',
          message: 'Cannot store personalization data without consent',
          requiredConsentType: 'personalization_data',
          redirectToQuestion: 'consent_personalization',
        },
        { status: 403 }
      );
    }

    // Find the question
    const question = mockQuestions.find((q) => q.key === questionKey);
    if (!question) {
      return HttpResponse.json(
        { error: 'QUESTION_NOT_FOUND', message: `Question ${questionKey} not found` },
        { status: 404 }
      );
    }

    // Validate ticker search
    if (question.type === 'ticker_search' && answer.values) {
      const validTickers = [
        'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK.B', 'BRK.A',
        'UNH', 'JNJ', 'V', 'XOM', 'JPM', 'WMT', 'PG', 'MA', 'HD', 'CVX', 'LLY',
      ];
      const invalid = answer.values.filter((t) => !validTickers.includes(t));
      if (invalid.length > 0) {
        return HttpResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Invalid ticker symbol',
            details: { field: 'values', value: invalid[0], rule: 'must be valid S&P 500 ticker' },
          },
          { status: 400 }
        );
      }
      if (answer.values.length > 10) {
        return HttpResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Maximum 10 tickers allowed',
            details: { field: 'values', value: answer.values.length, rule: 'max 10' },
          },
          { status: 400 }
        );
      }
    }

    // Validate text max length
    if (question.type === 'text' && answer.value) {
      const maxLength = question.validation?.maxLength ?? 100;
      if (answer.value.length > maxLength) {
        return HttpResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: `Maximum ${maxLength} characters allowed`,
            details: { field: 'value', value: answer.value.length, rule: `maxLength: ${maxLength}` },
          },
          { status: 400 }
        );
      }
    }

    // Handle consent questions
    let consentRecorded = false;
    let consentGranted = false;
    if (questionKey.startsWith('consent_')) {
      consentRecorded = true;
      consentGranted = answer.value === 'accept';
      sessionState.hasConsent = consentGranted;

      // If declined, return special response
      if (!consentGranted) {
        sessionState.answers.set(questionKey, { value: answer.value, skipped: false });
        return HttpResponse.json({
          success: true,
          answerId: `answer-${Date.now()}`,
          consentRecorded: true,
          consentType: 'personalization_data',
          consentGranted: false,
          sessionStatus: 'consent_declined',
          nextQuestion: null,
          message: '맞춤 서비스 없이 기본 레터만 받으실 수 있습니다.',
          progress: calculateProgress(),
        });
      }
    }

    // Store answer
    sessionState.answers.set(questionKey, { ...answer, skipped: false });

    // Get next question
    const { question: nextQuestion } = getNextQuestion();
    const progress = calculateProgress();

    const response: AnswerResponse & { consentRecorded?: boolean; consentType?: string; consentGranted?: boolean } = {
      success: true,
      answerId: `answer-${Date.now()}`,
      normalized: answer.value ?? answer.values?.join(','),
      nextQuestion,
      progress,
    };

    if (consentRecorded) {
      response.consentRecorded = true;
      response.consentType = 'personalization_data';
      response.consentGranted = consentGranted;
    }

    return HttpResponse.json(response);
  }),

  // POST /api/onboarding/skip
  http.post(`${API_BASE}/skip`, async ({ request }) => {
    const body = (await request.json()) as { questionKey: string };
    const { questionKey } = body;

    // Find the question
    const question = mockQuestions.find((q) => q.key === questionKey);
    if (!question) {
      return HttpResponse.json(
        { error: 'QUESTION_NOT_FOUND', message: `Question ${questionKey} not found` },
        { status: 404 }
      );
    }

    // Check if skippable
    if (!question.isSkippable) {
      return HttpResponse.json(
        {
          error: 'QUESTION_NOT_SKIPPABLE',
          message: 'This question is required and cannot be skipped',
          questionKey,
        },
        { status: 400 }
      );
    }

    // Check consent
    if (!sessionState.hasConsent) {
      return HttpResponse.json(
        {
          error: 'CONSENT_REQUIRED',
          message: 'Cannot skip questions without consent',
          requiredConsentType: 'personalization_data',
          redirectToQuestion: 'consent_personalization',
        },
        { status: 403 }
      );
    }

    // Store skip
    sessionState.answers.set(questionKey, { skipped: true });

    // Get next question
    const { question: nextQuestion } = getNextQuestion();
    const progress = calculateProgress();

    const response: SkipResponse = {
      success: true,
      skipped: true,
      questionKey,
      nextQuestion,
      progress,
    };

    return HttpResponse.json(response);
  }),

  // PATCH /api/onboarding/answer/:questionKey
  http.patch(`${API_BASE}/answer/:questionKey`, async ({ params, request }) => {
    const { questionKey } = params as { questionKey: string };
    const body = (await request.json()) as { answer: { value?: string; values?: string[] } | null };
    const { answer } = body;

    // Check if consent question
    if (questionKey.startsWith('consent_')) {
      if (answer === null) {
        return HttpResponse.json(
          {
            error: 'CANNOT_CLEAR_CONSENT',
            message: 'Consent answers cannot be cleared. Contact support to revoke consent.',
            questionKey,
          },
          { status: 400 }
        );
      }
    }

    const existingAnswer = sessionState.answers.get(questionKey);
    const previousValue = existingAnswer?.value ?? existingAnswer?.values?.join(',') ?? null;

    if (answer === null) {
      // Clear the answer (for back navigation)
      sessionState.answers.delete(questionKey);

      const { question: nextQuestion } = getNextQuestion();

      return HttpResponse.json({
        success: true,
        answerId: `answer-${Date.now()}`,
        previousValue,
        newValue: null,
        cleared: true,
        nextQuestion,
      });
    }

    // Update answer
    sessionState.answers.set(questionKey, { ...answer, skipped: false });

    return HttpResponse.json({
      success: true,
      answerId: `answer-${Date.now()}`,
      previousValue,
      newValue: answer.value ?? answer.values?.join(','),
      derivedFieldsUpdated: ['knowledge_level'],
    });
  }),

  // POST /api/onboarding/complete
  http.post(`${API_BASE}/complete`, async () => {
    // Check consent
    if (!sessionState.hasConsent) {
      return HttpResponse.json(
        {
          error: 'REQUIRED_QUESTIONS_INCOMPLETE',
          message: 'Please complete all required questions',
          missing: ['consent_personalization'],
        },
        { status: 400 }
      );
    }

    sessionState.isCompleted = true;
    sessionState.completedAt = new Date().toISOString();

    const response: CompleteResponse = {
      success: true,
      profile: {
        knowledgeLevel: 'intermediate',
        investorSegment: 'long_term',
        deliverySchedule: {
          timezone: 'Asia/Seoul',
          time: '07:00',
          nextDelivery: new Date(Date.now() + 86400000).toISOString(),
        },
        personalizationInputs: {
          watchlistTickers: [],
          watchlistSectors: ['Technology'],
          depthPreference: 'detailed',
        },
        onboardingCompletedAt: sessionState.completedAt,
      },
      message: '환영합니다! 내일 첫 번째 맞춤 레터를 보내드릴게요.',
    };

    return HttpResponse.json(response);
  }),

  // GET /api/onboarding/profile
  http.get(`${API_BASE}/profile`, async () => {
    if (!sessionState.isCompleted) {
      return HttpResponse.json(
        { error: 'NOT_FOUND', message: 'Profile not found' },
        { status: 404 }
      );
    }

    const response: ProfileResponse = {
      profile: {
        knowledgeLevel: 'intermediate',
        investorSegment: 'long_term',
        deliverySchedule: {
          timezone: 'Asia/Seoul',
          time: '07:00',
          nextDelivery: new Date(Date.now() + 86400000).toISOString(),
        },
        personalizationInputs: {
          watchlistTickers: [],
          watchlistSectors: ['Technology'],
          depthPreference: 'detailed',
        },
      },
      canEdit: true,
      editableFields: ['watchlistTickers', 'watchlistSectors', 'deliveryTime'],
    };

    return HttpResponse.json(response);
  }),
];
