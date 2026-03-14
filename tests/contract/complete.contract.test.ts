import { describe, it, expect, beforeEach } from 'vitest';
import { resetMockState } from '../mocks/handlers';
import { onboardingApi } from '@/lib/api/onboarding';
import { completeAnswerSet } from '../fixtures/answers';

describe('Contract: POST /api/onboarding/complete', () => {
  beforeEach(() => {
    resetMockState();
  });

  describe('Successful Completion', () => {
    beforeEach(async () => {
      // Answer all required questions
      await onboardingApi.submitAnswer('consent_personalization', { value: 'accept' });
    });

    it('OB-TC-005: returns computed profile', async () => {
      const response = await onboardingApi.complete({ finalConfirmation: true });

      expect(response.success).toBe(true);
      expect(response).toHaveProperty('profile');
      expect(response).toHaveProperty('message');
    });

    it('profile contains expected derived fields', async () => {
      const response = await onboardingApi.complete({ finalConfirmation: true });

      expect(response.profile).toHaveProperty('knowledgeLevel');
      expect(response.profile).toHaveProperty('investorSegment');
      
      // Verify valid enum values
      expect(['beginner', 'intermediate', 'advanced']).toContain(
        response.profile.knowledgeLevel
      );
      expect(['long_term', 'trader', 'macro', 'sector_specialist', 'learner']).toContain(
        response.profile.investorSegment
      );
    });

    it('profile contains delivery schedule', async () => {
      const response = await onboardingApi.complete({ finalConfirmation: true });

      expect(response.profile.deliverySchedule).toBeDefined();
      expect(response.profile.deliverySchedule).toHaveProperty('timezone');
      expect(response.profile.deliverySchedule).toHaveProperty('time');
      expect(response.profile.deliverySchedule).toHaveProperty('nextDelivery');
    });

    it('profile contains personalization inputs', async () => {
      const response = await onboardingApi.complete({ finalConfirmation: true });

      expect(response.profile.personalizationInputs).toBeDefined();
      expect(response.profile.personalizationInputs).toHaveProperty('watchlistTickers');
      expect(response.profile.personalizationInputs).toHaveProperty('watchlistSectors');
      expect(response.profile.personalizationInputs).toHaveProperty('depthPreference');
    });

    it('returns completion timestamp', async () => {
      const response = await onboardingApi.complete({ finalConfirmation: true });

      expect(response.profile.onboardingCompletedAt).toBeDefined();
      // Verify it's a valid ISO date
      expect(new Date(response.profile.onboardingCompletedAt!).toISOString()).toBe(
        response.profile.onboardingCompletedAt
      );
    });
  });

  describe('Completion Requirements', () => {
    it('fails without consent', async () => {
      await expect(
        onboardingApi.complete({ finalConfirmation: true })
      ).rejects.toThrow();
    });
  });

  describe('Already Completed', () => {
    it('OB-TC-015: start returns 409 after completion', async () => {
      // Complete first
      await onboardingApi.submitAnswer('consent_personalization', { value: 'accept' });
      await onboardingApi.complete({ finalConfirmation: true });

      // Try to start again
      await expect(onboardingApi.start({ locale: 'ko' })).rejects.toThrow();
    });
  });
});
