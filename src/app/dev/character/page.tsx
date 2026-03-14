'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { BrieflyCharacter } from '@/components/onboarding/BrieflyCharacter';
import type { CharacterEmotion3D } from '@/components/character/useEmotionState';

const BrieflyCharacter3D = dynamic(
  () => import('@/components/character/BrieflyCharacter3D'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full">
        <BrieflyCharacter emotion="thinking" size="lg" />
      </div>
    ),
  }
);

const EMOTIONS: { id: CharacterEmotion3D; label: string; desc: string }[] = [
  { id: 'neutral',     label: 'Neutral',     desc: '기본 상태' },
  { id: 'happy',       label: 'Happy',       desc: '좋은 뉴스, 수익' },
  { id: 'wink',        label: 'Wink',        desc: '인사, 팁 전달' },
  { id: 'angry',       label: 'Angry',       desc: '시장 급락, 리스크' },
  { id: 'sad',         label: 'Sad',         desc: '하락장, 부정 뉴스' },
  { id: 'curious',     label: 'Curious',     desc: '새 데이터 발견' },
  { id: 'thinking',    label: 'Thinking',    desc: '로딩, 자료 조사' },
  { id: 'celebrating', label: 'Celebrating', desc: '온보딩 완료, 목표 달성' },
  { id: 'puffed',      label: 'Puffed',      desc: '볼 빵빵 (커비)' },
];

export default function CharacterDevPage() {
  const [emotion, setEmotion] = useState<CharacterEmotion3D>('neutral');

  return (
    <div className="min-h-[200vh] bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          Briefly Character — WebGL Dev
        </h1>
        <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
          W-403: Micro-interactions — hover parallax, click wink, scroll offset
        </p>

        <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <BrieflyCharacter3D emotion={emotion} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {EMOTIONS.map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => setEmotion(id)}
              title={desc}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                emotion === id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Current: <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{emotion}</span>
          {' — '}
          {EMOTIONS.find(e => e.id === emotion)?.desc}
        </p>

        <div className="mt-4 rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/30">
          <p className="text-xs text-indigo-600 dark:text-indigo-400">
            Interactions: hover over sphere (parallax tilt) / click sphere (wink + bounce) / scroll page (parallax offset)
          </p>
        </div>

        <div className="mt-6 rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Fallback (emoji)
          </h2>
          <div className="flex items-center gap-4">
            <BrieflyCharacter emotion="neutral" size="md" />
            <BrieflyCharacter emotion="happy" size="md" />
            <BrieflyCharacter emotion="thinking" size="md" />
            <BrieflyCharacter emotion="celebrating" size="md" />
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center py-24 text-slate-300 dark:text-slate-700">
          <p className="text-sm">Scroll down to test scroll parallax</p>
        </div>
      </div>
    </div>
  );
}
