'use client';

import { motion } from 'motion/react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

const typeConfig = {
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500 dark:text-red-400',
    text: 'text-red-800 dark:text-red-200',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500 dark:text-amber-400',
    text: 'text-amber-800 dark:text-amber-200',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500 dark:text-blue-400',
    text: 'text-blue-800 dark:text-blue-200',
  },
};

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  type = 'error',
}: ErrorBannerProps) {
  const config = typeConfig[type];

  const bannerVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const shakeVariants = {
    shake: {
      x: [0, -8, 8, -8, 8, 0],
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      variants={bannerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      data-testid="error-banner"
      className={cn(
        'w-full px-4 py-3 rounded-xl border',
        config.bg,
        config.border,
        'mb-4'
      )}
    >
      <motion.div
        variants={shakeVariants}
        animate={type === 'error' ? 'shake' : undefined}
        className="flex items-start gap-3"
      >
        <AlertCircle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.icon)} />
        
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', config.text)}>
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className={cn('h-8 px-2', config.text, 'hover:bg-white/50 dark:hover:bg-black/20')}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              재시도
            </Button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                'p-1 rounded-full transition-colors',
                'hover:bg-white/50 dark:hover:bg-black/20',
                config.icon
              )}
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
