# Onboarding QA Checklist (Release Candidate)

## Test Environment Matrix

### Devices & Browsers
| Device Type | Browser | Priority | Notes |
|-------------|---------|----------|-------|
| iPhone Safari | iOS 16+ | P0 | iOS Simulator acceptable |
| Android Chrome | Android 12+ | P0 | Emulator acceptable |
| Desktop Chrome | Latest | P0 | Primary dev browser |
| Desktop Safari | Latest | P1 | macOS users |
| Desktop Firefox | Latest | P2 | Secondary coverage |

### Viewport Sizes
| Size | Dimensions | Notes |
|------|------------|-------|
| Small Mobile | 375×667 | iPhone SE/8 |
| Large Mobile | 414×896 | iPhone 11/12/13 Pro Max |
| Tablet | 768×1024 | iPad |
| Desktop | 1440×900 | Standard laptop |

---

## SMOKE TEST (10–15 minutes)
> **Purpose**: Fast confidence check before demo or release  
> **Pass Criteria**: All P0 items must pass

### Pre-flight
- [ ] Clear browser cache/storage before starting
- [ ] Note test device/browser/viewport
- [ ] Ensure network is stable

### S1: Consent Flow (2 min)
| # | Step | Expected | P |
|---|------|----------|---|
| S1.1 | Navigate to `/onboarding` | Shell loads with progress bar at 0%, character waving | P0 |
| S1.2 | Read consent question | Title "맞춤형 서비스를 위해 정보를 저장할까요?" visible, accept/decline buttons present | P0 |
| S1.3 | Tap "동의합니다" | Character emotion changes, progress updates, next question appears | P0 |

### S2: Single Choice Question (1 min)
| # | Step | Expected | P |
|---|------|----------|---|
| S2.1 | See experience_years question | 4 choice options displayed in cards | P0 |
| S2.2 | Tap any option | Selection highlights with checkmark, auto-advances after ~400ms | P0 |

### S3: Multi Choice Question (2 min)
| # | Step | Expected | P |
|---|------|----------|---|
| S3.1 | Navigate to watchlist_sectors | Grid of sector options shown | P0 |
| S3.2 | Select 2 sectors | Both show selected state, count shows "2/3 선택됨" | P0 |
| S3.3 | Tap "계속하기" | Advances to next question | P0 |

### S4: Ticker Search (2 min)
| # | Step | Expected | P |
|---|------|----------|---|
| S4.1 | Navigate to watchlist_tickers | Search input visible with placeholder | P0 |
| S4.2 | Type "AAPL" | Dropdown shows Apple Inc. result | P0 |
| S4.3 | Select AAPL | Chip appears below input | P0 |
| S4.4 | Search "BRK.B" (dot ticker) | Berkshire Hathaway appears | P0 |
| S4.5 | Tap "계속하기" | Advances with selected tickers | P0 |

### S5: Skip Functionality (1 min)
| # | Step | Expected | P |
|---|------|----------|---|
| S5.1 | On any skippable question | "건너뛰기" button visible | P0 |
| S5.2 | Tap skip | Progress increments, next question appears | P0 |

### S6: Back Navigation (2 min)
| # | Step | Expected | P |
|---|------|----------|---|
| S6.1 | After 3+ questions answered | Back button (←) visible and enabled | P0 |
| S6.2 | Tap back button | Previous question appears with prefilled answer | P0 |
| S6.3 | Edit and resubmit | Progress correct, continues forward | P0 |

### S7: Completion (2 min)
| # | Step | Expected | P |
|---|------|----------|---|
| S7.1 | Complete all questions | Redirects to `/onboarding/done` | P0 |
| S7.2 | Done page loads | Confetti animation, celebrating character visible | P0 |
| S7.3 | Profile summary shown | Key settings displayed correctly | P0 |
| S7.4 | Tap "시작하기" | Navigates to `/dashboard` | P0 |

### S8: Resume Session (2 min)
| # | Step | Expected | P |
|---|------|----------|---|
| S8.1 | Mid-flow, close tab | N/A |
| S8.2 | Re-open `/onboarding` | Resumes at last unanswered question, toast "이전에 하던 곳에서 계속합니다" | P0 |

---

## FULL REGRESSION (45–90 minutes)
> **Purpose**: Comprehensive pre-release validation  
> **Pass Criteria**: All P0 pass, P1 count tracked, P2 documented

### Section 1: Consent Handling (10 min)

#### 1.1 Accept Path
| # | Step | Expected | P |
|---|------|----------|---|
| 1.1.1 | Fresh session, consent question | Shield icon, privacy badge visible | P1 |
| 1.1.2 | "개인정보처리방침" link | Opens in new tab | P1 |
| 1.1.3 | Tap "동의합니다" | Loading state shows "처리 중...", then advances | P0 |
| 1.1.4 | Backend consent recorded | (API verify: consent_record has granted=true) | P0 |

#### 1.2 Decline Path
| # | Step | Expected | P |
|---|------|----------|---|
| 1.2.1 | Tap "동의하지 않습니다" | Redirects to `/onboarding/declined` | P0 |
| 1.2.2 | Declined page content | Character "concerned", explains limitations | P0 |
| 1.2.3 | "동의하고 계속하기" button | Returns to `/onboarding`, session resumes | P0 |
| 1.2.4 | "기본 레터만 보기" button | Navigates to `/dashboard` | P1 |

#### 1.3 Recovery Flow
| # | Step | Expected | P |
|---|------|----------|---|
| 1.3.1 | From declined page, accept consent | Toast "동의해 주셔서 감사합니다!" | P1 |
| 1.3.2 | Session continues | Next question (job_title) appears | P0 |

### Section 2: Question Types (15 min)

#### 2.1 consent (already tested above)

#### 2.2 single_choice
| # | Step | Expected | P |
|---|------|----------|---|
| 2.2.1 | experience_years displays | 4 options: 처음입니다/1~3년/3~5년/5년 이상 | P0 |
| 2.2.2 | Tap selection | Press feedback (scale 0.98), checkmark appears | P1 |
| 2.2.3 | Auto-advance timing | ~400ms delay then next question | P1 |
| 2.2.4 | Keyboard: arrow keys | Focus moves between options | P1 |
| 2.2.5 | Keyboard: Enter | Selects and advances | P1 |

#### 2.3 multi_choice
| # | Step | Expected | P |
|---|------|----------|---|
| 2.3.1 | watchlist_sectors displays | Grid layout, max 3 selectable | P0 |
| 2.3.2 | Select 3 | Counter shows "3/3 선택됨" | P0 |
| 2.3.3 | Try select 4th | Cannot select (at max) | P0 |
| 2.3.4 | Deselect one | Counter updates, 4th now selectable | P1 |
| 2.3.5 | Continue button | Only enabled when ≥1 selected (or 0 if skippable) | P0 |

#### 2.4 text
| # | Step | Expected | P |
|---|------|----------|---|
| 2.4.1 | job_title question | Input field with placeholder "직무/직책을 입력해주세요" | P0 |
| 2.4.2 | Type "소프트웨어 엔지니어" | Text appears, no validation error | P0 |
| 2.4.3 | Submit | Advances to next | P0 |
| 2.4.4 | 100+ character input | Truncated or error message | P1 |
| 2.4.5 | Empty submit (if skippable) | Prompts skip or shows validation | P1 |

#### 2.5 ticker_search
| # | Step | Expected | P |
|---|------|----------|---|
| 2.5.1 | Search "apple" (lowercase) | Case-insensitive: shows AAPL | P0 |
| 2.5.2 | Search "NVDA" (uppercase) | Shows NVIDIA | P0 |
| 2.5.3 | Search "BRK.B" (dot ticker) | Shows Berkshire Hathaway | P0 |
| 2.5.4 | Search "INVALID123" | "해당하는 S&P 500 종목이 없습니다" message | P0 |
| 2.5.5 | Add 10 tickers | Max reached, input disabled | P0 |
| 2.5.6 | Remove chip (X button) | Ticker removed, input enabled | P0 |
| 2.5.7 | Submit with 0 tickers | Treated as skip (if skippable) | P1 |
| 2.5.8 | Dropdown keyboard nav | Enter selects first result | P1 |

#### 2.6 time_picker
| # | Step | Expected | P |
|---|------|----------|---|
| 2.6.1 | delivery_time question | Time presets visible: 아침/점심/저녁 | P0 |
| 2.6.2 | Tap preset "아침 (07:00)" | Time selected, can continue | P0 |
| 2.6.3 | Custom time input | Can set any time 05:00–22:00 | P1 |
| 2.6.4 | Invalid time (e.g., 03:00) | Error or blocked | P1 |

### Section 3: Skip Rules (5 min)
| # | Step | Expected | P |
|---|------|----------|---|
| 3.1 | consent question | NO skip button visible | P0 |
| 3.2 | job_title question | Skip button visible | P0 |
| 3.3 | Tap skip | Progress increments, field stored as skipped | P0 |
| 3.4 | Complete via all skips | Completion works, profile has defaults | P1 |

### Section 4: Back Navigation & Editing (10 min)
| # | Step | Expected | P |
|---|------|----------|---|
| 4.1 | At question 1 (consent) | Back button disabled or hidden | P0 |
| 4.2 | At question 3+ | Back button enabled | P0 |
| 4.3 | Tap back | Animation slides right-to-left (reverse) | P1 |
| 4.4 | Previous answer prefilled | Selected option/text shown | P0 |
| 4.5 | Change answer | Old selection clears, new shows | P0 |
| 4.6 | Submit edited answer | Progress correct, moves forward | P0 |
| 4.7 | Submit unchanged | No error, moves forward | P1 |
| 4.8 | Back twice (multi-hop) | Correct questions shown in order | P1 |
| 4.9 | Back on consent | Cannot go back past consent (blocked) | P0 |

### Section 5: Resume Session (10 min)
| # | Step | Expected | P |
|---|------|----------|---|
| 5.1 | Answer 5 questions, close tab | N/A |
| 5.2 | Re-open in same browser | Resumes at question 6 | P0 |
| 5.3 | Resume toast | "이전에 하던 곳에서 계속합니다" appears | P1 |
| 5.4 | Progress bar correct | Shows ~35% (5/14) | P0 |
| 5.5 | Answer 2 more, force refresh (F5) | Resumes at question 8 | P0 |
| 5.6 | Different browser (logged in) | Session resumes correctly | P1 |
| 5.7 | Completed user visits `/onboarding` | Redirect to `/dashboard` | P0 |

### Section 6: Validation & Error States (10 min)
| # | Step | Expected | P |
|---|------|----------|---|
| 6.1 | Network error on submit | ErrorBanner appears, retry option | P0 |
| 6.2 | ErrorBanner dismiss | Banner hides | P1 |
| 6.3 | ErrorBanner retry | Re-attempts submission | P0 |
| 6.4 | Character on error | Emotion changes to "concerned" | P1 |
| 6.5 | Invalid ticker submission (bypass UI) | Server rejects, error shown | P1 |
| 6.6 | Shake animation on validation error | Input/card shakes horizontally | P2 |

### Section 7: Completion Screen (5 min)
| # | Step | Expected | P |
|---|------|----------|---|
| 7.1 | Final question submit | Redirect to `/onboarding/done` | P0 |
| 7.2 | Confetti fires | Multi-color confetti from sides | P1 |
| 7.3 | Character celebrating | Large celebrating emotion | P0 |
| 7.4 | Title "환영합니다! 🎉" | Visible with gradient text | P0 |
| 7.5 | Profile summary card | Shows derived settings (delivery time, sectors, etc.) | P0 |
| 7.6 | "시작하기" button | Large, gradient style, navigates to dashboard | P0 |

### Section 8: Performance & Feel (5 min)
| # | Step | Expected | P |
|---|------|----------|---|
| 8.1 | Initial load time | <2s on fast 3G | P0 |
| 8.2 | Question transition | Smooth, no visible jank | P1 |
| 8.3 | Ticker search debounce | No flickering, 150ms delay | P1 |
| 8.4 | Tap feedback | Immediate (no perceptible delay) | P0 |
| 8.5 | Animation blocking input | Can still tap during animations | P0 |

### Section 9: Accessibility (10 min)
| # | Step | Expected | P |
|---|------|----------|---|
| 9.1 | Tab navigation | Logical order through all interactive elements | P1 |
| 9.2 | Focus visible | Clear focus ring on all focusable elements | P1 |
| 9.3 | Choice cards ARIA | role="radiogroup" and role="radio" | P1 |
| 9.4 | Multi-choice ARIA | role="checkbox" or similar | P1 |
| 9.5 | Screen reader: question read | Title announced clearly | P1 |
| 9.6 | Screen reader: progress | Progress announced on change | P2 |
| 9.7 | Reduced motion: page transitions | Opacity-only (no slide) | P1 |
| 9.8 | Reduced motion: confetti | Still fires but simplified | P2 |

### Section 10: Copy & i18n (5 min)
| # | Step | Expected | P |
|---|------|----------|---|
| 10.1 | All Korean text | Correct grammar, no English placeholders | P0 |
| 10.2 | Skip labels | "건너뛰기" consistent | P1 |
| 10.3 | Long text overflow | No truncation, proper wrapping | P1 |
| 10.4 | Emoji rendering | 🎉 displays correctly | P2 |

---

## Results Summary Template

```
Date: ____________
Tester: ____________
Device/Browser: ____________
Viewport: ____________

SMOKE TEST: [ ] PASS  [ ] FAIL
  - Failures: _______________

FULL REGRESSION:
  - P0 Pass: ___/___ 
  - P0 Fail: ___/___ → BLOCKS RELEASE
  - P1 Pass: ___/___
  - P1 Fail: ___/___ → Track issues
  - P2 Pass: ___/___
  - P2 Fail: ___/___ → Log for backlog

Notes:
_____________________
_____________________
```

---

*Document Version: 1.0*  
*Created: 2026-01-29*
