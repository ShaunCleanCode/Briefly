# Bug Report Template

> **Usage**: Copy this template for each new bug discovered during QA testing.

---

## Title Format

Use this format for bug titles:
```
[ONBOARD-XXX] [P0/P1/P2] <Component>: <Brief Description>
```

**Examples:**
- `[ONBOARD-001] [P0] TickerSearch: "BRK.B" not found in search results`
- `[ONBOARD-002] [P1] ConsentCard: Accept button unresponsive on first tap`
- `[ONBOARD-003] [P2] ProgressBar: Animation stutters on slow devices`

---

## Bug Report Template

```markdown
# [ONBOARD-XXX] [PX] Component: Brief Description

## Environment

| Field | Value |
|-------|-------|
| **Device** | (e.g., iPhone 14 Pro / Samsung Galaxy S23 / MacBook Pro M2) |
| **OS** | (e.g., iOS 17.2 / Android 14 / macOS 14.2) |
| **Browser** | (e.g., Safari 17.2 / Chrome 120 / Firefox 121) |
| **Viewport** | (e.g., 375×667 / 414×896 / 1440×900) |
| **Network** | (e.g., WiFi / Fast 3G / Offline) |
| **Build/Commit** | (e.g., main@abc1234 or "latest deploy") |
| **Tester** | (Your name/initials) |
| **Date** | YYYY-MM-DD |

## Steps to Reproduce

1. Navigate to `/onboarding`
2. Accept consent
3. ...
4. ...
5. **Observe:** [describe what happens]

## Expected Behavior

[Describe what should happen]

## Actual Behavior

[Describe what actually happens]

## Severity

| Level | Definition |
|-------|------------|
| **P0** | Blocks demo or release. Critical functionality broken. |
| **P1** | Important UX or logic issue. Should fix before release. |
| **P2** | Polish issue. Nice to fix but not blocking. |

**This bug is: P[0/1/2]**

### Justification
[Why this severity? e.g., "Users cannot complete onboarding without workaround"]

## Frequency

- [ ] 100% reproducible
- [ ] Intermittent (~X% of attempts)
- [ ] Rare (happened once)

## Workaround

[If any workaround exists, describe it. Otherwise write "None"]

## Attachments

- [ ] Screenshot(s)
- [ ] Screen recording
- [ ] Console logs
- [ ] Network logs

> **Note**: Do not include real user data or PII in screenshots. Use test/fictional data only.

## Suspected Component

[Optional: Your best guess at which component/file is responsible]

Examples:
- `src/components/onboarding/TickerSearch.tsx`
- `src/hooks/useQuestionEngine.tsx`
- Backend: `/api/onboarding/answer`

## Regression?

- [ ] **Yes** — This worked before (note when/which build)
- [ ] **No** — New functionality or never worked
- [ ] **Unknown** — First time testing this scenario

## Additional Context

[Any other relevant information: related bugs, user feedback, etc.]
```

---

## Filled Example

```markdown
# [ONBOARD-007] [P0] TickerSearch: Dot tickers like "BRK.B" return no results

## Environment

| Field | Value |
|-------|-------|
| **Device** | iPhone 14 Pro |
| **OS** | iOS 17.2 |
| **Browser** | Safari 17.2 |
| **Viewport** | 393×852 |
| **Network** | WiFi |
| **Build/Commit** | main@f8a2c91 |
| **Tester** | QA-Kim |
| **Date** | 2026-01-29 |

## Steps to Reproduce

1. Navigate to `/onboarding`
2. Accept consent, proceed to job_title question
3. Continue until watchlist_tickers question
4. Type "BRK.B" in search input
5. **Observe:** No results appear in dropdown

## Expected Behavior

Dropdown should show "BRK.B - Berkshire Hathaway Inc. Class B" as a selectable option.

## Actual Behavior

Dropdown shows "해당하는 S&P 500 종목이 없습니다" message.

## Severity

**This bug is: P0**

### Justification
BRK.B is a popular S&P 500 stock. Users expecting to add Berkshire Hathaway will be confused and may think the feature is broken. Demo risk is high.

## Frequency

- [x] 100% reproducible
- [ ] Intermittent
- [ ] Rare

## Workaround

User can search "Berkshire" instead of ticker symbol to find BRK.B.

## Attachments

- [x] Screenshot: search_brk_b_no_results.png
- [x] Screen recording: brk_b_bug_recording.mp4

## Suspected Component

- `src/hooks/useSP500Tickers.ts` — search function may not handle dot characters
- `src/data/sp500-tickers.json` — verify BRK.B is in the data file

## Regression?

- [ ] **Yes**
- [x] **No** — First time testing dot tickers
- [ ] **Unknown**

## Additional Context

Other dot tickers to verify: BF.B, BF.A
The search uses simple string matching which may be escaping the dot as regex.
```

---

## Severity Guidelines

### P0 — Blocker
- Onboarding cannot be completed
- Data loss occurs
- Session corrupted/unrecoverable
- Consent flow broken
- App crashes

### P1 — Important
- Feature works but incorrectly
- Confusing UX that misleads users
- Accessibility issue blocking screen reader users
- Back navigation corrupts data
- Resume session fails

### P2 — Polish
- Animation glitch
- Minor visual misalignment
- Copy typo
- Performance not ideal but acceptable
- Edge case in non-critical path

---

## Quick Bug Filing Tips

1. **Be specific**: "Button doesn't work" → "Accept button on ConsentCard does not trigger submit when tapped"
2. **Include context**: What question were you on? What was the previous answer?
3. **Test isolation**: Try to narrow down the exact trigger
4. **Screenshot > words**: One screenshot often explains more than a paragraph
5. **Device matters**: Mobile bugs often don't repro on desktop

---

*Document Version: 1.0*  
*Created: 2026-01-29*
