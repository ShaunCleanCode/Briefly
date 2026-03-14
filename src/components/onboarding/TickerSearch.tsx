'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSP500Tickers, searchTickers } from '@/hooks/useSP500Tickers';

interface TickerSearchProps {
  selectedTickers?: string[];
  maxTickers?: number;
  placeholder?: string;
  onSubmit: (tickers: string[]) => void;
  disabled?: boolean;
}

export function TickerSearch({
  selectedTickers: initialTickers = [],
  maxTickers = 10,
  placeholder = '예: AAPL, MSFT, NVDA',
  onSubmit,
  disabled = false,
}: TickerSearchProps) {
  const [selectedTickers, setSelectedTickers] = useState<string[]>(initialTickers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { isLoading: isLoadingTickers } = useSP500Tickers();

  // Track previous initial value to detect prop changes (without causing infinite loops)
  const prevInitialRef = useRef<string>(JSON.stringify(initialTickers));

  // Sync with initial tickers when they change (for prefill on back navigation)
  useEffect(() => {
    const newKey = JSON.stringify(initialTickers);
    if (newKey !== prevInitialRef.current) {
      prevInitialRef.current = newKey;
      setSelectedTickers(initialTickers);
    }
  }, [initialTickers]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter tickers based on debounced search query
  const filteredTickers = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return searchTickers(debouncedQuery, 8, selectedTickers);
  }, [debouncedQuery, selectedTickers]);

  const handleAddTicker = useCallback((symbol: string) => {
    if (selectedTickers.length >= maxTickers) return;
    if (selectedTickers.includes(symbol)) return;
    
    setSelectedTickers((prev) => [...prev, symbol]);
    setSearchQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  }, [selectedTickers, maxTickers]);

  const handleRemoveTicker = useCallback((symbol: string) => {
    setSelectedTickers((prev) => prev.filter((t) => t !== symbol));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(selectedTickers);
  }, [selectedTickers, onSubmit]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation in dropdown
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSearchQuery('');
    }
    if (e.key === 'Enter' && filteredTickers.length > 0) {
      e.preventDefault();
      handleAddTicker(filteredTickers[0].symbol);
    }
  }, [filteredTickers, handleAddTicker]);

  const isAtMax = selectedTickers.length >= maxTickers;

  return (
    <div className="w-full space-y-4">
      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={isAtMax ? `최대 ${maxTickers}개 선택됨` : placeholder}
            disabled={disabled || isAtMax}
            data-testid="ticker-search-input"
            className={cn(
              'pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700',
              'bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
              'transition-all duration-200',
              isAtMax && 'opacity-50'
            )}
          />
          {isLoadingTickers && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
          )}
        </div>

        {/* Search results dropdown */}
        <AnimatePresence>
          {isSearchOpen && filteredTickers.length > 0 && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              data-testid="ticker-suggestions"
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto"
            >
              {filteredTickers.map((ticker, index) => (
                <button
                  key={ticker.symbol}
                  onClick={() => handleAddTicker(ticker.symbol)}
                  data-testid={`ticker-suggestion-${ticker.symbol}`}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3',
                    'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                    'text-left transition-colors',
                    index === 0 && 'bg-slate-50 dark:bg-slate-700/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {ticker.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {ticker.symbol}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                        {ticker.name}
                      </div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No results message */}
        <AnimatePresence>
          {isSearchOpen && debouncedQuery.trim() && filteredTickers.length === 0 && !isLoadingTickers && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              data-testid="ticker-no-results"
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-50 p-4 text-center text-slate-500 dark:text-slate-400"
            >
              &quot;{debouncedQuery}&quot;에 해당하는 S&P 500 종목이 없습니다
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected tickers */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        <AnimatePresence mode="popLayout">
          {selectedTickers.map((symbol) => (
            <motion.div
              key={symbol}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              data-testid={`ticker-chip-${symbol}`}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
                'text-sm font-medium'
              )}
            >
              <span>{symbol}</span>
              <button
                onClick={() => handleRemoveTicker(symbol)}
                disabled={disabled}
                data-testid={`remove-ticker-${symbol}`}
                className="p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors disabled:opacity-50"
                aria-label={`Remove ${symbol}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Count and submit */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {selectedTickers.length} / {maxTickers} 종목 선택
        </span>

        <Button
          onClick={handleSubmit}
          disabled={disabled}
          data-testid="continue-btn"
          className={cn(
            'px-6 rounded-xl',
            'bg-indigo-600 hover:bg-indigo-700 text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {selectedTickers.length === 0 ? '건너뛰기' : '계속하기'}
        </Button>
      </div>
    </div>
  );
}
