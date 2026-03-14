'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useRef, useEffect } from 'react';
import { BrieflyCharacter, useCharacterEmotion } from './BrieflyCharacter';
import { ChatBubble } from './ChatBubble';
import { ConsentCard } from './ConsentCard';
import { SingleChoiceGrid } from './SingleChoiceGrid';
import { MultiChoiceGrid } from './MultiChoiceGrid';
import { TickerSearch } from './TickerSearch';
import { TimePicker } from './TimePicker';
import { TextInput } from './TextInput';
import { SkipButton } from './SkipButton';
import type { Question, AnswerPayload } from '@/types/onboarding';

interface QuestionRendererProps {
  question: Question;
  direction: 'forward' | 'back';
  isLoading: boolean;
  initialAnswer?: AnswerPayload | null;
  onAnswer: (answer: AnswerPayload) => void;
  onSkip: () => void;
}

export function QuestionRenderer({
  question,
  direction,
  isLoading,
  initialAnswer,
  onAnswer,
  onSkip,
}: QuestionRendererProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine character emotion based on question type
  const getCharacterEmotion = () => {
    if (isLoading) return 'thinking';
    if (question.type === 'consent') return 'waving';
    if (question.type === 'text') return 'thinking';
    return 'neutral';
  };

  // Focus management on question change
  useEffect(() => {
    const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [role="radio"], [role="checkbox"], input, textarea, [tabindex="0"]'
    );
    
    const timer = setTimeout(() => {
      firstFocusable?.focus();
    }, 300); // After exit animation

    return () => clearTimeout(timer);
  }, [question.key]);

  // Animation variants based on direction
  const pageVariants = {
    initial: {
      opacity: 0,
      x: prefersReducedMotion ? 0 : direction === 'forward' ? 50 : -50,
    },
    enter: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
        staggerChildren: 0.07,
      },
    },
    exit: {
      opacity: 0,
      x: prefersReducedMotion ? 0 : direction === 'forward' ? -50 : 50,
      transition: { duration: 0.2 },
    },
  };

  const childVariants = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    enter: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="flex flex-col items-center"
    >
      {/* Character */}
      <motion.div variants={childVariants} className="mb-6">
        <BrieflyCharacter 
          emotion={getCharacterEmotion()} 
          size="md" 
        />
      </motion.div>

      {/* Chat bubble with question */}
      <motion.div variants={childVariants} className="w-full flex justify-center mb-8">
        <ChatBubble
          title={question.title}
          description={question.description}
          typing={isLoading}
        />
      </motion.div>

      {/* Answer area - varies by question type */}
      <motion.div variants={childVariants} className="w-full">
        <AnswerArea
          question={question}
          isLoading={isLoading}
          initialAnswer={initialAnswer}
          onAnswer={onAnswer}
        />
      </motion.div>

      {/* Skip button */}
      {question.isSkippable && (
        <motion.div variants={childVariants} className="mt-6">
          <SkipButton 
            onClick={onSkip} 
            label={question.skipLabel} 
            disabled={isLoading}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

interface AnswerAreaProps {
  question: Question;
  isLoading: boolean;
  initialAnswer?: AnswerPayload | null;
  onAnswer: (answer: AnswerPayload) => void;
}

function AnswerArea({ question, isLoading, initialAnswer, onAnswer }: AnswerAreaProps) {
  switch (question.type) {
    case 'consent':
      return (
        <ConsentCard
          onAccept={() => onAnswer({ value: 'accept' })}
          onDecline={() => onAnswer({ value: 'decline' })}
          isLoading={isLoading}
        />
      );

    case 'single_choice':
      return (
        <SingleChoiceGrid
          options={question.options ?? []}
          selectedValue={initialAnswer?.value}
          onSelect={(value) => onAnswer({ value })}
          disabled={isLoading}
        />
      );

    case 'multi_choice':
    case 'sector_picker':
      return (
        <MultiChoiceGrid
          options={question.options ?? []}
          selectedValues={initialAnswer?.values}
          maxSelections={question.validation?.max as number | undefined}
          onSubmit={(values) => onAnswer({ values })}
          disabled={isLoading}
        />
      );

    case 'ticker_search':
      return (
        <TickerSearch
          selectedTickers={initialAnswer?.values}
          maxTickers={(question.validation?.max as number) ?? 10}
          placeholder={question.placeholder}
          onSubmit={(tickers) => onAnswer({ values: tickers })}
          disabled={isLoading}
        />
      );

    case 'time_picker':
      return (
        <TimePicker
          defaultValue={initialAnswer?.value ?? question.placeholder}
          minTime={question.validation?.min as string | undefined}
          maxTime={question.validation?.max as string | undefined}
          onSubmit={(time) => onAnswer({ value: time })}
          disabled={isLoading}
        />
      );

    case 'text':
      return (
        <TextInput
          placeholder={question.placeholder}
          initialValue={initialAnswer?.value ?? ''}
          validation={{
            minLength: question.validation?.minLength as number | undefined,
            maxLength: question.validation?.maxLength as number | undefined,
            pattern: question.validation?.pattern as string | undefined,
          }}
          helperText={getTextInputHelperText(question.key)}
          onSubmit={(value) => onAnswer({ value })}
          disabled={isLoading}
        />
      );

    case 'number':
      // Number input - similar to text but with type="number"
      return (
        <TextInput
          placeholder={question.placeholder}
          initialValue={initialAnswer?.value ?? ''}
          validation={{
            minLength: 1,
            maxLength: 10,
            pattern: '^[0-9]+$',
          }}
          onSubmit={(value) => onAnswer({ value })}
          disabled={isLoading}
        />
      );

    default:
      return (
        <div className="text-center text-slate-500">
          Unknown question type: {question.type}
        </div>
      );
  }
}

/**
 * Get helper text for text input questions
 * Encourages detailed input for better personalization
 */
function getTextInputHelperText(questionKey: string): string | undefined {
  const helperTexts: Record<string, string> = {
    job_title: '상세할수록 더 맞춤화된 콘텐츠를 제공합니다',
    industry: '상세할수록 더 맞춤화된 콘텐츠를 제공합니다',
  };
  
  return helperTexts[questionKey];
}
