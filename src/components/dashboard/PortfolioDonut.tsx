'use client';

import { useMemo } from 'react';
import type { HoldingDerived } from '@/types/portfolio';
import { cn } from '@/lib/utils';

type Slice = {
  symbol: string;
  value: number;
  pct: number;
  startAngle: number;
  endAngle: number;
  color: string;
};

const COLORS = [
  '#6D28D9', // violet
  '#2563EB', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#14B8A6', // teal
  '#A855F7', // purple
  '#22C55E', // green2
  '#EAB308', // yellow
  '#F97316', // orange
];

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function donutSlicePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startRad: number,
  endRad: number
) {
  const outerStart = polarToCartesian(cx, cy, rOuter, startRad);
  const outerEnd = polarToCartesian(cx, cy, rOuter, endRad);
  const innerEnd = polarToCartesian(cx, cy, rInner, endRad);
  const innerStart = polarToCartesian(cx, cy, rInner, startRad);
  const largeArcFlag = endRad - startRad > Math.PI ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export function PortfolioDonut({
  holdings,
  className,
  centerTitle = 'Portfolio',
  centerSubtitle,
}: {
  holdings: HoldingDerived[];
  className?: string;
  centerTitle?: string;
  centerSubtitle?: string;
}) {
  const { slices, total } = useMemo(() => {
    const values = holdings
      .map((h) => ({
        symbol: h.symbol,
        value: (h.marketValue ?? h.costBasis ?? 0),
      }))
      .filter((x) => x.value > 0);

    const totalValue = values.reduce((a, b) => a + b.value, 0);
    const totalSafe = totalValue > 0 ? totalValue : 1;

    let angle = -Math.PI / 2; // start at top
    const built: Slice[] = values.map((v, idx) => {
      const pct = clamp01(v.value / totalSafe);
      const startAngle = angle;
      const endAngle = angle + pct * Math.PI * 2;
      angle = endAngle;
      return {
        symbol: v.symbol,
        value: v.value,
        pct,
        startAngle,
        endAngle,
        color: COLORS[idx % COLORS.length],
      };
    });

    return { slices: built, total: totalValue };
  }, [holdings]);

  // Larger viewBox to avoid any clipping from labels/leader lines.
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 170;
  const rInner = 120;

  return (
    <div className={cn('relative w-full max-w-[520px] mx-auto overflow-visible', className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
      >
        <g style={{ filter: 'drop-shadow(0px 10px 14px rgba(15, 23, 42, 0.12))' }}>

        {/* donut background */}
        <circle
          cx={cx}
          cy={cy}
          r={(rOuter + rInner) / 2}
          fill="transparent"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth={rOuter - rInner}
        />

        {/* slices */}
        {slices.map((s) => (
          <path
            key={s.symbol}
            d={donutSlicePath(cx, cy, rOuter, rInner, s.startAngle, s.endAngle)}
            fill={s.color}
          />
        ))}

        {/* center */}
        <circle cx={cx} cy={cy} r={rInner - 4} fill="white" className="dark:fill-slate-900" />

        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-slate-900 dark:fill-white" style={{ fontSize: 18, fontWeight: 800 }}>
          {centerTitle}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="fill-slate-500 dark:fill-slate-300" style={{ fontSize: 12, fontWeight: 600 }}>
          {centerSubtitle ?? (total > 0 ? 'Weights by value' : 'Add your first log')}
        </text>

        {/* labels */}
        {slices.map((s) => {
          const mid = (s.startAngle + s.endAngle) / 2;
          const p1 = polarToCartesian(cx, cy, rOuter + 6, mid);
          const p2 = polarToCartesian(cx, cy, rOuter + 26, mid);
          const isRight = Math.cos(mid) >= 0;
          const p3 = { x: p2.x + (isRight ? 34 : -34), y: p2.y };
          const labelX = p3.x + (isRight ? 6 : -6);
          const anchor = isRight ? 'start' : 'end';
          const pctText = `${Math.round(s.pct * 100)}%`;
          return (
            <g key={`${s.symbol}-label`}>
              <path d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`} fill="none" stroke="rgba(148,163,184,0.75)" strokeWidth="1.4" />
              <circle cx={p1.x} cy={p1.y} r={2.4} fill="rgba(148,163,184,0.9)" />
              <text
                x={labelX}
                y={p3.y - 2}
                textAnchor={anchor}
                className="fill-slate-900 dark:fill-white"
                style={{ fontSize: 12, fontWeight: 800 }}
              >
                {s.symbol}
              </text>
              <text
                x={labelX}
                y={p3.y + 12}
                textAnchor={anchor}
                className="fill-slate-500 dark:fill-slate-300"
                style={{ fontSize: 11, fontWeight: 700 }}
              >
                {pctText}
              </text>
            </g>
          );
        })}
        </g>
      </svg>
    </div>
  );
}

