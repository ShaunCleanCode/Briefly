import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// Types
// =============================================================================

interface QuoteData {
  price: number;
  asOf: string;
  source: 'finnhub';
  cached: boolean;
  stale: boolean;
}

interface CacheEntry {
  price: number;
  asOf: string;
  expiresAt: number;
}

interface FinnhubQuoteResponse {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

interface SuccessResponse {
  ok: true;
  asOf: string;
  quotes: Record<string, QuoteData>;
}

interface ErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse = SuccessResponse | ErrorResponse;

// =============================================================================
// Configuration
// =============================================================================

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const CACHE_TTL_MS = parseInt(process.env.QUOTE_CACHE_TTL_MS || '90000', 10); // 90 seconds default
const MAX_SYMBOLS = 20;

// =============================================================================
// In-Memory Cache & In-Flight Deduplication
// =============================================================================

const quoteCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<CacheEntry | null>>();

// =============================================================================
// Finnhub API Client
// =============================================================================

async function fetchQuoteFromFinnhub(symbol: string): Promise<CacheEntry | null> {
  if (!FINNHUB_API_KEY) {
    console.error('[quotes] FINNHUB_API_KEY is not configured');
    return null;
  }

  const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Don't cache at the fetch level - we manage our own cache
      cache: 'no-store',
    });

    if (response.status === 429) {
      console.warn(`[quotes] Finnhub rate limited for symbol: ${symbol}`);
      return null;
    }

    if (!response.ok) {
      console.error(`[quotes] Finnhub error for ${symbol}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: FinnhubQuoteResponse = await response.json();

    // Finnhub returns c=0 for invalid symbols
    if (data.c === 0 && data.pc === 0) {
      console.warn(`[quotes] Invalid or unavailable symbol: ${symbol}`);
      return null;
    }

    const now = Date.now();
    const entry: CacheEntry = {
      price: data.c,
      asOf: new Date(data.t * 1000 || now).toISOString(),
      expiresAt: now + CACHE_TTL_MS,
    };

    return entry;
  } catch (error) {
    console.error(`[quotes] Network error fetching ${symbol}:`, error);
    return null;
  }
}

// =============================================================================
// Quote Fetcher with Cache & Deduplication
// =============================================================================

async function getQuote(symbol: string): Promise<{ entry: CacheEntry | null; cached: boolean; stale: boolean }> {
  const now = Date.now();
  const cached = quoteCache.get(symbol);

  // Check if we have a valid cached entry
  if (cached && cached.expiresAt > now) {
    return { entry: cached, cached: true, stale: false };
  }

  // Check if there's already an in-flight request for this symbol
  const inFlight = inFlightRequests.get(symbol);
  if (inFlight) {
    console.log(`[quotes] Deduplicating request for ${symbol}`);
    const entry = await inFlight;
    if (entry) {
      return { entry, cached: false, stale: false };
    }
    // If in-flight request failed, check if we have stale cache
    if (cached) {
      return { entry: cached, cached: true, stale: true };
    }
    return { entry: null, cached: false, stale: false };
  }

  // Create a new fetch request
  const fetchPromise = fetchQuoteFromFinnhub(symbol);
  inFlightRequests.set(symbol, fetchPromise);

  try {
    const entry = await fetchPromise;
    
    if (entry) {
      // Update cache with fresh data
      quoteCache.set(symbol, entry);
      console.log(`[quotes] Fetched fresh quote for ${symbol}: $${entry.price}`);
      return { entry, cached: false, stale: false };
    }

    // Fetch failed - check if we have stale cache to fall back to
    if (cached) {
      console.log(`[quotes] Using stale cache for ${symbol} after fetch failure`);
      return { entry: cached, cached: true, stale: true };
    }

    return { entry: null, cached: false, stale: false };
  } finally {
    // Always clean up in-flight request
    inFlightRequests.delete(symbol);
  }
}

// =============================================================================
// Input Validation
// =============================================================================

function parseAndValidateSymbols(symbolsParam: string | null): { symbols: string[]; error?: string } {
  if (!symbolsParam || symbolsParam.trim() === '') {
    return { symbols: [], error: 'Missing required parameter: symbols' };
  }

  // Parse, trim, uppercase, and deduplicate
  const symbolsArray = symbolsParam
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(s => s.length > 0);
  const symbols = Array.from(new Set(symbolsArray));

  if (symbols.length === 0) {
    return { symbols: [], error: 'No valid symbols provided' };
  }

  if (symbols.length > MAX_SYMBOLS) {
    return { symbols: [], error: `Maximum ${MAX_SYMBOLS} symbols allowed, got ${symbols.length}` };
  }

  // Basic symbol format validation (1-5 uppercase letters, allowing dots for BRK.B etc)
  const invalidSymbols = symbols.filter(s => !/^[A-Z]{1,5}(\.[A-Z])?$/.test(s));
  if (invalidSymbols.length > 0) {
    return { symbols: [], error: `Invalid symbol format: ${invalidSymbols.join(', ')}` };
  }

  return { symbols };
}

// =============================================================================
// Route Handler
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const symbolsParam = searchParams.get('symbols');

  // Validate input
  const { symbols, error: validationError } = parseAndValidateSymbols(symbolsParam);
  
  if (validationError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationError,
        },
      },
      { status: 400 }
    );
  }

  // Check API key configuration
  if (!FINNHUB_API_KEY) {
    console.error('[quotes] FINNHUB_API_KEY environment variable is not set');
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Market data service is not configured',
        },
      },
      { status: 503 }
    );
  }

  // Fetch quotes for all symbols in parallel
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const result = await getQuote(symbol);
      return { symbol, ...result };
    })
  );

  // Build response
  const quotes: Record<string, QuoteData> = {};
  let hasAnyData = false;
  let allFailed = true;

  for (const { symbol, entry, cached, stale } of results) {
    if (entry) {
      hasAnyData = true;
      allFailed = false;
      quotes[symbol] = {
        price: entry.price,
        asOf: entry.asOf,
        source: 'finnhub',
        cached,
        stale,
      };
    } else {
      // Symbol failed with no cache fallback - we still include it in response as null would break typing
      // Frontend should handle missing symbols gracefully
    }
  }

  // If all requests failed and no cached data available
  if (allFailed && !hasAnyData) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'UPSTREAM_ERROR',
          message: 'Finnhub request failed',
        },
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    asOf: new Date().toISOString(),
    quotes,
  });
}

// =============================================================================
// Cache Management (for testing/debugging)
// =============================================================================

export function clearQuoteCache(): void {
  quoteCache.clear();
  console.log('[quotes] Cache cleared');
}

export function getCacheStats(): { size: number; symbols: string[] } {
  return {
    size: quoteCache.size,
    symbols: Array.from(quoteCache.keys()),
  };
}
