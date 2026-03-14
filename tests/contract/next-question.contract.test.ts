import { describe, it, expect, beforeEach } from 'vitest';
import { resetMockState } from '../mocks/handlers';
import { onboardingApi } from '@/lib/api/onboarding';
import { mockQuestions } from '../fixtures/questions';

describe('Contract: GET /api/onboarding/question/next', () => {
  beforeEach(async () => {
    resetMockState();
    // Grant consent to proceed
    await onboardingApi.submitAnswer('consent_personalization', { value: 'accept' });
  });

  it('OB-TC-016: returns first unanswered question by sequence order', async () => {
    const response = await onboardingApi.getNextQuestion();

    // After consent, should be job_title (sequence 2)
    expect(response.question?.key).toBe('job_title');
  });

  it('returns question with all required fields', async () => {
    const response = await onboardingApi.getNextQuestion();

    expect(response.question).toHaveProperty('key');
    expect(response.question).toHaveProperty('type');
    expect(response.question).toHaveProperty('title');
    expect(response.question).toHaveProperty('isRequired');
    expect(response.question).toHaveProperty('isSkippable');
  });

  it('includes progress in response', async () => {
    const response = await onboardingApi.getNextQuestion();

    expect(response).toHaveProperty('progress');
    expect(response.progress).toHaveProperty('answered');
    expect(response.progress).toHaveProperty('total');
    expect(response.progress).toHaveProperty('percentComplete');
  });

  it('includes previousAnswers map', async () => {
    const response = await onboardingApi.getNextQuestion();

    expect(response).toHaveProperty('previousAnswers');
    expect(typeof response.previousAnswers).toBe('object');
    
    // Should have consent answer
    expect(response.previousAnswers).toHaveProperty('consent_personalization');
    expect(response.previousAnswers.consent_personalization.value).toBe('accept');
  });

  it('returns null when all questions answered', async () => {
    // Skip all remaining questions
    for (const q of mockQuestions) {
      if (q.key !== 'consent_personalization' && q.isSkippable) {
        await onboardingApi.skipQuestion(q.key);
      }
    }

    const response = await onboardingApi.getNextQuestion();
    
    expect(response.question).toBeNull();
    expect(response.isComplete).toBe(true);
  });

  it('advances correctly after answering', async () => {
    // Answer job_title
    await onboardingApi.submitAnswer('job_title', { value: 'Engineer' });
    
    const response = await onboardingApi.getNextQuestion();
    
    // Should now be industry (sequence 3)
    expect(response.question?.key).toBe('industry');
  });

  it('advances correctly after skipping', async () => {
    // Skip job_title
    await onboardingApi.skipQuestion('job_title');
    
    const response = await onboardingApi.getNextQuestion();
    
    // Should now be industry (sequence 3)
    expect(response.question?.key).toBe('industry');
  });
});
