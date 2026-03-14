import { test as base, Page, Route, Request } from '@playwright/test';

// Types for mock state
interface Answer {
  value?: string;
  values?: string[];
  skipped: boolean;
}

interface ValidationOverride {
  minLength?: number;
  maxLength?: number;
  min?: string | number;
  max?: string | number;
  pattern?: string;
}

interface MockState {
  hasConsent: boolean;
  currentQuestionIndex: number;
  answers: Map<string, Answer>;
  isCompleted: boolean;
  completedAt: string | null;
  validationOverrides: Map<string, ValidationOverride>;
}

// Mock questions (matches tests/fixtures/questions.ts)
const mockQuestions = [
  {
    key: 'consent_personalization',
    type: 'consent',
    title: '맞춤형 서비스를 위해 정보를 저장할까요?',
    description: '투자 성향과 관심 종목을 저장하여 매일 맞춤 콘텐츠를 제공합니다. 언제든 설정에서 삭제할 수 있습니다.',
    options: [
      { value: 'accept', label: '동의합니다' },
      { value: 'decline', label: '동의하지 않습니다' },
    ],
    isRequired: true,
    isSkippable: false,
  },
  {
    key: 'job_title',
    type: 'text',
    title: '어떤 일을 하고 계신가요?',
    description: '자세히 알려주실수록 레터가 더 정확해져요.',
    placeholder: '직무/직책을 입력해주세요',
    isRequired: false,
    isSkippable: true,
    skipLabel: '건너뛰기',
    validation: { maxLength: 100 },
  },
  {
    key: 'industry',
    type: 'single_choice',
    title: '어떤 산업에서 일하시나요?',
    description: '관련 산업 뉴스와 인사이트를 우선 제공해드려요.',
    options: [
      { value: 'technology', label: '기술/IT' },
      { value: 'finance', label: '금융/투자' },
      { value: 'healthcare', label: '헬스케어/제약' },
      { value: 'manufacturing', label: '제조업' },
      { value: 'retail', label: '유통/소매' },
      { value: 'education', label: '교육' },
      { value: 'other', label: '기타' },
    ],
    isRequired: false,
    isSkippable: true,
    skipLabel: '건너뛰기',
  },
  {
    key: 'experience_years',
    type: 'single_choice',
    title: '주식 투자 경험이 얼마나 되셨나요?',
    description: '맞춤 콘텐츠 난이도를 조절하는 데 활용됩니다.',
    options: [
      { value: '0', label: '처음입니다' },
      { value: '1_3', label: '1~3년' },
      { value: '3_5', label: '3~5년' },
      { value: '5_plus', label: '5년 이상' },
    ],
    isRequired: false,
    isSkippable: true,
    skipLabel: '건너뛰기',
  },
  {
    key: 'investment_goal',
    type: 'single_choice',
    title: '투자의 주요 목표는 무엇인가요?',
    options: [
      { value: 'wealth_growth', label: '자산 증식' },
      { value: 'income', label: '배당/수익 창출' },
      { value: 'learn', label: '투자 공부' },
      { value: 'active_trading', label: '단기 트레이딩' },
      { value: 'macro_understanding', label: '경제 흐름 이해' },
    ],
    isRequired: false,
    isSkippable: true,
    skipLabel: '건너뛰기',
  },
  {
    key: 'risk_tolerance',
    type: 'single_choice',
    title: '투자 위험에 대한 선호도는?',
    options: [
      { value: 'conservative', label: '안정 추구 (낮은 변동성 선호)' },
      { value: 'moderate', label: '균형 (적정 수준의 위험 감수)' },
      { value: 'aggressive', label: '공격적 (높은 수익을 위해 위험 감수)' },
    ],
    isRequired: false,
    isSkippable: true,
    skipLabel: '건너뛰기',
  },
  {
    key: 'time_availability',
    type: 'single_choice',
    title: '하루에 투자 정보를 읽는 데 얼마나 시간을 쓰시나요?',
    options: [
      { value: 'very_busy', label: '5분 이하 (요약만)' },
      { value: 'moderate', label: '10-15분 (적당한 깊이)' },
      { value: 'plenty', label: '30분 이상 (깊이 있게)' },
    ],
    isRequired: false,
    isSkippable: true,
    skipLabel: '건너뛰기',
  },
  {
    key: 'watchlist_sectors',
    type: 'multi_choice',
    title: '관심 있는 섹터를 선택해주세요 (최대 3개)',
    options: [
      { value: 'Technology', label: '기술 (Tech)' },
      { value: 'Healthcare', label: '헬스케어' },
      { value: 'Financials', label: '금융' },
      { value: 'Consumer', label: '소비재' },
      { value: 'Energy', label: '에너지' },
      { value: 'Industrials', label: '산업재' },
      { value: 'Materials', label: '소재' },
      { value: 'Utilities', label: '유틸리티' },
      { value: 'Real Estate', label: '부동산' },
      { value: 'Communication', label: '통신' },
    ],
    isRequired: false,
    isSkippable: true,
    skipLabel: '건너뛰기',
    validation: { max: 3 },
  },
  {
    key: 'delivery_time',
    type: 'time_picker',
    title: '매일 레터를 받고 싶은 시간은?',
    description: '한국 시간 기준입니다.',
    placeholder: '07:00',
    isRequired: false,
    isSkippable: true,
    skipLabel: '기본값 (07:00) 사용',
    validation: { min: '05:00', max: '22:00' },
  },
  {
    key: 'watchlist_tickers',
    type: 'ticker_search',
    title: '관심 종목이 있으신가요? (선택, 최대 10개)',
    description: 'S&P 500 종목 중에서 검색해주세요.',
    placeholder: '예: AAPL, MSFT, NVDA',
    isRequired: false,
    isSkippable: true,
    skipLabel: '건너뛰기',
    validation: { max: 10 },
  },
  {
    key: 'portfolio_size_range',
    type: 'single_choice',
    title: '대략적인 투자 규모는? (선택)',
    description: '맞춤 콘텐츠 제공에만 활용되며 외부에 공유되지 않습니다.',
    options: [
      { value: 'none', label: '아직 투자하지 않음' },
      { value: 'under_10k', label: '$10,000 미만' },
      { value: '10k_50k', label: '$10,000 - $50,000' },
      { value: '50k_200k', label: '$50,000 - $200,000' },
      { value: '200k_plus', label: '$200,000 이상' },
    ],
    isRequired: false,
    isSkippable: true,
    skipLabel: '답하지 않음',
  },
];

// Valid S&P 500 tickers for validation
const validTickers = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK.B', 'BRK.A',
  'UNH', 'JNJ', 'V', 'XOM', 'JPM', 'WMT', 'PG', 'MA', 'HD', 'CVX', 'LLY',
];

/**
 * Creates a fresh mock state for each test
 */
function createMockState(): MockState {
  return {
    hasConsent: false,
    currentQuestionIndex: 0,
    answers: new Map(),
    isCompleted: false,
    completedAt: null,
    validationOverrides: new Map(),
  };
}

/**
 * Gets the next unanswered question based on current state
 * Applies any validation overrides from state
 */
function getNextQuestion(state: MockState) {
  for (let i = 0; i < mockQuestions.length; i++) {
    const q = mockQuestions[i];
    const answer = state.answers.get(q.key);
    if (!answer || (answer.value === undefined && answer.values === undefined && !answer.skipped)) {
      // Apply validation overrides if any
      const override = state.validationOverrides.get(q.key);
      if (override) {
        const question = {
          ...q,
          validation: {
            ...(q as { validation?: ValidationOverride }).validation,
            ...override,
          },
        };
        return { question, index: i };
      }
      return { question: q, index: i };
    }
  }
  return { question: null, index: mockQuestions.length };
}

/**
 * Calculates progress based on answered questions
 */
function calculateProgress(state: MockState) {
  const answeredCount = Array.from(state.answers.values()).filter(
    (a) => a.value !== undefined || a.values !== undefined || a.skipped
  ).length;
  return {
    answered: answeredCount,
    total: mockQuestions.length,
    percentComplete: Math.round((answeredCount / mockQuestions.length) * 100),
  };
}

/**
 * API Mock class that handles route interception
 */
export class ApiMock {
  private state: MockState;
  private page: Page;
  private interceptLog: { method: string; url: string; timestamp: number }[] = [];
  private interceptCount = 0;

  constructor(page: Page) {
    this.page = page;
    this.state = createMockState();
  }

  /**
   * Reset state to initial values
   */
  reset() {
    this.state = createMockState();
    this.interceptLog = [];
    this.interceptCount = 0;
  }

  /**
   * Set up all API route interceptions
   */
  async setup() {
    // Log ALL requests for debugging
    this.page.on('request', (request) => {
      const url = request.url();
      if (url.includes('api')) {
        console.log(`[API-MOCK] REQUEST (all): ${request.method()} ${url}`);
      }
    });

    this.page.on('response', (response) => {
      const url = response.url();
      if (url.includes('api')) {
        console.log(`[API-MOCK] RESPONSE (all): ${response.status()} ${url}`);
      }
    });

    // Set up route interception with regex for more reliable matching
    await this.page.route(/\/api\/onboarding\/.*/, (route) => this.handleRoute(route));
    console.log('[API-MOCK] Route interception configured for /api/onboarding/* (regex)');
  }

  /**
   * Get intercept count (for verification)
   */
  getInterceptCount(): number {
    return this.interceptCount;
  }

  /**
   * Get intercept log (for debugging)
   */
  getInterceptLog(): { method: string; url: string; timestamp: number }[] {
    return [...this.interceptLog];
  }

  /**
   * Main route handler
   */
  private async handleRoute(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const pathname = url.pathname;

    // Log intercept for verification
    this.interceptCount++;
    this.interceptLog.push({
      method,
      url: request.url(),
      timestamp: Date.now(),
    });
    console.log(`[API-MOCK] INTERCEPTED #${this.interceptCount}: ${method} ${pathname}`);

    try {
      // POST /api/onboarding/start
      if (pathname.endsWith('/start') && method === 'POST') {
        return this.handleStart(route);
      }

      // GET /api/onboarding/session
      if (pathname.endsWith('/session') && method === 'GET') {
        return this.handleGetSession(route);
      }

      // GET /api/onboarding/question/next
      if (pathname.endsWith('/question/next') && method === 'GET') {
        return this.handleGetNextQuestion(route);
      }

      // POST /api/onboarding/answer
      if (pathname.endsWith('/answer') && method === 'POST') {
        return this.handleAnswer(route, request);
      }

      // POST /api/onboarding/skip
      if (pathname.endsWith('/skip') && method === 'POST') {
        return this.handleSkip(route, request);
      }

      // PATCH /api/onboarding/answer/:questionKey
      if (pathname.includes('/answer/') && method === 'PATCH') {
        return this.handleEditAnswer(route, request);
      }

      // POST /api/onboarding/complete
      if (pathname.endsWith('/complete') && method === 'POST') {
        return this.handleComplete(route);
      }

      // GET /api/onboarding/profile
      if (pathname.endsWith('/profile') && method === 'GET') {
        return this.handleGetProfile(route);
      }

      // Default: continue to actual server (should not happen in tests)
      await route.continue();
    } catch (error) {
      console.error('API Mock error:', error);
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'MOCK_ERROR', message: String(error) }),
      });
    }
  }

  /**
   * POST /api/onboarding/start
   */
  private async handleStart(route: Route) {
    if (this.state.isCompleted) {
      return route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'ONBOARDING_ALREADY_COMPLETED',
          message: 'Onboarding was completed',
          completedAt: this.state.completedAt,
          canRestart: false,
        }),
      });
    }

    const { question } = getNextQuestion(this.state);
    const progress = calculateProgress(this.state);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        session: {
          id: 'test-session-001',
          status: 'in_progress',
          questionSetVersion: 1,
          currentQuestionKey: question?.key ?? null,
          progress,
          startedAt: new Date().toISOString(),
        },
        consentRequired: !this.state.hasConsent,
        nextQuestion: question,
      }),
    });
  }

  /**
   * GET /api/onboarding/session
   */
  private async handleGetSession(route: Route) {
    const { question } = getNextQuestion(this.state);
    const progress = calculateProgress(this.state);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        session: {
          id: 'test-session-001',
          status: this.state.isCompleted ? 'completed' : 'in_progress',
          questionSetVersion: 1,
          currentQuestionKey: question?.key ?? null,
          progress,
          startedAt: new Date().toISOString(),
        },
        consentRequired: !this.state.hasConsent,
        nextQuestion: question,
      }),
    });
  }

  /**
   * GET /api/onboarding/question/next
   */
  private async handleGetNextQuestion(route: Route) {
    const { question } = getNextQuestion(this.state);
    const progress = calculateProgress(this.state);

    const previousAnswers: Record<string, Answer> = {};
    this.state.answers.forEach((value, key) => {
      previousAnswers[key] = value;
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        question,
        progress,
        previousAnswers,
        isComplete: question === null,
      }),
    });
  }

  /**
   * POST /api/onboarding/answer
   */
  private async handleAnswer(route: Route, request: Request) {
    const body = JSON.parse(request.postData() || '{}');
    const { questionKey, answer } = body;

    // Check consent requirement
    if (!this.state.hasConsent && !questionKey.startsWith('consent_')) {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'CONSENT_REQUIRED',
          message: 'Cannot store personalization data without consent',
          requiredConsentType: 'personalization_data',
          redirectToQuestion: 'consent_personalization',
        }),
      });
    }

    // Find the question
    const question = mockQuestions.find((q) => q.key === questionKey);
    if (!question) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'QUESTION_NOT_FOUND', message: `Question ${questionKey} not found` }),
      });
    }

    // Validate ticker search
    if (question.type === 'ticker_search' && answer.values) {
      const invalid = answer.values.filter((t: string) => !validTickers.includes(t));
      if (invalid.length > 0) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'VALIDATION_ERROR',
            message: 'Invalid ticker symbol',
            details: { field: 'values', value: invalid[0], rule: 'must be valid S&P 500 ticker' },
          }),
        });
      }
      if (answer.values.length > 10) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'VALIDATION_ERROR',
            message: 'Maximum 10 tickers allowed',
            details: { field: 'values', value: answer.values.length, rule: 'max 10' },
          }),
        });
      }
    }

    // Validate text max length
    if (question.type === 'text' && answer.value) {
      // Check for validation override first
      const override = this.state.validationOverrides.get(questionKey);
      const baseValidation = (question as { validation?: { maxLength?: number } }).validation;
      const maxLength = override?.maxLength ?? baseValidation?.maxLength ?? 100;
      if (answer.value.length > maxLength) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'VALIDATION_ERROR',
            message: `Maximum ${maxLength} characters allowed`,
            details: { field: 'value', value: answer.value.length, rule: `maxLength: ${maxLength}` },
          }),
        });
      }
    }

    // Handle consent questions
    let consentRecorded = false;
    let consentGranted = false;
    if (questionKey.startsWith('consent_')) {
      consentRecorded = true;
      consentGranted = answer.value === 'accept';
      this.state.hasConsent = consentGranted;

      // If declined, return special response
      if (!consentGranted) {
        this.state.answers.set(questionKey, { value: answer.value, skipped: false });
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            answerId: `answer-${Date.now()}`,
            consentRecorded: true,
            consentType: 'personalization_data',
            consentGranted: false,
            sessionStatus: 'consent_declined',
            nextQuestion: null,
            message: '맞춤 서비스 없이 기본 레터만 받으실 수 있습니다.',
            progress: calculateProgress(this.state),
          }),
        });
      }
    }

    // Store answer
    this.state.answers.set(questionKey, { ...answer, skipped: false });

    // Get next question
    const { question: nextQuestion } = getNextQuestion(this.state);
    const progress = calculateProgress(this.state);

    const response: Record<string, unknown> = {
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

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  }

  /**
   * POST /api/onboarding/skip
   */
  private async handleSkip(route: Route, request: Request) {
    const body = JSON.parse(request.postData() || '{}');
    const { questionKey } = body;

    // Find the question
    const question = mockQuestions.find((q) => q.key === questionKey);
    if (!question) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'QUESTION_NOT_FOUND', message: `Question ${questionKey} not found` }),
      });
    }

    // Check if skippable
    if (!question.isSkippable) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'QUESTION_NOT_SKIPPABLE',
          message: 'This question is required and cannot be skipped',
          questionKey,
        }),
      });
    }

    // Check consent
    if (!this.state.hasConsent) {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'CONSENT_REQUIRED',
          message: 'Cannot skip questions without consent',
          requiredConsentType: 'personalization_data',
          redirectToQuestion: 'consent_personalization',
        }),
      });
    }

    // Store skip
    this.state.answers.set(questionKey, { skipped: true });

    // Get next question
    const { question: nextQuestion } = getNextQuestion(this.state);
    const progress = calculateProgress(this.state);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        skipped: true,
        questionKey,
        nextQuestion,
        progress,
      }),
    });
  }

  /**
   * PATCH /api/onboarding/answer/:questionKey
   */
  private async handleEditAnswer(route: Route, request: Request) {
    const url = new URL(request.url());
    const pathParts = url.pathname.split('/');
    const questionKey = pathParts[pathParts.length - 1];

    const body = JSON.parse(request.postData() || '{}');
    const { answer } = body;

    // Check if consent question
    if (questionKey.startsWith('consent_') && answer === null) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'CANNOT_CLEAR_CONSENT',
          message: 'Consent answers cannot be cleared. Contact support to revoke consent.',
          questionKey,
        }),
      });
    }

    const existingAnswer = this.state.answers.get(questionKey);
    const previousValue = existingAnswer?.value ?? existingAnswer?.values?.join(',') ?? null;

    if (answer === null) {
      // Clear the answer (for back navigation)
      this.state.answers.delete(questionKey);

      const { question: nextQuestion } = getNextQuestion(this.state);

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          answerId: `answer-${Date.now()}`,
          previousValue,
          newValue: null,
          cleared: true,
          nextQuestion,
        }),
      });
    }

    // Update answer
    this.state.answers.set(questionKey, { ...answer, skipped: false });
    
    // Handle consent questions - update hasConsent state
    if (questionKey.startsWith('consent_')) {
      this.state.hasConsent = answer.value === 'accept';
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        answerId: `answer-${Date.now()}`,
        previousValue,
        newValue: answer.value ?? answer.values?.join(','),
        derivedFieldsUpdated: ['knowledge_level'],
      }),
    });
  }

  /**
   * POST /api/onboarding/complete
   */
  private async handleComplete(route: Route) {
    // Check consent
    if (!this.state.hasConsent) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'REQUIRED_QUESTIONS_INCOMPLETE',
          message: 'Please complete all required questions',
          missing: ['consent_personalization'],
        }),
      });
    }

    this.state.isCompleted = true;
    this.state.completedAt = new Date().toISOString();

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
          onboardingCompletedAt: this.state.completedAt,
        },
        message: '환영합니다! 내일 첫 번째 맞춤 레터를 보내드릴게요.',
      }),
    });
  }

  /**
   * GET /api/onboarding/profile
   */
  private async handleGetProfile(route: Route) {
    if (!this.state.isCompleted) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'NOT_FOUND', message: 'Profile not found' }),
      });
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
      }),
    });
  }

  /**
   * Set consent state directly (for testing resume scenarios)
   */
  setConsent(hasConsent: boolean) {
    this.state.hasConsent = hasConsent;
  }

  /**
   * Set validation override for a question (for testing validation)
   */
  setQuestionValidation(questionKey: string, validation: ValidationOverride) {
    this.state.validationOverrides.set(questionKey, validation);
  }

  /**
   * Add an answer directly (for testing resume scenarios)
   */
  addAnswer(questionKey: string, answer: Answer) {
    this.state.answers.set(questionKey, answer);
  }

  /**
   * Set completion state directly
   */
  setCompleted(completed: boolean) {
    this.state.isCompleted = completed;
    if (completed) {
      this.state.completedAt = new Date().toISOString();
    }
  }

  /**
   * Get current state (for assertions)
   */
  getState() {
    return {
      hasConsent: this.state.hasConsent,
      answeredCount: this.state.answers.size,
      isCompleted: this.state.isCompleted,
    };
  }
}

/**
 * Extended test fixture with API mocking
 */
export type TestFixtures = {
  apiMock: ApiMock;
};

/**
 * Test base with API mock fixture
 */
export const test = base.extend<TestFixtures>({
  apiMock: async ({ page }, use) => {
    const mock = new ApiMock(page);
    await mock.setup();
    await use(mock);
  },
});

export { expect } from '@playwright/test';
