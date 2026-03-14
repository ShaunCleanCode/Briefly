/**
 * Answer fixtures for testing different onboarding scenarios
 */

import type { AnswerPayload } from '@/types/onboarding';

/**
 * Valid answers for each question type
 */
export const validAnswers: Record<string, AnswerPayload> = {
  consent_personalization: { value: 'accept' },
  job_title: { value: 'Software Engineer' },
  industry: { value: 'technology' },
  experience_years: { value: '1_3' },
  investment_goal: { value: 'wealth_growth' },
  risk_tolerance: { value: 'moderate' },
  time_availability: { value: 'moderate' },
  watchlist_sectors: { values: ['Technology', 'Healthcare'] },
  delivery_time: { value: '07:30' },
  watchlist_tickers: { values: ['AAPL', 'MSFT', 'NVDA'] },
  portfolio_size_range: { value: '10k_50k' },
};

/**
 * Answers for consent decline scenario
 */
export const consentDeclineAnswer: AnswerPayload = {
  value: 'decline',
};

/**
 * Invalid answers for validation testing
 */
export const invalidAnswers = {
  // Job title too long
  job_title_too_long: {
    value: 'A'.repeat(101), // 101 chars, max is 100
  },
  
  // Invalid ticker symbol
  invalid_ticker: {
    values: ['AAPL', 'INVALID', 'MSFT'],
  },
  
  // Too many tickers
  too_many_tickers: {
    values: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK.B', 'UNH', 'JNJ', 'V'], // 11 tickers
  },
  
  // Too many sectors
  too_many_sectors: {
    values: ['Technology', 'Healthcare', 'Financials', 'Energy'], // 4, max is 3
  },
  
  // Invalid single choice value
  invalid_choice: {
    value: 'not_a_valid_option',
  },
  
  // Invalid time format
  invalid_time: {
    value: '25:00', // Invalid hour
  },
};

/**
 * Complete set of answers for happy path testing
 */
export const completeAnswerSet: Record<string, AnswerPayload> = {
  consent_personalization: { value: 'accept' },
  job_title: { value: 'Product Manager' },
  industry: { value: 'technology' },
  experience_years: { value: '3_5' },
  investment_goal: { value: 'wealth_growth' },
  risk_tolerance: { value: 'moderate' },
  time_availability: { value: 'moderate' },
  watchlist_sectors: { values: ['Technology', 'Healthcare', 'Financials'] },
  delivery_time: { value: '07:00' },
  watchlist_tickers: { values: ['AAPL', 'MSFT', 'GOOGL'] },
  portfolio_size_range: { value: '50k_200k' },
};

/**
 * Minimal answers (consent + all skips)
 */
export const minimalAnswerSet: Record<string, AnswerPayload> = {
  consent_personalization: { value: 'accept' },
};

/**
 * S&P 500 tickers that are valid for tests
 */
export const validTickers = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK.B', 'BRK.A',
  'UNH', 'JNJ', 'V', 'XOM', 'JPM', 'WMT', 'PG', 'MA', 'HD', 'CVX', 'LLY',
];

/**
 * Invalid tickers for validation tests
 */
export const invalidTickers = [
  'INVALID',
  'FAKE123',
  'NOTREAL',
  'XYZ123',
];

/**
 * Special tickers with dots
 */
export const dotTickers = [
  'BRK.B',
  'BRK.A',
];
