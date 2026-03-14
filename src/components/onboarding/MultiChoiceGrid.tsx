'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface MultiChoiceGridProps {
  options: Option[];
  selectedValues?: string[];
  maxSelections?: number;
  onSubmit: (values: string[]) => void;
  disabled?: boolean;
}

export function MultiChoiceGrid({
  options,
  selectedValues: externalSelected,
  maxSelections,
  onSubmit,
  disabled = false,
}: MultiChoiceGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedValues, setSelectedValues] = useState<string[]>(externalSelected ?? []);

  // Sync with external selected values (for prefill on back navigation)
  useEffect(() => {
    setSelectedValues(externalSelected ?? []);
  }, [externalSelected]);

  const handleToggle = useCallback((value: string) => {
    if (disabled) return;
    
    setSelectedValues((prev) => {
      const isSelected = prev.includes(value);
      
      if (isSelected) {
        return prev.filter((v) => v !== value);
      }
      
      // Check max selections
      if (maxSelections && prev.length >= maxSelections) {
        return prev;
      }
      
      return [...prev, value];
    });
  }, [disabled, maxSelections]);

  const handleSubmit = useCallback(() => {
    if (selectedValues.length > 0) {
      onSubmit(selectedValues);
    }
  }, [selectedValues, onSubmit]);

  const choiceVariants = {
    idle: {
      scale: 1,
    },
    hover: {
      scale: prefersReducedMotion ? 1 : 1.02,
    },
    tap: {
      scale: prefersReducedMotion ? 1 : 0.98,
    },
  };

  const checkmarkVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 500, damping: 25 },
    },
  };

  const isAtMax = maxSelections !== undefined && selectedValues.length >= maxSelections;

  return (
    <div className="w-full space-y-6">
      {/* Grid of options */}
      <div
        role="group"
        aria-label="여러 개를 선택할 수 있습니다"
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          const isDisabledByMax = isAtMax && !isSelected;

          return (
            <motion.button
              key={option.value}
              role="checkbox"
              aria-checked={isSelected}
              data-testid={`choice-option-${option.value}`}
              onClick={() => handleToggle(option.value)}
              disabled={disabled || isDisabledByMax}
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-center',
                'bg-white dark:bg-slate-800 border-2 transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                'min-h-[80px]',
                isSelected 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
                (disabled || isDisabledByMax) && 'opacity-50 cursor-not-allowed'
              )}
              variants={choiceVariants}
              initial="idle"
              whileHover={disabled || isDisabledByMax ? undefined : 'hover'}
              whileTap={disabled || isDisabledByMax ? undefined : 'tap'}
            >
              {/* Checkmark badge */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    variants={checkmarkVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon */}
              {option.icon && (
                <span className="text-2xl" aria-hidden="true">
                  {option.icon}
                </span>
              )}

              {/* Label */}
              <span className={cn(
                'text-sm font-medium text-slate-900 dark:text-white',
                isSelected && 'text-indigo-900 dark:text-indigo-100'
              )}>
                {option.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selection count and submit */}
      <div className="flex items-center justify-between">
        <span data-testid="selection-count" className="text-sm text-slate-500 dark:text-slate-400">
          {selectedValues.length}
          {maxSelections && ` / ${maxSelections}`}
          {' 선택됨'}
        </span>

        <Button
          onClick={handleSubmit}
          disabled={disabled || selectedValues.length === 0}
          data-testid="continue-btn"
          className={cn(
            'px-6 rounded-xl transition-all',
            'bg-indigo-600 hover:bg-indigo-700 text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          계속하기
        </Button>
      </div>
    </div>
  );
}
