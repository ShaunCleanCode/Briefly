'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { usePortfolioLocal } from '@/hooks/usePortfolioLocal';
import { usePortfolioPositionsLocal } from '@/hooks/usePortfolioPositionsLocal';
import { PortfolioDonut } from '@/components/dashboard/PortfolioDonut';
import { PositionsPanel } from '@/components/dashboard/PositionsPanel';
import { TradeLogComposer } from '@/components/dashboard/TradeLogComposer';
import { TradeLogList } from '@/components/dashboard/TradeLogList';
import type { HoldingDerived, TradeLog } from '@/types/portfolio';
import { formatCurrency, formatPct } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Tab = 'portfolio' | 'logs';

export default function DashboardPage() {
  const { trades, addTrade, updateTrade, deleteTrade, loadDemo, resetAll } =
    usePortfolioLocal();
  const { positions, setCurrentValue, resetCurrentValues, summary: posSummary } =
    usePortfolioPositionsLocal();

  const [tab, setTab] = useState<Tab>('portfolio');
  const [editing, setEditing] = useState<TradeLog | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const centerSubtitle = useMemo(() => {
    if (posSummary.totalCurrentValue === null) return '현재 평가금액(원)을 입력해주세요';
    return `${formatCurrency(posSummary.totalCurrentValue, 'KRW')} · ${formatPct(posSummary.pnlPct)}`;
  }, [posSummary.totalCurrentValue, posSummary.pnlPct]);

  const donutHoldings = useMemo(() => {
    // Adapt positions -> donut input (value = currentValue if present else costBasis)
    return positions.map<HoldingDerived>((p) => ({
      symbol: p.symbol,
      shares: p.shares,
      avgCost: null,
      costBasis: p.costBasis,
      currentPrice: null,
      marketValue: p.currentValue,
      unrealizedPnl: p.currentValue !== null ? p.currentValue - p.costBasis : null,
      unrealizedPnlPct: p.currentValue !== null ? (p.currentValue - p.costBasis) / p.costBasis : null,
    }));
  }, [positions]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setComposerOpen(false);
        setEditing(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-[calc(100vh-40px)] px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              내 포트폴리오를 한 눈에 보고, BUY/SELL 이유를 기록하세요.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => loadDemo()}
              data-testid="load-demo"
            >
              Demo 데이터
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => {
                setEditing(null);
                resetAll();
              }}
              data-testid="reset-demo"
            >
              Reset
            </Button>

            {/* Tabs */}
            <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 w-fit">
              {([
                { key: 'portfolio', label: 'Portfolio' },
                { key: 'logs', label: 'LOG' },
              ] as const).map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setTab(t.key);
                      if (t.key !== 'logs') {
                        setComposerOpen(false);
                        setEditing(null);
                      }
                    }}
                    className={cn(
                      'relative px-4 h-10 rounded-xl text-sm font-extrabold transition',
                      active ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-200'
                    )}
                    data-testid={`tab-${t.key}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="tab-pill"
                        className="absolute inset-0 rounded-xl bg-white dark:bg-slate-700 shadow"
                        transition={{ type: 'spring' as const, stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary cards (원가 기준) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-white/80 dark:bg-slate-900/60 backdrop-blur p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">Total Current Value</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(posSummary.totalCurrentValue, 'KRW')}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              * 비어있으면 “—”로 표시돼요
            </div>
          </div>
          <div className="rounded-2xl border bg-white/80 dark:bg-slate-900/60 backdrop-blur p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">Total Cost Basis</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(posSummary.totalCostBasis, 'KRW')}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              매수금액 기준 (원가)
            </div>
          </div>
          <div className="rounded-2xl border bg-white/80 dark:bg-slate-900/60 backdrop-blur p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">P/L</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(posSummary.pnl, 'KRW')}{' '}
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                ({formatPct(posSummary.pnlPct)})
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              * 현재 평가금액(원) 입력 시 계산돼요
            </div>
          </div>
        </div>

        {tab === 'portfolio' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6">
              <div className="rounded-2xl border bg-white/70 dark:bg-slate-950/40 backdrop-blur p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Portfolio Wheel</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      이미지처럼 “도넛 + 티커 라벨”로 비중을 직관적으로 보여줘요.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <PortfolioDonut
                    holdings={donutHoldings}
                    centerTitle="Briefly;"
                    centerSubtitle={centerSubtitle}
                  />
                </div>
              </div>
            </div>
            <div className="lg:col-span-6 space-y-4">
              <PositionsPanel positions={positions} onChangeCurrentValue={setCurrentValue} />
              <div className="rounded-2xl border bg-white/80 dark:bg-slate-900/60 backdrop-blur p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Logs</div>
                    <div className="text-xs text-slate-500 dark:text-slate-300">
                      BUY/SELL 이유를 기록해두면, 나중에 LOG 탭에서 자동 집계돼요.
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl"
                    onClick={() => resetCurrentValues()}
                    data-testid="reset-current-values"
                  >
                    현재가 비우기
                  </Button>
                </div>
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-300">
                  로그 추가/수정은 <span className="font-semibold">LOG</span> 탭에서만 가능해요.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-12">
              <TradeLogList
                trades={trades}
                currency="USD"
                onNew={() => {
                  setEditing(null);
                  setComposerOpen(true);
                }}
                onEdit={(t) => {
                  setTab('logs');
                  setEditing(t);
                  setComposerOpen(true);
                }}
                onDelete={(id) => {
                  if (editing?.id === id) setEditing(null);
                  deleteTrade(id);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Composer modal / right sheet */}
      {composerOpen && (
        <div className="fixed inset-0 z-50" aria-modal="true" role="dialog" data-testid="composer-modal">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setComposerOpen(false);
              setEditing(null);
            }}
          />
          <div className="absolute inset-0 flex items-end md:items-stretch md:justify-end p-3 md:p-4">
            <div className="w-full md:w-[520px] md:max-w-[520px] h-[86vh] md:h-full rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-700/60 shadow-2xl overflow-auto">
              <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {editing ? 'Edit LOG' : 'New LOG'}
                </div>
                <Button
                  variant="ghost"
                  className="h-9"
                  onClick={() => {
                    setComposerOpen(false);
                    setEditing(null);
                  }}
                  data-testid="close-composer"
                >
                  닫기
                </Button>
              </div>
              <div className="p-4">
                <TradeLogComposer
                  mode={editing ? 'edit' : 'create'}
                  initial={editing}
                  onCancelEdit={() => {
                    setEditing(null);
                    setComposerOpen(false);
                  }}
                  onCreate={(input) => {
                    addTrade(input);
                    setEditing(null);
                    setComposerOpen(false);
                  }}
                  onUpdate={(id, patch) => {
                    updateTrade(id, patch);
                    setEditing(null);
                    setComposerOpen(false);
                  }}
                  className="border-0 bg-transparent p-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

