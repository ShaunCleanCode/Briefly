import type { PortfolioPosition } from '@/types/portfolio';

export type PositionsSummary = {
  totalCostBasis: number;
  totalCurrentValue: number | null;
  pnl: number | null;
  pnlPct: number | null;
};

function safeDiv(a: number, b: number): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}

export function derivePositionsSummary(positions: PortfolioPosition[]): PositionsSummary {
  const totalCostBasis = positions.reduce((sum, p) => sum + (p.costBasis ?? 0), 0);
  const currentValues = positions.map((p) => p.currentValue).filter((v): v is number => typeof v === 'number');
  const totalCurrentValue = currentValues.length ? currentValues.reduce((a, b) => a + b, 0) : null;
  const pnl = totalCurrentValue !== null ? totalCurrentValue - totalCostBasis : null;
  const pnlPct = pnl !== null ? safeDiv(pnl, totalCostBasis) : null;
  return { totalCostBasis, totalCurrentValue, pnl, pnlPct };
}

export function positionWeightValue(p: PortfolioPosition): number {
  return (p.currentValue ?? p.costBasis) || 0;
}

