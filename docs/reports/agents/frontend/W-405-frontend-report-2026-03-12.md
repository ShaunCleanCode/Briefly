# W-405 Frontend Report — 커비 볼 빵빵 + 입 메시

**Date**: 2026-03-12
**Owner**: Frontend Engineer Agent
**Status**: Done

---

## Summary

"puffed" 감정을 추가하여 커비처럼 볼이 빵빵하게 부풀고 입이 살짝 벌어지는 표정을 구현했다.

## Changes

### New Files
- `src/components/character/BrieflyMouth.tsx` — 프로시저럴 입 메시 (타원형 ShapeGeometry)
  - `openAmount` prop으로 입 열림 정도 제어 (0 = 닫힘/투명, 1 = 완전 열림)
  - smooth lerp로 열림/닫힘 전환

### Modified Files
- `src/components/character/useEmotionState.ts`
  - `CharacterEmotion3D` 타입에 `'puffed'` 추가
  - `EmotionVisuals` 인터페이스에 `mouthOpen`, `sphereScale` 필드 추가
  - `EMOTION_MAP`에 `puffed` 정의: 눈 scaleY 0.55 (축소), sphereScale 1.08 (8% 팽창), mouthOpen 1
  - 모든 기존 감정에 `mouthOpen: 0`, `sphereScale: 1` 기본값 추가
  - `AnimatedEmotionState`에 `mouthOpen`, `sphereScale` lerp 추가

- `src/components/character/BrieflySphere.tsx`
  - `sphereScale` prop 추가 (기본값 1)
  - useFrame에서 `smoothScale` lerp로 구체 크기 애니메이션
  - `EMOTION_COLORS`에 `puffed: '#f0a0c0'` (소프트 핑크) 추가

- `src/components/character/BrieflyScene.tsx`
  - `BrieflyMouth` 임포트 및 렌더
  - `useEmotionState` 호출하여 `mouthOpen`과 `sphereScale`을 하위 컴포넌트에 전달

- `src/app/dev/character/page.tsx`
  - EMOTIONS 배열에 `puffed` 버튼 추가 (desc: "볼 빵빵 (커비)")

## Puffed Emotion Spec

| 속성 | 값 | 설명 |
|------|-----|------|
| leftEye.scaleY | 0.55 | 축소 (볼이 눈을 밀어올림) |
| rightEye.scaleY | 0.55 | 축소 (볼이 눈을 밀어올림) |
| positionY | 0.2 | 약간 위로 |
| color | #f0a0c0 | 소프트 핑크 (커비톤) |
| mouthOpen | 1 | 완전 열림 |
| sphereScale | 1.08 | 8% 팽창 |

## Verification

- `npm run build`: PASS
- `npm run lint`: PASS (0 errors, 0 warnings)
- Runtime: `/dev/character` 페이지에서 Puffed 버튼 클릭 시 구체 팽창 + 입 열림 + 눈 축소 확인
- 감정 전환: 다른 감정에서 puffed로, puffed에서 다른 감정으로 smooth lerp 전환 정상
