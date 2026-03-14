'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onboardingApi } from '@/lib/api/onboarding';
import type { AnswerPayload } from '@/types/onboarding';

// Query keys
export const onboardingKeys = {
  all: ['onboarding'] as const,
  session: () => [...onboardingKeys.all, 'session'] as const,
  profile: () => [...onboardingKeys.all, 'profile'] as const,
  consent: () => [...onboardingKeys.all, 'consent'] as const,
};

/**
 * Hook to get current onboarding session
 */
export function useOnboardingSession() {
  return useQuery({
    queryKey: onboardingKeys.session(),
    queryFn: () => onboardingApi.getSession(),
    staleTime: Infinity,
    retry: 3,
  });
}

/**
 * Hook to get user's onboarding profile
 */
export function useOnboardingProfile() {
  return useQuery({
    queryKey: onboardingKeys.profile(),
    queryFn: () => onboardingApi.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to start onboarding session
 */
export function useStartOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { locale?: string; metadata?: Record<string, string> }) =>
      onboardingApi.start(params),
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.session(), data);
    },
  });
}

/**
 * Hook to submit an answer
 */
export function useSubmitAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionKey, answer }: { questionKey: string; answer: AnswerPayload }) =>
      onboardingApi.submitAnswer(questionKey, answer),
    
    // Optimistic update
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: onboardingKeys.session() });
      
      // Snapshot previous value
      const previousSession = queryClient.getQueryData(onboardingKeys.session());
      
      return { previousSession };
    },
    
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousSession) {
        queryClient.setQueryData(onboardingKeys.session(), context.previousSession);
      }
    },
    
    onSuccess: (data) => {
      // Update cache with new data
      queryClient.setQueryData(onboardingKeys.session(), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const oldData = old as Record<string, unknown>;
        const oldSession = (oldData.session && typeof oldData.session === 'object') 
          ? oldData.session as Record<string, unknown>
          : {};
        return {
          ...oldData,
          nextQuestion: data.nextQuestion,
          session: {
            ...oldSession,
            progress: data.progress,
          },
        };
      });
    },
  });
}

/**
 * Hook to skip a question
 */
export function useSkipQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionKey: string) => onboardingApi.skipQuestion(questionKey),
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.session(), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const oldData = old as Record<string, unknown>;
        const oldSession = (oldData.session && typeof oldData.session === 'object') 
          ? oldData.session as Record<string, unknown>
          : {};
        return {
          ...oldData,
          nextQuestion: data.nextQuestion,
          session: {
            ...oldSession,
            progress: data.progress,
          },
        };
      });
    },
  });
}

/**
 * Hook to edit a previous answer
 */
export function useEditAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionKey, answer }: { questionKey: string; answer: AnswerPayload | null }) =>
      onboardingApi.editAnswer(questionKey, answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.session() });
    },
  });
}

/**
 * Hook to complete onboarding
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => onboardingApi.complete({ finalConfirmation: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
  });
}

/**
 * Hook to record consent
 */
export function useRecordConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { consentType: string; granted: boolean }) =>
      onboardingApi.recordConsent(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.consent() });
    },
  });
}

/**
 * Hook to save portfolio snapshot
 */
export function useSavePortfolioSnapshot() {
  return useMutation({
    mutationFn: (params: { tickers: Array<{ symbol: string; weightPct: number }> }) =>
      onboardingApi.savePortfolioSnapshot(params),
  });
}
