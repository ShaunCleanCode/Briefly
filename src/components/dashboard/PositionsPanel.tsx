'use client';

import type { PortfolioPosition } from '@/types/portfolio';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatNumber, formatPct } from '@/lib/format';
import { cn } from '@/lib/utils';

function avatarText(name: string, symbol: string): string {
  const base = (name || symbol || '').trim();
  if (!base) return '?';
  // Korean: take first char, otherwise take first letter(s)
  const first = base[0] ?? '?';
  return first.toUpperCase();
}

export function PositionsPanel({
  positions,
  onChangeCurrentValue,
  className,
}: {
  positions: PortfolioPosition[];
  onChangeCurrentValue: (id: string, value: number | null) => void;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border bg-white/80 dark:bg-slate-900/60 backdrop-blur p-4', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Holdings (원가 기준)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            현재 평가는 비워두고, 나중에 직접 입력할 수 있어요.
          </p>
        </div>
      </div>

      <div className="mt-3 divide-y divide-slate-200/70 dark:divide-slate-700/70">
        {positions.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-300">
            포지션 데이터가 없어요.
          </div>
        ) : (
          positions.map((p) => {
            const hasValue = typeof p.currentValue === 'number';
            const pnl = hasValue ? p.currentValue! - p.costBasis : null;
            const pnlPct = pnl !== null ? pnl / p.costBasis : null;
            const pnlPositive = (pnl ?? 0) >= 0;
            return (
              <div key={p.id} className="py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-full bg-slate-900/90 dark:bg-white/10 flex items-center justify-center text-white font-extrabold">
                    {avatarText(p.name, p.symbol)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                        {formatNumber(p.shares)}주
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                      {p.avgBuyPrice != null && p.avgBuyPriceCurrency ? (
                        <>
                          내 평균 {formatCurrency(p.avgBuyPrice, p.avgBuyPriceCurrency)} ·{' '}
                        </>
                      ) : null}
                      매수금액 {formatCurrency(p.costBasis, 'KRW')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-40">
                    <Input
                      value={p.currentValue ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.replace(/,/g, '').trim();
                        if (!v) return onChangeCurrentValue(p.id, null);
                        const n = Number(v);
                        onChangeCurrentValue(p.id, Number.isFinite(n) ? n : null);
                      }}
                      inputMode="numeric"
                      placeholder="현재 평가금액(원)"
                      data-testid={`current-value-${p.symbol}`}
                      className="h-10"
                    />
                  </div>
                  <div className="text-right w-40">
                    <div className="text-xs text-slate-500 dark:text-slate-300">
                      현재 {formatCurrency(p.currentValue, 'KRW')}
                    </div>
                    <div
                      className={cn(
                        'text-sm font-extrabold tabular-nums',
                        pnl === null
                          ? 'text-slate-400 dark:text-slate-400'
                          : pnlPositive
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                      )}
                    >
                      {pnl === null ? '—' : `${formatCurrency(pnl, 'KRW')} (${formatPct(pnlPct)})`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

