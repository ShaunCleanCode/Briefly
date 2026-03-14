'use client';

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export type CharacterEmotion = 
  | 'neutral' 
  | 'thinking' 
  | 'happy' 
  | 'celebrating' 
  | 'concerned' 
  | 'waving';

interface BrieflyCharacterProps {
  emotion: CharacterEmotion;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Emotion-based character configurations
const emotionConfig: Record<CharacterEmotion, { emoji: string; bg: string; scale: number }> = {
  neutral: { emoji: '🤖', bg: 'bg-indigo-100 dark:bg-indigo-900/50', scale: 1 },
  thinking: { emoji: '🤔', bg: 'bg-amber-100 dark:bg-amber-900/50', scale: 1 },
  happy: { emoji: '😊', bg: 'bg-green-100 dark:bg-green-900/50', scale: 1.05 },
  celebrating: { emoji: '🎉', bg: 'bg-pink-100 dark:bg-pink-900/50', scale: 1.1 },
  concerned: { emoji: '😟', bg: 'bg-orange-100 dark:bg-orange-900/50', scale: 0.95 },
  waving: { emoji: '👋', bg: 'bg-blue-100 dark:bg-blue-900/50', scale: 1.05 },
};

const sizeConfig = {
  sm: { container: 'w-16 h-16', emoji: 'text-3xl' },
  md: { container: 'w-24 h-24', emoji: 'text-5xl' },
  lg: { container: 'w-32 h-32', emoji: 'text-6xl' },
};

export function BrieflyCharacter({ 
  emotion, 
  size = 'md', 
  className 
}: BrieflyCharacterProps) {
  const prefersReducedMotion = useReducedMotion();
  const config = emotionConfig[emotion];
  const sizeStyles = sizeConfig[size];

  // Idle animation variants
  const idleVariants = {
    animate: {
      y: prefersReducedMotion ? 0 : [0, -4, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  // Character appearance animation
  const characterVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: config.scale, 
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <motion.div 
      className={cn(
        'flex items-center justify-center rounded-full',
        sizeStyles.container,
        config.bg,
        'shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50',
        className
      )}
      variants={characterVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div
        variants={idleVariants}
        animate="animate"
        className={cn('select-none', sizeStyles.emoji)}
        role="img"
        aria-label={`Briefly character: ${emotion}`}
      >
        {config.emoji}
      </motion.div>
    </motion.div>
  );
}

// Export a hook for determining character emotion based on state
export function useCharacterEmotion({
  isLoading,
  hasError,
  isComplete,
}: {
  isLoading: boolean;
  hasError: boolean;
  isComplete: boolean;
}): CharacterEmotion {
  if (hasError) return 'concerned';
  if (isComplete) return 'celebrating';
  if (isLoading) return 'thinking';
  return 'neutral';
}
