'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Shield, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ConsentCardProps {
  onAccept: () => void;
  onDecline: () => void;
  learnMoreUrl?: string;
  isLoading?: boolean;
}

export function ConsentCard({
  onAccept,
  onDecline,
  learnMoreUrl = '/privacy',
  isLoading = false,
}: ConsentCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const cardVariants = {
    initial: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className="w-full max-w-md mx-auto"
    >
      {/* Privacy badge */}
      <div className="flex items-center justify-center gap-2 mb-6 text-slate-500 dark:text-slate-400">
        <Shield className="w-4 h-4" />
        <span className="text-sm font-medium">개인정보 보호</span>
      </div>

      {/* Consent card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700">
        {/* Info text */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          수집된 정보는 맞춤 콘텐츠 제공에만 사용되며,{' '}
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            개인정보처리방침
            <ExternalLink className="w-3 h-3" />
          </a>
          에 따라 안전하게 관리됩니다.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onAccept}
            disabled={isLoading}
            data-testid="consent-accept-btn"
            className={cn(
              'w-full py-6 text-base font-semibold rounded-xl',
              'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700',
              'text-white shadow-lg shadow-indigo-500/25',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? '처리 중...' : '동의합니다'}
          </Button>

          <Button
            variant="ghost"
            onClick={onDecline}
            disabled={isLoading}
            data-testid="consent-decline-btn"
            className={cn(
              'w-full py-4 text-sm font-medium rounded-xl',
              'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
              'hover:bg-slate-100 dark:hover:bg-slate-700/50',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            동의하지 않습니다
          </Button>
        </div>
      </div>

      {/* Additional note */}
      <p className="mt-4 text-xs text-center text-slate-400 dark:text-slate-500">
        동의하지 않으시면 기본 서비스만 이용 가능합니다.
      </p>
    </motion.div>
  );
}
