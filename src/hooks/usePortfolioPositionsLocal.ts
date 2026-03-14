'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PortfolioPosition } from '@/types/portfolio';
import { derivePositionsSummary } from '@/lib/portfolio/positions-calc';

const STORAGE_KEY_POSITIONS = 'briefly:positions:v1';

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function uid(prefix = 'pos'): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function seedCustomerPositions(): PortfolioPosition[] {
  return [
    {
      id: uid('pos'),
      name: '로보티즈',
      symbol: 'ROBOTIS',
      shares: 124,
      avgBuyPrice: 283_161,
      avgBuyPriceCurrency: 'KRW',
      costBasis: 35_111_964,
      costBasisCurrency: 'KRW',
      currentValue: null,
    },
    {
      id: uid('pos'),
      name: '삼성전자',
      symbol: 'SAMSUNG',
      shares: 353,
      avgBuyPrice: 200_614,
      avgBuyPriceCurrency: 'KRW',
      costBasis: 70_816_742,
      costBasisCurrency: 'KRW',
      currentValue: null,
    },
    {
      id: uid('pos'),
      name: 'KODEX 코스닥150 레버리지',
      symbol: 'KODEX-150LEV',
      shares: 4_747,
      avgBuyPrice: 19_850,
      avgBuyPriceCurrency: 'KRW',
      costBasis: 94_227_950,
      costBasisCurrency: 'KRW',
      currentValue: null,
    },
    {
      id: uid('pos'),
      name: 'SK텔레콤',
      symbol: 'SKT',
      shares: 445,
      avgBuyPrice: 79_020,
      avgBuyPriceCurrency: 'KRW',
      costBasis: 35_163_900,
      costBasisCurrency: 'KRW',
      currentValue: null,
    },
    {
      id: uid('pos'),
      name: 'SK하이닉스',
      symbol: 'SKHYNIX',
      shares: 60,
      avgBuyPrice: 1_010_250,
      avgBuyPriceCurrency: 'KRW',
      costBasis: 60_615_000,
      costBasisCurrency: 'KRW',
      currentValue: null,
    },
    {
      id: uid('pos'),
      name: 'TIGER 반도체TOP10 레버리지',
      symbol: 'TIGER-SEMI10LEV',
      shares: 640,
      avgBuyPrice: 52_964,
      avgBuyPriceCurrency: 'KRW',
      costBasis: 33_896_960,
      costBasisCurrency: 'KRW',
      currentValue: null,
    },
    {
      id: uid('pos'),
      name: 'SCHD',
      symbol: 'SCHD',
      shares: 2_222,
      avgBuyPrice: 27.48,
      avgBuyPriceCurrency: 'USD',
      costBasis: 90_235_298,
      costBasisCurrency: 'KRW',
      currentValue: null,
    },
    {
      id: uid('pos'),
      name: 'VOO',
      symbol: 'VOO',
      shares: 98,
      avgBuyPrice: 625.6791,
      avgBuyPriceCurrency: 'USD',
      costBasis: 89_873_623,
      costBasisCurrency: 'KRW',
      currentValue: null,
    },
    {
      id: uid('pos'),
      name: '비스트라 에너지 (VST)',
      symbol: 'VST',
      shares: 112,
      avgBuyPrice: 161.7162,
      avgBuyPriceCurrency: 'USD',
      costBasis: 26_210_149,
      costBasisCurrency: 'KRW',
      currentValue: null,
    },
    {
      id: uid('pos'),
      name: '아마존닷컴 (AMZN)',
      symbol: 'AMZN',
      shares: 116,
      avgBuyPrice: 241.89,
      avgBuyPriceCurrency: 'USD',
      costBasis: 40_142_023,
      costBasisCurrency: 'KRW',
      currentValue: null,
    },
    {
      id: uid('pos'),
      name: '브로드컴 (AVGO)',
      symbol: 'AVGO',
      shares: 57,
      avgBuyPrice: 331.7428,
      avgBuyPriceCurrency: 'USD',
      costBasis: 27_364_380,
      costBasisCurrency: 'KRW',
      currentValue: null,
    },
  ];
}

export function usePortfolioPositionsLocal() {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);

  useEffect(() => {
    const loaded = safeJsonParse<PortfolioPosition[]>(
      localStorage.getItem(STORAGE_KEY_POSITIONS),
      []
    );
    if (loaded.length > 0) {
      setPositions(loaded);
      return;
    }

    const seeded = seedCustomerPositions();
    setPositions(seeded);
    localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(seeded));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(positions));
  }, [positions]);

  const setCurrentValue = useCallback((id: string, value: number | null) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, currentValue: value } : p))
    );
  }, []);

  const resetCurrentValues = useCallback(() => {
    setPositions((prev) => prev.map((p) => ({ ...p, currentValue: null })));
  }, []);

  const summary = useMemo(() => derivePositionsSummary(positions), [positions]);

  return { positions, setCurrentValue, resetCurrentValues, summary };
}

