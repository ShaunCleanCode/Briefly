import { describe, it, expect, beforeEach } from 'vitest';
import { resetMockState } from '../mocks/handlers';
import { onboardingApi } from '@/lib/api/onboarding';

describe('Contract: POST /api/onboarding/start', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('OB-TC-004: returns session with expected schema', async () => {
    const response = await onboardingApi.start({ locale: 'ko' });

    // Verify session structure
    expect(response).toHaveProperty('session');
    expect(response.session).toHaveProperty('id');
    expect(response.session).toHaveProperty('status');
    expect(response.session).toHaveProperty('questionSetVersion');
    expect(response.session).toHaveProperty('progress');
    expect(response.session.status).toBe('in_progress');

    // Verify progress structure
    expect(response.session.progress).toHaveProperty('answered');
    expect(response.session.progress).toHaveProperty('total');
    expect(response.session.progress).toHaveProperty('percentComplete');
    expect(typeof response.session.progress.answered).toBe('number');
    expect(typeof response.session.progress.total).toBe('number');
    expect(typeof response.session.progress.percentComplete).toBe('number');

    // Verify consent requirement flag
    expect(response).toHaveProperty('consentRequired');
    expect(response.consentRequired).toBe(true);

    // Verify first question is consent
    expect(response).toHaveProperty('nextQuestion');
    expect(response.nextQuestion).not.toBeNull();
    expect(response.nextQuestion?.key).toBe('consent_personalization');
    expect(response.nextQuestion?.type).toBe('consent');
    expect(response.nextQuestion?.isSkippable).toBe(false);
  });

  it('OB-TC-007: progress percentComplete matches answered/total ratio', async () => {
    const response = await onboardingApi.start({ locale: 'ko' });

    const { answered, total, percentComplete } = response.session.progress;
    const expectedPercent = Math.round((answered / total) * 100);

    expect(percentComplete).toBe(expectedPercent);
  });

  it('returns nextQuestion with required fields', async () => {
    const response = await onboardingApi.start({ locale: 'ko' });

    const question = response.nextQuestion;
    expect(question).not.toBeNull();
    expect(question).toHaveProperty('key');
    expect(question).toHaveProperty('type');
    expect(question).toHaveProperty('title');
    expect(question).toHaveProperty('isRequired');
    expect(question).toHaveProperty('isSkippable');
  });

  it('returns consent question with accept/decline options', async () => {
    const response = await onboardingApi.start({ locale: 'ko' });

    const question = response.nextQuestion;
    expect(question?.options).toBeDefined();
    expect(question?.options?.length).toBe(2);

    const values = question?.options?.map((o) => o.value);
    expect(values).toContain('accept');
    expect(values).toContain('decline');
  });
});
