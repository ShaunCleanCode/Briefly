'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TextInputProps {
  placeholder?: string;
  initialValue?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  helperText?: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function TextInput({
  placeholder = '입력해주세요',
  initialValue = '',
  validation,
  helperText,
  onSubmit,
  disabled = false,
}: TextInputProps) {
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const minLength = validation?.minLength ?? 2;
  const maxLength = validation?.maxLength ?? 100;

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Validate input
  const validate = useCallback((text: string): string | null => {
    if (text.length > 0 && text.length < minLength) {
      return `최소 ${minLength}자 이상 입력해주세요`;
    }
    if (text.length > maxLength) {
      return `최대 ${maxLength}자까지 입력 가능합니다`;
    }
    if (validation?.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(text)) {
        return '올바른 형식으로 입력해주세요';
      }
    }
    return null;
  }, [minLength, maxLength, validation?.pattern]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Clear error on change
    if (error) {
      setError(null);
    }
  }, [error]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    const validationError = validate(trimmed);
    
    if (validationError) {
      setError(validationError);
      // Shake animation will be triggered by error state
      return;
    }
    
    onSubmit(trimmed);
  }, [value, validate, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const isValid = value.trim().length >= minLength && !error;
  const charCount = value.length;

  // Shake animation for errors
  const shakeVariants = {
    shake: {
      x: prefersReducedMotion ? 0 : [0, -8, 8, -8, 8, 0],
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Encouragement text */}
      {helperText && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-center text-slate-500 dark:text-slate-400"
        >
          {helperText}
        </motion.p>
      )}

      {/* Input card */}
      <motion.div
        variants={shakeVariants}
        animate={error ? 'shake' : undefined}
        className={cn(
          'relative bg-white dark:bg-slate-800 rounded-2xl',
          'border-2 transition-all duration-200',
          'shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50',
          isFocused 
            ? 'border-indigo-500 ring-4 ring-indigo-500/10' 
            : error
              ? 'border-red-400 dark:border-red-500'
              : 'border-slate-200 dark:border-slate-700',
          disabled && 'opacity-50'
        )}
      >
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          data-testid="text-input"
          className={cn(
            'w-full px-5 py-4 rounded-2xl resize-none',
            'bg-transparent text-slate-900 dark:text-white',
            'text-lg placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus:outline-none',
            'disabled:cursor-not-allowed'
          )}
          aria-invalid={!!error}
          aria-describedby={error ? 'input-error' : undefined}
        />

        {/* Character count */}
        <div 
          className={cn(
            "absolute bottom-3 right-4 text-xs transition-colors",
            charCount > maxLength 
              ? "text-red-500 dark:text-red-400 font-medium" 
              : "text-slate-400 dark:text-slate-500"
          )}
          data-testid="char-count"
        >
          {charCount} / {maxLength}
        </div>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            id="input-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            data-testid="text-input-error"
            className="text-sm text-center text-red-500 dark:text-red-400"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={disabled || (!isValid && value.trim().length > 0)}
          data-testid="continue-btn"
          className={cn(
            'px-8 py-3 rounded-xl text-base font-medium',
            'bg-indigo-600 hover:bg-indigo-700 text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
        >
          계속하기
        </Button>
      </div>
    </div>
  );
}
