'use client';

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  type: 'question' | 'choices' | 'full';
}

export function LoadingSkeleton({ type }: LoadingSkeletonProps) {
  if (type === 'full') {
    return (
      <div data-testid="loading-skeleton" className="flex flex-col items-center animate-pulse">
        {/* Character placeholder */}
        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 mb-6" />

        {/* Chat bubble placeholder */}
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md mb-8">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
        </div>

        {/* Choices placeholder */}
        <div className="w-full space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'question') {
    return (
      <div className="animate-pulse">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
        </div>
      </div>
    );
  }

  // choices
  return (
    <div className="w-full space-y-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        />
      ))}
    </div>
  );
}

// Pulse animation skeleton box component
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 dark:bg-slate-700 rounded',
        className
      )}
    />
  );
}
