'use client';

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  title: string;
  description?: string | null;
  typing?: boolean;
  className?: string;
}

export function ChatBubble({ 
  title, 
  description, 
  typing = false,
  className 
}: ChatBubbleProps) {
  const prefersReducedMotion = useReducedMotion();

  const bubbleVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
      scale: prefersReducedMotion ? 1 : 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -10,
      scale: prefersReducedMotion ? 1 : 0.98,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'relative bg-white dark:bg-slate-800 rounded-2xl rounded-tl-md',
        'px-5 py-4 shadow-md shadow-slate-200/50 dark:shadow-slate-900/50',
        'border border-slate-100 dark:border-slate-700',
        'max-w-[90%] md:max-w-[600px]',
        className
      )}
    >
      {/* Bubble tail */}
      <div className="absolute -top-2 left-4 w-4 h-4 bg-white dark:bg-slate-800 border-l border-t border-slate-100 dark:border-slate-700 transform rotate-45" />
      
      {typing ? (
        <TypingIndicator />
      ) : (
        <>
          <h2 data-testid="question-title" className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white leading-relaxed">
            {title}
          </h2>
          {description && (
            <p data-testid="question-description" className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {description}
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  const dotVariants = {
    animate: (i: number) => ({
      y: [0, -6, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: 'loop' as const,
        delay: i * 0.15,
      },
    }),
  };

  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          custom={i}
          variants={dotVariants}
          animate="animate"
          className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"
        />
      ))}
    </div>
  );
}
