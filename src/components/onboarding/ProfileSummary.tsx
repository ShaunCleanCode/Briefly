'use client';

import { motion } from 'motion/react';
import { Clock, TrendingUp, Target, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DerivedProfile } from '@/types/onboarding';

interface ProfileSummaryProps {
  profile: DerivedProfile;
  className?: string;
  'data-testid'?: string;
}

const knowledgeLevelLabels: Record<string, string> = {
  beginner: '초보자',
  intermediate: '중급자',
  advanced: '전문가',
};

const investorSegmentLabels: Record<string, string> = {
  long_term: '장기 투자자',
  trader: '트레이더',
  macro: '매크로 투자자',
  sector_specialist: '섹터 전문가',
  learner: '투자 학습자',
};

export function ProfileSummary({ profile, className, 'data-testid': dataTestId }: ProfileSummaryProps) {
  const items = [
    {
      icon: <Target className="w-5 h-5" />,
      label: '투자 성향',
      value: investorSegmentLabels[profile.investorSegment] || profile.investorSegment,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: '투자 수준',
      value: knowledgeLevelLabels[profile.knowledgeLevel] || profile.knowledgeLevel,
      color: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: '레터 시간',
      value: `매일 ${profile.deliverySchedule?.time || '07:00'}`,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      label: '관심 섹터',
      value: profile.personalizationInputs?.watchlistSectors?.slice(0, 2).join(', ') || '미설정',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      data-testid={dataTestId}
      className={cn(
        'bg-white dark:bg-slate-800 rounded-2xl p-6',
        'shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50',
        'border border-slate-100 dark:border-slate-700',
        className
      )}
    >
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        맞춤 설정 완료
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            variants={itemVariants}
            className="space-y-2"
          >
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              item.color
            )}>
              {item.icon}
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {item.label}
              </div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                {item.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Watchlist tickers */}
      {profile.personalizationInputs?.watchlistTickers && 
       profile.personalizationInputs.watchlistTickers.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700"
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            관심 종목
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.personalizationInputs.watchlistTickers.slice(0, 5).map((ticker) => (
              <span
                key={ticker}
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  'bg-slate-100 dark:bg-slate-700',
                  'text-slate-700 dark:text-slate-300'
                )}
              >
                {ticker}
              </span>
            ))}
            {profile.personalizationInputs.watchlistTickers.length > 5 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1">
                +{profile.personalizationInputs.watchlistTickers.length - 5}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
