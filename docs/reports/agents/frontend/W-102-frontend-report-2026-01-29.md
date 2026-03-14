# W-102 | P1: Replace partial S&P500 list with full static dataset

## Task Summary
| 항목 | 내용 |
|------|------|
| Task ID | W-102 |
| Priority | P1 |
| Status | ✅ Complete |
| Date | 2026-01-29 |
| Agent | Frontend Engineer |

## Objective
- 기존 partial ticker list를 최신 S&P 500 전체 데이터셋으로 교체
- Dot ticker (BRK.B, BF.B) 포함 확인
- 검색 UX 성능 유지

## Changes Made

### 1. `src/data/sp500-tickers.json` 업데이트
- **Source**: Wikipedia "List of S&P 500 companies" (2026-01 기준)
- **Total tickers**: 503개
- **Dot tickers included**: BRK.B (Berkshire Hathaway), BF.B (Brown-Forman)
- **Format**: `{ symbol, name, sector }` JSON array

### 2. 데이터 특징
- 최신 S&P 500 구성 종목 반영
- 2025-2026 신규 편입 종목 포함:
  - APP (AppLovin)
  - COIN (Coinbase)
  - CRWD (CrowdStrike)
  - DDOG (Datadog)
  - DASH (DoorDash)
  - HOOD (Robinhood Markets)
  - IBKR (Interactive Brokers)
  - PLTR (Palantir Technologies)
  - TTD (Trade Desk)
  - 등

## Test Results

| Test Suite | Result |
|------------|--------|
| `npm run lint` | ✅ Pass (0 warnings/errors) |
| `npm run build` | ✅ Pass |
| `npm run test:e2e:smoke` | ✅ Pass |
| `npm run test:e2e:regression` | ✅ **21/21 passed** |

### Key Test Case
- **OB-TC-112: accepts dot ticker BRK.B** ✅ Pass

## Acceptance Criteria

| Criteria | Status |
|----------|--------|
| Static versioned dataset in repo | ✅ |
| All S&P500 symbols included (503) | ✅ |
| Dot tickers (BRK.B, BF.B) included | ✅ |
| Search UX fast (memoization) | ✅ (기존 useSP500Tickers hook 유지) |
| No regression in onboarding flows | ✅ |

## Files Changed
- `src/data/sp500-tickers.json` - Full S&P 500 dataset (503 companies)

## Notes
- 데이터 소스: Wikipedia "List of S&P 500 companies" (user 제공)
- 기존 `useSP500Tickers.ts` hook의 검색 로직 변경 없음 (이미 최적화됨)
- S&P 500은 분기별로 rebalancing되므로, 필요시 동일 방식으로 업데이트 가능
