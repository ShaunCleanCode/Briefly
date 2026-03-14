'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Mail } from 'lucide-react';
import { BrieflyCharacter } from '@/components/onboarding/BrieflyCharacter';
import { Button } from '@/components/ui/button';
import { onboardingApi } from '@/lib/api/onboarding';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function OnboardingDeclinedPage() {
  const router = useRouter();
  const [isRecovering, setIsRecovering] = useState(false);

  // Handle consent recovery - user decides to accept after all
  const handleAcceptConsent = async () => {
    setIsRecovering(true);
    try {
      // v1.1 Contract: consent is recorded via /answer (consent_* keys)
      // If the user previously declined, PATCH updates the existing answer.
      await onboardingApi.editAnswer('consent_personalization', { value: 'accept' });
      
      toast.success('동의해 주셔서 감사합니다!');
      
      // Restart onboarding flow
      router.push('/onboarding');
    } catch (error) {
      toast.error('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsRecovering(false);
    }
  };

  // Exit to basic experience
  const handleExitToBasic = () => {
    router.push('/dashboard');
  };

  const childVariants = {
    initial: { opacity: 0, y: 20 },
    enter: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
    },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 via-amber-50/20 to-orange-50/30 dark:from-slate-950 dark:via-amber-950/10 dark:to-orange-950/10">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-20 w-60 h-60 bg-orange-200/20 dark:bg-orange-900/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial="initial"
        animate="enter"
        className="relative z-10 w-full max-w-md space-y-8"
      >
        {/* Character */}
        <motion.div variants={childVariants} className="flex justify-center">
          <BrieflyCharacter emotion="concerned" size="lg" />
        </motion.div>

        {/* Title */}
        <motion.div variants={childVariants} className="text-center space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            맞춤형 서비스를 제공할 수 없어요
          </h1>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            개인화 정보 저장에 동의하지 않으시면,<br />
            <span className="font-medium">일반 시장 레터만</span> 받으실 수 있습니다.
          </p>
        </motion.div>

        {/* Explanation card */}
        <motion.div 
          variants={childVariants}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-slate-900 dark:text-white">
                맞춤형 서비스가 제공되지 않습니다
              </h3>
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 관심 종목 기반 뉴스 필터링 불가</li>
                <li>• 포트폴리오 영향 분석 불가</li>
                <li>• 개인화된 투자 체크리스트 불가</li>
                <li>• 선호 시간대 레터 발송 불가</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div variants={childVariants} className="space-y-3">
          {/* Primary: Reconsider and accept */}
          <Button
            onClick={handleAcceptConsent}
            disabled={isRecovering}
            data-testid="retry-btn"
            className={cn(
              'w-full py-6 text-base font-semibold rounded-xl',
              'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700',
              'text-white shadow-lg shadow-indigo-500/25',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isRecovering ? (
              '처리 중...'
            ) : (
              <>
                동의하고 계속하기
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>

          {/* Secondary: Exit to basic */}
          <Button
            variant="ghost"
            onClick={handleExitToBasic}
            disabled={isRecovering}
            className={cn(
              'w-full py-4 text-sm font-medium rounded-xl',
              'text-slate-600 dark:text-slate-400',
              'hover:bg-slate-100 dark:hover:bg-slate-800',
              'transition-all duration-200'
            )}
          >
            <Mail className="mr-2 w-4 h-4" />
            기본 레터만 보기
          </Button>
        </motion.div>

        {/* Note */}
        <motion.p 
          variants={childVariants}
          className="text-xs text-center text-slate-400 dark:text-slate-500"
        >
          나중에 설정에서 언제든지 맞춤형 서비스를 활성화할 수 있습니다.
        </motion.p>
      </motion.div>
    </div>
  );
}
