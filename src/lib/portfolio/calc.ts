import type { HoldingDerived, PortfolioSummaryDerived, TradeLog } from '@/types/portfolio';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function safeDiv(a: number, b: number): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}

/**
 * MVP assumptions:
 * - All trades are in the same currency (USD) for a given user.
 * - Average cost method for unrealized PnL.
 * - Realized PnL is not calculated yet (can be added later).
 */
export function deriveHoldings(
  trades: TradeLog[],
  currentPricesBySymbol: Record<string, number | null | undefined>
): HoldingDerived[] {
  const bySymbol = new Map<
    string,
    {
      shares: number;
      totalCost: number; // sum(BUY shares * price) - doesn't reduce on SELL in avg-cost method
      buyShares: number; // used for avg cost
    }
  >();

  const sorted = [...trades].sort((a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime());

  for (const t of sorted) {
    const sym = t.symbol.toUpperCase();
    const entry = bySymbol.get(sym) ?? { shares: 0, totalCost: 0, buyShares: 0 };

    if (t.side === 'BUY') {
      entry.shares += t.shares;
      entry.totalCost += t.shares * t.price;
      entry.buyShares += t.shares;
    } else {
      entry.shares -= t.shares;
      // average-cost: keep totalCost/buyShares as avgCost; do not adjust totalCost on sell (MVP)
      // In the future: track lots and realized PnL.
      if (entry.shares < 0) entry.shares = 0;
    }

    bySymbol.set(sym, entry);
  }

  const holdings: HoldingDerived[] = [];
  bySymbol.forEach((v, symbol) => {
    if (v.shares <= 0) return;

    const avgCost = v.buyShares > 0 ? v.totalCost / v.buyShares : null;
    const costBasis = avgCost !== null ? avgCost * v.shares : null;
    const currentPriceRaw = currentPricesBySymbol[symbol];
    const currentPrice = typeof currentPriceRaw === 'number' && Number.isFinite(currentPriceRaw) ? currentPriceRaw : null;
    const marketValue = currentPrice !== null ? currentPrice * v.shares : null;
    const unrealizedPnl =
      marketValue !== null && costBasis !== null ? marketValue - costBasis : null;
    const unrealizedPnlPct =
      unrealizedPnl !== null && costBasis !== null ? safeDiv(unrealizedPnl, costBasis) : null;

    holdings.push({
      symbol,
      shares: round2(v.shares),
      avgCost: avgCost !== null ? round2(avgCost) : null,
      costBasis: costBasis !== null ? round2(costBasis) : null,
      currentPrice: currentPrice !== null ? round2(currentPrice) : null,
      marketValue: marketValue !== null ? round2(marketValue) : null,
      unrealizedPnl: unrealizedPnl !== null ? round2(unrealizedPnl) : null,
      unrealizedPnlPct: unrealizedPnlPct !== null ? round2(unrealizedPnlPct) : null,
    });
  });

  // Sort by market value (fallback cost basis)
  holdings.sort((a, b) => {
    const av = a.marketValue ?? a.costBasis ?? 0;
    const bv = b.marketValue ?? b.costBasis ?? 0;
    return bv - av;
  });

  return holdings;
}

export function derivePortfolioSummary(holdings: HoldingDerived[]): PortfolioSummaryDerived {
  const costBasisValues = holdings.map((h) => h.costBasis).filter((v): v is number => typeof v === 'number');
  const marketValues = holdings.map((h) => h.marketValue).filter((v): v is number => typeof v === 'number');

  const totalCostBasis = costBasisValues.length ? costBasisValues.reduce((a, b) => a + b, 0) : null;
  const totalMarketValue = marketValues.length ? marketValues.reduce((a, b) => a + b, 0) : null;
  const totalUnrealizedPnl =
    totalMarketValue !== null && totalCostBasis !== null ? totalMarketValue - totalCostBasis : null;
  const totalUnrealizedPnlPct =
    totalUnrealizedPnl !== null && totalCostBasis !== null ? safeDiv(totalUnrealizedPnl, totalCostBasis) : null;

  return {
    totalCostBasis: totalCostBasis !== null ? round2(totalCostBasis) : null,
    totalMarketValue: totalMarketValue !== null ? round2(totalMarketValue) : null,
    totalUnrealizedPnl: totalUnrealizedPnl !== null ? round2(totalUnrealizedPnl) : null,
    totalUnrealizedPnlPct: totalUnrealizedPnlPct !== null ? round2(totalUnrealizedPnlPct) : null,
  };
}

