'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TradeLog } from '@/types/portfolio';
import { deriveHoldings, derivePortfolioSummary } from '@/lib/portfolio/calc';

const STORAGE_KEY_TRADES = 'briefly:trades:v1';
const STORAGE_KEY_PRICES = 'briefly:prices:v1';

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function usePortfolioLocal() {
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [prices, setPrices] = useState<Record<string, number | null>>({});

  // load
  useEffect(() => {
    setTrades(safeJsonParse<TradeLog[]>(localStorage.getItem(STORAGE_KEY_TRADES), []));
    setPrices(safeJsonParse<Record<string, number | null>>(localStorage.getItem(STORAGE_KEY_PRICES), {}));
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TRADES, JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRICES, JSON.stringify(prices));
  }, [prices]);

  const addTrade = useCallback((input: Omit<TradeLog, 'id' | 'createdAt' | 'updatedAt'>) => {
    const t: TradeLog = {
      ...input,
      id: uid('trade'),
      symbol: input.symbol.toUpperCase(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    setTrades((prev) => [t, ...prev]);
    return t.id;
  }, []);

  const updateTrade = useCallback((id: string, patch: Partial<TradeLog>) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t))
    );
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setCurrentPrice = useCallback((symbol: string, price: number | null) => {
    const sym = symbol.toUpperCase();
    setPrices((prev) => ({ ...prev, [sym]: price }));
  }, []);

  const resetAll = useCallback(() => {
    setTrades([]);
    setPrices({});
    localStorage.removeItem(STORAGE_KEY_TRADES);
    localStorage.removeItem(STORAGE_KEY_PRICES);
  }, []);

  const loadDemo = useCallback(() => {
    const base = new Date();
    const iso = (daysAgo: number) => new Date(base.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const demoTrades: TradeLog[] = [
      {
        id: uid('trade'),
        side: 'BUY',
        symbol: 'NVDA',
        tradedAt: iso(40),
        shares: 5,
        price: 700,
        currency: 'USD',
        memo: 'AI 사이클 장기 추세. 단, 밸류에이션/변동성 리스크 관리.',
        createdAt: iso(40),
        updatedAt: iso(40),
      },
      {
        id: uid('trade'),
        side: 'BUY',
        symbol: 'AAPL',
        tradedAt: iso(28),
        shares: 10,
        price: 180,
        currency: 'USD',
        memo: '현금흐름/자사주/에코시스템. 하락 시 분할매수.',
        createdAt: iso(28),
        updatedAt: iso(28),
      },
      {
        id: uid('trade'),
        side: 'BUY',
        symbol: 'MSFT',
        tradedAt: iso(21),
        shares: 8,
        price: 400,
        currency: 'USD',
        memo: '클라우드 + AI 배분. 장기 보유.',
        createdAt: iso(21),
        updatedAt: iso(21),
      },
      {
        id: uid('trade'),
        side: 'BUY',
        symbol: 'TSLA',
        tradedAt: iso(14),
        shares: 6,
        price: 230,
        currency: 'USD',
        memo: '변동성 감안해서 포지션 사이즈 작게.',
        createdAt: iso(14),
        updatedAt: iso(14),
      },
      {
        id: uid('trade'),
        side: 'BUY',
        symbol: 'NTRA',
        tradedAt: iso(9),
        shares: 20,
        price: 95,
        currency: 'USD',
        memo: '헬스케어 성장 테마. 이벤트 리스크 체크.',
        createdAt: iso(9),
        updatedAt: iso(9),
      },
    ];

    const demoPrices: Record<string, number | null> = {
      NVDA: 880,
      AAPL: 195,
      MSFT: 430,
      TSLA: 205,
      NTRA: 110,
    };

    setTrades(demoTrades);
    setPrices(demoPrices);
  }, []);

  const holdings = useMemo(() => deriveHoldings(trades, prices), [trades, prices]);
  const summary = useMemo(() => derivePortfolioSummary(holdings), [holdings]);

  return {
    trades,
    addTrade,
    updateTrade,
    deleteTrade,
    prices,
    setCurrentPrice,
    resetAll,
    loadDemo,
    holdings,
    summary,
  };
}

