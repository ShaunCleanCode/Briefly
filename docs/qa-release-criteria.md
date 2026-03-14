# Release Sign-off Criteria

> **Purpose**: Define the quality gates for shipping the onboarding feature  
> **Applies to**: MVP release and subsequent updates  
> **Last Updated**: 2026-01-29

---

## Go/No-Go Decision Framework

### 🟢 GO — Ready to Ship

All of the following must be true:
- [ ] **P0 bugs: 0 open**
- [ ] **Smoke test: 100% pass** on at least 2 device types (1 mobile, 1 desktop)
- [ ] **Full regression: P0 section 100% pass**
- [ ] **Consent flow: Accept AND Decline paths verified working**
- [ ] **Resume session: Verified working on close/reopen**
- [ ] **Completion flow: Can reach `/onboarding/done` and see profile summary**

### 🟡 CONDITIONAL GO — Ship with Known Issues

May ship if:
- [ ] P0 bugs: 0 open
- [ ] P1 bugs: ≤3 open with documented workarounds
- [ ] P1 bugs do not affect core user journey (consent → answer → complete)
- [ ] Product owner approves known issue list
- [ ] Hotfix plan documented for P1 issues

### 🔴 NO-GO — Do Not Ship

Any of the following:
- [ ] Any P0 bug open
- [ ] Consent flow broken (accept or decline path fails)
- [ ] Session resume broken (data loss on refresh)
- [ ] Cannot complete onboarding flow end-to-end
- [ ] Security vulnerability (XSS, data leak, etc.)
- [ ] >5 P1 bugs open

---

## P0 Must-Pass Test Cases

These specific tests MUST pass for release:

| ID | Test Case | Pass Criteria |
|----|-----------|---------------|
| **P0-1** | Consent accept | User can tap "동의합니다" and proceed to next question |
| **P0-2** | Consent decline | User redirected to `/onboarding/declined` |
| **P0-3** | Consent recovery | User can recover from declined and continue onboarding |
| **P0-4** | Single choice selection | User can select option and auto-advances |
| **P0-5** | Multi choice selection | User can select multiple (up to max) and continue |
| **P0-6** | Ticker search basic | User can search "AAPL" and add to watchlist |
| **P0-7** | Ticker search dot ticker | User can search "BRK.B" and add to watchlist |
| **P0-8** | Skip functionality | User can skip skippable questions |
| **P0-9** | Back navigation | User can go back and see prefilled answer |
| **P0-10** | Session resume | User can close tab, reopen, and continue |
| **P0-11** | Completion | User reaches `/onboarding/done` after all questions |
| **P0-12** | Profile summary | Completion page shows user's selections |
| **P0-13** | Dashboard redirect | "시작하기" button navigates to dashboard |
| **P0-14** | Already completed | Completed user at `/onboarding` redirects to dashboard |
| **P0-15** | Error recovery | Network error shows banner with retry option |

---

## P1 Acceptance Thresholds

### Allowed P1 Issues (with documentation)

| Category | Max Open | Notes |
|----------|----------|-------|
| Animation/Motion | 3 | Visual polish, not blocking |
| Copy/Microcopy | 2 | Typos or unclear text |
| Keyboard navigation | 2 | Mouse/touch still works |
| Edge case validation | 2 | Rare scenarios |

### P1 Issues That Block Release

Even as P1, these specific issues block release:
- Back navigation corrupts answer data
- Progress bar shows incorrect percentage
- User stuck in infinite loop
- Profile summary shows wrong data
- Duplicate submissions recorded

---

## Required Test Coverage

### Device Matrix (Minimum)

| Device Type | Browser | Required |
|-------------|---------|----------|
| iPhone (any recent) | Safari | ✅ Must test |
| Android (any recent) | Chrome | ✅ Must test |
| Desktop Mac | Chrome | ✅ Must test |
| Desktop Mac | Safari | ⚠️ Should test |
| Desktop Windows | Chrome | ⚠️ Should test |

### Viewport Coverage (Minimum)

| Viewport | Required |
|----------|----------|
| Mobile (375px width) | ✅ Must test |
| Mobile (414px width) | ⚠️ Should test |
| Desktop (1440px width) | ✅ Must test |

---

## Test Execution Requirements

### Smoke Test
- **Duration**: 10-15 minutes
- **When**: Before every demo, before every deploy
- **Who**: Any team member
- **Pass Criteria**: All items checked

### Full Regression
- **Duration**: 45-90 minutes
- **When**: Before release, after major changes
- **Who**: QA lead or designated tester
- **Pass Criteria**: P0 100%, P1 tracked

---

## Sign-off Checklist

### Pre-Release Checklist

```
Release Version: ______________
Date: ______________
QA Lead: ______________

TESTING
[ ] Smoke test passed on mobile Safari
[ ] Smoke test passed on mobile Chrome
[ ] Smoke test passed on desktop Chrome
[ ] Full regression completed
[ ] P0 bugs: ___ open (must be 0)
[ ] P1 bugs: ___ open (track numbers)
[ ] P2 bugs: ___ open (document for backlog)

SPECIAL FOCUS AREAS
[ ] Consent decline → recovery path verified
[ ] Back navigation does not corrupt data
[ ] Resume session works on tab close/reopen
[ ] Ticker search handles BRK.B (dot ticker)
[ ] Max ticker count (10) enforced
[ ] Animations do not block input taps

SECURITY
[ ] XSS tested on text inputs
[ ] No PII in console logs
[ ] Consent recorded to database

PERFORMANCE
[ ] Initial load <3s on fast 3G
[ ] No visible jank on question transitions
[ ] Ticker search responsive (<300ms feedback)

ACCESSIBILITY
[ ] Keyboard navigation functional
[ ] Focus visible on all elements
[ ] Reduced motion respected
```

### Sign-off Signatures

```
QA Sign-off:
Name: ______________  Date: ______________
[ ] APPROVED for release
[ ] BLOCKED — see issues list

Product Sign-off:
Name: ______________  Date: ______________
[ ] APPROVED for release
[ ] BLOCKED — see issues list

Engineering Sign-off:
Name: ______________  Date: ______________
[ ] APPROVED for release
[ ] BLOCKED — see issues list
```

---

## Issue Escalation Matrix

| Issue Type | Escalate To | Response Time |
|------------|-------------|---------------|
| P0 (any) | Engineering Lead + PM | Immediate |
| P1 (>3 open) | PM | Within 2 hours |
| Security | Engineering Lead + Security | Immediate |
| Data loss | Engineering Lead + PM | Immediate |

---

## Post-Release Monitoring

### First 24 Hours

| Metric | Alert Threshold |
|--------|-----------------|
| Completion rate | <50% (normal ~80%) |
| Error rate | >5% of sessions |
| Consent decline rate | >30% (might indicate UX issue) |
| Session resume failures | >2% |

### Actions on Alert

1. **Completion rate low**: Check for blocking bugs, review error logs
2. **Error rate high**: Check server logs, network issues, API errors
3. **Consent decline high**: Review copy, may be UX concern (not bug)
4. **Resume failures**: Check session persistence, database connectivity

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-29 | Initial release criteria |

---

*Document Version: 1.0*  
*Created: 2026-01-29*
