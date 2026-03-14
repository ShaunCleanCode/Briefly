import { describe, it, expect, beforeEach } from 'vitest';
import { resetMockState } from '../mocks/handlers';
import { onboardingApi } from '@/lib/api/onboarding';
import { validAnswers, invalidAnswers, consentDeclineAnswer } from '../fixtures/answers';

describe('Contract: POST /api/onboarding/answer', () => {
  beforeEach(() => {
    resetMockState();
  });

  describe('Consent Flow', () => {
    it('OB-TC-001: consent accept records consent and proceeds', async () => {
      const response = await onboardingApi.submitAnswer('consent_personalization', {
        value: 'accept',
      });

      expect(response.success).toBe(true);
      expect(response).toHaveProperty('answerId');
      // @ts-expect-error - Extended response fields for consent
      expect(response.consentRecorded).toBe(true);
      // @ts-expect-error - Extended response fields for consent
      expect(response.consentGranted).toBe(true);
      expect(response.nextQuestion).not.toBeNull();
      expect(response.nextQuestion?.key).toBe('job_title');
    });

    it('OB-TC-002: consent decline ends flow with special response', async () => {
      const response = await onboardingApi.submitAnswer(
        'consent_personalization',
        consentDeclineAnswer
      );

      expect(response.success).toBe(true);
      // @ts-expect-error - Extended response fields for consent
      expect(response.consentRecorded).toBe(true);
      // @ts-expect-error - Extended response fields for consent
      expect(response.consentGranted).toBe(false);
      // @ts-expect-error - Extended response fields for consent decline
      expect(response.sessionStatus).toBe('consent_declined');
      expect(response.nextQuestion).toBeNull();
    });

    it('OB-TC-003: answer blocked without consent returns 403', async () => {
      // Try to submit answer without consent first
      await expect(
        onboardingApi.submitAnswer('job_title', { value: 'Engineer' })
      ).rejects.toThrow();
    });
  });

  describe('Answer Validation', () => {
    beforeEach(async () => {
      // Grant consent first
      await onboardingApi.submitAnswer('consent_personalization', { value: 'accept' });
    });

    it('accepts valid single choice answer', async () => {
      const response = await onboardingApi.submitAnswer('experience_years', {
        value: '1_3',
      });

      expect(response.success).toBe(true);
      expect(response.normalized).toBe('1_3');
    });

    it('accepts valid multi choice answer', async () => {
      // Skip to watchlist_sectors
      await onboardingApi.skipQuestion('job_title');
      await onboardingApi.skipQuestion('industry');
      await onboardingApi.skipQuestion('experience_years');
      await onboardingApi.skipQuestion('investment_goal');
      await onboardingApi.skipQuestion('risk_tolerance');
      await onboardingApi.skipQuestion('time_availability');

      const response = await onboardingApi.submitAnswer('watchlist_sectors', {
        values: ['Technology', 'Healthcare'],
      });

      expect(response.success).toBe(true);
    });

    it('OB-TC-006: rejects invalid ticker symbol', async () => {
      // Skip to watchlist_tickers
      await onboardingApi.skipQuestion('job_title');
      await onboardingApi.skipQuestion('industry');
      await onboardingApi.skipQuestion('experience_years');
      await onboardingApi.skipQuestion('investment_goal');
      await onboardingApi.skipQuestion('risk_tolerance');
      await onboardingApi.skipQuestion('time_availability');
      await onboardingApi.skipQuestion('watchlist_sectors');
      await onboardingApi.skipQuestion('delivery_time');

      await expect(
        onboardingApi.submitAnswer('watchlist_tickers', invalidAnswers.invalid_ticker)
      ).rejects.toThrow();
    });

    it('OB-TC-010: rejects more than 10 tickers', async () => {
      // Skip to watchlist_tickers
      await onboardingApi.skipQuestion('job_title');
      await onboardingApi.skipQuestion('industry');
      await onboardingApi.skipQuestion('experience_years');
      await onboardingApi.skipQuestion('investment_goal');
      await onboardingApi.skipQuestion('risk_tolerance');
      await onboardingApi.skipQuestion('time_availability');
      await onboardingApi.skipQuestion('watchlist_sectors');
      await onboardingApi.skipQuestion('delivery_time');

      await expect(
        onboardingApi.submitAnswer('watchlist_tickers', invalidAnswers.too_many_tickers)
      ).rejects.toThrow();
    });

    it('OB-TC-011: rejects text exceeding max length', async () => {
      await expect(
        onboardingApi.submitAnswer('job_title', invalidAnswers.job_title_too_long)
      ).rejects.toThrow();
    });

    it('accepts dot ticker BRK.B', async () => {
      // Skip to watchlist_tickers
      await onboardingApi.skipQuestion('job_title');
      await onboardingApi.skipQuestion('industry');
      await onboardingApi.skipQuestion('experience_years');
      await onboardingApi.skipQuestion('investment_goal');
      await onboardingApi.skipQuestion('risk_tolerance');
      await onboardingApi.skipQuestion('time_availability');
      await onboardingApi.skipQuestion('watchlist_sectors');
      await onboardingApi.skipQuestion('delivery_time');

      const response = await onboardingApi.submitAnswer('watchlist_tickers', {
        values: ['AAPL', 'BRK.B', 'MSFT'],
      });

      expect(response.success).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    it('OB-TC-007: progress updates correctly after each answer', async () => {
      // Start
      const startResponse = await onboardingApi.start({ locale: 'ko' });
      expect(startResponse.session.progress.answered).toBe(0);

      // Answer consent
      const consentResponse = await onboardingApi.submitAnswer('consent_personalization', {
        value: 'accept',
      });
      expect(consentResponse.progress.answered).toBe(1);

      // Answer job_title
      const jobResponse = await onboardingApi.submitAnswer('job_title', {
        value: 'Engineer',
      });
      expect(jobResponse.progress.answered).toBe(2);

      // Verify percentage
      const expectedPercent = Math.round((2 / jobResponse.progress.total) * 100);
      expect(jobResponse.progress.percentComplete).toBe(expectedPercent);
    });
  });

  describe('Response Schema', () => {
    beforeEach(async () => {
      await onboardingApi.submitAnswer('consent_personalization', { value: 'accept' });
    });

    it('returns expected response structure', async () => {
      const response = await onboardingApi.submitAnswer('job_title', {
        value: 'Software Engineer',
      });

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('answerId');
      expect(response).toHaveProperty('nextQuestion');
      expect(response).toHaveProperty('progress');

      expect(typeof response.success).toBe('boolean');
      expect(typeof response.answerId).toBe('string');
    });
  });
});
