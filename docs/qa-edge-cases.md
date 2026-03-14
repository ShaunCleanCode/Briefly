# Edge Case Catalog

> **Purpose**: Comprehensive list of edge cases to test for the onboarding flow  
> **Total Cases**: 45  
> **Last Updated**: 2026-01-29

---

## Category 1: Network Conditions (8 cases)

| # | Edge Case | Expected Behavior | Priority |
|---|-----------|-------------------|----------|
| NET-1 | **Slow network (3G)** during answer submission | Loading state shows, submission completes eventually, no timeout error under 10s | P1 |
| NET-2 | **Network drops** mid-submission | ErrorBanner appears with retry option; answer not lost | P0 |
| NET-3 | **Offline** when tapping continue | Error displayed immediately; can retry when back online | P0 |
| NET-4 | **Flaky network** (intermittent drops) | Retry logic handles; no duplicate submissions | P1 |
| NET-5 | **Network restored** after offline queue | Queued answers submitted automatically; progress updates | P1 |
| NET-6 | **Timeout** on POST /answer (>30s) | Error message, retry available, answer not duplicated | P1 |
| NET-7 | **Slow network on initial load** | LoadingSkeleton shows; page eventually loads | P0 |
| NET-8 | **Network error on completion** POST | Error shown; user can retry; profile not half-saved | P0 |

---

## Category 2: Session & Resume (8 cases)

| # | Edge Case | Expected Behavior | Priority |
|---|-----------|-------------------|----------|
| SES-1 | **Close tab** mid-onboarding | Session persisted; resumable | P0 |
| SES-2 | **Refresh page** (F5) mid-question | Resumes at current or last completed question | P0 |
| SES-3 | **Browser back button** pressed | Returns to previous question OR shows confirmation dialog | P1 |
| SES-4 | **Different device** same account | Session syncs; resumes at correct question | P1 |
| SES-5 | **Session expires** (token timeout) | Re-auth flow; session state preserved | P1 |
| SES-6 | **Completed user** returns to `/onboarding` | Redirect to `/dashboard` | P0 |
| SES-7 | **Multiple tabs** open on same session | No conflicts; last write wins or locks | P2 |
| SES-8 | **Clear browser storage** mid-session | Backend session persists; client re-fetches on refresh | P1 |

---

## Category 3: Consent Flow (7 cases)

| # | Edge Case | Expected Behavior | Priority |
|---|-----------|-------------------|----------|
| CON-1 | **Decline consent** | Redirect to `/onboarding/declined`; no profile data stored | P0 |
| CON-2 | **Recovery from decline** | Can tap "동의하고 계속하기"; session resumes at job_title | P0 |
| CON-3 | **Exit to basic** from declined | Navigates to dashboard; basic service only | P1 |
| CON-4 | **Back from post-consent question** | Cannot navigate back past consent (blocked) | P0 |
| CON-5 | **Double-tap accept** | No duplicate submission; single consent recorded | P1 |
| CON-6 | **Consent page reload** | Same consent question shown if not yet answered | P1 |
| CON-7 | **API error on consent submit** | ErrorBanner; can retry; no partial state | P0 |

---

## Category 4: Validation (7 cases)

| # | Edge Case | Expected Behavior | Priority |
|---|-----------|-------------------|----------|
| VAL-1 | **Empty text field submit** (job_title) | If skippable, prompts skip; if required, validation error | P1 |
| VAL-2 | **Text over max length** (>100 chars) | Truncated or error message | P1 |
| VAL-3 | **Special characters** in job_title | Allowed per validation regex (letters, numbers, spaces, hyphens) | P1 |
| VAL-4 | **HTML/script injection** in text input | Sanitized; no XSS vulnerability | P0 |
| VAL-5 | **Multi-choice exceed max** (4 sectors when max=3) | 4th selection blocked; UI indicates max reached | P0 |
| VAL-6 | **Time outside valid range** (03:00 AM) | Error or clamped to 05:00–22:00 | P1 |
| VAL-7 | **Submit without answering** single_choice | Cannot proceed; must select or skip | P1 |

---

## Category 5: Ticker Search (9 cases)

| # | Edge Case | Expected Behavior | Priority |
|---|-----------|-------------------|----------|
| TKR-1 | **Case-insensitive search** "aapl" | Returns AAPL | P0 |
| TKR-2 | **Dot ticker** "BRK.B" | Returns Berkshire Hathaway Class B | P0 |
| TKR-3 | **Dot ticker** "BF.B" | Returns Brown-Forman Class B | P1 |
| TKR-4 | **Partial match** "Appl" | Returns AAPL (Apple Inc.) | P1 |
| TKR-5 | **Company name search** "Microsoft" | Returns MSFT | P1 |
| TKR-6 | **Invalid ticker** "ZZZZZ" | "해당하는 S&P 500 종목이 없습니다" message | P0 |
| TKR-7 | **Max tickers (10) reached** | Input disabled; shows "최대 10개 선택됨" | P0 |
| TKR-8 | **Remove ticker chip** | Ticker removed; input re-enabled | P0 |
| TKR-9 | **Duplicate ticker add** | Prevented; ticker not duplicated in list | P1 |

---

## Category 6: Back Navigation & Editing (6 cases)

| # | Edge Case | Expected Behavior | Priority |
|---|-----------|-------------------|----------|
| BACK-1 | **Back on first question** (consent) | Back button disabled or hidden | P0 |
| BACK-2 | **Back after multiple answers** | Returns to previous question with prefilled answer | P0 |
| BACK-3 | **Edit and resubmit** same answer | No error; proceeds forward | P1 |
| BACK-4 | **Edit to different answer** | Old answer cleared; new saved; derived fields update | P0 |
| BACK-5 | **Multi-hop back** (3+ questions) | Each question shows correct prefilled answer | P1 |
| BACK-6 | **Back on conditional question** | Branching re-evaluates correctly | P2 |

---

## Category 7: Accessibility & Reduced Motion (5 cases)

| # | Edge Case | Expected Behavior | Priority |
|---|-----------|-------------------|----------|
| A11Y-1 | **Keyboard-only navigation** | All interactive elements reachable via Tab; Enter activates | P1 |
| A11Y-2 | **Screen reader** on question | Title and options announced clearly | P1 |
| A11Y-3 | **Reduced motion preference** | Page transitions use opacity only; no slide animations | P1 |
| A11Y-4 | **High contrast mode** | UI remains legible and functional | P2 |
| A11Y-5 | **Focus trap in dropdown** | Focus stays within dropdown; Escape closes | P1 |

---

## Category 8: i18n & Copy Overflow (5 cases)

| # | Edge Case | Expected Behavior | Priority |
|---|-----------|-------------------|----------|
| I18N-1 | **Long Korean text** in option labels | Wraps properly; no truncation | P1 |
| I18N-2 | **Long company name** in ticker dropdown | Truncates with ellipsis; tooltip on hover (desktop) | P2 |
| I18N-3 | **RTL text** (if future i18n) | Layout adjusts (future consideration) | P2 |
| I18N-4 | **Emoji in title** (🎉) | Renders correctly on all platforms | P2 |
| I18N-5 | **Very long job_title input** | Input scrolls or shows overflow indicator | P1 |

---

## Summary by Priority

| Priority | Count | Must Pass for Release |
|----------|-------|----------------------|
| P0 | 18 | ✅ All must pass |
| P1 | 22 | ⚠️ Track failures |
| P2 | 5 | 📝 Document for backlog |

---

## Test Execution Tips

### Network Testing
- Use browser DevTools > Network > Throttling
- "Slow 3G" for slow network tests
- "Offline" for offline tests
- Consider using Charles Proxy for finer control

### Session Testing
- Use incognito mode for fresh sessions
- Test cross-browser with same account
- Check localStorage/sessionStorage contents in DevTools

### Ticker Testing
- Keep a list of edge-case tickers handy:
  - Dot tickers: BRK.B, BRK.A, BF.B, BF.A
  - Short symbols: A, C, V, F
  - Common searches: AAPL, MSFT, GOOGL, AMZN

### Accessibility Testing
- macOS: System Preferences > Accessibility > Reduce Motion
- Chrome DevTools: Rendering > Emulate prefers-reduced-motion
- VoiceOver (macOS): Cmd + F5
- NVDA (Windows): Free screen reader

---

*Document Version: 1.0*  
*Created: 2026-01-29*
