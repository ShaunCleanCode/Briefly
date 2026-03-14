# Onboarding Demo Script

> **Purpose**: Guide a live demo session for user interviews  
> **Audience**: Demo facilitator + observer  
> **Prerequisites**: 
> - Test account ready (not completed onboarding)
> - Device charged, screen mirroring set up
> - Clear browser cache before starting

---

## Quick Reference: Fallback Actions

| If This Happens | Do This |
|-----------------|---------|
| Page freezes | Refresh, resume will auto-restore |
| Network error banner | Tap "다시 시도" or refresh |
| Wrong question appears | Tap back (←), navigate manually |
| Confetti doesn't fire | Not blocking—continue to dashboard |
| Session lost | Re-login, session should auto-resume |

---

## SHORT PATH (2–3 minutes)
> For time-constrained demos or quick feature showcase

### Setup
- Open device, navigate to app login page
- Login with test account
- Confirm redirected to `/onboarding`

### Demo Flow

**[00:00] START**
> 🎤 *"Briefly;는 매일 맞춤형 투자 레터를 보내드리는 서비스입니다. 먼저 여러분에 대해 조금 알아볼게요."*

1. **Consent Screen**
   - Point out: "개인정보 보호 배지와 명확한 동의 버튼"
   - Tap: **"동의합니다"**
   
2. **Job Title (Skip)**
   - Point out: "원하시면 건너뛰실 수 있어요"
   - Tap: **"건너뛰기"**

3. **Industry (Skip)**
   - Tap: **"건너뛰기"**

4. **Experience Years**
   > 🎤 *"투자 경험을 선택해 주세요"*
   - Tap: **"1~3년"**
   - Point out: "선택하면 자동으로 다음으로 넘어가요"

5. **Investment Goal**
   - Tap: **"자산 증식"**

6. **Risk Tolerance**
   - Tap: **"균형"**

7. **Time Availability**
   - Tap: **"10-15분 (적당한 깊이)"**

8. **Watchlist Sectors**
   > 🎤 *"관심 있는 섹터를 골라보세요"*
   - Tap: **"기술 (Tech)"** and **"헬스케어"**
   - Tap: **"계속하기"**

9. **Delivery Time**
   > 🎤 *"레터를 받을 시간을 선택하세요"*
   - Tap preset: **"아침 (07:00)"** or manually set
   - Tap: **"계속하기"**

10. **Skip remaining optional questions**
    - For role_function, seniority, tickers, portfolio_size, has_portfolio:
    - Tap **"건너뛰기"** repeatedly

**[~02:00] COMPLETION**
> 🎤 *"축하합니다! 온보딩이 완료되었습니다."*
- Point out: Confetti animation
- Point out: Profile summary showing selections
- Tap: **"시작하기"**

**[~02:30] END**
- Now on dashboard
> 🎤 *"내일부터 맞춤 레터를 받으실 수 있습니다."*

---

## FULL PATH (5–7 minutes)
> For comprehensive feature demonstration

### Setup
- Open device, clear cache/storage
- Login with fresh test account
- Confirm at `/onboarding`

### Demo Flow

**[00:00] START**
> 🎤 *"Briefly;의 온보딩 경험을 보여드리겠습니다. Duolingo 스타일의 인터랙티브 UI로 만들었어요."*

---

#### Phase 1: Consent (30 sec)

**Screen: consent_personalization**
> 🎤 *"먼저 맞춤형 서비스를 위한 동의를 받습니다."*

- Point out:
  - Shield icon → privacy focus
  - Character waving → friendly UX
  - Two clear button options

- Tap: **"동의합니다"**
- Point out: Loading state "처리 중..."
- Point out: Progress bar updates

---

#### Phase 2: Professional Context (1 min)

**Screen: job_title**
> 🎤 *"직무를 입력하면 더 정확한 콘텐츠를 드릴 수 있어요."*

- Type: **"프로덕트 매니저"**
- Point out: Character shows "thinking" emotion
- Tap: **"계속하기"**

**Screen: industry**
> 🎤 *"산업군 선택이에요."*

- Tap: **"기술/IT"**
- Point out: Auto-advance with checkmark animation

---

#### Phase 3: Investment Profile (1.5 min)

**Screen: experience_years**
> 🎤 *"투자 경험을 선택해 주세요."*

- Tap: **"3~5년"**

**Screen: investment_goal**
- Tap: **"자산 증식"**

**Screen: risk_tolerance**
> 🎤 *"위험 성향은요?"*

- Tap: **"균형 (적정 수준의 위험 감수)"**

**Screen: time_availability**
> 🎤 *"얼마나 깊이 있는 콘텐츠를 원하시나요?"*

- Tap: **"10-15분 (적당한 깊이)"**

---

#### Phase 4: Watchlist Setup (1.5 min)

**Screen: watchlist_sectors**
> 🎤 *"관심 섹터를 최대 3개까지 선택하세요."*

- Tap: **"기술 (Tech)"**
- Tap: **"헬스케어"**
- Tap: **"에너지"**
- Point out: Counter "3/3 선택됨"
- Tap: **"계속하기"**

**Screen: delivery_time**
> 🎤 *"매일 레터를 받을 시간을 정하세요."*

- Tap: **"아침 (07:00)"**
- Tap: **"계속하기"**

---

#### Phase 5: Optional Deep-Dive (1 min)

**Screen: role_function** (conditional—shows if job_title was entered)
> 🎤 *"더 자세한 정보를 주시면 더 정확해져요."*

- Tap: **"프로덕트/기획"**

**Screen: seniority**
- Tap: **"시니어 (6-10년)"**

**Screen: watchlist_tickers**
> 🎤 *"관심 종목을 검색해서 추가해 보세요."*

- Type: **"AAPL"**
- Point out: Dropdown with company name
- Tap result to add
- Type: **"NVDA"** → add
- Type: **"BRK.B"** → add (dot ticker!)
> 🎤 *"점이 있는 티커도 잘 됩니다."*
- Tap: **"계속하기"**

**Screen: portfolio_size_range**
- Tap: **"건너뛰기"** (sensitive question)

**Screen: has_portfolio**
- Tap: **"나중에 할게요"**

---

#### Phase 6: Back Navigation Demo (30 sec)

> 🎤 *"방금 입력한 정보를 수정하고 싶으면요..."*

- Tap: **← Back button**
- Point out: Previous answer prefilled
- Point out: Animation direction reversed
- Tap: **"계속하기"** without changing

---

#### Phase 7: Completion (30 sec)

**Screen: /onboarding/done**
> 🎤 *"완료되었습니다!"*

- Point out: Confetti celebration
- Point out: Character celebrating
- Point out: Profile summary card with selections
- Point out: "시작하기" CTA

- Tap: **"시작하기"**

**Screen: Dashboard**
> 🎤 *"이제 대시보드입니다. 내일 아침 첫 번째 맞춤 레터를 받으실 수 있어요."*

**[~06:00] END**

---

## DECLINE PATH DEMO (Optional, +1 min)

> For demonstrating consent decline & recovery flow

**From fresh session:**

1. At consent screen:
   > 🎤 *"동의하지 않으면 어떻게 되는지 보여드릴게요."*
   - Tap: **"동의하지 않습니다"**

2. **Screen: /onboarding/declined**
   - Point out: Character "concerned"
   - Point out: Clear explanation of limitations
   - Point out: "동의하고 계속하기" recovery option
   - Point out: "기본 레터만 보기" exit option

3. Recovery:
   > 🎤 *"마음이 바뀌면 다시 동의할 수 있어요."*
   - Tap: **"동의하고 계속하기"**
   - Point out: Toast "동의해 주셔서 감사합니다!"
   - Now continues with onboarding

---

## Facilitator Notes

### Talking Points to Emphasize
- "Duolingo-inspired friendly UX"
- "Privacy-first with clear consent"
- "Can always skip sensitive questions"
- "Session saves automatically—can resume anytime"
- "Micro-interactions make it feel polished"

### Common Questions & Answers

**Q: Can I change my answers later?**
> A: Yes, you can edit settings anytime in the profile section after completing.

**Q: What if I don't want to share my portfolio?**
> A: Totally fine! All portfolio questions are optional. You'll still get great general content.

**Q: How long does this take?**
> A: About 2-3 minutes if you skip optional questions, 5-7 minutes for full customization.

**Q: What if I close the browser?**
> A: Your progress is saved automatically. You'll resume right where you left off.

---

## Post-Demo Checklist

- [ ] Note any issues encountered
- [ ] Document user feedback/confusion points
- [ ] Reset test account if needed for next demo
- [ ] File bug reports for any failures

---

*Document Version: 1.0*  
*Created: 2026-01-29*
