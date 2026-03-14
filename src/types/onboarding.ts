// Question types matching backend spec
export type QuestionType = 
  | 'consent'
  | 'single_choice'
  | 'multi_choice'
  | 'text'
  | 'number'
  | 'ticker_search'
  | 'sector_picker'
  | 'time_picker';

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface QuestionValidation {
  min?: number | string;
  max?: number | string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface Question {
  key: string;
  type: QuestionType;
  title: string;
  description?: string | null;
  options?: QuestionOption[];
  isRequired: boolean;
  isSkippable: boolean;
  skipLabel?: string;
  validation?: QuestionValidation | null;
  placeholder?: string;
}

export interface Progress {
  answered: number;
  total: number;
  percentComplete: number;
}

export interface Session {
  id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  questionSetVersion: number;
  currentQuestionKey: string | null;
  progress: Progress;
  startedAt: string;
  completedAt?: string;
}

export interface AnswerPayload {
  value?: string;
  values?: string[];
}

export interface StartSessionResponse {
  session: Session;
  consentRequired: boolean;
  nextQuestion: Question | null;
}

export interface AnswerResponse {
  success: boolean;
  answerId: string;
  normalized?: string;
  nextQuestion: Question | null;
  progress: Progress;
}

export interface SkipResponse {
  success: boolean;
  skipped: boolean;
  questionKey: string;
  nextQuestion: Question | null;
  progress: Progress;
}

export interface NextQuestionResponse {
  question: Question | null;
  progress: Progress;
  previousAnswers: Record<string, { value?: string; values?: string[]; skipped: boolean }>;
  isComplete?: boolean;
}

export interface DeliverySchedule {
  timezone: string;
  time: string;
  nextDelivery: string;
}

export interface PersonalizationInputs {
  watchlistTickers: string[];
  watchlistSectors: string[];
  depthPreference: 'summary' | 'detailed' | 'deep_dive';
  investmentHorizon?: 'short' | 'medium' | 'long';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  portfolioTickers?: string[];
}

export interface DerivedProfile {
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  investorSegment: 'long_term' | 'trader' | 'macro' | 'sector_specialist' | 'learner';
  deliverySchedule?: DeliverySchedule;
  personalizationInputs?: PersonalizationInputs;
  onboardingCompletedAt?: string;
  lastUpdatedAt?: string;
}

export interface CompleteResponse {
  success: boolean;
  profile: DerivedProfile;
  message: string;
}

export interface ProfileResponse {
  profile: DerivedProfile;
  canEdit: boolean;
  editableFields: string[];
}

// S&P 500 Ticker info
export interface SP500Ticker {
  symbol: string;
  name: string;
  sector?: string;
}

// Error types
export interface OnboardingError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
