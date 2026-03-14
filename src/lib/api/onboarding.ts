import type {
  StartSessionResponse,
  AnswerResponse,
  SkipResponse,
  NextQuestionResponse,
  CompleteResponse,
  ProfileResponse,
  AnswerPayload,
} from '@/types/onboarding';

const API_BASE = '/api/onboarding';

// Helper for API calls
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const onboardingApi = {
  /**
   * Start or resume an onboarding session
   */
  start: async (params: {
    locale?: string;
    metadata?: Record<string, string>;
  }): Promise<StartSessionResponse> => {
    return fetchApi<StartSessionResponse>('/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Get current session state
   */
  getSession: async (): Promise<StartSessionResponse> => {
    return fetchApi<StartSessionResponse>('/session', {
      method: 'GET',
    });
  },

  /**
   * Get next question
   */
  getNextQuestion: async (locale = 'ko'): Promise<NextQuestionResponse> => {
    return fetchApi<NextQuestionResponse>(`/question/next?locale=${locale}`);
  },

  /**
   * Submit an answer
   */
  submitAnswer: async (
    questionKey: string,
    answer: AnswerPayload
  ): Promise<AnswerResponse> => {
    return fetchApi<AnswerResponse>('/answer', {
      method: 'POST',
      body: JSON.stringify({ questionKey, answer }),
    });
  },

  /**
   * Skip a question
   */
  skipQuestion: async (questionKey: string): Promise<SkipResponse> => {
    return fetchApi<SkipResponse>('/skip', {
      method: 'POST',
      body: JSON.stringify({ questionKey }),
    });
  },

  /**
   * Edit a previous answer
   */
  editAnswer: async (
    questionKey: string,
    answer: AnswerPayload | null
  ): Promise<AnswerResponse> => {
    return fetchApi<AnswerResponse>(`/answer/${questionKey}`, {
      method: 'PATCH',
      body: JSON.stringify({ answer }),
    });
  },

  /**
   * Complete onboarding
   */
  complete: async (params: {
    finalConfirmation: boolean;
  }): Promise<CompleteResponse> => {
    return fetchApi<CompleteResponse>('/complete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Get derived profile
   */
  getProfile: async (): Promise<ProfileResponse> => {
    return fetchApi<ProfileResponse>('/profile');
  },

  /**
   * Record consent
   */
  recordConsent: async (params: {
    consentType: string;
    granted: boolean;
  }): Promise<{ success: boolean }> => {
    return fetchApi('/consent', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Save portfolio snapshot
   */
  savePortfolioSnapshot: async (params: {
    tickers: Array<{ symbol: string; weightPct: number }>;
  }): Promise<{ success: boolean; snapshotId: string }> => {
    return fetchApi('/portfolio-snapshot', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};
