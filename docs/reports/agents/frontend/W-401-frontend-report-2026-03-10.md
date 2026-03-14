## Agent Task Report — W-401

### Header
- **Date**: 2026-03-10
- **Agent**: Frontend Engineer Agent
- **Task ID(s)**: W-401
- **Priority**: P1
- **Status**: done

---

## 1) Executive Summary
- **What changed**: Added procedural eyes (rounded rectangle ShapeGeometry) to the glass sphere, with idle blink animation and emotion-driven transforms for neutral/happy/thinking states.
- **Why it matters**: The sphere now reads as a "character" — eyes provide personality and emotion feedback, which is the core UX differentiator for the Briefly copilot.
- **What is unblocked now**: W-402 (full 8-emotion system with color hue lerp) and W-403 (micro-interactions) can proceed.

---

## 2) Acceptance Criteria Check
- [x] AC-1: Two white eyes render on the sphere surface
- [x] AC-2: Idle blink animation fires periodically (2.5–5s interval, 0.12s duration)
- [x] AC-3: `emotion` prop switches between neutral/happy/thinking with smooth lerp transitions

---

## 3) Evidence (required)

### Commands run

| Command | Exit Code | Notes |
|---------|-----------|-------|
| `npm run build` | 0 | 12 routes compiled, `/dev/character` at 2.19 kB first load |
| `npm run lint` | 0 | No ESLint warnings or errors |

### Build output (key excerpt)
```
Route (app)                              Size     First Load JS
├ ○ /dev/character                       2.19 kB         124 kB
```
Minimal size increase from W-400 (1.98 → 2.19 kB) — eyes geometry is lightweight.

---

## 4) Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/components/character/useEmotionState.ts` | **new** | Emotion state machine hook — per-eye transforms (scaleY, positionY, rotationZ), color mapping, blink timer with MathUtils.lerp interpolation |
| `src/components/character/BrieflyEyes.tsx` | **new** | Procedural eyes — rounded rectangle ShapeGeometry, white emissive MeshStandardMaterial, per-frame blink + emotion transform application |
| `src/components/character/BrieflySphere.tsx` | modified | Accepts `emotion` prop, lerps attenuationColor/color per emotion |
| `src/components/character/BrieflyScene.tsx` | modified | Accepts `emotion` prop, wraps sphere + eyes in shared group with idle float animation |
| `src/components/character/BrieflyCharacter3D.tsx` | modified | Accepts and passes through `emotion` prop |
| `src/app/dev/character/page.tsx` | modified | Added emotion toggle buttons (Neutral / Happy / Thinking) for live testing |
| `docs/ops/agent-workboard.md` | modified | W-401 status: `todo` → `done` |

**NOT modified**: `src/components/onboarding/BrieflyCharacter.tsx` (preserved as fallback)

---

## 5) Risks / Rollback

- **Risk**: Eye z-position (`sphereRadius * 0.92`) is hand-tuned — may need adjustment if sphere radius changes or if eyes clip through on certain camera angles.
- **Risk**: `useFrame` runs per-frame for blink + emotion lerp on both eyes. Minimal overhead but worth profiling in W-404.
- **Rollback plan**: Revert `useEmotionState.ts` and `BrieflyEyes.tsx`, restore previous versions of Scene/Sphere/Character3D.

---

## 6) Next Recommended Action (PM)

- **Who**: Frontend Engineer Agent
- **Next task ID**: W-402
- **Why**: The 3-emotion foundation is in place. W-402 extends to all 8 emotions (angry, sad, curious, wink, celebrating) with full hue-shift color system and additional eye morphs (wink close, angry V-shape). This completes the emotion expressiveness before interaction work in W-403.

### Technical notes for W-402
- `useEmotionState.ts` already has placeholder configs for celebrating/concerned/waving — these need refinement + addition of angry/sad/curious/wink
- Color lerp is implemented in `BrieflySphere.tsx` via `Color.lerp()` — ready for expanded palette
- Eye transform system supports arbitrary scaleY/positionY/rotationZ per eye — sufficient for all planned expressions
