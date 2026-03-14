'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

interface SingleChoiceGridProps {
  options: Option[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  layout?: 'stack' | 'grid';
}

export function SingleChoiceGrid({
  options,
  selectedValue: externalSelected,
  onSelect,
  disabled = false,
  layout = 'stack',
}: SingleChoiceGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedValue, setSelectedValue] = useState<string | undefined>(externalSelected);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Sync with external selected value (for prefill on back navigation)
  useEffect(() => {
    setSelectedValue(externalSelected);
    setHasSubmitted(false); // Reset submission state when coming back
  }, [externalSelected]);

  // Auto-advance after selection with brief delay
  const handleSelect = useCallback((value: string) => {
    if (disabled || hasSubmitted) return;
    
    setSelectedValue(value);
    setHasSubmitted(true);
    
    // Delay before advancing to show selection feedback
    setTimeout(() => {
      onSelect(value);
    }, 400);
  }, [disabled, hasSubmitted, onSelect]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || hasSubmitted) return;
      
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleSelect(options[focusedIndex].value);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, hasSubmitted, focusedIndex, options, handleSelect]);

  const choiceVariants = {
    idle: {
      scale: 1,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    },
    hover: {
      scale: prefersReducedMotion ? 1 : 1.02,
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    },
    tap: {
      scale: prefersReducedMotion ? 1 : 0.98,
    },
    selected: {
      scale: 1,
      boxShadow: '0 0 0 2px rgb(99 102 241)',
    },
  };

  const checkmarkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { type: 'spring' as const, stiffness: 400, damping: 25 },
        opacity: { duration: 0.1 },
      },
    },
  };

  const gridClassName = layout === 'grid' 
    ? 'grid grid-cols-2 gap-3'
    : 'flex flex-col gap-3';

  return (
    <div
      role="radiogroup"
      aria-label="답변을 선택하세요"
      className={cn('w-full', gridClassName)}
    >
      {options.map((option, index) => {
        const isSelected = selectedValue === option.value;
        const isFocused = focusedIndex === index;

        return (
          <motion.button
            key={option.value}
            role="radio"
            aria-checked={isSelected}
            aria-describedby={option.description ? `desc-${option.value}` : undefined}
            data-testid={`choice-option-${option.value}`}
            onClick={() => handleSelect(option.value)}
            disabled={disabled || hasSubmitted}
            className={cn(
              'relative flex items-center gap-3 p-4 rounded-xl text-left',
              'bg-white dark:bg-slate-800 border-2 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
              isSelected 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
              isFocused && !isSelected && 'border-indigo-300 dark:border-indigo-700',
              (disabled || hasSubmitted) && 'cursor-not-allowed',
              (disabled || hasSubmitted) && !isSelected && 'opacity-50'
            )}
            variants={choiceVariants}
            initial="idle"
            whileHover={(disabled || hasSubmitted) ? undefined : 'hover'}
            whileTap={(disabled || hasSubmitted) ? undefined : 'tap'}
            animate={isSelected ? 'selected' : 'idle'}
            onFocus={() => setFocusedIndex(index)}
          >
            {/* Icon (if provided) */}
            {option.icon && (
              <span className="text-2xl" aria-hidden="true">
                {option.icon}
              </span>
            )}

            {/* Label and description */}
            <div className="flex-1 min-w-0">
              <span className={cn(
                'block font-medium text-slate-900 dark:text-white',
                isSelected && 'text-indigo-900 dark:text-indigo-100'
              )}>
                {option.label}
              </span>
              {option.description && (
                <span 
                  id={`desc-${option.value}`}
                  className="block mt-0.5 text-sm text-slate-500 dark:text-slate-400"
                >
                  {option.description}
                </span>
              )}
            </div>

            {/* Checkmark */}
            <div className={cn(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
              isSelected 
                ? 'border-indigo-500 bg-indigo-500' 
                : 'border-slate-300 dark:border-slate-600'
            )}>
              <AnimatePresence>
                {isSelected && (
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-white"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    aria-hidden="true"
                  >
                    <motion.path
                      d="M5 12l5 5L20 7"
                      variants={checkmarkVariants}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
