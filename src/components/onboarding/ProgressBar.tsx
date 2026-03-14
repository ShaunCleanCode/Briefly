'use client';

import { motion, useReducedMotion } from 'motion/react';

interface ProgressBarProps {
  percentComplete: number;
  animated?: boolean;
}

export function ProgressBar({ percentComplete, animated = true }: ProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div 
      data-testid="progress-bar"
      role="progressbar"
      aria-valuenow={percentComplete}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden"
    >
      <motion.div
        className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: percentComplete / 100 }}
        transition={
          prefersReducedMotion || !animated
            ? { duration: 0 }
            : {
                type: 'spring' as const,
                stiffness: 100,
                damping: 20,
              }
        }
      />
    </div>
  );
}
