'use client';

import { useMemo, useCallback } from 'react';
import type { SP500Ticker } from '@/types/onboarding';

// Static import of S&P 500 tickers - loaded at build time
import sp500Data from '@/data/sp500-tickers.json';

// Type the imported data
const SP500_TICKERS: SP500Ticker[] = sp500Data as SP500Ticker[];

interface UseSP500TickersReturn {
  tickers: SP500Ticker[];
  isLoading: boolean;
  error: string | null;
  searchTickers: (query: string, limit?: number) => SP500Ticker[];
  validateTicker: (symbol: string) => boolean;
  normalizeTicker: (symbol: string) => string;
}

/**
 * Normalize ticker symbol for comparison
 * - Uppercase
 * - Handles special characters like dots (BRK.B)
 */
export function normalizeTicker(symbol: string): string {
  return symbol.trim().toUpperCase();
}

/**
 * Validate if a ticker is in the S&P 500 list
 */
export function validateTicker(symbol: string): boolean {
  const normalized = normalizeTicker(symbol);
  return SP500_TICKERS.some(
    (ticker) => normalizeTicker(ticker.symbol) === normalized
  );
}

/**
 * Search tickers by symbol or name
 * Optimized for fast typeahead on mobile
 */
export function searchTickers(
  query: string,
  limit = 8,
  excludeSymbols: string[] = []
): SP500Ticker[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  
  const upperQuery = trimmed.toUpperCase();
  const excludeSet = new Set(excludeSymbols.map(s => normalizeTicker(s)));
  
  const results: SP500Ticker[] = [];
  
  // First pass: exact symbol match (highest priority)
  for (const ticker of SP500_TICKERS) {
    if (results.length >= limit) break;
    if (excludeSet.has(normalizeTicker(ticker.symbol))) continue;
    
    if (ticker.symbol.toUpperCase() === upperQuery) {
      results.push(ticker);
    }
  }
  
  // Second pass: symbol starts with query
  for (const ticker of SP500_TICKERS) {
    if (results.length >= limit) break;
    if (excludeSet.has(normalizeTicker(ticker.symbol))) continue;
    if (results.includes(ticker)) continue;
    
    if (ticker.symbol.toUpperCase().startsWith(upperQuery)) {
      results.push(ticker);
    }
  }
  
  // Third pass: symbol contains query
  for (const ticker of SP500_TICKERS) {
    if (results.length >= limit) break;
    if (excludeSet.has(normalizeTicker(ticker.symbol))) continue;
    if (results.includes(ticker)) continue;
    
    if (ticker.symbol.toUpperCase().includes(upperQuery)) {
      results.push(ticker);
    }
  }
  
  // Fourth pass: name contains query
  for (const ticker of SP500_TICKERS) {
    if (results.length >= limit) break;
    if (excludeSet.has(normalizeTicker(ticker.symbol))) continue;
    if (results.includes(ticker)) continue;
    
    if (ticker.name.toUpperCase().includes(upperQuery)) {
      results.push(ticker);
    }
  }
  
  return results;
}

/**
 * Get ticker info by symbol
 */
export function getTickerBySymbol(symbol: string): SP500Ticker | undefined {
  const normalized = normalizeTicker(symbol);
  return SP500_TICKERS.find(
    (ticker) => normalizeTicker(ticker.symbol) === normalized
  );
}

/**
 * Hook for accessing S&P 500 ticker data
 * Uses static data loaded at build time - no network requests
 */
export function useSP500Tickers(): UseSP500TickersReturn {
  // Memoized search function with exclusion support
  const search = useCallback((query: string, limit = 8, exclude: string[] = []) => {
    return searchTickers(query, limit, exclude);
  }, []);

  const validate = useCallback((symbol: string) => {
    return validateTicker(symbol);
  }, []);

  const normalize = useCallback((symbol: string) => {
    return normalizeTicker(symbol);
  }, []);

  return {
    tickers: SP500_TICKERS,
    isLoading: false, // Static data, always ready
    error: null,
    searchTickers: search,
    validateTicker: validate,
    normalizeTicker: normalize,
  };
}

// Export the ticker list for direct access if needed
export { SP500_TICKERS };
