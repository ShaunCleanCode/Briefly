import { describe, it, expect, beforeEach } from 'vitest';
import { resetMockState } from '../mocks/handlers';
import { onboardingApi } from '@/lib/api/onboarding';

describe('Contract: GET /api/onboarding/profile', () => {
  beforeEach(() => {
    resetMockState();
  });

  describe('After Completion', () => {
    beforeEach(async () => {
      // Complete onboarding
      await onboardingApi.submitAnswer('consent_personalization', { value: 'accept' });
      await onboardingApi.complete({ finalConfirmation: true });
    });

    it('returns profile with expected schema', async () => {
      const response = await onboardingApi.getProfile();

      expect(response).toHaveProperty('profile');
      expect(response).toHaveProperty('canEdit');
      expect(response).toHaveProperty('editableFields');
    });

    it('profile contains derived fields', async () => {
      const response = await onboardingApi.getProfile();

      expect(response.profile).toHaveProperty('knowledgeLevel');
      expect(response.profile).toHaveProperty('investorSegment');
    });

    it('canEdit is true for completed onboarding', async () => {
      const response = await onboardingApi.getProfile();

      expect(response.canEdit).toBe(true);
    });

    it('editableFields is an array of strings', async () => {
      const response = await onboardingApi.getProfile();

      expect(Array.isArray(response.editableFields)).toBe(true);
      expect(response.editableFields.length).toBeGreaterThan(0);
      expect(response.editableFields.every((f) => typeof f === 'string')).toBe(true);
    });
  });

  describe('Before Completion', () => {
    it('returns 404 when onboarding not completed', async () => {
      await expect(onboardingApi.getProfile()).rejects.toThrow();
    });
  });
});
