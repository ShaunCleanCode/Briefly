'use client';

import { ReactNode, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, X, LogOut } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OnboardingShellProps {
  children: ReactNode;
  progress: {
    answered: number;
    total: number;
    percentComplete: number;
  };
  onBack?: () => void;
  onExit: () => void;
  canGoBack: boolean;
}

export function OnboardingShell({
  children,
  progress,
  onBack,
  onExit,
  canGoBack,
}: OnboardingShellProps) {
  const [showExitDialog, setShowExitDialog] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation area */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
        {/* Progress bar */}
        <ProgressBar percentComplete={progress.percentComplete} />
        
        {/* Navigation buttons */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back button */}
          <motion.div
            initial={false}
            animate={{ opacity: canGoBack ? 1 : 0.3 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={!canGoBack}
              data-testid="back-btn"
              className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">뒤로</span>
            </Button>
          </motion.div>

          {/* Progress indicator */}
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {progress.answered} / {progress.total}
          </div>

          {/* Exit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExitDialog(true)}
            data-testid="exit-btn"
            className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <span className="hidden sm:inline">나가기</span>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 md:py-10">
          {children}
        </div>
      </main>

      {/* Safe area for mobile */}
      <div className="h-safe-area-bottom" />

      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>온보딩을 나가시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              진행 상황은 자동으로 저장됩니다. 나중에 이어서 진행할 수 있어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onExit}
              className="rounded-xl bg-slate-900 dark:bg-slate-100"
            >
              나가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
