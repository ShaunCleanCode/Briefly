# Memory Bank - 반복되는 이슈 및 해결책

> 이 문서는 프로젝트에서 반복적으로 발생하는 문제와 해결 방법을 기록합니다.
> 에이전트는 문제 발생 시 이 문서를 **먼저** 참조해야 합니다.

---

## 📖 Document Governance

### Ownership
- **Primary Owner:** System Architecture Engineer Agent
- **Contributors:** All agents may add entries
- **Reviewer:** PM (via workboard task)

### When to Use This Document
- **Agents:** Check this document FIRST when encountering build failures, test timeouts, or runtime errors
- **Before opening a new issue:** Search here for known solutions
- **After fixing a recurring issue:** Add an entry if it might happen again

### Distinction from ADRs
| Memory Bank | ADRs |
|-------------|------|
| Operational fixes (how to recover) | Strategic decisions (why we chose X) |
| Symptoms + solutions | Context + decision + consequences |
| Frequently updated | Rarely changed after acceptance |
| Tactical knowledge | Architectural knowledge |

---

## 📝 Entry Template

When adding a new entry, use this format:

```markdown
### [Issue Number]. [Short Title]

**증상 (Symptom):**
- Bullet list of observable symptoms
- Error messages (verbatim)
- Where it manifests (build/test/runtime)

**근본 원인 (Root Cause):**
- Why this happens (technical explanation)

**해결책 (Fix):**
```bash
# Commands to fix
```
Or code snippet showing correct vs incorrect pattern

**관련 파일 (Affected Files):**
- `path/to/file.ts`

**관련 태스크 (Related Tasks):**
- W-XXX (link to workboard task if applicable)

**마지막 발생 (Last Seen):** YYYY-MM-DD

**담당자 (Owner):** [Agent name who documented this]
```

### Validation Rules
1. **Symptom must be specific** — include exact error messages
2. **Fix must be copy-paste ready** — commands should work without modification
3. **Related tasks should link to workboard** — enables traceability
4. **Last seen date required** — helps identify stale entries

---

## 🔴 Critical Issues

### 1. E2E 테스트 타임아웃 / 질문 렌더링 실패

**증상 (Symptom):**
- E2E 테스트에서 `waitForQuestion` 타임아웃
- 페이지 셸은 로드되지만 질문 콘텐츠가 렌더링되지 않음
- `[data-testid="question-title"]` 요소를 찾을 수 없음
- 에러: `TimeoutError: locator.waitFor: Timeout 10000ms exceeded`

**근본 원인 (Root Cause):**
- Next.js 개발 서버가 실행되지 않았거나 좀비 프로세스 상태
- 여러 개의 dev 서버가 동시에 실행되어 포트 충돌

**해결책 (Fix):**
```bash
# 1. 기존 dev 서버 프로세스 종료
pkill -f "next dev"

# 2. 잠시 대기
sleep 2

# 3. dev 서버 재시작
cd /Users/onseonghyeon/Desktop/BRIEFLY\;2
npm run dev &

# 4. 서버 준비 확인 (200 응답)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/onboarding

# 5. 테스트 재실행
npm run test:e2e:smoke
npm run test:e2e:regression
```

**관련 파일 (Affected Files):**
- `playwright.config.ts` (webServer config)
- `tests/e2e/**/*.spec.ts`

**관련 태스크 (Related Tasks):**
- W-101, W-004 (E2E 테스트 관련)

**마지막 발생 (Last Seen):** 2026-01-29

**담당자 (Owner):** Frontend Engineer Agent

---

### 2. React 무한 루프 - TickerSearch useEffect

**증상 (Symptom):**
- 페이지가 응답하지 않거나 매우 느림
- 브라우저 콘솔에서 무한 리렌더링 경고
- `useEffect` 의존성 관련 ESLint 경고

**근본 원인 (Root Cause):**
- `initialTickers` prop이 배열이라 매 렌더마다 새 참조 생성
- `useEffect` 의존성 배열에 배열을 직접 넣으면 무한 루프 발생

**해결책 (Fix):**
```typescript
// ❌ 잘못된 코드 (무한 루프)
useEffect(() => {
  setSelectedTickers(initialTickers);
}, [initialTickers]);

// ✅ 올바른 코드
useEffect(() => {
  const initialString = JSON.stringify(initialTickers);
  const currentString = JSON.stringify(selectedTickers);
  if (initialString !== currentString) {
    setSelectedTickers(initialTickers);
  }
}, [JSON.stringify(initialTickers)]);
```

**관련 파일 (Affected Files):**
- `src/components/onboarding/TickerSearch.tsx`

**관련 태스크 (Related Tasks):**
- W-101

**마지막 발생 (Last Seen):** 2026-01-29

**담당자 (Owner):** Frontend Engineer Agent

---

## 🟡 Common Issues

### 3. TypeScript 빌드 에러 - React Query 캐시 업데이트

**증상 (Symptom):**
- `npm run build` 실패
- 에러: `Spread types may only be created from object types`

**근본 원인 (Root Cause):**
- React Query의 `setQueryData` 콜백에서 `unknown` 타입을 직접 spread

**해결책 (Fix):**
```typescript
// ❌ 잘못된 코드
queryClient.setQueryData(key, (old: unknown) => ({
  ...old, // Error: can't spread unknown
  newData,
}));

// ✅ 올바른 코드
queryClient.setQueryData(key, (old: unknown) => {
  if (!old || typeof old !== 'object') return old;
  const oldData = old as Record<string, unknown>;
  return {
    ...oldData,
    newData,
  };
});
```

**관련 파일 (Affected Files):**
- `src/hooks/useOnboarding.ts`

**관련 태스크 (Related Tasks):**
- W-004

**마지막 발생 (Last Seen):** 2026-01-29

**담당자 (Owner):** Frontend Engineer Agent

---

### 4. Next.js Metadata Viewport 경고

**증상 (Symptom):**
- 빌드 시 경고: `Unsupported metadata viewport is configured`

**근본 원인 (Root Cause):**
- Next.js 14에서 `metadata` export의 `viewport` 속성이 deprecated

**해결책 (Fix):**
```typescript
// ❌ 잘못된 코드
export const metadata = {
  title: 'Page',
  viewport: 'width=device-width, initial-scale=1',
};

// ✅ 올바른 코드
export const metadata = {
  title: 'Page',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};
```

**관련 파일 (Affected Files):**
- `src/app/layout.tsx`
- `src/app/onboarding/layout.tsx`

**관련 태스크 (Related Tasks):**
- N/A (non-blocking warning, P2)

**마지막 발생 (Last Seen):** 2026-01-29

**담당자 (Owner):** Frontend Engineer Agent

---

## 📋 Checklist - E2E 테스트 실행 전

1. [ ] dev 서버가 실행 중인지 확인: `curl http://localhost:3000/onboarding`
2. [ ] 서버가 응답하지 않으면: `pkill -f "next dev" && npm run dev &`
3. [ ] 서버 준비 대기: `sleep 5`
4. [ ] 테스트 실행: `npm run test:e2e:smoke`

### 5. ~~Three.js / R3F 패키지 설치 후 dev 서버 깨짐~~ (RESOLVED)

> **해결 완료 (2026-03-12)**: React 19 + Next.js 15 + R3F v9 마이그레이션으로 `--legacy-peer-deps` 불필요.
> 모든 패키지가 peer dep 충돌 없이 설치됨.

---

### 6. ~~@react-three/postprocessing R3F v8 호환 불가~~ (RESOLVED)

> **해결 완료 (2026-03-12)**: R3F v9 + React 19 마이그레이션으로 `@react-three/postprocessing` 재도입 가능.
> 현재 Sparkles로 대체 중이나, 필요 시 Bloom 효과 복원 가능.

---

### 7. React 19 + Next.js 15 + R3F v9 마이그레이션 기록

**마이그레이션 일자:** 2026-03-12

**변경 요약:**
| 패키지 | Before | After |
|--------|--------|-------|
| react / react-dom | 18.2.0 | 19.2.4 |
| next | 14.0.4 | 15.5.12 |
| @react-three/fiber | 8.18.0 | 9.5.0 |
| @react-three/drei | 9.122.0 | 10.7.7 |
| three | 0.170.0 | 0.170.0 |
| framer-motion | 10.18.0 | motion 12.35.2 |
| lucide-react | 0.303.0 | 0.460.0 |
| @testing-library/react | 14.1.0 | 16.3.2 |
| eslint-config-next | 14.0.4 | 15.5.12 |

**코드 변경:**
- 18개 파일: `import ... from 'framer-motion'` → `import ... from 'motion/react'`
- motion v12 타입 강화: `type: 'spring'` → `type: 'spring' as const` (11개 파일)
- `next.config.js`: `images.domains` → `images.remotePatterns`

**핵심 성과:**
- `--legacy-peer-deps` 완전 제거
- peer dep 충돌 0건
- `@react-three/postprocessing` 재도입 가능 상태

**담당자 (Owner):** Frontend Engineer Agent

---

## 🔄 문서 업데이트 기록

| 날짜 | 변경 내용 | 작성자 |
|------|-----------|--------|
| 2026-01-29 | E2E 타임아웃, React 무한 루프, TS 빌드 에러, Viewport 경고 추가 | Frontend Engineer Agent |
| 2026-01-29 | Governance 섹션 + Entry Template 추가, Related Tasks 연결 | System Architecture Engineer Agent |
| 2026-03-12 | Three.js 패키지 설치 후 dev 서버 깨짐, postprocessing 호환 불가 항목 추가 | Frontend Engineer Agent |
| 2026-03-12 | React 19 + Next.js 15 + R3F v9 마이그레이션 완료, 항목 5/6 resolved, 항목 7 추가 | Frontend Engineer Agent |
