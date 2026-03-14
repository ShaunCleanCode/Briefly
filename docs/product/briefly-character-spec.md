## Briefly Character (브리플리) WebGL Implementation Spec (Draft v0.1)

### 1. 캐릭터 정체성

**이름**: 브리플리 (Briefly)

**역할**: 금융 경제 플랫폼의 코파일럿
- 자료 조사 및 수집
- 그날의 경제레터 전달
- 시장 인사이트 요약
- 시장/뉴스에 대한 감정 반응

**설정**: 전문가(운영자)와 브리플리가 함께 플랫폼을 운영하는 코파일럿 구조
- 전문가: 콘텐츠 기획/편집, 품질 검수/승인, 최종 의사결정
- 브리플리: 자료 조사, 레터 전달, 인사이트 요약, 감정 반응

---

### 2. 시각적 표현

**형태**: 반투명 구체(sphere)
- 유리/비눗방울 질감의 홀로그램 셰이더
- 내부에 gradient vortex / 빛의 굴절
- 표면에 무지개(iridescence) 반사

**얼굴 요소**:
- 흰색 타원형 눈 2개 (둥근 막대 형태, 이미지 참조)
- 눈: 깜빡임, 윙크, 찡그림 등 표정 전환 가능
- 입 없음 (눈만으로 표현하는 미니멀 스타일)

**레퍼런스**: minitap.ai "mini" 캐릭터의 WebGL 퀄리티

---

### 3. 감정 시스템 (인사이드 아웃 스타일)

감정별로 **색(hue/saturation)**과 **표정(눈 형태/움직임)**이 변한다.

| 감정 | 색 톤 | 표정 | 트리거 예시 |
|------|--------|------|-------------|
| **neutral** (중립) | 연보라/라벤더 | 기본 눈, 부드러운 idle | 기본 상태, 분석 중 |
| **happy** (기쁨) | 밝은 보라/분홍 | 눈 약간 위로, 밝은 빛 | 환영, 좋은 뉴스, 수익 |
| **wink** (윙크) | 라벤더/골드 | 한쪽 눈 닫힘 | 인사, 팁 전달 |
| **angry** (분노/우려) | 붉은/주황 톤 | 눈 찡그림, 눈썹 내려감 | 시장 급락, 리스크 경고 |
| **sad** (슬픔) | 파란/청록 톤 | 눈 내려감 | 하락장, 부정적 뉴스 |
| **curious** (호기심) | 노랑/골드 톤 | 눈 크게, 살짝 기울임 | 새 데이터, 인사이트 발견 |
| **thinking** (사고) | 짙은 보라/남색 | 눈 한쪽 위로 | 로딩, 자료 조사 중 |
| **celebrating** (축하) | 핑크/금색 파티클 | 눈 위로, 빛 산란 | 온보딩 완료, 목표 달성 |

**색 전환**: 감정 전환 시 hue/saturation이 0.5~1초에 걸쳐 smooth lerp
**파티클**: celebrating 감정에서만 구체 주변에 미세한 빛 파티클

---

### 4. 기술 스택 결정

#### 4-A. 핵심 라이브러리

| 라이브러리 | 역할 | 선택 근거 |
|-----------|------|-----------|
| **React Three Fiber (R3F)** | Three.js의 React 바인딩 | Next.js 14 + React 18 호환, 선언적 API |
| **@react-three/drei** | R3F 유틸리티 (MeshTransmissionMaterial 등) | 유리/반투명 효과 내장 |
| **@react-three/postprocessing** | 후처리 효과 | Bloom, 색수차 등 |
| **three** | 3D 렌더링 엔진 | R3F 의존성 |
| **GSAP** (선택) | 셰이더 uniform 트위닝 | 부드러운 감정 전환 |

#### 4-B. 머티리얼 전략

**Primary**: `MeshTransmissionMaterial` (drei)
- `transmission`: 1 (완전 투과)
- `thickness`: 0.5~1.5 (굴절 깊이)
- `roughness`: 0.05~0.15 (광택)
- `chromaticAberration`: 0.03~0.08 (색수차)
- `ior`: 1.5 (유리 굴절률)
- `attenuationColor`: 감정별 동적 변경 (hue shift)

**Iridescence**: Three.js `MeshPhysicalMaterial`의 iridescence 속성 활용
- `iridescence`: 0.8~1.0
- `iridescenceIOR`: 1.3
- `iridescenceThicknessRange`: [100, 800]

#### 4-C. 표정 구현 방식

**프로시저럴 접근** (Blender 모델 없이 코드로 생성):
- 눈: `PlaneGeometry` 또는 `ExtrudeGeometry`로 둥근 막대 형태
- 눈 애니메이션: scale Y로 깜빡임/윙크, rotation Z로 기울임
- 찡그림: 눈 position Y 조절 + rotation Z로 "V자" 형태

```
기본 눈:   ||     윙크:    -|     찡그림:  /\
           ||             ||            \/
```

**상태 머신 기반**:
```
Emotion → { eyeLeftScaleY, eyeRightScaleY, eyeRotationZ, eyePositionY }
```
값 변경 시 GSAP/lerp로 0.3~0.5초 트위닝.

#### 4-D. 인터랙션

| 인터랙션 | 동작 |
|---------|------|
| **Idle** | 부드러운 상하 부유 (sin wave, amplitude 2~4px) |
| **마우스 호버** | 구체가 마우스 방향으로 살짝 기울임 (parallax) |
| **클릭** | 윙크 + 약간의 scale bounce |
| **감정 전환** | 색 lerp + 눈 morph + 미세한 pulse |
| **스크롤** | 시차 효과로 살짝 움직임 |

---

### 5. Next.js 14 통합 방안

#### 5-A. 번들 분리 (Critical)

Three.js는 1MB+ 번들이므로 반드시 dynamic import:

```tsx
import dynamic from 'next/dynamic';

const BrieflyCharacter3D = dynamic(
  () => import('@/components/character/BrieflyCharacter3D'),
  { ssr: false, loading: () => <BrieflyCharacterFallback /> }
);
```

#### 5-B. 파일 구조

```
src/components/character/
  BrieflyCharacter3D.tsx     — R3F Canvas + Scene (dynamic import entry)
  BrieflyScene.tsx           — 3D scene 구성 (조명, 카메라, 후처리)
  BrieflySphere.tsx          — 구체 메시 + 머티리얼 + 셰이더
  BrieflyEyes.tsx            — 눈 메시 + 표정 애니메이션
  BrieflyParticles.tsx       — 감정별 파티클 시스템
  useEmotionState.ts         — 감정 상태 머신 + 셰이더 uniform 관리
  shaders/
    iridescent.frag          — 커스텀 fragment shader (필요 시)
    iridescent.vert          — 커스텀 vertex shader (필요 시)
  constants.ts               — 감정별 색/표정 매핑 테이블
```

#### 5-C. 기존 BrieflyCharacter.tsx와의 관계

현재 `src/components/onboarding/BrieflyCharacter.tsx`는 이모지 기반 플레이스홀더:
- WebGL 버전이 완성될 때까지 **fallback으로 유지**
- WebGL 로드 실패 / WebGL 미지원 환경에서 이모지 버전으로 graceful degradation
- 두 컴포넌트의 `CharacterEmotion` 타입 인터페이스는 동일하게 유지

---

### 6. 성능 요구사항

| 항목 | 목표 |
|------|------|
| FPS | 모바일 30fps+, 데스크톱 60fps |
| 번들 크기 | Three.js chunk < 200KB gzipped (tree-shaking) |
| LCP 영향 | 캐릭터는 above-the-fold가 아닌 경우 lazy load |
| 메모리 | GPU 메모리 < 50MB |
| 폴백 | WebGL 미지원 시 기존 이모지 fallback |

**최적화 기법**:
- R3F의 `frameloop="demand"` (정지 시 렌더링 중지)
- `resolution` 낮추기 (MeshTransmissionMaterial: 256~512)
- Intersection Observer로 viewport 밖이면 렌더링 중지
- `useReducedMotion` 존중 → 애니메이션 비활성화

---

### 7. 구현 단계 (에픽 분해)

#### Phase 1: 기본 구체 + 머티리얼 (W-400)
- R3F + drei 설치 및 Next.js 통합
- MeshTransmissionMaterial로 반투명 구체 렌더링
- 기본 라이팅 (환경맵 + 포인트라이트)
- dynamic import + fallback

#### Phase 2: 눈 + 기본 표정 (W-401)
- 프로시저럴 눈 메시 생성
- idle 깜빡임 애니메이션
- neutral, happy, thinking 3가지 감정

#### Phase 3: 감정 시스템 확장 (W-402)
- 전체 감정 맵 구현 (8가지)
- 감정별 색 전환 (hue lerp)
- 윙크, 찡그림 표정 추가

#### Phase 4: 마이크로 인터랙션 (W-403)
- 마우스/터치 호버 반응
- 클릭 인터랙션
- idle 부유 애니메이션
- 스크롤 시차

#### Phase 5: 후처리 + 폴리시 (W-404)
- Bloom, 색수차 후처리
- celebrating 파티클
- 성능 최적화 (프레임 드롭 대응)
- 크로스 브라우저/디바이스 QA

---

### 8. 의존 패키지 (신규 추가 예상)

```
@react-three/fiber    — R3F 코어
@react-three/drei     — 유틸리티 (MeshTransmissionMaterial, Environment 등)
@react-three/postprocessing — 후처리
three                  — Three.js 코어
```

선택:
```
gsap                   — 트위닝 (이미 framer-motion 사용 중이므로 대체 가능)
leva                   — 개발용 GUI 컨트롤 (devDependencies)
```

---

### 9. 참고 자료

- [Three.js MeshPhysicalMaterial (iridescence, transmission)](https://threejs.org/docs/api/en/materials/MeshPhysicalMaterial.html)
- [drei MeshTransmissionMaterial](https://drei.docs.pmnd.rs/shaders/mesh-transmission-material)
- [Codrops: Vortex Glass Sphere with TSL](https://tympanus.net/codrops/2025/03/10/rendering-a-procedural-vortex-inside-a-glass-sphere-with-three-js-and-tsl/)
- [Three.js Morph Targets Face Example](https://threejs.org/examples/webgpu_morphtargets_face.html)
- [Hologram Material Shader (fresnel + rim lighting)](https://github.com/otanodesignco/Hologram-Material)
- [Three.js Iridescent Shader](https://github.com/pzsprog/threejs-iridescent-shader)
- [R3F Scaling Performance Guide](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Next.js + R3F Integration (Medium)](https://medium.com/@divyanshsharma0631/unlocking-the-third-dimension-building-immersive-3d-experiences-with-react-three-fiber-in-next-js-153397f27802)
