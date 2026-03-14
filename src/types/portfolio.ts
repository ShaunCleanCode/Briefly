export type CurrencyCode = 'USD' | 'KRW';

export type TradeSide = 'BUY' | 'SELL';

export interface TradeAttachment {
  id: string;
  mimeType: string;
  fileName: string;
  dataUrl: string; // MVP: stored in localStorage for demo
}

export interface TradeLog {
  id: string;
  side: TradeSide;
  symbol: string; // S&P500 ticker (may include dot tickers like BRK.B)
  tradedAt: string; // ISO datetime
  shares: number;
  price: number;
  currency: CurrencyCode;
  memo?: string;
  attachments?: TradeAttachment[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface HoldingDerived {
  symbol: string;
  shares: number;
  avgCost: number | null; // weighted average cost (currency assumed uniform in MVP)
  costBasis: number | null;
  currentPrice: number | null; // user-provided for unrealized calc (optional)
  marketValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number | null;
}

export interface PortfolioSummaryDerived {
  totalCostBasis: number | null;
  totalMarketValue: number | null;
  totalUnrealizedPnl: number | null;
  totalUnrealizedPnlPct: number | null;
}

export interface PortfolioPosition {
  id: string;
  name: string;
  symbol: string;
  shares: number;
  avgBuyPrice?: number | null;
  avgBuyPriceCurrency?: CurrencyCode | null;
  costBasis: number; // KRW-based purchase amount
  costBasisCurrency: 'KRW';
  currentValue: number | null; // user input (KRW). empty until user fills it.
}

