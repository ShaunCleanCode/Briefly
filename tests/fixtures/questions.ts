import type { Question } from '@/types/onboarding';

/**
 * Mock question set v1.1 for testing
 * Matches the backend spec exactly
 */
export const mockQuestions: Question[] = [
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
    description: '자세히 알려주실수록 레터가 더 정확해져요. 예: 소프트웨어 엔지니어, 마케팅 매니저',
    placeholder: '직무/직책을 입력해주세요',
    isRequired: false,
    isSkippable: true,
    skipLabel: '건너뛰기',
    validation: {
      maxLength: 100,
    },
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
    validation: {
      max: 3,
    },
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
    validation: {
      min: '05:00',
      max: '22:00',
    },
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
    validation: {
      max: 10,
    },
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

/**
 * Get question by key
 */
export function getQuestion(key: string): Question | undefined {
  return mockQuestions.find((q) => q.key === key);
}

/**
 * Get question index by key
 */
export function getQuestionIndex(key: string): number {
  return mockQuestions.findIndex((q) => q.key === key);
}
