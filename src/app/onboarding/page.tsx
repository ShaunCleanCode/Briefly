'use client';

import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { QuestionRenderer } from '@/components/onboarding/QuestionRenderer';
import { LoadingSkeleton } from '@/components/onboarding/LoadingSkeleton';
import { ErrorBanner } from '@/components/onboarding/ErrorBanner';
import { useQuestionEngine } from '@/hooks/useQuestionEngine';

export default function OnboardingPage() {
  const {
    currentQuestion,
    progress,
    currentAnswer,
    isLoading,
    isInitializing,
    error,
    direction,
    canGoBack,
    handleAnswer,
    handleSkip,
    handleBack,
    handleExit,
    startSession,
    clearError,
  } = useQuestionEngine();

  // Initialize session on mount
  useEffect(() => {
    startSession();
  }, [startSession]);

  // Show loading skeleton during initial load
  if (isInitializing) {
    return (
      <OnboardingShell
        progress={{ answered: 0, total: 1, percentComplete: 0 }}
        onBack={() => {}}
        onExit={handleExit}
        canGoBack={false}
      >
        <LoadingSkeleton type="full" />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      progress={progress ?? { answered: 0, total: 1, percentComplete: 0 }}
      onBack={handleBack}
      onExit={handleExit}
      canGoBack={canGoBack}
    >
      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <ErrorBanner
            message={error}
            onDismiss={clearError}
            onRetry={() => {
              clearError();
              startSession();
            }}
          />
        )}
      </AnimatePresence>

      {/* Question content */}
      <AnimatePresence mode="wait" initial={false}>
        {currentQuestion && (
          <QuestionRenderer
            key={currentQuestion.key}
            question={currentQuestion}
            direction={direction}
            isLoading={isLoading}
            initialAnswer={currentAnswer}
            onAnswer={handleAnswer}
            onSkip={handleSkip}
          />
        )}
      </AnimatePresence>
    </OnboardingShell>
  );
}
