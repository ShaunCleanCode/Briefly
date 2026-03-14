# Onboarding Frontend Specification (v1)

## High-Level Plan

1. **Route Structure**: Single `/onboarding` route with sub-states managed via query params, plus `/onboarding/done` for completion
2. **Shell-Based Layout**: Full-screen modal experience with persistent progress bar, back navigation, and character area
3. **Question Engine**: Client-side state machine that consumes backend's `nextQuestion` responses, handles branching automatically
4. **Motion System**: Spring-based animations with Framer Motion, respecting `prefers-reduced-motion`
5. **Offline Resilience**: Optimistic UI with retry queues, session resumption from any point
6. **Mobile-First**: Touch-optimized cards (48px+ tap targets), swipe gestures optional, responsive scaling
7. **Character-Led UX**: "Briefly" mascot with emotion states guides the entire flow

---

## 1. Information Architecture & Route Structure

### 1.1 Routes

```
/onboarding                    # Main onboarding flow
  ?step=consent               # Query param tracks current question (for deep linking/debugging)
  ?step=experience_years
  ?step=...
  
/onboarding/done              # Completion celebration screen
/onboarding/declined          # Consent declined path (minimal experience)
```

### 1.2 Layout Decision

**Full-Screen Modal Experience** (not embedded in app shell)

Rationale:
- Focus: No navigation distractions
- Immersion: Duolingo-style "world" feel
- Mobile: Full viewport, no safe-area conflicts
- Exit: Explicit "Save & Exit" button (resumes later)

### 1.3 Auth Gating

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = await getSession(request);
  
  if (!session && request.nextUrl.pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/login?redirect=/onboarding', request.url));
  }
  
  // Already completed onboarding? Redirect to dashboard
  if (session?.user?.onboardingCompletedAt && request.nextUrl.pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}
```

### 1.4 Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        /onboarding                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Progress Bar (0% → 100%)                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────┐                                               │
│  │  ← Back  │  [Save & Exit]                               │
│  └──────────┘                                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │           🤖 Briefly Character                      │   │
│  │              (emotion state)                        │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │                                             │   │   │
│  │  │           Speech Bubble                     │   │   │
│  │  │           (question text)                   │   │   │
│  │  │                                             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │                                               │ │   │
│  │  │         Answer Area                           │ │   │
│  │  │         (varies by question type)             │ │   │
│  │  │                                               │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  ┌─────────────┐                                   │   │
│  │  │  Skip →     │  (if skippable)                   │   │
│  │  └─────────────┘                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Component Tree

```
OnboardingPage
├── OnboardingShell
│   ├── ProgressBar
│   ├── TopNav
│   │   ├── BackButton
│   │   └── ExitButton
│   └── SafeAreaContainer
│       └── QuestionRenderer
│           ├── BrieflyCharacter
│           │   └── CharacterAvatar (PNG/SVG/Lottie slot)
│           ├── ChatBubble
│           └── AnswerArea
│               ├── ConsentCard
│               ├── SingleChoiceGrid
│               ├── MultiChoiceGrid
│               ├── TickerSearch
│               ├── SectorPicker
│               ├── TimePicker
│               └── SkipButton
├── LoadingSkeleton
├── ErrorBanner
└── ConfettiOverlay (on completion)
```

### 2.2 Component Specifications

#### `OnboardingShell`
```typescript
interface OnboardingShellProps {
  children: React.ReactNode;
  progress: {
    current: number;
    total: number;
    percentComplete: number;
  };
  onBack?: () => void;
  onExit: () => void;
  canGoBack: boolean;
}
```
**Responsibilities:**
- Manages full-screen layout with safe areas (notch, home indicator)
- Renders progress bar at top
- Handles keyboard visibility on mobile (viewport resize)
- Provides exit confirmation dialog

---

#### `ProgressBar`
```typescript
interface ProgressBarProps {
  percentComplete: number; // 0-100
  segmentCount?: number;   // Optional: show discrete segments
  animated?: boolean;
}
```
**Design:**
- Height: 4px (mobile), 6px (desktop)
- Color: Gradient from `--brand-primary` to `--brand-secondary`
- Animated fill with spring physics
- Optional segment markers for visual chunking

---

#### `BrieflyCharacter`
```typescript
type CharacterEmotion = 
  | 'neutral' 
  | 'thinking' 
  | 'happy' 
  | 'celebrating' 
  | 'concerned' 
  | 'waving';

interface BrieflyCharacterProps {
  emotion: CharacterEmotion;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Asset interface for swappability
interface CharacterAssets {
  neutral: string | LottieAnimationData;
  thinking: string | LottieAnimationData;
  happy: string | LottieAnimationData;
  celebrating: string | LottieAnimationData;
  concerned: string | LottieAnimationData;
  waving: string | LottieAnimationData;
}
```
**Responsibilities:**
- Render character avatar based on emotion state
- Support PNG, SVG, or Lottie animation
- Subtle idle animation (breathing/bouncing)
- Transition between emotions smoothly

---

#### `ChatBubble`
```typescript
interface ChatBubbleProps {
  title: string;
  description?: string;
  typing?: boolean;      // Show typing indicator
  direction?: 'left' | 'center';
}
```
**Design:**
- Speech bubble with tail pointing to character
- Typing indicator with 3-dot animation
- Text appears with typewriter effect (optional, reduced motion aware)
- Max-width: 90% on mobile, 600px on desktop

---

#### `AnswerChoices` (Single Choice)
```typescript
interface SingleChoiceProps {
  options: Array<{
    value: string;
    label: string;
    description?: string;
    icon?: string;
  }>;
  selectedValue?: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  layout?: 'stack' | 'grid';  // stack for 2-3 options, grid for 4+
}
```
**Design:**
- Large tappable cards (min-height: 56px)
- Selected state: border + background shift + checkmark
- Press feedback: scale(0.98) + shadow reduction
- Auto-advance after selection (with brief delay for feedback)

---

#### `MultiChoiceGrid`
```typescript
interface MultiChoiceProps {
  options: Array<{
    value: string;
    label: string;
    icon?: string;
  }>;
  selectedValues: string[];
  onToggle: (value: string) => void;
  maxSelections?: number;
  disabled?: boolean;
}
```
**Design:**
- Grid layout: 2 columns on mobile, 3 on tablet+
- Checkbox-style selection (can select multiple)
- Shows count badge: "2/3 selected"
- Explicit "Continue" button (no auto-advance)

---

#### `TickerSearch`
```typescript
interface TickerSearchProps {
  selectedTickers: string[];
  onAdd: (ticker: string) => void;
  onRemove: (ticker: string) => void;
  maxTickers: number;
  placeholder?: string;
}
```
**Features:**
- Typeahead search against S&P 500 list
- Debounced API calls (300ms)
- Shows company name + logo in suggestions
- Selected tickers as removable chips
- Validates against allowed ticker list
- Mobile: Full-screen search overlay

---

#### `TimePicker`
```typescript
interface TimePickerProps {
  value?: string;         // "HH:MM"
  onChange: (time: string) => void;
  minTime?: string;
  maxTime?: string;
  presets?: Array<{
    value: string;
    label: string;
  }>;
}
```
**Design:**
- Quick presets: "아침 (07:00)", "점심 (12:00)", "저녁 (18:00)"
- Custom time via native time input or wheel picker
- Shows timezone context: "한국 시간 (KST)"

---

#### `ConsentCard`
```typescript
interface ConsentCardProps {
  title: string;
  description: string;
  learnMoreUrl?: string;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}
```
**Design:**
- Prominent card with clear accept/decline buttons
- Accept: Primary button (large, filled)
- Decline: Secondary button (outline, smaller)
- "자세히 보기" link for privacy policy
- No skip option (required)

---

#### `SkipButton`
```typescript
interface SkipButtonProps {
  label?: string;         // default: "건너뛰기"
  onClick: () => void;
  disabled?: boolean;
  variant?: 'text' | 'outline';
}
```
**Design:**
- Positioned below answer area
- Subtle styling (text link or ghost button)
- Not prominent but accessible

---

#### `ErrorBanner`
```typescript
interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}
```
**Design:**
- Slides in from top
- Auto-dismiss after 5s for warnings
- Persistent for errors until dismissed/retried

---

#### `LoadingSkeleton`
```typescript
interface LoadingSkeletonProps {
  type: 'question' | 'choices' | 'full';
}
```
**Design:**
- Pulse animation on placeholder shapes
- Matches actual content layout
- Character shows "thinking" emotion during load

---

## 3. Motion Design Spec

### 3.1 Design Tokens

```typescript
// motion.config.ts
export const motionConfig = {
  // Spring presets
  spring: {
    gentle: { type: 'spring', stiffness: 120, damping: 14 },
    snappy: { type: 'spring', stiffness: 300, damping: 24 },
    bouncy: { type: 'spring', stiffness: 400, damping: 10 },
  },
  
  // Duration presets
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    deliberate: 0.8,
  },
  
  // Easing
  easing: {
    easeOut: [0.0, 0.0, 0.2, 1],
    easeInOut: [0.4, 0.0, 0.2, 1],
    anticipate: [0.68, -0.55, 0.265, 1.55],
  },
};
```

### 3.2 Framer Motion Variants

#### Page Transitions
```typescript
// variants/pageTransition.ts
export const pageVariants = {
  initial: {
    opacity: 0,
    x: 50,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
      staggerChildren: 0.07,
    },
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: {
      duration: 0.2,
    },
  },
};

// For back navigation (reverse direction)
export const pageVariantsBack = {
  initial: { opacity: 0, x: -50 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
};
```

#### Choice Selection
```typescript
// variants/choice.ts
export const choiceVariants = {
  idle: {
    scale: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  selected: {
    scale: 1,
    boxShadow: '0 0 0 2px var(--brand-primary)',
    backgroundColor: 'var(--brand-primary-light)',
    transition: { type: 'spring', stiffness: 500, damping: 25 },
  },
};

// Checkmark animation
export const checkmarkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: 'spring', stiffness: 400, damping: 25 },
      opacity: { duration: 0.1 },
    },
  },
};
```

#### Progress Bar
```typescript
// variants/progressBar.ts
export const progressBarVariants = {
  initial: { scaleX: 0 },
  animate: (percentComplete: number) => ({
    scaleX: percentComplete / 100,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  }),
};
```

#### Chat Bubble
```typescript
// variants/chatBubble.ts
export const bubbleVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

// Typing indicator dots
export const typingDotVariants = {
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
};
```

#### Error Shake
```typescript
// variants/error.ts
export const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};
```

#### Success Celebration
```typescript
// variants/success.ts
export const celebrationVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
};

// Confetti config (using canvas-confetti or similar)
export const confettiConfig = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
};
```

### 3.3 Reduced Motion Support

```typescript
// hooks/useReducedMotion.ts
import { useReducedMotion } from 'framer-motion';

export function useAccessibleMotion() {
  const prefersReducedMotion = useReducedMotion();
  
  return {
    // Return simplified variants for reduced motion
    pageTransition: prefersReducedMotion 
      ? { initial: { opacity: 0 }, enter: { opacity: 1 }, exit: { opacity: 0 } }
      : pageVariants,
    
    choiceAnimation: prefersReducedMotion
      ? { selected: { outline: '2px solid var(--brand-primary)' } }
      : choiceVariants,
  };
}
```

---

## 4. Data Flow & State Management

### 4.1 State Architecture

```typescript
// store/onboardingStore.ts (using Zustand)
interface OnboardingState {
  // Session state
  session: {
    id: string;
    status: 'in_progress' | 'completed';
    questionSetVersion: number;
  } | null;
  
  // Current question
  currentQuestion: Question | null;
  
  // Progress
  progress: {
    answered: number;
    total: number;
    percentComplete: number;
  };
  
  // Answer history (for back navigation)
  answerHistory: Array<{
    questionKey: string;
    answer: AnswerPayload;
    skipped: boolean;
  }>;
  
  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  direction: 'forward' | 'back'; // For animation direction
  
  // Actions
  actions: {
    startSession: (locale: string) => Promise<void>;
    submitAnswer: (questionKey: string, answer: AnswerPayload) => Promise<void>;
    skipQuestion: (questionKey: string) => Promise<void>;
    goBack: () => Promise<void>;
    completeOnboarding: () => Promise<void>;
  };
}
```

### 4.2 TanStack Query Integration

```typescript
// hooks/useOnboarding.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Start/resume session
export function useOnboardingSession() {
  return useQuery({
    queryKey: ['onboarding', 'session'],
    queryFn: () => api.onboarding.getSession(),
    staleTime: Infinity, // Session doesn't change unless we change it
    retry: 3,
  });
}

// Submit answer mutation
export function useSubmitAnswer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ questionKey, answer }: SubmitAnswerParams) =>
      api.onboarding.submitAnswer(questionKey, answer),
    
    // Optimistic update
    onMutate: async ({ questionKey, answer }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['onboarding'] });
      
      // Snapshot previous value
      const previousSession = queryClient.getQueryData(['onboarding', 'session']);
      
      // Optimistically update progress
      queryClient.setQueryData(['onboarding', 'session'], (old: any) => ({
        ...old,
        progress: {
          ...old.progress,
          answered: old.progress.answered + 1,
          percentComplete: Math.round(
            ((old.progress.answered + 1) / old.progress.total) * 100
          ),
        },
      }));
      
      return { previousSession };
    },
    
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['onboarding', 'session'],
        context?.previousSession
      );
    },
    
    onSuccess: (data) => {
      // Update with server response (includes nextQuestion)
      queryClient.setQueryData(['onboarding', 'session'], (old: any) => ({
        ...old,
        currentQuestion: data.nextQuestion,
        progress: data.progress,
      }));
    },
  });
}

// Skip question mutation
export function useSkipQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (questionKey: string) =>
      api.onboarding.skipQuestion(questionKey),
    onSuccess: (data) => {
      queryClient.setQueryData(['onboarding', 'session'], (old: any) => ({
        ...old,
        currentQuestion: data.nextQuestion,
        progress: data.progress,
      }));
    },
  });
}

// Complete onboarding mutation
export function useCompleteOnboarding() {
  const router = useRouter();
  
  return useMutation({
    mutationFn: () => api.onboarding.complete({ finalConfirmation: true }),
    onSuccess: () => {
      router.push('/onboarding/done');
    },
  });
}
```

### 4.3 Question Engine Logic

```typescript
// hooks/useQuestionEngine.ts
export function useQuestionEngine() {
  const { data: session, isLoading } = useOnboardingSession();
  const submitAnswer = useSubmitAnswer();
  const skipQuestion = useSkipQuestion();
  const completeOnboarding = useCompleteOnboarding();
  
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [answerStack, setAnswerStack] = useState<AnswerRecord[]>([]);
  
  // Handle answer submission
  const handleAnswer = useCallback(async (answer: AnswerPayload) => {
    if (!session?.currentQuestion) return;
    
    const questionKey = session.currentQuestion.key;
    
    // Prevent double-submission
    if (submitAnswer.isPending) return;
    
    setDirection('forward');
    
    // Track in local stack for back navigation
    setAnswerStack(prev => [...prev, { questionKey, answer, skipped: false }]);
    
    await submitAnswer.mutateAsync({ questionKey, answer });
    
    // Check if complete
    if (session.progress.answered + 1 >= session.progress.total) {
      await completeOnboarding.mutateAsync();
    }
  }, [session, submitAnswer, completeOnboarding]);
  
  // Handle skip
  const handleSkip = useCallback(async () => {
    if (!session?.currentQuestion?.isSkippable) return;
    if (skipQuestion.isPending) return;
    
    const questionKey = session.currentQuestion.key;
    setDirection('forward');
    setAnswerStack(prev => [...prev, { questionKey, answer: null, skipped: true }]);
    
    await skipQuestion.mutateAsync(questionKey);
  }, [session, skipQuestion]);
  
  // Handle back navigation
  const handleBack = useCallback(async () => {
    if (answerStack.length === 0) return;
    
    setDirection('back');
    const previous = answerStack[answerStack.length - 1];
    setAnswerStack(prev => prev.slice(0, -1));
    
    // PATCH to edit previous answer (allows re-answering)
    // or just navigate back in the stack
    await api.onboarding.editAnswer(previous.questionKey, null);
  }, [answerStack]);
  
  return {
    session,
    currentQuestion: session?.currentQuestion,
    progress: session?.progress,
    isLoading: isLoading || submitAnswer.isPending || skipQuestion.isPending,
    error: submitAnswer.error || skipQuestion.error,
    direction,
    canGoBack: answerStack.length > 0,
    handleAnswer,
    handleSkip,
    handleBack,
  };
}
```

### 4.4 Offline & Error Handling

```typescript
// hooks/useOfflineQueue.ts
export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const isOnline = useOnlineStatus();
  
  // Add to queue when offline
  const queueAction = useCallback((action: QueuedAction) => {
    if (!isOnline) {
      setQueue(prev => [...prev, action]);
      toast.info('오프라인 상태입니다. 연결되면 자동으로 저장됩니다.');
      return true;
    }
    return false;
  }, [isOnline]);
  
  // Process queue when back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue(queue);
      setQueue([]);
    }
  }, [isOnline, queue]);
  
  return { queueAction, queueLength: queue.length };
}

// Retry logic with exponential backoff
export function useRetry() {
  const retry = useCallback(async (
    fn: () => Promise<any>,
    maxRetries = 3,
    baseDelay = 1000
  ) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);
  
  return { retry };
}
```

### 4.5 Session Resumption

```typescript
// On page load/mount
export function useSessionResumption() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const resumeSession = async () => {
      try {
        // POST /start will return existing session if one exists
        const response = await api.onboarding.start({
          locale: navigator.language.startsWith('ko') ? 'ko' : 'en',
          metadata: {
            device: detectDevice(),
            referrer: document.referrer,
          },
        });
        
        if (response.session.status === 'in_progress') {
          // Session resumed - show toast
          toast.success('이전에 하던 곳에서 계속합니다');
        }
        
        queryClient.setQueryData(['onboarding', 'session'], response);
      } catch (error) {
        if (error.code === 'ONBOARDING_ALREADY_COMPLETED') {
          router.replace('/dashboard');
        }
      }
    };
    
    resumeSession();
  }, []);
}
```

---

## 5. Accessibility & UX Quality

### 5.1 Keyboard Navigation

```typescript
// hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation({
  options,
  selectedIndex,
  onSelect,
  onConfirm,
}: KeyboardNavProps) {
  const [focusedIndex, setFocusedIndex] = useState(selectedIndex ?? 0);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex(prev => 
            Math.min(prev + 1, options.length - 1)
          );
          break;
          
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
          
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(options[focusedIndex].value);
          if (e.key === 'Enter') {
            onConfirm?.();
          }
          break;
          
        case 'Tab':
          // Allow natural tab flow
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, focusedIndex, onSelect, onConfirm]);
  
  return { focusedIndex, setFocusedIndex };
}
```

### 5.2 Focus Management

```typescript
// hooks/useFocusManagement.ts
export function useFocusOnTransition(questionKey: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousQuestionRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (previousQuestionRef.current !== questionKey) {
      // Question changed - focus the first interactive element
      const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
        'button, [role="radio"], [role="checkbox"], input, [tabindex="0"]'
      );
      
      // Delay to allow exit animation to complete
      setTimeout(() => {
        firstFocusable?.focus();
      }, 300);
      
      previousQuestionRef.current = questionKey;
    }
  }, [questionKey]);
  
  return containerRef;
}
```

### 5.3 ARIA Implementation

```tsx
// components/SingleChoiceGrid.tsx
export function SingleChoiceGrid({ options, selectedValue, onSelect }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="답변을 선택하세요"
      className="choice-grid"
    >
      {options.map((option, index) => (
        <motion.button
          key={option.value}
          role="radio"
          aria-checked={selectedValue === option.value}
          aria-describedby={option.description ? `desc-${option.value}` : undefined}
          onClick={() => onSelect(option.value)}
          className={cn(
            'choice-card',
            selectedValue === option.value && 'selected'
          )}
          variants={choiceVariants}
          whileHover="hover"
          whileTap="tap"
          animate={selectedValue === option.value ? 'selected' : 'idle'}
        >
          <span className="choice-label">{option.label}</span>
          {option.description && (
            <span id={`desc-${option.value}`} className="choice-description">
              {option.description}
            </span>
          )}
          
          {/* Checkmark for selected state */}
          <AnimatePresence>
            {selectedValue === option.value && (
              <motion.svg
                className="checkmark"
                viewBox="0 0 24 24"
                initial="hidden"
                animate="visible"
                exit="hidden"
                aria-hidden="true"
              >
                <motion.path
                  d="M5 12l5 5L20 7"
                  variants={checkmarkVariants}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>
      ))}
    </div>
  );
}
```

### 5.4 Screen Reader Announcements

```typescript
// hooks/useAnnounce.ts
export function useAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', priority);
    el.setAttribute('aria-atomic', 'true');
    el.className = 'sr-only';
    el.textContent = message;
    
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }, []);
  
  return { announce };
}

// Usage
const { announce } = useAnnounce();
announce(`질문 ${progress.answered + 1} of ${progress.total}`);
```

### 5.5 Color Contrast & Dark Mode

```css
/* globals.css */
:root {
  /* Light mode - WCAG AA compliant */
  --color-text-primary: #1a1a2e;        /* contrast 12.5:1 on white */
  --color-text-secondary: #4a4a68;      /* contrast 7.2:1 on white */
  --color-text-muted: #6b6b8a;          /* contrast 4.6:1 on white */
  
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8f9fc;
  --color-bg-tertiary: #eef0f5;
  
  --color-brand-primary: #6366f1;       /* Indigo */
  --color-brand-primary-light: #eef2ff;
  --color-brand-secondary: #8b5cf6;     /* Violet */
  
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: #f1f1f4;
    --color-text-secondary: #a1a1b5;
    --color-text-muted: #71718a;
    
    --color-bg-primary: #0f0f1a;
    --color-bg-secondary: #1a1a2e;
    --color-bg-tertiary: #252542;
    
    --color-brand-primary-light: #1e1b4b;
  }
}
```

---

## 6. Implementation Plan (Frontend Tickets)

### Ticket FE-OB-1: Project Setup & Shell Component
**Priority:** P0  
**Estimate:** 3 points

**Acceptance Criteria:**
- [ ] Next.js app router structure set up with `/onboarding` route
- [ ] Tailwind CSS + shadcn/ui installed and configured
- [ ] Framer Motion installed with motion config
- [ ] `OnboardingShell` component renders with progress bar, back/exit buttons
- [ ] Auth middleware redirects unauthenticated users to login
- [ ] Mobile viewport handling (safe areas, keyboard)

**Files to create:**
```
app/onboarding/
  layout.tsx
  page.tsx
components/onboarding/
  OnboardingShell.tsx
  ProgressBar.tsx
  TopNav.tsx
lib/
  motion.config.ts
```

---

### Ticket FE-OB-2: Briefly Character & Chat Bubble
**Priority:** P0  
**Estimate:** 2 points

**Acceptance Criteria:**
- [ ] `BrieflyCharacter` component with 6 emotion states
- [ ] Asset interface allows swapping PNG/SVG/Lottie
- [ ] `ChatBubble` component with speech bubble styling
- [ ] Typing indicator animation
- [ ] Smooth transition between character emotions
- [ ] Idle animation (subtle bounce/breathe)

**Files to create:**
```
components/onboarding/
  BrieflyCharacter.tsx
  ChatBubble.tsx
  TypingIndicator.tsx
assets/character/
  neutral.svg
  thinking.svg
  happy.svg
  celebrating.svg
  concerned.svg
  waving.svg
```

---

### Ticket FE-OB-3: Answer Components (Choices & Consent)
**Priority:** P0  
**Estimate:** 3 points

**Acceptance Criteria:**
- [ ] `SingleChoiceGrid` with selection animation and auto-advance
- [ ] `MultiChoiceGrid` with count display and Continue button
- [ ] `ConsentCard` with accept/decline buttons and learn-more link
- [ ] Keyboard navigation (arrow keys + Enter)
- [ ] ARIA roles (radiogroup, checkbox)
- [ ] Press feedback animations

**Files to create:**
```
components/onboarding/
  SingleChoiceGrid.tsx
  MultiChoiceGrid.tsx
  ConsentCard.tsx
  ChoiceCard.tsx (shared)
variants/
  choice.ts
```

---

### Ticket FE-OB-4: Specialized Input Components
**Priority:** P1  
**Estimate:** 3 points

**Acceptance Criteria:**
- [ ] `TickerSearch` with typeahead, max 10 selections, chip display
- [ ] S&P 500 ticker validation (client-side list + server validation)
- [ ] `TimePicker` with presets and custom time input
- [ ] `SectorPicker` (if different from multi-choice)
- [ ] Mobile: Full-screen search overlay for TickerSearch
- [ ] Error states for invalid tickers

**Files to create:**
```
components/onboarding/
  TickerSearch.tsx
  TickerChip.tsx
  TimePicker.tsx
  TimePresetButton.tsx
data/
  sp500-tickers.json
```

---

### Ticket FE-OB-5: Question Engine & API Integration
**Priority:** P0  
**Estimate:** 4 points

**Acceptance Criteria:**
- [ ] TanStack Query hooks for all onboarding endpoints
- [ ] `useQuestionEngine` hook manages flow state
- [ ] POST /start called on mount, handles resume
- [ ] Answer submission with optimistic updates
- [ ] Skip functionality for skippable questions
- [ ] Progress updates from backend `progress` payload
- [ ] Double-tap prevention (isPending checks)

**Files to create:**
```
hooks/
  useOnboarding.ts
  useQuestionEngine.ts
  useSubmitAnswer.ts
  useSkipQuestion.ts
lib/
  api/onboarding.ts
store/
  onboardingStore.ts (optional Zustand)
```

---

### Ticket FE-OB-6: Back Navigation & Answer Editing
**Priority:** P1  
**Estimate:** 2 points

**Acceptance Criteria:**
- [ ] Back button navigates to previous question
- [ ] Animation direction reverses on back navigation
- [ ] Previous answer pre-populated when returning
- [ ] PATCH /answer/:questionKey called when editing
- [ ] Answer history tracked in client state
- [ ] Back disabled on first question

**Files to modify:**
```
hooks/useQuestionEngine.ts
components/onboarding/TopNav.tsx
```

---

### Ticket FE-OB-7: Completion Screen & Celebration
**Priority:** P1  
**Estimate:** 2 points

**Acceptance Criteria:**
- [ ] `/onboarding/done` route with celebration UI
- [ ] Confetti animation on arrival
- [ ] Profile summary displayed
- [ ] "시작하기" CTA button to dashboard
- [ ] Character in celebrating emotion
- [ ] POST /complete called before navigation

**Files to create:**
```
app/onboarding/done/
  page.tsx
components/onboarding/
  CompletionScreen.tsx
  ConfettiOverlay.tsx
  ProfileSummary.tsx
```

---

### Ticket FE-OB-8: Error States & Offline Handling
**Priority:** P1  
**Estimate:** 2 points

**Acceptance Criteria:**
- [ ] `ErrorBanner` component with retry action
- [ ] Shake animation on validation errors
- [ ] Toast notifications for transient errors
- [ ] Offline detection with queue
- [ ] Retry logic with exponential backoff
- [ ] Character shows "concerned" emotion on error

**Files to create:**
```
components/onboarding/
  ErrorBanner.tsx
hooks/
  useOfflineQueue.ts
  useRetry.ts
  useOnlineStatus.ts
```

---

### Ticket FE-OB-9: Accessibility Polish
**Priority:** P1  
**Estimate:** 2 points

**Acceptance Criteria:**
- [ ] Full keyboard navigation for all question types
- [ ] Focus management after transitions
- [ ] Screen reader announcements for progress/errors
- [ ] `prefers-reduced-motion` support
- [ ] Color contrast meets WCAG AA
- [ ] Tab order logical throughout flow

**Files to modify:**
```
hooks/
  useKeyboardNavigation.ts
  useFocusManagement.ts
  useAnnounce.ts
  useReducedMotion.ts
```

---

### Ticket FE-OB-10: Loading States & Skeletons
**Priority:** P2  
**Estimate:** 1 point

**Acceptance Criteria:**
- [ ] `LoadingSkeleton` for initial load
- [ ] Skeleton matches question layout
- [ ] Character shows "thinking" during load
- [ ] Smooth transition from skeleton to content
- [ ] Button loading states during submission

**Files to create:**
```
components/onboarding/
  LoadingSkeleton.tsx
  SubmitButton.tsx (with loading state)
```

---

## 7. Example Screen States

### 7.1 Consent Question

```tsx
<OnboardingShell progress={{ answered: 0, total: 12, percentComplete: 0 }}>
  <BrieflyCharacter emotion="waving" />
  
  <ChatBubble
    title="맞춤형 서비스를 위해 정보를 저장할까요?"
    description="투자 성향과 관심 종목을 저장하여 매일 맞춤 콘텐츠를 제공합니다. 언제든 설정에서 삭제할 수 있습니다."
  />
  
  <ConsentCard
    onAccept={() => handleAnswer({ value: 'accept' })}
    onDecline={() => handleAnswer({ value: 'decline' })}
    learnMoreUrl="/privacy"
  />
  
  {/* No skip button - consent is required */}
</OnboardingShell>
```

### 7.2 Single Choice Question

```tsx
<OnboardingShell progress={{ answered: 1, total: 12, percentComplete: 8 }}>
  <BrieflyCharacter emotion="neutral" />
  
  <ChatBubble
    title="주식 투자 경험이 얼마나 되셨나요?"
    description="맞춤 콘텐츠 난이도를 조절하는 데 활용됩니다."
  />
  
  <SingleChoiceGrid
    options={[
      { value: '0', label: '처음입니다' },
      { value: '1_3', label: '1~3년' },
      { value: '3_5', label: '3~5년' },
      { value: '5_plus', label: '5년 이상' },
    ]}
    selectedValue={selectedValue}
    onSelect={(value) => handleAnswer({ value })}
  />
  
  <SkipButton onClick={handleSkip} />
</OnboardingShell>
```

### 7.3 Multi Choice Question

```tsx
<OnboardingShell progress={{ answered: 5, total: 12, percentComplete: 42 }}>
  <BrieflyCharacter emotion="thinking" />
  
  <ChatBubble
    title="관심 있는 섹터를 선택해주세요 (최대 3개)"
  />
  
  <MultiChoiceGrid
    options={[
      { value: 'Technology', label: '기술 (Tech)' },
      { value: 'Healthcare', label: '헬스케어' },
      { value: 'Financials', label: '금융' },
      { value: 'Consumer', label: '소비재' },
      { value: 'Energy', label: '에너지' },
      { value: 'Industrials', label: '산업재' },
    ]}
    selectedValues={selectedValues}
    onToggle={handleToggle}
    maxSelections={3}
  />
  
  <div className="flex justify-between mt-6">
    <SkipButton onClick={handleSkip} />
    <Button 
      onClick={() => handleAnswer({ values: selectedValues })}
      disabled={selectedValues.length === 0}
    >
      계속하기 ({selectedValues.length}/3)
    </Button>
  </div>
</OnboardingShell>
```

### 7.4 Ticker Search Question

```tsx
<OnboardingShell progress={{ answered: 7, total: 12, percentComplete: 58 }}>
  <BrieflyCharacter emotion="neutral" />
  
  <ChatBubble
    title="관심 종목이 있으신가요? (선택, 최대 10개)"
    description="S&P 500 종목 중에서 검색해주세요."
  />
  
  <TickerSearch
    selectedTickers={selectedTickers}
    onAdd={(ticker) => setSelectedTickers(prev => [...prev, ticker])}
    onRemove={(ticker) => setSelectedTickers(prev => prev.filter(t => t !== ticker))}
    maxTickers={10}
    placeholder="예: AAPL, MSFT, NVDA"
  />
  
  {/* Selected tickers as chips */}
  <div className="flex flex-wrap gap-2 mt-4">
    {selectedTickers.map(ticker => (
      <TickerChip 
        key={ticker}
        ticker={ticker}
        onRemove={() => handleRemove(ticker)}
      />
    ))}
  </div>
  
  <div className="flex justify-between mt-6">
    <SkipButton onClick={handleSkip} />
    <Button onClick={() => handleAnswer({ values: selectedTickers })}>
      계속하기
    </Button>
  </div>
</OnboardingShell>
```

### 7.5 Completion Screen

```tsx
<div className="min-h-screen flex flex-col items-center justify-center p-6">
  <ConfettiOverlay />
  
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
  >
    <BrieflyCharacter emotion="celebrating" size="lg" />
  </motion.div>
  
  <motion.h1
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="text-3xl font-bold mt-8"
  >
    환영합니다! 🎉
  </motion.h1>
  
  <motion.p
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="text-gray-600 mt-4 text-center"
  >
    내일 첫 번째 맞춤 레터를 보내드릴게요.
  </motion.p>
  
  <ProfileSummary profile={profile} className="mt-8" />
  
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.6 }}
    className="mt-8"
  >
    <Button size="lg" onClick={() => router.push('/dashboard')}>
      시작하기
    </Button>
  </motion.div>
</div>
```

---

## 8. Definition of Done Checklist

- [ ] Can complete onboarding end-to-end against backend spec
- [ ] Resumable session works (close browser, reopen, continue from last question)
- [ ] All question types render correctly:
  - [ ] consent
  - [ ] single_choice
  - [ ] multi_choice
  - [ ] ticker_search
  - [ ] sector_picker
  - [ ] time_picker
- [ ] Skip works and is tracked (only for skippable questions)
- [ ] Validation errors display clearly with shake animation
- [ ] Motion feels polished and not distracting
- [ ] Reduced motion mode works (no jarring animations)
- [ ] Mobile layout is excellent (safe areas, touch targets, keyboard handling)
- [ ] Desktop/tablet layouts look great
- [ ] Keyboard navigation works on desktop
- [ ] Screen reader experience is good (ARIA, announcements)
- [ ] Lighthouse performance score > 90 (no heavy blocking assets)
- [ ] Error states handled gracefully (network errors, validation)
- [ ] Back navigation works throughout flow
- [ ] Character reacts appropriately to states

---

## 9. Contract Alignment (v1.1)

This section documents frontend-backend contract decisions for implementation consistency.

### 9.1 Consent Handling

**Approach A (via POST /answer):**
- Consent is treated as a question with `type: 'consent'` and `key: 'consent_personalization'`
- Answer payload: `{ value: 'accept' }` or `{ value: 'decline' }`
- If declined, backend returns `nextQuestion: null` with `consentDeclined: true`
- Frontend redirects to `/onboarding/declined`

**Approach B (explicit POST /consent):**
- Consent uses dedicated `POST /api/onboarding/consent` endpoint
- Payload: `{ consentType: 'personalization_data', granted: true/false }`
- If declined, frontend redirects to `/onboarding/declined`

**Frontend Implementation:**
- `ConsentCard` component calls appropriate handler based on config
- Both approaches result in identical UX
- Config flag: `CONSENT_VIA_ANSWER_ENDPOINT` (default: true for MVP)

### 9.2 Back Navigation Behavior

**Rules:**
1. Client maintains an `answerStack` array of `{ questionKey, answer, skipped, question }` records
2. When user taps "Back":
   - Pop the last item from stack
   - Display that question with prefilled answer (no API call yet)
   - User can modify or keep the answer
3. When user submits (same or modified answer):
   - If answer changed: `PATCH /api/onboarding/answer/:questionKey`
   - If answer unchanged: No API call, proceed to next question
4. Backend `/question/next` returns `previousAnswers` map for recovery scenarios

**API Usage:**
- Do NOT call `PATCH` with `null` to clear answers
- Only call `PATCH` when user explicitly changes a previous answer
- This minimizes network calls and preserves audit integrity

### 9.3 Job Title / Industry Questions

**Question Types:**
- `job_title`: `type: 'text'`, skippable, maps to `user_profile.job_title`
- `industry`: `type: 'text'` OR `type: 'single_choice'` with taxonomy, skippable

**UI Requirements:**
- Large input card with encouraging microcopy
- Placeholder: "예: 소프트웨어 엔지니어, 금융 애널리스트"
- Character emotion: `thinking` during input
- Validation: min 2 chars if not skipped, max 100 chars
- Skip label: "답하지 않음"

**Rendering:**
```tsx
case 'text':
  return (
    <TextInput
      placeholder={question.placeholder}
      validation={question.validation}
      initialValue={prefillValue}
      onSubmit={(value) => onAnswer({ value })}
      disabled={isLoading}
    />
  );
```

### 9.4 S&P 500 Ticker Data Source

**Data Location:** `src/data/sp500-tickers.json`

**Format:**
```json
[
  { "symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology" },
  { "symbol": "BRK.B", "name": "Berkshire Hathaway Inc. Class B", "sector": "Financials" },
  ...
]
```

**Loading Strategy:**
- Static import at build time (no network request)
- Memoized search with debounce (150ms)
- Results limited to 8 for performance
- Symbol normalization: case-insensitive, handles dots (BRK.B)

**Validation:**
- Client-side: Check against loaded list
- Server-side: Validates against `Ticker` table with `is_sp500 = TRUE`

### 9.5 Prefill Logic

**When Navigating Back:**
1. `QuestionRenderer` receives `initialAnswer` prop
2. For each question type:
   - `single_choice`: `selectedValue={initialAnswer?.value}`
   - `multi_choice`: `selectedValues={initialAnswer?.values ?? []}`
   - `ticker_search`: `selectedTickers={initialAnswer?.values ?? []}`
   - `text`: `initialValue={initialAnswer?.value ?? ''}`
   - `time_picker`: `defaultValue={initialAnswer?.value}`
3. User sees their previous selection/input
4. "Continue" button enabled immediately (can re-submit same answer)

**Change Detection:**
```typescript
const hasAnswerChanged = (original: AnswerPayload | null, current: AnswerPayload): boolean => {
  if (!original) return true;
  if (original.value !== current.value) return true;
  if (JSON.stringify(original.values) !== JSON.stringify(current.values)) return true;
  return false;
};
```

---

*Document Version: 1.1*  
*Last Updated: 2026-01-28*  
*Author: Frontend Engineer Agent*
