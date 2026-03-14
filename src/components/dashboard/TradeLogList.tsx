'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CurrencyCode, TradeLog } from '@/types/portfolio';
import { formatCurrency, formatNumber, formatPct } from '@/lib/format';
import { deriveTradeMetricsById } from '@/lib/portfolio/trade-metrics';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return iso;
  }
}

export function TradeLogList({
  trades,
  currency = 'USD',
  onNew,
  onEdit,
  onDelete,
  className,
}: {
  trades: TradeLog[];
  currency?: CurrencyCode;
  onNew?: () => void;
  onEdit: (trade: TradeLog) => void;
  onDelete: (id: string) => void;
  className?: string;
}) {
  const sorted = useMemo(() => {
    return [...trades].sort((a, b) => new Date(b.tradedAt).getTime() - new Date(a.tradedAt).getTime());
  }, [trades]);

  const metricsById = useMemo(() => deriveTradeMetricsById(sorted), [sorted]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  useEffect(() => {
    const handleDocPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-trade-card="true"]')) return;
      if (target.closest('[data-filter-menu-root="true"]')) return;
      setActiveId(null);
      setFilterMenuOpen(false);
    };
    document.addEventListener('pointerdown', handleDocPointerDown);
    return () => document.removeEventListener('pointerdown', handleDocPointerDown);
  }, []);

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'ALL') return sorted;
    return sorted.filter((t) => t.side === filter);
  }, [sorted, filter]);

  const finvizHeat = (pct: number) => {
    // Finviz-like: intensity depends on |pct|. Bigger move => more saturated & darker.
    // Keep it subtle so text stays readable (tint, not paint).
    const cap = 0.18; // 18% = max intensity (beyond this won't get stronger)
    const mag = Math.min(cap, Math.abs(pct));
    const t = mag / cap; // 0..1
    const hue = pct >= 0 ? 145 : 0; // green / red
    const sat = 65 + t * 15; // 65..80 (closer to finviz but less neon)
    const light = 96 - t * 20; // 96..76 (light mode)
    const darkLight = 26 - t * 6; // 26..20 (dark mode)
    const alpha = 0.06 + t * 0.10; // 0.06..0.16 (max tint)
    return {
      light: `hsla(${hue} ${sat}% ${light}% / ${alpha})`,
      dark: `hsla(${hue} ${sat}% ${darkLight}% / ${Math.min(0.18, alpha + 0.02)})`,
    };
  };

  return (
    <div className={cn('rounded-2xl border bg-white/80 dark:bg-slate-900/60 backdrop-blur p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Logs</h3>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            BUY/SELL 히스토리와 이유를 한 곳에 모아두는 탭이에요.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-300 tabular-nums">
          {filtered.length} items
        </div>
      </div>

      {/* Filters (left-aligned) */}
      <div className="mt-3 flex items-center justify-start gap-2">
        {onNew && (
          <Button
            variant="outline"
            className="h-10 w-10 rounded-2xl p-0"
            onClick={onNew}
            aria-label="New log"
            data-testid="new-log"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}

        <div className="relative" data-filter-menu-root="true">
          <button
            type="button"
            onClick={() => setFilterMenuOpen((v) => !v)}
            className={cn(
              'h-10 inline-flex items-center gap-2 rounded-2xl px-4 text-xs font-extrabold transition border',
              'bg-white/90 dark:bg-slate-950/40 backdrop-blur border-slate-200/70 dark:border-slate-700/70',
              filter === 'BUY' && 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200',
              filter === 'SELL' && 'bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:text-rose-200'
            )}
            data-testid="filter-menu-btn"
            aria-haspopup="menu"
            aria-expanded={filterMenuOpen}
          >
            <span>
              {filter === 'ALL' ? 'All Logs' : filter === 'BUY' ? 'BUY LOG' : 'SELL LOG'}
            </span>
            <ChevronDown className={cn('h-4 w-4 transition', filterMenuOpen && 'rotate-180')} />
          </button>

          {filterMenuOpen && (
            <div
              role="menu"
              className={cn(
                'absolute left-0 mt-2 w-48 rounded-2xl border shadow-xl z-20 overflow-hidden',
                'bg-white/95 dark:bg-slate-950/95 backdrop-blur',
                'border-slate-200/70 dark:border-slate-700/70'
              )}
              data-testid="filter-menu"
            >
              {(
                [
                  { key: 'ALL' as const, label: 'All Logs' },
                  { key: 'BUY' as const, label: 'BUY LOG' },
                  { key: 'SELL' as const, label: 'SELL LOG' },
                ] as const
              ).map((opt) => {
                const selected = filter === opt.key;
                const tinted =
                  opt.key === 'BUY'
                    ? 'data-[selected=true]:bg-emerald-100/70 dark:data-[selected=true]:bg-emerald-900/30'
                    : opt.key === 'SELL'
                      ? 'data-[selected=true]:bg-rose-100/70 dark:data-[selected=true]:bg-rose-900/30'
                      : 'data-[selected=true]:bg-slate-100/80 dark:data-[selected=true]:bg-slate-800/60';
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    data-selected={selected}
                    onClick={() => {
                      setFilter(opt.key);
                      setFilterMenuOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white',
                      'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition',
                      tinted
                    )}
                    data-testid={`filter-${opt.key.toLowerCase()}`}
                  >
                    <span className={cn(opt.key === 'BUY' && 'text-emerald-700 dark:text-emerald-200', opt.key === 'SELL' && 'text-rose-700 dark:text-rose-200')}>
                      {opt.label}
                    </span>
                    {selected ? <Check className="h-4 w-4 text-slate-900 dark:text-white" /> : <span className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-300">
            아직 로그가 없어요. 오른쪽에서 첫 BUY/SELL LOG를 저장해보세요.
          </div>
        ) : (
          filtered.map((t) => {
            const isBuy = t.side === 'BUY';
            const badgeClass = isBuy ? 'bg-emerald-600' : 'bg-rose-600';
            const isActive = activeId === t.id;
            const m = metricsById[t.id];
            const realizedPct = t.side === 'SELL' ? (m?.realizedPnlPct ?? null) : null;
            const realizedPnl = t.side === 'SELL' ? (m?.realizedPnl ?? null) : null;
            const pnlPositive = (realizedPnl ?? 0) >= 0;
            const heat = realizedPct !== null ? finvizHeat(realizedPct) : null;
            return (
              <div
                key={t.id}
                className={cn(
                  'relative rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-950/40 p-4',
                  isActive && 'ring-2 ring-indigo-500/30'
                )}
                data-testid={`trade-${t.id}`}
                data-trade-card="true"
                onPointerDown={(e) => {
                  // Only primary button/touch.
                  if (e.pointerType === 'mouse' && e.button !== 0) return;
                  clearPressTimer();
                  pressTimerRef.current = window.setTimeout(() => {
                    setActiveId(t.id);
                  }, 450);
                }}
                onPointerUp={() => clearPressTimer()}
                onPointerCancel={() => clearPressTimer()}
                onPointerLeave={() => clearPressTimer()}
              >
                {/* Finviz-like heat tint for SELL rows */}
                {heat && (
                  <>
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none dark:hidden"
                      style={{ backgroundColor: heat.light }}
                    />
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none hidden dark:block"
                      style={{ backgroundColor: heat.dark }}
                    />
                  </>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-extrabold text-white', badgeClass)}>
                        {t.side}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">{t.symbol}</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">{fmtDate(t.tradedAt)}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {formatNumber(t.shares)} sh @ {formatCurrency(t.price, currency)}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {/* SELL P/L summary */}
                    {t.side === 'SELL' ? (
                      <div className="text-right">
                        <div
                          className={cn(
                            'text-sm font-extrabold tabular-nums',
                            pnlPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                          )}
                          data-testid={`sell-pnl-${t.id}`}
                        >
                          {formatCurrency(realizedPnl, currency)}{' '}
                          <span className="text-xs font-semibold opacity-80">({formatPct(realizedPct)})</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                          Avg {formatCurrency(m?.avgCostAtTrade ?? null, currency)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-slate-400 dark:text-slate-400 select-none">
                        길게 눌러 수정/삭제
                      </div>
                    )}

                    {/* Actions hidden by default; show on long-press */}
                    {isActive ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="h-9"
                          onClick={() => {
                            setActiveId(null);
                            onEdit(t);
                          }}
                          data-testid={`edit-${t.id}`}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="h-9" data-testid={`delete-${t.id}`}>
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>삭제할까요?</AlertDialogTitle>
                              <AlertDialogDescription>
                                이 로그는 복구할 수 없어요. 정말 삭제하시겠어요?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  setActiveId(null);
                                  onDelete(t.id);
                                }}
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : null}
                  </div>
                </div>

                {t.memo && (
                  <div className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                    {t.memo}
                  </div>
                )}

                {t.attachments?.length ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {t.attachments.map((a) => (
                      <div key={a.id} className="overflow-hidden rounded-xl border bg-slate-50 dark:bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.dataUrl} alt={a.fileName} className="h-24 w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

