'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { BrieflyCharacter } from '@/components/onboarding/BrieflyCharacter';
import { ProfileSummary } from '@/components/onboarding/ProfileSummary';
import { Button } from '@/components/ui/button';
import { useOnboardingProfile } from '@/hooks/useOnboarding';

export default function OnboardingDonePage() {
  const router = useRouter();
  const { data: profileData } = useOnboardingProfile();
  const [showContent, setShowContent] = useState(false);

  // Trigger confetti on mount
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Fire from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
      });
    }, 250);

    // Show content after initial confetti
    const timer = setTimeout(() => setShowContent(true), 400);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 via-indigo-50/30 to-violet-50/50 dark:from-slate-950 dark:via-indigo-950/30 dark:to-violet-950/20">
      {/* Character celebration */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: 'spring' as const, 
          stiffness: 200, 
          damping: 15,
          delay: 0.1 
        }}
      >
        <BrieflyCharacter emotion="celebrating" size="lg" />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold mt-8 text-center bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent"
      >
        환영합니다! 🎉
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-slate-600 dark:text-slate-300 mt-4 text-center text-lg max-w-md"
      >
        내일 아침, 첫 번째 맞춤 레터를 보내드릴게요.
      </motion.p>

      {/* Profile summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full max-w-md mt-8"
        data-testid="profile-summary-section"
      >
        {profileData?.profile && (
          <ProfileSummary profile={profileData.profile} data-testid="profile-summary" />
        )}
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8"
      >
        <Button
          size="lg"
          onClick={() => router.push('/dashboard')}
          data-testid="start-btn"
          className="px-12 py-6 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300"
        >
          시작하기
        </Button>
      </motion.div>

      {/* Additional info */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-slate-500 dark:text-slate-400 mt-6 text-sm text-center"
      >
        설정에서 언제든지 관심 종목과 배송 시간을 변경할 수 있어요.
      </motion.p>
    </div>
  );
}
