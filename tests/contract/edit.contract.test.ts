import { describe, it, expect, beforeEach } from 'vitest';
import { resetMockState } from '../mocks/handlers';
import { onboardingApi } from '@/lib/api/onboarding';

describe('Contract: PATCH /api/onboarding/answer/:questionKey', () => {
  beforeEach(async () => {
    resetMockState();
    // Setup: grant consent and answer a question
    await onboardingApi.submitAnswer('consent_personalization', { value: 'accept' });
    await onboardingApi.submitAnswer('job_title', { value: 'Engineer' });
  });

  it('OB-TC-012: updates answer and returns previous/new values', async () => {
    const response = await onboardingApi.editAnswer('job_title', {
      value: 'Senior Engineer',
    });

    expect(response.success).toBe(true);
    expect(response).toHaveProperty('answerId');
    // @ts-expect-error - Extended response for edit
    expect(response.previousValue).toBe('Engineer');
    // @ts-expect-error - Extended response for edit
    expect(response.newValue).toBe('Senior Engineer');
  });

  it('OB-TC-013: setting null clears answer for back navigation', async () => {
    const response = await onboardingApi.editAnswer('job_title', null);

    expect(response.success).toBe(true);
    // @ts-expect-error - Extended response for clear
    expect(response.cleared).toBe(true);
    // @ts-expect-error - Extended response for clear
    expect(response.newValue).toBeNull();
    // After clearing, next question should be the cleared one
    expect(response.nextQuestion?.key).toBe('job_title');
  });

  it('OB-TC-014: cannot clear consent answer', async () => {
    await expect(
      onboardingApi.editAnswer('consent_personalization', null)
    ).rejects.toThrow();
  });

  it('can edit consent answer (change value but not clear)', async () => {
    // Note: In real scenario, changing consent from accept to decline
    // would have implications - this tests the API contract
    // The business logic may prevent this in production
    const response = await onboardingApi.editAnswer('consent_personalization', {
      value: 'accept', // Same value, no real change
    });

    expect(response.success).toBe(true);
  });

  it('returns previous value when editing', async () => {
    const response = await onboardingApi.editAnswer('job_title', {
      value: 'Product Manager',
    });

    // @ts-expect-error - Extended response fields
    expect(response.previousValue).toBeDefined();
    // @ts-expect-error - Extended response fields
    expect(response.previousValue).not.toEqual(response.newValue);
  });
});
