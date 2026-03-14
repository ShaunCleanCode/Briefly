'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CurrencyCode, TradeAttachment, TradeLog, TradeSide } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Draft = {
  side: TradeSide;
  symbol: string;
  tradedAt: string;
  shares: string;
  price: string;
  currency: CurrencyCode;
  memo: string;
  attachments: TradeAttachment[];
};

function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function todayIsoLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function TradeLogComposer({
  mode,
  initial,
  onCancelEdit,
  onCreate,
  onUpdate,
  className,
}: {
  mode: 'create' | 'edit';
  initial?: TradeLog | null;
  onCancelEdit?: () => void;
  onCreate: (input: Omit<TradeLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, patch: Partial<TradeLog>) => void;
  className?: string;
}) {
  const initialDraft: Draft = useMemo(() => {
    const t = initial ?? null;
    return {
      side: t?.side ?? 'BUY',
      symbol: t?.symbol ?? '',
      tradedAt: t?.tradedAt ? t.tradedAt.slice(0, 16) : todayIsoLocal(),
      shares: t?.shares ? String(t.shares) : '',
      price: t?.price ? String(t.price) : '',
      currency: t?.currency ?? 'USD',
      memo: t?.memo ?? '',
      attachments: t?.attachments ?? [],
    };
  }, [initial]);

  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = mode === 'edit' && initial?.id;

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const canSubmit = useMemo(() => {
    const shares = Number(draft.shares);
    const price = Number(draft.price);
    return (
      draft.symbol.trim().length >= 1 &&
      Number.isFinite(shares) &&
      shares > 0 &&
      Number.isFinite(price) &&
      price > 0 &&
      draft.tradedAt.length >= 10
    );
  }, [draft]);

  return (
    <div className={cn('rounded-2xl border bg-white/80 dark:bg-slate-900/60 backdrop-blur p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {isEdit ? 'Edit Log' : 'New Log'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-300">
            BUY/SELL 이유와 이미지를 함께 저장해두면, 나중에 복기하기 좋아요.
          </p>
        </div>
        {isEdit && onCancelEdit && (
          <Button variant="ghost" onClick={onCancelEdit} className="h-9">
            취소
          </Button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* side toggle */}
        <div className="md:col-span-4">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {(['BUY', 'SELL'] as const).map((side) => {
              const active = draft.side === side;
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, side }))}
                  className={cn(
                    'flex-1 h-10 rounded-lg text-sm font-extrabold transition',
                    active
                      ? side === 'BUY'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-rose-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700'
                  )}
                  data-testid={`side-${side}`}
                >
                  {side}
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-4">
          <Input
            value={draft.symbol}
            onChange={(e) => setDraft((d) => ({ ...d, symbol: e.target.value.toUpperCase() }))}
            placeholder="Ticker (예: AAPL, BRK.B)"
            data-testid="log-symbol"
            className="h-10"
          />
        </div>

        <div className="md:col-span-4">
          <Input
            type="datetime-local"
            value={draft.tradedAt}
            onChange={(e) => setDraft((d) => ({ ...d, tradedAt: e.target.value }))}
            data-testid="log-date"
            className="h-10"
          />
        </div>

        <div className="md:col-span-4">
          <Input
            value={draft.shares}
            onChange={(e) => setDraft((d) => ({ ...d, shares: e.target.value }))}
            inputMode="decimal"
            placeholder="Shares (예: 10)"
            data-testid="log-shares"
            className="h-10"
          />
        </div>

        <div className="md:col-span-4">
          <Input
            value={draft.price}
            onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
            inputMode="decimal"
            placeholder="Price (예: 198.50)"
            data-testid="log-price"
            className="h-10"
          />
        </div>

        <div className="md:col-span-4">
          <Input value={draft.currency} disabled className="h-10" data-testid="log-currency" />
        </div>

        <div className="md:col-span-12">
          <textarea
            value={draft.memo}
            onChange={(e) => setDraft((d) => ({ ...d, memo: e.target.value }))}
            placeholder={draft.side === 'BUY' ? '왜 샀는지 (근거/가설/리스크/트리거)' : '왜 팔았는지 (청산 이유/회고/다음 액션)'}
            data-testid="log-memo"
            rows={4}
            className={cn(
              'w-full rounded-xl border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
          />
        </div>

        <div className="md:col-span-12 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">Attachments (optional)</div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSubmitting(true);
                  try {
                    const dataUrl = await fileToDataUrl(file);
                    const attachment: TradeAttachment = {
                      id: uid('att'),
                      mimeType: file.type || 'image/*',
                      fileName: file.name,
                      dataUrl,
                    };
                    setDraft((d) => ({ ...d, attachments: [attachment, ...d.attachments].slice(0, 3) }));
                  } finally {
                    setSubmitting(false);
                    e.target.value = '';
                  }
                }}
                data-testid="log-attachment"
              />
              + 이미지 추가
            </label>
          </div>

          {draft.attachments.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {draft.attachments.map((a) => (
                <div key={a.id} className="relative overflow-hidden rounded-xl border bg-slate-50 dark:bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.dataUrl} alt={a.fileName} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, attachments: d.attachments.filter((x) => x.id !== a.id) }))}
                    className="absolute top-2 right-2 rounded-lg bg-black/60 text-white text-xs px-2 py-1"
                    aria-label="Remove attachment"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-[11px] text-slate-500 dark:text-slate-300">
            MVP: 이미지는 데모용으로 브라우저 저장소에 저장돼요(용량 제한 있음).
          </div>
        </div>

        <div className="md:col-span-12 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setDraft(initialDraft)}
            disabled={submitting}
            className="h-10"
            data-testid="log-reset"
          >
            리셋
          </Button>
          <Button
            onClick={() => {
              if (!canSubmit) return;
              setSubmitting(true);
              try {
                const input = {
                  side: draft.side,
                  symbol: draft.symbol.trim().toUpperCase(),
                  tradedAt: new Date(draft.tradedAt).toISOString(),
                  shares: Number(draft.shares),
                  price: Number(draft.price),
                  currency: draft.currency,
                  memo: draft.memo.trim() ? draft.memo.trim() : undefined,
                  attachments: draft.attachments.length ? draft.attachments : undefined,
                } satisfies Omit<TradeLog, 'id' | 'createdAt' | 'updatedAt'>;

                if (isEdit) {
                  onUpdate(initial!.id, input);
                } else {
                  onCreate(input);
                  setDraft(initialDraft);
                }
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!canSubmit || submitting}
            className={cn('h-10 px-5 font-extrabold', draft.side === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700')}
            data-testid="log-submit"
          >
            {isEdit ? '수정 저장' : draft.side === 'BUY' ? 'BUY LOG 저장' : 'SELL LOG 저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}

