'use client';

import type { HoldingDerived, CurrencyCode } from '@/types/portfolio';
import { formatCurrency, formatNumber, formatPct } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function HoldingsPanel({
  holdings,
  currency = 'USD',
  currentPrices,
  onChangePrice,
  className,
}: {
  holdings: HoldingDerived[];
  currency?: CurrencyCode;
  currentPrices: Record<string, number | null>;
  onChangePrice: (symbol: string, price: number | null) => void;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border bg-white/80 dark:bg-slate-900/60 backdrop-blur p-4', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Holdings</h3>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            현재가를 입력하면 손익/비중이 더 정확해져요.
          </p>
        </div>
      </div>

      <div className="mt-3 divide-y divide-slate-200/70 dark:divide-slate-700/70">
        {holdings.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-300">
            아직 보유 종목이 없어요. 아래에서 BUY LOG를 먼저 추가해보세요.
          </div>
        ) : (
          holdings.map((h) => {
            const pnlPositive = (h.unrealizedPnl ?? 0) >= 0;
            return (
              <div key={h.symbol} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {h.symbol}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                      {formatNumber(h.shares)} sh
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    Avg {formatCurrency(h.avgCost, currency)} · Cost {formatCurrency(h.costBasis, currency)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-28">
                    <Input
                      value={currentPrices[h.symbol] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        if (!v) return onChangePrice(h.symbol, null);
                        const n = Number(v);
                        onChangePrice(h.symbol, Number.isFinite(n) ? n : null);
                      }}
                      inputMode="decimal"
                      placeholder="현재가"
                      data-testid={`price-${h.symbol}`}
                      className="h-9"
                    />
                  </div>
                  <div className="text-right w-36">
                    <div className="text-xs text-slate-500 dark:text-slate-300">
                      MV {formatCurrency(h.marketValue, currency)}
                    </div>
                    <div
                      className={cn(
                        'text-sm font-extrabold tabular-nums',
                        pnlPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      )}
                    >
                      {formatCurrency(h.unrealizedPnl, currency)}{' '}
                      <span className="text-xs font-semibold opacity-80">({formatPct(h.unrealizedPnlPct)})</span>
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

