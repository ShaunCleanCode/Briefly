# Briefly Character — Design Rules & Technical Reference

> 최종 갱신: 2026-03-14 · React 19 + Next.js 15 + R3F v9 + drei v10

---

## 1. 캐릭터 정체성

| 항목 | 값 |
|------|-----|
| **이름** | 브리플리 (Briefly) |
| **형태** | 반투명 유리 구체 (sphere) |
| **역할** | 금융 경제 플랫폼의 코파일럿 — 자료 조사, 경제레터 전달, 시장 인사이트 요약, 감정 반응 |
| **성격** | 친근하고 호기심 많은 조력자. 눈 표정만으로 감정을 전달하는 미니멀 캐릭터 |

---

## 2. 시각 디자인 규칙

### 2-A. 구체 (BrieflySphere)

| 속성 | 기본값 | 비고 |
|------|--------|------|
| radius | `1.2` | sphereGeometry args |
| segments | `64 × 64` | 충분한 곡면 해상도 |
| 회전 | `elapsedTime * 0.1` rad/s | Y축 느린 자전 |

**머티리얼** — `MeshTransmissionMaterial` (drei)

| 파라미터 | 값 | 설명 |
|---------|-----|------|
| transmission | `1` | 완전 투과 (유리) |
| thickness | `0.8` | 굴절 깊이 |
| roughness | `0.1` | 높은 광택 |
| chromaticAberration | `0.05` | 미세한 색수차 |
| ior | `1.5` | 유리 굴절률 |
| distortion | `0.2` | 표면 왜곡 |
| distortionScale | `0.3` | 왜곡 스케일 |
| temporalDistortion | `0.1` | 시간축 왜곡 |
| attenuationDistance | `0.6` | 빛 감쇠 거리 |
| resolution | `512` | FBO 해상도 |
| samples | `6` | 렌더 샘플 수 |
| backside | `true` | 뒷면 렌더링 |

### 2-B. 눈 (BrieflyEyes)

| 속성 | 값 | 비고 |
|------|-----|------|
| 형태 | 둥근 모서리 직사각형 (rounded rect) | `ShapeGeometry` |
| 크기 | `0.12 × 0.22`, radius `0.06` | 세로가 긴 타원형 |
| 색상 | `#ffffff`, emissive intensity `0.3` | 자체 발광 흰색 |
| 간격 | 좌우 `±0.2` | eyeSpacing |
| Z 위치 | `sphereRadius × 0.92` | 구체 표면 바로 앞 |
| 시선 추적 | mouseX × `0.04`, mouseY × `0.03` | 마우스 따라 미세하게 이동 |
| 깜빡임 주기 | `2.5~5.0`초 간격 | 랜덤 간격 |
| 깜빡임 속도 | `0.12`초 (half duration) | 빠르고 자연스러운 깜빡임 |

### 2-C. 입 (BrieflyMouth)

| 속성 | 값 | 비고 |
|------|-----|------|
| 형태 | 타원형 (quadratic bezier oval) | `ShapeGeometry` |
| 크기 | `0.14 × 0.12` | puffed 전용 크기 |
| 색상 | `#ffffff`, emissive intensity `0.15` | 눈보다 약간 어둡게 |
| Y 위치 | `-0.22` | 구체 하단부 |
| Z 위치 | `sphereRadius × 0.93` | 구체 표면 바로 앞 |
| 기본 상태 | scale `0.01`, opacity `0` | 보이지 않음 |
| 열림 상태 | scale `1`, opacity `0.85` | puffed 감정에서만 |

---

## 3. 감정 시스템 (Emotion System)

### 3-A. 감정 매핑 테이블

> `useEmotionState.ts` → `EMOTION_MAP`

| 감정 | 색상 (hex) | 좌눈 scaleY | 우눈 scaleY | 눈 positionY | 눈 rotationZ (L/R) | mouthOpen | sphereScale | 트리거 예시 |
|------|-----------|-------------|-------------|-------------|-------------------|-----------|-------------|------------|
| **neutral** | `#b4a7d6` (연보라) | 1.0 | 1.0 | 0.15 | 0 / 0 | 0 | 1.0 | 기본 상태 |
| **happy** | `#d4a7e8` (밝은 보라) | 0.6 | 0.6 | 0.22 | 0.06 / -0.06 | 0 | 1.0 | 좋은 뉴스, 수익 |
| **wink** | `#c9b97a` (골드) | 1.0 | 0.05 | 0.15 | 0 / 0 | 0 | 1.0 | 인사, 팁 전달, 클릭 |
| **angry** | `#d6785a` (붉은 주황) | 0.75 | 0.75 | 0.08 | 0.25 / -0.25 | 0 | 1.0 | 시장 급락, 리스크 |
| **sad** | `#7ab4c9` (파란 청록) | 0.85 | 0.85 | 0.05 | -0.1 / 0.1 | 0 | 1.0 | 하락장, 부정 뉴스 |
| **curious** | `#d4c462` (노란 골드) | 1.15 | 1.15 | 0.18/0.2 | -0.08 / 0.08 | 0 | 1.0 | 새 데이터 발견 |
| **thinking** | `#6b5b95` (짙은 보라) | 1.0 | 0.8 | 0.15/0.25 | 0 / 0.22 | 0 | 1.0 | 로딩, 조사 중 |
| **celebrating** | `#e8a7c8` (핑크) | 0.5 | 0.5 | 0.26 | 0.1 / -0.1 | 0 | 1.0 | 온보딩 완료, 목표 달성 |
| **puffed** | `#f5a0b8` (진한 핑크) | 0.4 | 0.4 | 0.25 | 0 / 0 | 1 | **1.3** | 커비 볼 빵빵 |

**레거시 별칭**: `concerned` → `angry`, `waving` → `wink`

### 3-B. 감정 전환 애니메이션

| 파라미터 | lerp 속도 | 비고 |
|---------|----------|------|
| 눈 transform | `LERP_SPEED = 6` | 약 0.3~0.5초 전환 |
| 구체 색상 | `delta × 4` | 색 전환은 눈보다 약간 빠르게 |
| 구체 크기 | `delta × 6` | BrieflySphere 내부 자체 lerp |
| 입 열림 | `delta × 6` | BrieflyMouth 내부 자체 lerp |

### 3-C. 특수 감정: celebrating

- 구체 주변 `BrieflyParticles` 활성화 (40개, radius 2.0, 분홍 `#f0d0e8`)
- `Sparkles` 추가 (30개, scale 3, speed 0.8, 핑크 `#f0c0e0`)
- 다른 감정에서는 파티클 비활성 (opacity fade out)

### 3-D. 특수 감정: puffed (커비 볼 빵빵)

- 구체 30% 팽창 (`sphereScale: 1.3`)
- 눈 납작해짐 (`scaleY: 0.4`)
- 입 활짝 열림 (`mouthOpen: 1`)
- 색상 진한 핑크 (`#f5a0b8`)

---

## 4. 인터랙션 시스템 (useInteraction)

| 인터랙션 | 동작 | 파라미터 |
|---------|------|---------|
| **Idle 부유** | sin wave Y 오실레이션 | amplitude `0.08`, freq `0.8` |
| **마우스 호버** | 구체 틸트 (parallax) | X × `0.2`, Y × `0.15`, lerp `0.1` |
| **클릭** | 윙크 + scale bounce | bounce peak `1.18`, decay `8` |
| **스크롤** | Y 오프셋 (parallax) | factor `0.0003`, lerp `5` |

**클릭 바운스 시퀀스**:
1. `up` phase: scale → `1.18` (0.1초)
2. `down` phase: scale → `1.0` (decay lerp)
3. 동시에 `isClickWink = true` → 감정이 `wink`로 임시 전환
4. bounce 완료 시 `isClickWink = false` → 원래 감정 복귀

---

## 5. 컴포넌트 아키텍처

```
src/components/character/
├── BrieflyCharacter3D.tsx   — Canvas + WebGL 체크 + dynamic import entry
├── BrieflyScene.tsx         — 3D scene 오케스트레이터 (조명, 그림자, 환경)
├── BrieflySphere.tsx        — 구체 메시 + MeshTransmissionMaterial
├── BrieflyEyes.tsx          — 프로시저럴 눈 × 2 + 깜빡임 + 시선 추적
├── BrieflyMouth.tsx         — 프로시저럴 입 (puffed 전용)
├── BrieflyParticles.tsx     — celebrating 파티클 시스템
├── useEmotionState.ts       — 감정 상태 머신 + 애니메이션 lerp
└── useInteraction.ts        — 마우스/클릭/스크롤 인터랙션 상태
```

### 데이터 흐름

```
[Dev Page / App]
    │ emotion prop
    ▼
BrieflyCharacter3D (Canvas, WebGL fallback, viewport check)
    │
    ▼
BrieflyScene (오케스트레이터)
    ├── resolveEmotion(emotion) → target 값 (sphereScale, mouthOpen)
    ├── useEmotionState(emotion) → animated state (눈 transform, blink)
    ├── useInteraction() → mouse, bounce, scroll
    │
    ├──▶ BrieflySphere  ← emotion (색상), sphereScale (target)
    ├──▶ BrieflyEyes    ← emotion (표정), mouseX/Y (시선)
    ├──▶ BrieflyMouth   ← mouthOpen (target)
    └──▶ BrieflyParticles ← active (celebrating만)
```

**핵심 규칙**: `useEmotionState`의 ref 값은 매 프레임 mutate되지만, React 리렌더를 트리거하지 않는다.
따라서 `sphereScale`, `mouthOpen` 같은 값은 `resolveEmotion()`으로 **target 값을 직접 전달**하고,
각 컴포넌트(BrieflySphere, BrieflyMouth)가 자체 `useFrame`에서 lerp한다.

---

## 6. 조명 설정

| 타입 | position | intensity | 비고 |
|------|----------|-----------|------|
| ambientLight | — | 0.4 | 기본 환경광 |
| pointLight | [10, 10, 10] | 1.5 | 메인 라이트 |
| pointLight | [-10, -5, -10] | 0.5 | 보조 (연보라 `#b4a7d6`) |
| spotLight | [0, 8, 4] | 1.0 | 상단 스포트, penumbra 1 |
| Environment | preset `"city"` | — | drei HDR 환경맵 |
| ContactShadows | [0, -1.5, 0] | opacity 0.3 | 바닥 그림자 |

---

## 7. 성능 제약

| 항목 | 목표 |
|------|------|
| FPS | 모바일 30fps+, 데스크톱 60fps |
| Three.js chunk | < 200KB gzipped |
| GPU 메모리 | < 50MB |
| Canvas DPR | `[1, 1.5]` (AdaptiveDpr) |
| Viewport 밖 | `frameloop="never"` (IntersectionObserver) |
| `prefers-reduced-motion` | 모든 애니메이션 비활성, scale 고정 1 |
| WebGL 미지원 | 이모지 fallback (`BrieflyCharacter.tsx`) |

---

## 8. 기술 스택

| 패키지 | 버전 | 역할 |
|--------|------|------|
| react | 19.x | UI 프레임워크 |
| next | 15.5.x | 앱 프레임워크 (App Router) |
| three | 0.175.x | 3D 렌더링 엔진 |
| @react-three/fiber | 9.x | React Three Fiber |
| @react-three/drei | 10.x | R3F 유틸리티 |
| motion | 12.x | UI 애니메이션 (framer-motion 후속) |
| typescript | 5.x | 타입 시스템 |
| tailwindcss | 3.x | CSS 프레임워크 |

---

## 9. 알려진 이슈 & 해결책

### 9-A. useRef stale value 문제 (해결됨, 2026-03-14)

**증상**: `puffed` 감정 시 구체가 커지지 않음

**원인**: `useEmotionState`가 `useRef`로 애니메이션 상태를 관리하는데, ref 변경은 React 리렌더를 트리거하지 않음. `emotionState.sphereScale`을 prop으로 전달하면 렌더 시점의 stale 값(이전 감정의 값)이 고정됨.

**해결**: `resolveEmotion(emotion).sphereScale` (target 값)을 직접 전달. 각 컴포넌트가 자체 useFrame에서 target을 향해 lerp.

### 9-B. .next 캐시 깨짐

**증상**: `__webpack_modules__[moduleId] is not a function` 런타임 에러

**해결**: `rm -rf .next && npm run dev` (캐시 클리어 후 재시작)

### 9-C. MeshTransmissionMaterial + 환경맵

Cursor IDE 내장 브라우저(headless Chromium)는 WebGL 미지원. 반드시 Chrome/Safari 실제 브라우저에서 테스트.
