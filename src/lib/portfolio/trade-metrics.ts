import type { TradeLog } from '@/types/portfolio';

export type TradeMetrics = {
  avgCostAtTrade: number | null;
  realizedPnl: number | null;
  realizedPnlPct: number | null; // realizedPnl / (avgCostAtTrade * shares)
};

function safeDiv(a: number, b: number): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}

/**
 * Average-cost realized P/L per SELL trade.
 * - BUY updates running avgCost
 * - SELL realizes pnl based on avgCostAtTrade
 */
export function deriveTradeMetricsById(trades: TradeLog[]): Record<string, TradeMetrics> {
  const sorted = [...trades].sort((a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime());

  const stateBySymbol = new Map<string, { shares: number; avgCost: number | null }>();
  const out: Record<string, TradeMetrics> = {};

  for (const t of sorted) {
    const sym = t.symbol.toUpperCase();
    const s = stateBySymbol.get(sym) ?? { shares: 0, avgCost: null };

    if (t.side === 'BUY') {
      const prevShares = s.shares;
      const nextShares = prevShares + t.shares;
      const prevCost = (s.avgCost ?? 0) * prevShares;
      const nextCost = prevCost + t.price * t.shares;
      const nextAvg = nextShares > 0 ? nextCost / nextShares : null;

      out[t.id] = { avgCostAtTrade: nextAvg, realizedPnl: null, realizedPnlPct: null };
      stateBySymbol.set(sym, { shares: nextShares, avgCost: nextAvg });
      continue;
    }

    // SELL
    const avgCostAtTrade = s.avgCost;
    const basis = avgCostAtTrade !== null ? avgCostAtTrade * t.shares : null;
    const realizedPnl =
      avgCostAtTrade !== null ? (t.price - avgCostAtTrade) * t.shares : null;
    const realizedPnlPct = realizedPnl !== null && basis !== null ? safeDiv(realizedPnl, basis) : null;

    const nextShares = Math.max(0, s.shares - t.shares);
    // avgCost stays the same for remaining shares (average-cost method)
    stateBySymbol.set(sym, { shares: nextShares, avgCost: nextShares > 0 ? s.avgCost : null });

    out[t.id] = { avgCostAtTrade, realizedPnl, realizedPnlPct };
  }

  return out;
}

