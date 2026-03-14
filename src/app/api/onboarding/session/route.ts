import { NextResponse } from 'next/server';

/**
 * Stub: Onboarding session GET API
 * Returns mock data so the app doesn't hang.
 * TODO: Replace with real implementation.
 */
export async function GET() {
  return NextResponse.json({
    session: {
      id: 'stub-session',
      status: 'in_progress',
      questionSetVersion: 1,
      currentQuestionKey: null,
      progress: { answered: 0, total: 14, percentComplete: 0 },
      startedAt: new Date().toISOString(),
    },
    nextQuestion: {
      key: 'consent_personalization',
      type: 'consent',
      title: '맞춤형 서비스를 위해 정보를 저장할까요?',
      description: '투자 성향과 관심 종목을 저장하여 매일 맞춤 콘텐츠를 제공합니다.',
      options: [
        { value: 'accept', label: '동의합니다' },
        { value: 'decline', label: '동의하지 않습니다' },
      ],
      isRequired: true,
      isSkippable: false,
    },
  });
}
