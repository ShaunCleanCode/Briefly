/**
 * Test user fixtures for onboarding tests
 * 
 * Note: These are mock users for testing purposes.
 * No real PII is stored.
 */

export interface TestUser {
  id: string;
  email: string;
  hasCompletedOnboarding: boolean;
  currentQuestionKey?: string;
  completedAt?: string;
}

export const testUsers: Record<string, TestUser> = {
  /**
   * Fresh user who has never started onboarding
   */
  newUser: {
    id: 'user-new-001',
    email: 'testuser-new@example.test',
    hasCompletedOnboarding: false,
  },

  /**
   * User who started but hasn't completed
   * Currently at experience_years question
   */
  resumingUser: {
    id: 'user-resume-001',
    email: 'testuser-resume@example.test',
    hasCompletedOnboarding: false,
    currentQuestionKey: 'experience_years',
  },

  /**
   * User who already completed onboarding
   */
  completedUser: {
    id: 'user-done-001',
    email: 'testuser-done@example.test',
    hasCompletedOnboarding: true,
    completedAt: '2026-01-20T10:00:00Z',
  },

  /**
   * User who declined consent
   */
  declinedUser: {
    id: 'user-declined-001',
    email: 'testuser-declined@example.test',
    hasCompletedOnboarding: false,
    currentQuestionKey: 'consent_personalization',
  },
};

/**
 * Create a unique test user ID
 */
export function createTestUserId(): string {
  return `test-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate a test email from user ID
 */
export function createTestEmail(userId: string): string {
  return `${userId}@example.test`;
}
