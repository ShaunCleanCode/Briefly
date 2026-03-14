import { describe, it, expect, beforeEach } from 'vitest';
import { resetMockState } from '../mocks/handlers';
import { onboardingApi } from '@/lib/api/onboarding';

describe('Contract: POST /api/onboarding/skip', () => {
  beforeEach(async () => {
    resetMockState();
    // Grant consent first
    await onboardingApi.submitAnswer('consent_personalization', { value: 'accept' });
  });

  it('OB-TC-008: skip stores is_skipped correctly', async () => {
    const response = await onboardingApi.skipQuestion('job_title');

    expect(response.success).toBe(true);
    expect(response.skipped).toBe(true);
    expect(response.questionKey).toBe('job_title');
    expect(response.nextQuestion).not.toBeNull();
    expect(response.nextQuestion?.key).toBe('industry');
  });

  it('OB-TC-009: returns error for non-skippable question', async () => {
    resetMockState(); // Reset to test consent skip

    await expect(onboardingApi.skipQuestion('consent_personalization')).rejects.toThrow();
  });

  it('updates progress after skip', async () => {
    const response = await onboardingApi.skipQuestion('job_title');

    // Progress should increase (skipped counts as answered)
    expect(response.progress.answered).toBeGreaterThan(1);
  });

  it('returns next question in sequence', async () => {
    await onboardingApi.skipQuestion('job_title');
    const response = await onboardingApi.skipQuestion('industry');

    expect(response.nextQuestion?.key).toBe('experience_years');
  });

  it('response has expected schema', async () => {
    const response = await onboardingApi.skipQuestion('job_title');

    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('skipped');
    expect(response).toHaveProperty('questionKey');
    expect(response).toHaveProperty('nextQuestion');
    expect(response).toHaveProperty('progress');
  });
});
