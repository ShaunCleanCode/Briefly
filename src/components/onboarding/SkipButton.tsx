'use client';

import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkipButtonProps {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'text' | 'outline';
}

export function SkipButton({
  label = '건너뛰기',
  onClick,
  disabled = false,
  variant = 'text',
}: SkipButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      data-testid="skip-btn"
      className={cn(
        'inline-flex items-center gap-1 px-4 py-2 rounded-lg',
        'text-sm font-medium transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        variant === 'text' && [
          'text-slate-500 dark:text-slate-400',
          'hover:text-slate-700 dark:hover:text-slate-300',
          'hover:bg-slate-100 dark:hover:bg-slate-800',
        ],
        variant === 'outline' && [
          'border border-slate-300 dark:border-slate-600',
          'text-slate-600 dark:text-slate-300',
          'hover:bg-slate-50 dark:hover:bg-slate-800',
        ],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      whileHover={disabled ? undefined : { x: 2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
    >
      <span>{label}</span>
      <ChevronRight className="w-4 h-4" />
    </motion.button>
  );
}
