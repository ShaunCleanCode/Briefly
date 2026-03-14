'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { onboardingApi } from '@/lib/api/onboarding';
import type {
  Question,
  Progress,
  Session,
  AnswerPayload,
} from '@/types/onboarding';

interface AnswerRecord {
  questionKey: string;
  question: Question;
  answer: AnswerPayload | null;
  skipped: boolean;
}

interface UseQuestionEngineReturn {
  session: Session | null;
  currentQuestion: Question | null;
  progress: Progress | null;
  currentAnswer: AnswerPayload | null;
  isLoading: boolean;
  isInitializing: boolean;
  isSubmitting: boolean;
  error: string | null;
  direction: 'forward' | 'back';
  canGoBack: boolean;
  handleAnswer: (answer: AnswerPayload) => Promise<void>;
  handleSkip: () => Promise<void>;
  handleBack: () => void;
  handleExit: () => void;
  startSession: () => Promise<void>;
  clearError: () => void;
}

/**
 * Check if two answer payloads are equal
 */
function areAnswersEqual(a: AnswerPayload | null, b: AnswerPayload | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  
  if (a.value !== b.value) return false;
  
  const aValues = a.values ?? [];
  const bValues = b.values ?? [];
  
  if (aValues.length !== bValues.length) return false;
  
  // Sort and compare for multi-select
  const sortedA = [...aValues].sort();
  const sortedB = [...bValues].sort();
  
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

export function useQuestionEngine(): UseQuestionEngineReturn {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [answerStack, setAnswerStack] = useState<AnswerRecord[]>([]);
  
  // Current answer for prefill (when navigating back)
  const [currentAnswer, setCurrentAnswer] = useState<AnswerPayload | null>(null);
  
  // Track original answer when editing (for change detection)
  const originalAnswerRef = useRef<AnswerPayload | null>(null);
  
  // UI state
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  // Derived state
  const isLoading = isSubmitting;
  const canGoBack = answerStack.length > 0;

  // Start or resume session
  const startSession = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const locale = typeof navigator !== 'undefined' && navigator.language.startsWith('ko') 
        ? 'ko' 
        : 'en';

      const response = await onboardingApi.start({
        locale,
        metadata: {
          device: typeof window !== 'undefined' ? 
            (/Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop') : 
            'unknown',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        },
      });

      setSession(response.session);
      setCurrentQuestion(response.nextQuestion);
      setProgress(response.session.progress);
      setCurrentAnswer(null);
      originalAnswerRef.current = null;

      // If session was resumed, show toast
      if (response.session.progress.answered > 0) {
        toast.success('이전에 하던 곳에서 계속합니다');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '세션을 시작할 수 없습니다';
      
      // Check if already completed
      if (message.includes('ONBOARDING_ALREADY_COMPLETED')) {
        router.replace('/dashboard');
        return;
      }
      
      setError(message);
      toast.error(message);
    } finally {
      setIsInitializing(false);
    }
  }, [router]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    try {
      await onboardingApi.complete({ finalConfirmation: true });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Navigate to done page
      router.push('/onboarding/done');
    } catch (err) {
      const message = err instanceof Error ? err.message : '온보딩을 완료할 수 없습니다';
      setError(message);
      toast.error(message);
    }
  }, [queryClient, router]);

  // Submit answer
  const handleAnswer = useCallback(async (answer: AnswerPayload) => {
    if (!currentQuestion || isSubmitting) return;

    // Handle consent decline - must still persist decision via /answer (Option A contract)
    if (currentQuestion.type === 'consent' && answer.value === 'decline') {
      setIsSubmitting(true);
      setError(null);
      setDirection('forward');

      try {
        await onboardingApi.submitAnswer(currentQuestion.key, answer);
        router.push('/onboarding/declined');
      } catch (err) {
        const message = err instanceof Error ? err.message : '동의 상태를 저장할 수 없습니다';
        setError(message);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setDirection('forward');

    try {
      // Check if we're editing a previous answer
      const isEditing = originalAnswerRef.current !== null;
      const hasChanged = !areAnswersEqual(originalAnswerRef.current, answer);

      let response;

      if (isEditing && !hasChanged) {
        // Answer unchanged - no API call needed, just fetch next question
        response = await onboardingApi.getNextQuestion();
        
        // Update state with response
        setProgress(response.progress);
        
        if (response.isComplete || !response.question) {
          await completeOnboarding();
        } else {
          setCurrentQuestion(response.question);
          setCurrentAnswer(null);
          originalAnswerRef.current = null;
        }
      } else if (isEditing && hasChanged) {
        // Answer changed - PATCH the answer
        response = await onboardingApi.editAnswer(currentQuestion.key, answer);
        
        // Track in answer stack for back navigation
        setAnswerStack((prev) => [
          ...prev,
          { questionKey: currentQuestion.key, question: currentQuestion, answer, skipped: false },
        ]);

        // Update state with response
        setProgress(response.progress);

        if (!response.nextQuestion) {
          await completeOnboarding();
        } else {
          setCurrentQuestion(response.nextQuestion);
          setCurrentAnswer(null);
          originalAnswerRef.current = null;
        }
      } else {
        // New answer - POST
        response = await onboardingApi.submitAnswer(currentQuestion.key, answer);

        // Track in answer stack for back navigation
        setAnswerStack((prev) => [
          ...prev,
          { questionKey: currentQuestion.key, question: currentQuestion, answer, skipped: false },
        ]);

        // Update state with response
        setProgress(response.progress);

        // Check if we should complete onboarding
        if (!response.nextQuestion) {
          await completeOnboarding();
        } else {
          setCurrentQuestion(response.nextQuestion);
          setCurrentAnswer(null);
          originalAnswerRef.current = null;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '답변을 저장할 수 없습니다';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentQuestion, isSubmitting, router, completeOnboarding]);

  // Skip question
  const handleSkip = useCallback(async () => {
    if (!currentQuestion || !currentQuestion.isSkippable || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setDirection('forward');

    try {
      const response = await onboardingApi.skipQuestion(currentQuestion.key);

      // Track in answer stack
      setAnswerStack((prev) => [
        ...prev,
        { questionKey: currentQuestion.key, question: currentQuestion, answer: null, skipped: true },
      ]);

      // Update state
      setProgress(response.progress);
      setCurrentAnswer(null);
      originalAnswerRef.current = null;

      if (!response.nextQuestion) {
        await completeOnboarding();
      } else {
        setCurrentQuestion(response.nextQuestion);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '질문을 건너뛸 수 없습니다';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentQuestion, isSubmitting, completeOnboarding]);

  // Go back to previous question - pure client-side, no API call
  const handleBack = useCallback(() => {
    if (!canGoBack || isSubmitting) return;

    setDirection('back');

    // Pop the last answer from stack
    const previousRecord = answerStack[answerStack.length - 1];
    setAnswerStack((prev) => prev.slice(0, -1));

    // Show the previous question with prefilled answer
    setCurrentQuestion(previousRecord.question);
    setCurrentAnswer(previousRecord.skipped ? null : previousRecord.answer);
    originalAnswerRef.current = previousRecord.skipped ? null : previousRecord.answer;

    // Decrement progress (optimistic)
    if (progress) {
      setProgress({
        ...progress,
        answered: Math.max(0, progress.answered - 1),
        percentComplete: Math.max(0, Math.round(((progress.answered - 1) / progress.total) * 100)),
      });
    }
  }, [canGoBack, isSubmitting, answerStack, progress]);

  // Exit onboarding (save and leave)
  const handleExit = useCallback(() => {
    // Session is automatically saved, just navigate away
    router.push('/dashboard');
  }, [router]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    session,
    currentQuestion,
    progress,
    currentAnswer,
    isLoading,
    isInitializing,
    isSubmitting,
    error,
    direction,
    canGoBack,
    handleAnswer,
    handleSkip,
    handleBack,
    handleExit,
    startSession,
    clearError,
  };
}
