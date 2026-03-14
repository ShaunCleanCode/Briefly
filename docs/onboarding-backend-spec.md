# Onboarding Backend Specification (v1.1)

---

## Change Summary (v1.0 → v1.1)

| Change | Reason |
|--------|--------|
| **Added job_title, industry fields** | High-signal personalization inputs requested by PM |
| **Added role_function, seniority fields** | Optional professional context for content targeting |
| **Consent via `/answer` (Option A)** | Single canonical path; removes frontend ambiguity |
| **Deprecated standalone `/consent` endpoint** | Now handled by `/answer` for `consent_*` keys |
| **Defined deterministic next-question rule** | Back navigation works reliably with PATCH-to-null |
| **Added new questions to MVP bank** | job_title, industry with Korean i18n |
| **Updated tickets OB-1, OB-2, OB-5** | Schema + contract changes |
| **Added 6 test cases** | Covers consent, back-nav, new fields |

---

## Tech Stack Decision

**Choice: Next.js API Routes + Supabase Postgres**

### Justification
1. **Unified Stack**: Briefly; likely uses Next.js for the frontend (SSR/SSG content platform). Keeping API routes in the same repo simplifies deployment, type-sharing, and development velocity.
2. **Supabase Benefits**: Built-in Row Level Security (RLS), real-time subscriptions (useful for chat UX), automatic REST/GraphQL, edge functions for future AI personalization.
3. **Managed Auth**: Supabase Auth integrates well with the existing User model, reducing custom auth code.
4. **Cost-Effective for MVP**: Generous free tier, easy scaling path to Pro.

---

## 1. Data Model (Postgres Schema)

### 1.1 Existing Tables (Extended)

```sql
-- Extend existing UserProfile with onboarding-derived fields
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS
  onboarding_completed_at TIMESTAMPTZ,
  knowledge_level TEXT CHECK (knowledge_level IN ('beginner', 'intermediate', 'advanced')),
  investor_segment TEXT CHECK (investor_segment IN ('long_term', 'trader', 'macro', 'sector_specialist', 'learner')),
  delivery_timezone TEXT DEFAULT 'Asia/Seoul',
  delivery_time TIME DEFAULT '07:00',
  depth_preference TEXT CHECK (depth_preference IN ('summary', 'detailed', 'deep_dive')) DEFAULT 'detailed',
  watchlist_tickers TEXT[], -- e.g., ['AAPL', 'MSFT', 'NVDA']
  watchlist_sectors TEXT[], -- e.g., ['Technology', 'Healthcare']
  investment_horizon TEXT CHECK (investment_horizon IN ('short', 'medium', 'long')),
  risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  portfolio_size_range TEXT CHECK (portfolio_size_range IN ('none', 'under_10k', '10k_50k', '50k_200k', '200k_plus', 'skip')),
  experience_years TEXT CHECK (experience_years IN ('0', '1_3', '3_5', '5_plus', 'skip')),
  -- v1.1: High-signal professional context fields
  job_title TEXT, -- freeform, max 100 chars (e.g., '소프트웨어 엔지니어', 'Product Manager')
  industry TEXT CHECK (industry IN (
    'technology', 'finance', 'healthcare', 'manufacturing', 'retail',
    'education', 'government', 'consulting', 'media', 'energy',
    'real_estate', 'legal', 'other', 'skip'
  )),
  role_function TEXT CHECK (role_function IN (
    'engineering', 'product', 'design', 'marketing', 'sales',
    'operations', 'finance', 'hr', 'executive', 'other', 'skip'
  )), -- optional
  seniority TEXT CHECK (seniority IN (
    'entry', 'mid', 'senior', 'lead', 'executive', 'skip'
  )), -- optional
  updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index for personalization queries on professional fields
CREATE INDEX IF NOT EXISTS idx_user_profile_industry ON user_profile(industry) WHERE industry IS NOT NULL;
```

### 1.2 New Tables

```sql
-- ==========================================
-- ONBOARDING QUESTION DEFINITIONS (Versioned)
-- ==========================================
CREATE TABLE onboarding_question_set (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INT NOT NULL,
  name TEXT NOT NULL, -- e.g., 'mvp_v1', 'mvp_v2'
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE, -- only one active at a time
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(version)
);

CREATE INDEX idx_question_set_active ON onboarding_question_set(is_active) WHERE is_active = TRUE;

CREATE TABLE onboarding_question (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id UUID NOT NULL REFERENCES onboarding_question_set(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL, -- stable key: 'experience_years', 'risk_tolerance', etc.
  sequence_order INT NOT NULL, -- display order within the set
  question_type TEXT NOT NULL CHECK (question_type IN (
    'single_choice', 'multi_choice', 'text', 'number', 
    'ticker_search', 'sector_picker', 'time_picker', 'consent'
  )),
  is_required BOOLEAN DEFAULT FALSE, -- required for completion
  is_skippable BOOLEAN DEFAULT TRUE, -- can user skip?
  validation_rules JSONB, -- { min: 0, max: 100, pattern: "..." }
  options JSONB, -- for choice types: [{ value: 'beginner', label_key: 'q.exp.opt1' }]
  condition_logic JSONB, -- branching: { if: 'experience_years', equals: '0', then: 'show' }
  maps_to_field TEXT, -- target UserProfile field or NULL
  scoring_weight JSONB, -- { knowledge: 0, segment: 2 } for derived fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_set_id, question_key)
);

CREATE INDEX idx_question_order ON onboarding_question(question_set_id, sequence_order);
CREATE INDEX idx_question_key ON onboarding_question(question_key);

-- Localized content for questions/options
CREATE TABLE onboarding_question_i18n (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES onboarding_question(id) ON DELETE CASCADE,
  locale TEXT NOT NULL DEFAULT 'ko', -- 'ko', 'en'
  title TEXT NOT NULL,
  description TEXT,
  placeholder TEXT,
  option_labels JSONB, -- { 'beginner': '초보자 (1년 미만)', ... }
  skip_label TEXT DEFAULT '건너뛰기',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, locale)
);

CREATE INDEX idx_question_i18n_locale ON onboarding_question_i18n(question_id, locale);

-- ==========================================
-- ONBOARDING SESSION & ANSWERS
-- ==========================================
CREATE TABLE onboarding_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_set_id UUID NOT NULL REFERENCES onboarding_question_set(id),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_question_key TEXT, -- last answered/shown question
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- { device, ip_hash, referrer }
  UNIQUE(user_id, question_set_id) -- one session per user per version
);

CREATE INDEX idx_session_user ON onboarding_session(user_id);
CREATE INDEX idx_session_status ON onboarding_session(status);

CREATE TABLE onboarding_answer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES onboarding_session(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES onboarding_question(id),
  question_key TEXT NOT NULL, -- denormalized for easier queries
  answer_raw JSONB NOT NULL, -- original user input: { value: 'beginner' } or { values: ['AAPL','MSFT'] }
  answer_normalized TEXT, -- normalized for profile field mapping
  is_skipped BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

CREATE INDEX idx_answer_session ON onboarding_answer(session_id);
CREATE INDEX idx_answer_question_key ON onboarding_answer(question_key);

-- ==========================================
-- CONSENT RECORDS (Auditable)
-- ==========================================
CREATE TABLE consent_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'personalization_data', -- allow storing profile for personalization
    'portfolio_data', -- allow storing portfolio info
    'email_marketing', -- marketing emails beyond product
    'third_party_share' -- future: share with partners (not MVP)
  )),
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip_hash TEXT, -- hashed IP for audit
  user_agent TEXT,
  consent_version TEXT DEFAULT 'v1', -- link to legal text version
  UNIQUE(user_id, consent_type, consent_version)
);

CREATE INDEX idx_consent_user ON consent_record(user_id);
CREATE INDEX idx_consent_type ON consent_record(consent_type, granted);

-- ==========================================
-- PORTFOLIO SNAPSHOT (Optional during onboarding)
-- ==========================================
CREATE TABLE onboarding_portfolio_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES onboarding_session(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tickers JSONB NOT NULL, -- [{ symbol: 'AAPL', weight_pct: 25 }, ...]
  total_allocation_pct INT, -- should sum to ~100
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_snapshot_user ON onboarding_portfolio_snapshot(user_id);

-- ==========================================
-- AUDIT LOG (Profile & Consent Changes)
-- ==========================================
CREATE TABLE profile_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id), -- who made the change (user or admin)
  action TEXT NOT NULL CHECK (action IN (
    'profile_created', 'profile_updated', 'onboarding_completed',
    'consent_granted', 'consent_revoked', 'answer_edited', 'answer_skipped'
  )),
  target_field TEXT, -- e.g., 'knowledge_level', 'consent:personalization_data'
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}', -- { ip_hash, source: 'onboarding' | 'profile_edit' }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON profile_audit_log(user_id);
CREATE INDEX idx_audit_action ON profile_audit_log(action);
CREATE INDEX idx_audit_created ON profile_audit_log(created_at DESC);
```

### 1.3 Recommended Indexes Summary

| Table | Index | Purpose |
|-------|-------|---------|
| `onboarding_question_set` | `is_active` partial | Fast active version lookup |
| `onboarding_question` | `(question_set_id, sequence_order)` | Ordered question fetch |
| `onboarding_session` | `user_id` | Resume session lookup |
| `onboarding_answer` | `session_id`, `question_key` | Answer retrieval |
| `consent_record` | `(user_id)`, `(consent_type, granted)` | Consent checks |
| `profile_audit_log` | `user_id`, `action`, `created_at DESC` | Audit queries |

### 1.4 Retention Rules

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| `onboarding_session` | 2 years | Re-onboarding, support |
| `onboarding_answer` | 2 years | Profile derivation history |
| `consent_record` | 7 years (legal) | Compliance audit trail |
| `profile_audit_log` | 3 years | Audit compliance |
| `onboarding_portfolio_snapshot` | Until migrated to `Holding` | Temp storage |

---

## 2. API Design (REST)

### 2.1 Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/onboarding/start` | Start or resume session |
| `GET` | `/api/onboarding/session` | Get current session state |
| `GET` | `/api/onboarding/question/next` | Fetch next question (deterministic selection) |
| `POST` | `/api/onboarding/answer` | Submit an answer **(handles consent questions too)** |
| `POST` | `/api/onboarding/skip` | Skip a question |
| `PATCH` | `/api/onboarding/answer/:questionKey` | Edit/clear a past answer (set `null` for back-nav) |
| `POST` | `/api/onboarding/complete` | Complete onboarding |
| `GET` | `/api/onboarding/profile` | Get derived profile |
| `GET` | `/api/onboarding/consent` | Get consent status (read-only) |
| `POST` | `/api/onboarding/portfolio-snapshot` | Save portfolio snapshot |

> **v1.1 Contract Change:** `POST /api/onboarding/consent` is **DEPRECATED** for frontend use.  
> Consent is now recorded via `POST /api/onboarding/answer` when `questionKey.startsWith('consent_')`.  
> The standalone endpoint remains available for admin audit purposes only.

### 2.2 Detailed Endpoint Specs

#### `POST /api/onboarding/start`

Start a new session or resume existing one.

**Request:**
```json
{
  "locale": "ko",
  "metadata": {
    "device": "mobile",
    "referrer": "signup_flow"
  }
}
```

**Response (200 OK):**
```json
{
  "session": {
    "id": "uuid-session",
    "status": "in_progress",
    "questionSetVersion": 1,
    "currentQuestionKey": null,
    "progress": {
      "answered": 0,
      "total": 12,
      "percentComplete": 0
    },
    "startedAt": "2026-01-28T10:00:00Z"
  },
  "consentRequired": true,
  "nextQuestion": {
    "key": "consent_personalization",
    "type": "consent",
    "title": "맞춤형 서비스를 위해 정보를 저장할까요?",
    "description": "투자 성향과 관심 종목을 저장하여 매일 맞춤 콘텐츠를 제공합니다.",
    "options": [
      { "value": "accept", "label": "동의합니다" },
      { "value": "decline", "label": "동의하지 않습니다" }
    ],
    "isRequired": true,
    "isSkippable": false
  }
}
```

**Response (409 Conflict - already completed):**
```json
{
  "error": "ONBOARDING_ALREADY_COMPLETED",
  "message": "Onboarding was completed on 2026-01-20",
  "completedAt": "2026-01-20T15:30:00Z",
  "canRestart": false
}
```

---

#### `GET /api/onboarding/question/next`

Fetch the next question based on branching logic.

**Query Params:**
- `locale` (optional, default: `ko`)

**Response (200 OK):**
```json
{
  "question": {
    "key": "experience_years",
    "type": "single_choice",
    "title": "주식 투자 경험이 얼마나 되셨나요?",
    "description": null,
    "options": [
      { "value": "0", "label": "처음입니다" },
      { "value": "1_3", "label": "1~3년" },
      { "value": "3_5", "label": "3~5년" },
      { "value": "5_plus", "label": "5년 이상" }
    ],
    "isRequired": false,
    "isSkippable": true,
    "skipLabel": "건너뛰기",
    "validation": null
  },
  "progress": {
    "answered": 1,
    "total": 12,
    "percentComplete": 8
  },
  "previousAnswers": {
    "consent_personalization": { "value": "accept", "skipped": false }
  }
}
```

**Response (200 OK - no more questions):**
```json
{
  "question": null,
  "isComplete": true,
  "progress": {
    "answered": 12,
    "total": 12,
    "percentComplete": 100
  }
}
```

---

#### `POST /api/onboarding/answer`

Submit an answer to a question. **Handles consent questions atomically.**

**Request:**
```json
{
  "questionKey": "experience_years",
  "answer": {
    "value": "1_3"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "answerId": "uuid-answer",
  "normalized": "1_3",
  "nextQuestion": {
    "key": "risk_tolerance",
    "type": "single_choice",
    "title": "투자 위험에 대한 선호도는 어떠신가요?",
    ...
  },
  "progress": {
    "answered": 2,
    "total": 14,
    "percentComplete": 14
  }
}
```

**Consent Question Example (v1.1):**

When `questionKey` starts with `consent_`, backend performs these steps atomically:
1. Validate answer is `accept` or `decline`
2. Write to `consent_record` table
3. Write to `onboarding_answer` table
4. Return next question (or end flow if declined)

```json
// Request
{
  "questionKey": "consent_personalization",
  "answer": {
    "value": "accept"
  }
}

// Response (200 OK)
{
  "success": true,
  "answerId": "uuid-answer",
  "consentRecorded": true,
  "consentType": "personalization_data",
  "consentGranted": true,
  "nextQuestion": {
    "key": "job_title",
    "type": "text",
    "title": "어떤 일을 하고 계신가요?",
    ...
  },
  "progress": {
    "answered": 1,
    "total": 14,
    "percentComplete": 7
  }
}
```

**Consent Declined Response:**
```json
{
  "success": true,
  "answerId": "uuid-answer",
  "consentRecorded": true,
  "consentType": "personalization_data",
  "consentGranted": false,
  "sessionStatus": "consent_declined",
  "nextQuestion": null,
  "message": "맞춤 서비스 없이 기본 레터만 받으실 수 있습니다."
}
```

**Multi-select Example (watchlist tickers):**
```json
{
  "questionKey": "watchlist_tickers",
  "answer": {
    "values": ["AAPL", "MSFT", "NVDA", "GOOGL"]
  }
}
```

**Error: Consent Required (403):**

Returned when trying to submit non-consent answers before consent is granted.

```json
{
  "error": "CONSENT_REQUIRED",
  "message": "Cannot store personalization data without consent",
  "requiredConsentType": "personalization_data",
  "redirectToQuestion": "consent_personalization"
}
```

**Validation Error (400):**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid ticker symbol",
  "details": {
    "field": "values[2]",
    "value": "INVALID",
    "rule": "must be valid S&P 500 ticker"
  }
}
```

---

#### `POST /api/onboarding/skip`

Skip a skippable question.

**Request:**
```json
{
  "questionKey": "portfolio_size_range"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "skipped": true,
  "questionKey": "portfolio_size_range",
  "nextQuestion": { ... },
  "progress": { ... }
}
```

**Error (400 - not skippable):**
```json
{
  "error": "QUESTION_NOT_SKIPPABLE",
  "message": "This question is required and cannot be skipped",
  "questionKey": "consent_personalization"
}
```

---

#### `PATCH /api/onboarding/answer/:questionKey`

Edit a previously submitted answer. **Supports back navigation via null.**

**Request (Edit answer):**
```json
{
  "answer": {
    "value": "3_5"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "answerId": "uuid-answer",
  "previousValue": "1_3",
  "newValue": "3_5",
  "derivedFieldsUpdated": ["knowledge_level"]
}
```

**Request (Clear answer for back navigation - v1.1):**

Setting `answer` to `null` clears the answer, making this question the "next" question again.

```json
{
  "answer": null
}
```

**Response (200 OK - answer cleared):**
```json
{
  "success": true,
  "answerId": "uuid-answer",
  "previousValue": "3_5",
  "newValue": null,
  "cleared": true,
  "nextQuestion": {
    "key": "experience_years",
    "type": "single_choice",
    "title": "주식 투자 경험이 얼마나 되셨나요?",
    ...
  }
}
```

**Error (Cannot clear consent):**
```json
{
  "error": "CANNOT_CLEAR_CONSENT",
  "message": "Consent answers cannot be cleared. Contact support to revoke consent.",
  "questionKey": "consent_personalization"
}
```

---

#### `POST /api/onboarding/complete`

Mark onboarding as complete and trigger profile computation.

**Request:**
```json
{
  "finalConfirmation": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "profile": {
    "knowledgeLevel": "intermediate",
    "investorSegment": "long_term",
    "deliveryTimezone": "Asia/Seoul",
    "deliveryTime": "07:00",
    "depthPreference": "detailed",
    "watchlistTickers": ["AAPL", "MSFT", "NVDA"],
    "watchlistSectors": ["Technology"],
    "completedAt": "2026-01-28T10:15:00Z"
  },
  "message": "환영합니다! 내일 첫 번째 맞춤 레터를 보내드릴게요."
}
```

**Error (400 - missing required):**
```json
{
  "error": "REQUIRED_QUESTIONS_INCOMPLETE",
  "message": "Please complete all required questions",
  "missing": ["consent_personalization"]
}
```

---

#### `GET /api/onboarding/profile`

Fetch the computed profile.

**Response (200 OK):**
```json
{
  "profile": {
    "knowledgeLevel": "intermediate",
    "investorSegment": "long_term",
    "deliverySchedule": {
      "timezone": "Asia/Seoul",
      "time": "07:00",
      "nextDelivery": "2026-01-29T07:00:00+09:00"
    },
    "personalizationInputs": {
      "watchlistTickers": ["AAPL", "MSFT", "NVDA"],
      "watchlistSectors": ["Technology", "Healthcare"],
      "depthPreference": "detailed",
      "investmentHorizon": "long",
      "riskTolerance": "moderate"
    },
    "onboardingCompletedAt": "2026-01-28T10:15:00Z",
    "lastUpdatedAt": "2026-01-28T10:15:00Z"
  },
  "canEdit": true,
  "editableFields": [
    "watchlistTickers",
    "watchlistSectors",
    "depthPreference",
    "deliveryTime",
    "deliveryTimezone"
  ]
}
```

---

#### `GET /api/onboarding/consent`

Get consent status for the current user. (Read-only)

**Response (200 OK):**
```json
{
  "consents": [
    {
      "type": "personalization_data",
      "granted": true,
      "grantedAt": "2026-01-28T10:01:00Z",
      "version": "v1"
    },
    {
      "type": "portfolio_data",
      "granted": false,
      "grantedAt": null,
      "version": null
    }
  ]
}
```

> **⚠️ DEPRECATED (v1.1):** `POST /api/onboarding/consent`  
> Frontend should use `POST /api/onboarding/answer` with `questionKey: "consent_*"` instead.  
> The standalone POST endpoint remains available for admin/audit tooling only.

---

#### `POST /api/onboarding/portfolio-snapshot`

Save optional portfolio during onboarding.

**Request:**
```json
{
  "tickers": [
    { "symbol": "AAPL", "weightPct": 30 },
    { "symbol": "MSFT", "weightPct": 25 },
    { "symbol": "GOOGL", "weightPct": 20 },
    { "symbol": "NVDA", "weightPct": 15 },
    { "symbol": "CASH", "weightPct": 10 }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "snapshotId": "uuid-snapshot",
  "totalAllocationPct": 100,
  "tickerCount": 5,
  "message": "Portfolio saved. You can refine it later in Portfolio settings."
}
```

---

### 2.3 Admin Endpoints (Optional for MVP)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/onboarding/question-sets` | List all versions |
| `POST` | `/api/admin/onboarding/question-sets` | Create new version |
| `PUT` | `/api/admin/onboarding/question-sets/:id/activate` | Activate a version |
| `GET` | `/api/admin/onboarding/questions/:setId` | List questions |
| `POST` | `/api/admin/onboarding/questions/:setId` | Add question |
| `PUT` | `/api/admin/onboarding/questions/:id` | Update question |
| `GET` | `/api/admin/onboarding/analytics` | Completion rates, drop-off |

---

## 3. Question Engine Approach

### 3.1 Versioned Questionnaire

**Strategy:**
1. Each `onboarding_question_set` has a version number.
2. Only one set is `is_active = TRUE` at any time.
3. When a user starts onboarding, their session locks to the current active version.
4. Users who started with v1 continue with v1 questions even if v2 becomes active.
5. New question sets can reuse question_keys for backward compatibility in derived fields.

**Migration Path:**
```sql
-- Activate new version (transaction)
BEGIN;
UPDATE onboarding_question_set SET is_active = FALSE WHERE is_active = TRUE;
UPDATE onboarding_question_set SET is_active = TRUE WHERE id = 'new-version-uuid';
COMMIT;
```

### 3.2 Conditional Logic Engine

**Condition Schema:**
```json
{
  "condition_logic": {
    "rules": [
      {
        "if": {
          "questionKey": "experience_years",
          "operator": "in",
          "values": ["0", "1_3"]
        },
        "then": "show"
      },
      {
        "if": {
          "questionKey": "has_portfolio",
          "operator": "equals",
          "value": "no"
        },
        "then": "skip"
      }
    ],
    "default": "show"
  }
}
```

**Supported Operators:**
- `equals`, `not_equals`
- `in`, `not_in`
- `exists`, `not_exists` (for optional/skipped)
- `gt`, `gte`, `lt`, `lte` (for numeric)

**Evaluation Logic (TypeScript):**
```typescript
function shouldShowQuestion(
  question: OnboardingQuestion,
  previousAnswers: Map<string, Answer>
): 'show' | 'skip' | 'hide' {
  if (!question.condition_logic) return 'show';
  
  const { rules, default: defaultAction } = question.condition_logic;
  
  for (const rule of rules) {
    const answer = previousAnswers.get(rule.if.questionKey);
    if (evaluateCondition(rule.if, answer)) {
      return rule.then;
    }
  }
  
  return defaultAction || 'show';
}
```

### 3.2.1 Deterministic Next-Question Selection Rule (v1.1)

This rule ensures back navigation works reliably when using PATCH-to-null strategy.

**Contract:** `GET /api/onboarding/question/next` always returns the same question given the same answer state.

**Algorithm:**

```typescript
/**
 * Deterministic next-question selection.
 * 
 * Rule: Return the FIRST question (by sequence_order) where:
 *   1. Question belongs to the session's locked question_set
 *   2. Answer is NULL or does not exist in onboarding_answer
 *   3. Answer is NOT marked as is_skipped = true (skipped counts as answered)
 *   4. Branching rules evaluate to 'show' (not 'skip' or 'hide')
 * 
 * If no such question exists, return null (onboarding complete).
 */
async function getNextQuestion(
  sessionId: string,
  locale: string = 'ko'
): Promise<QuestionResponse | null> {
  const session = await getSession(sessionId);
  
  // 1. Load all questions for this session's question set (ordered by sequence_order)
  const questions = await db.onboardingQuestion.findMany({
    where: { question_set_id: session.question_set_id },
    orderBy: { sequence_order: 'asc' },
    include: { i18n: { where: { locale } } },
  });
  
  // 2. Load all existing answers for this session (including skipped)
  const answers = await db.onboardingAnswer.findMany({
    where: { session_id: sessionId },
  });
  
  // Build answer map: questionKey -> { value, isSkipped }
  const answerMap = new Map<string, AnswerRecord>();
  for (const ans of answers) {
    // Only include answers that have a value OR are explicitly skipped
    if (ans.answer_raw !== null || ans.is_skipped) {
      answerMap.set(ans.question_key, {
        value: ans.answer_raw,
        isSkipped: ans.is_skipped,
      });
    }
  }
  
  // 3. Find first unanswered question that should be shown
  for (const question of questions) {
    const existingAnswer = answerMap.get(question.question_key);
    
    // Skip if already answered (has value or is explicitly skipped)
    if (existingAnswer && (existingAnswer.value !== null || existingAnswer.isSkipped)) {
      continue;
    }
    
    // Check branching rules
    const visibility = shouldShowQuestion(question, answerMap);
    
    if (visibility === 'show') {
      // This is the next question
      return formatQuestionResponse(question, answerMap);
    }
    
    // If visibility is 'skip' or 'hide', continue to next question
  }
  
  // No more questions
  return null;
}
```

**Back Navigation Flow:**

```
User at question 5 (risk_tolerance), wants to go back to question 4 (investment_goal):

1. Frontend calls: PATCH /answer/investment_goal { answer: null }
2. Backend sets onboarding_answer.answer_raw = NULL for investment_goal
3. Backend calls getNextQuestion()
4. Algorithm finds investment_goal is first question where answer is null
5. Returns investment_goal as nextQuestion
6. Frontend displays investment_goal with previous answer for editing
```

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| PATCH null on consent question | Error: `CANNOT_CLEAR_CONSENT` |
| PATCH null on skipped question | Clears skip, question becomes "next" |
| PATCH null on conditional question | Re-evaluates branching |
| All questions answered | Returns `{ question: null, isComplete: true }` |
| Session status = 'completed' | Error: `ONBOARDING_ALREADY_COMPLETED` |

### 3.3 Required Path Under 3-5 Minutes

**Design Principles:**
1. **Core questions: 10-12 max** for required path (v1.1: added professional context)
2. **Optional deep-dive: 4-6 additional** for engaged users
3. **Smart defaults**: Pre-fill where possible (timezone from browser)
4. **Chunking**: Group related questions visually
5. **Skip-friendly copy**: Encourage completion without forcing

**Question Flow (MVP v1.1):**

```
[REQUIRED - ~3 min, all skippable except consent]
1. consent_personalization (consent) - GATE, NOT skippable
2. job_title (text) - NEW v1.1, skippable, high-signal
3. industry (single_choice) - NEW v1.1, skippable, high-signal
4. experience_years (single_choice)
5. investment_goal (single_choice) 
6. risk_tolerance (single_choice)
7. time_availability (single_choice) - maps to depth_preference
8. watchlist_sectors (multi_choice, max 3)
9. delivery_time (time_picker)

[OPTIONAL - +2 min if engaged]
10. role_function (single_choice) - NEW v1.1, optional professional detail
11. seniority (single_choice) - NEW v1.1, optional
12. watchlist_tickers (ticker_search, max 10)
13. portfolio_size_range (single_choice, skippable)
14. has_portfolio → portfolio_entry (conditional)
```

**v1.1 Rationale for job_title/industry placement:**
- Placed early (questions 2-3) to capture while engagement is high
- Skippable to respect data minimization
- Copy emphasizes value: "자세히 알려주실수록 레터가 더 정확해져요"
- Text input for job_title allows nuance; enum for industry enables analytics

### 3.4 Localization Strategy

**Approach: Content/Code Separation**

1. **Question text lives in `onboarding_question_i18n`**, not in code.
2. **Frontend requests `?locale=ko`**, backend joins appropriate i18n row.
3. **Fallback chain**: `ko` → `en` → question_key as placeholder.

**Seed Example:**
```sql
INSERT INTO onboarding_question_i18n (question_id, locale, title, description, option_labels) VALUES
(
  'uuid-experience-years',
  'ko',
  '주식 투자 경험이 얼마나 되셨나요?',
  '맞춤 콘텐츠 난이도를 조절하는 데 활용됩니다.',
  '{"0": "처음입니다", "1_3": "1~3년", "3_5": "3~5년", "5_plus": "5년 이상"}'
),
(
  'uuid-experience-years',
  'en',
  'How long have you been investing in stocks?',
  'This helps us calibrate content difficulty.',
  '{"0": "I''m new", "1_3": "1-3 years", "3_5": "3-5 years", "5_plus": "5+ years"}'
);
```

### 3.5 Validation Per Question Type

| Type | Validation Rules |
|------|------------------|
| `single_choice` | Value must be in `options[].value` |
| `multi_choice` | Values must be subset of options; optional `min`/`max` count |
| `text` | Optional `minLength`, `maxLength`, `pattern` (regex) |
| `number` | Optional `min`, `max`, `step` |
| `ticker_search` | Validate against `Ticker` table where `is_sp500 = TRUE` |
| `sector_picker` | Validate against allowed GICS sectors list |
| `time_picker` | Format `HH:MM`, optional range (`05:00`-`22:00`) |
| `consent` | Must be `accept` or `decline` |

**Validation Implementation:**
```typescript
async function validateAnswer(
  question: OnboardingQuestion,
  answer: AnswerPayload
): Promise<ValidationResult> {
  const rules = question.validation_rules || {};
  
  switch (question.question_type) {
    case 'ticker_search':
      const invalidTickers = await findInvalidTickers(answer.values);
      if (invalidTickers.length > 0) {
        return { valid: false, error: `Invalid tickers: ${invalidTickers.join(', ')}` };
      }
      if (rules.max && answer.values.length > rules.max) {
        return { valid: false, error: `Maximum ${rules.max} tickers allowed` };
      }
      break;
    // ... other types
  }
  
  return { valid: true };
}
```

### 3.6 Rate Limiting & Abuse Prevention

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /onboarding/start` | 5 | per hour per user |
| `POST /onboarding/answer` | 60 | per minute per session |
| `POST /onboarding/skip` | 30 | per minute per session |
| `PATCH /onboarding/answer/*` | 20 | per minute per user |

**Implementation (Next.js middleware + Upstash Redis):**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
});

// In API route
const { success, limit, remaining } = await ratelimit.limit(
  `onboarding:answer:${sessionId}`
);

if (!success) {
  return NextResponse.json(
    { error: 'RATE_LIMIT_EXCEEDED', retryAfter: 60 },
    { status: 429 }
  );
}
```

---

## 4. Derived Fields & Scoring (Deterministic)

### 4.1 Knowledge Level Computation

```typescript
type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

function computeKnowledgeLevel(answers: AnswerMap): KnowledgeLevel {
  let score = 0;
  
  // Experience years: 0=0, 1_3=1, 3_5=2, 5_plus=3
  const expMap = { '0': 0, '1_3': 1, '3_5': 2, '5_plus': 3 };
  score += expMap[answers.get('experience_years')?.value] ?? 0;
  
  // Self-assessed knowledge (if asked): beginner=0, intermediate=1, advanced=2
  const selfMap = { 'beginner': 0, 'intermediate': 1, 'advanced': 2 };
  score += selfMap[answers.get('self_knowledge')?.value] ?? 0;
  
  // Bonus for advanced features interest
  if (answers.get('depth_preference')?.value === 'deep_dive') score += 1;
  if (answers.get('wants_technical_analysis')?.value === 'yes') score += 1;
  
  // Map score to level
  if (score <= 1) return 'beginner';
  if (score <= 4) return 'intermediate';
  return 'advanced';
}
```

### 4.2 Investor Segment Classification

```typescript
type InvestorSegment = 'long_term' | 'trader' | 'macro' | 'sector_specialist' | 'learner';

function computeInvestorSegment(answers: AnswerMap): InvestorSegment {
  const goal = answers.get('investment_goal')?.value;
  const horizon = answers.get('investment_horizon')?.value;
  const sectors = answers.get('watchlist_sectors')?.values || [];
  const experience = answers.get('experience_years')?.value;
  
  // Learner: new investor focused on education
  if (experience === '0' || goal === 'learn') {
    return 'learner';
  }
  
  // Trader: short horizon, active trading interest
  if (horizon === 'short' || goal === 'active_trading') {
    return 'trader';
  }
  
  // Sector specialist: focused on 1-2 sectors
  if (sectors.length <= 2 && sectors.length > 0) {
    return 'sector_specialist';
  }
  
  // Macro: interested in economy-wide factors
  if (goal === 'macro_understanding' || sectors.includes('Macro')) {
    return 'macro';
  }
  
  // Default: long-term investor
  return 'long_term';
}
```

### 4.3 Delivery Schedule

```typescript
interface DeliverySchedule {
  timezone: string;
  time: string; // HH:MM
  nextDelivery: string; // ISO datetime
}

function computeDeliverySchedule(answers: AnswerMap): DeliverySchedule {
  // Timezone: from browser detection or explicit question
  const timezone = answers.get('timezone')?.value || 'Asia/Seoul';
  
  // Time: from time_picker or default based on morning preference
  let time = answers.get('delivery_time')?.value || '07:00';
  
  // Adjust based on time availability
  const availability = answers.get('time_availability')?.value;
  if (availability === 'morning_commute') time = '07:00';
  else if (availability === 'lunch_break') time = '12:00';
  else if (availability === 'evening') time = '18:00';
  
  // Calculate next delivery
  const nextDelivery = calculateNextDelivery(timezone, time);
  
  return { timezone, time, nextDelivery };
}
```

### 4.4 Personalization Inputs Bundle

```typescript
interface PersonalizationInputs {
  watchlistTickers: string[];
  watchlistSectors: string[];
  depthPreference: 'summary' | 'detailed' | 'deep_dive';
  investmentHorizon: 'short' | 'medium' | 'long';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  portfolioTickers?: string[]; // from snapshot if available
}

function computePersonalizationInputs(
  answers: AnswerMap,
  portfolioSnapshot?: PortfolioSnapshot
): PersonalizationInputs {
  const watchlistTickers = answers.get('watchlist_tickers')?.values || [];
  const watchlistSectors = answers.get('watchlist_sectors')?.values || [];
  
  // Merge portfolio tickers into watchlist (deduped)
  const portfolioTickers = portfolioSnapshot?.tickers.map(t => t.symbol) || [];
  const allWatchlist = [...new Set([...watchlistTickers, ...portfolioTickers])];
  
  // Depth preference from time availability
  const timeMap: Record<string, 'summary' | 'detailed' | 'deep_dive'> = {
    'very_busy': 'summary',
    'moderate': 'detailed',
    'plenty': 'deep_dive',
  };
  const depthPreference = timeMap[answers.get('time_availability')?.value] || 'detailed';
  
  return {
    watchlistTickers: allWatchlist.slice(0, 10), // max 10
    watchlistSectors,
    depthPreference,
    investmentHorizon: answers.get('investment_horizon')?.value || 'long',
    riskTolerance: answers.get('risk_tolerance')?.value || 'moderate',
    portfolioTickers,
  };
}
```

### 4.5 Full Profile Computation

```typescript
async function computeDerivedProfile(
  sessionId: string
): Promise<DerivedProfile> {
  const answers = await loadAnswersForSession(sessionId);
  const snapshot = await loadPortfolioSnapshot(sessionId);
  
  return {
    knowledgeLevel: computeKnowledgeLevel(answers),
    investorSegment: computeInvestorSegment(answers),
    deliverySchedule: computeDeliverySchedule(answers),
    personalizationInputs: computePersonalizationInputs(answers, snapshot),
  };
}
```

---

## 5. Security & Privacy

### 5.1 Consent Enforcement Design

**Principle: No profile storage without explicit consent.**

```typescript
// Middleware for answer storage
async function storeAnswer(sessionId: string, answer: Answer) {
  const session = await getSession(sessionId);
  
  // Check consent before storing any profile-related answer
  if (answer.questionKey !== 'consent_personalization') {
    const hasConsent = await checkConsent(session.userId, 'personalization_data');
    
    if (!hasConsent) {
      throw new ConsentRequiredError(
        'Cannot store answer without personalization consent'
      );
    }
  }
  
  // Store answer
  await db.onboardingAnswer.upsert({ ... });
}
```

**Consent-Gated Data:**
| Data Type | Required Consent |
|-----------|------------------|
| Investment experience | `personalization_data` |
| Risk tolerance | `personalization_data` |
| Watchlist tickers/sectors | `personalization_data` |
| Portfolio snapshot | `portfolio_data` |
| Delivery preferences | `personalization_data` |

**Session State (Minimal, Pre-Consent):**
```typescript
// Stored even without consent
interface MinimalSessionState {
  sessionId: string;
  userId: string;
  questionSetId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  currentQuestionKey: string | null;
  startedAt: Date;
}
```

### 5.2 PII Classification & Encryption

| Field | PII Level | Encryption Strategy |
|-------|-----------|---------------------|
| `email` | High | Encrypted at rest (Supabase default) |
| `delivery_timezone` | Low | Plain |
| `watchlist_tickers` | Medium | Plain (not sensitive) |
| `portfolio_snapshot` | High | Encrypted column (pgcrypto) |
| `ip_hash` | Medium | One-way hash (SHA-256) |
| `answer_raw` | Medium | Plain (no direct PII in answers) |

**Portfolio Encryption:**
```sql
-- Use pgcrypto for sensitive portfolio data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt portfolio snapshot tickers
UPDATE onboarding_portfolio_snapshot
SET tickers = pgp_sym_encrypt(
  tickers::text,
  current_setting('app.encryption_key')
)::jsonb;
```

### 5.3 Access Control (RLS)

```sql
-- Enable RLS
ALTER TABLE onboarding_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answer ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- User can only access their own sessions
CREATE POLICY "Users can view own sessions" ON onboarding_session
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON onboarding_session
  FOR UPDATE USING (auth.uid() = user_id);

-- User can only access their own answers
CREATE POLICY "Users can manage own answers" ON onboarding_answer
  FOR ALL USING (
    session_id IN (
      SELECT id FROM onboarding_session WHERE user_id = auth.uid()
    )
  );

-- Admin can access all (via service role key)
CREATE POLICY "Admins can access all sessions" ON onboarding_session
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Consent records: user-only read, insert; admin can read all
CREATE POLICY "Users can manage own consent" ON consent_record
  FOR ALL USING (auth.uid() = user_id);
```

### 5.4 Audit Log Strategy

**Logged Events:**
| Action | When | Data Captured |
|--------|------|---------------|
| `profile_created` | First profile save | user_id, created fields |
| `profile_updated` | Any profile field change | field, old_value, new_value |
| `consent_granted` | User grants consent | consent_type, ip_hash |
| `consent_revoked` | User revokes consent | consent_type, ip_hash |
| `answer_edited` | User edits past answer | question_key, old, new |
| `answer_skipped` | User skips question | question_key |
| `onboarding_completed` | Session completed | computed profile summary |

**Audit Log Implementation:**
```typescript
async function logProfileChange(
  userId: string,
  actorId: string,
  action: AuditAction,
  field: string,
  oldValue: any,
  newValue: any,
  metadata: Record<string, any> = {}
) {
  await db.profileAuditLog.create({
    data: {
      userId,
      actorId,
      action,
      targetField: field,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      metadata: {
        ...metadata,
        ipHash: hashIP(metadata.ip),
        timestamp: new Date().toISOString(),
      },
    },
  });
}
```

---

## 6. Example Flows

### 6.1 Flow 1: User with No Portfolio

```
[User signs up, redirected to onboarding]

1. POST /api/onboarding/start
   → Session created, consent question returned

2. POST /api/onboarding/answer
   { questionKey: "consent_personalization", answer: { value: "accept" } }
   → Consent recorded, next: experience_years

3. POST /api/onboarding/answer
   { questionKey: "experience_years", answer: { value: "1_3" } }
   → next: investment_goal

4. POST /api/onboarding/answer
   { questionKey: "investment_goal", answer: { value: "wealth_growth" } }
   → next: risk_tolerance

5. POST /api/onboarding/answer
   { questionKey: "risk_tolerance", answer: { value: "moderate" } }
   → next: time_availability

6. POST /api/onboarding/answer
   { questionKey: "time_availability", answer: { value: "moderate" } }
   → next: watchlist_sectors

7. POST /api/onboarding/answer
   { questionKey: "watchlist_sectors", answer: { values: ["Technology", "Healthcare"] } }
   → next: delivery_time

8. POST /api/onboarding/answer
   { questionKey: "delivery_time", answer: { value: "07:30" } }
   → next: watchlist_tickers (optional)

9. POST /api/onboarding/skip
   { questionKey: "watchlist_tickers" }
   → next: portfolio_size_range (optional)

10. POST /api/onboarding/skip
    { questionKey: "portfolio_size_range" }
    → isComplete: true

11. POST /api/onboarding/complete
    { finalConfirmation: true }
    → profile computed and saved

RESULT:
{
  "knowledgeLevel": "intermediate",
  "investorSegment": "long_term",
  "deliverySchedule": { "timezone": "Asia/Seoul", "time": "07:30" },
  "personalizationInputs": {
    "watchlistTickers": [],
    "watchlistSectors": ["Technology", "Healthcare"],
    "depthPreference": "detailed"
  }
}
```

### 6.2 Flow 2: User with Holdings + Watchlist

```
[Engaged user completes full onboarding]

1-7. [Same as Flow 1 through watchlist_sectors]

8. POST /api/onboarding/answer
   { questionKey: "watchlist_tickers", 
     answer: { values: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"] } }
   → next: portfolio_size_range

9. POST /api/onboarding/answer
   { questionKey: "portfolio_size_range", answer: { value: "50k_200k" } }
   → next: has_portfolio

10. POST /api/onboarding/answer
    { questionKey: "has_portfolio", answer: { value: "yes" } }
    → Conditional: shows portfolio_entry

11. POST /api/onboarding/portfolio-snapshot
    { tickers: [
        { symbol: "AAPL", weightPct: 25 },
        { symbol: "MSFT", weightPct: 20 },
        { symbol: "GOOGL", weightPct: 15 },
        { symbol: "NVDA", weightPct: 15 },
        { symbol: "BRK.B", weightPct: 10 },
        { symbol: "CASH", weightPct: 15 }
    ]}
    → Snapshot saved

12. POST /api/onboarding/answer
    { questionKey: "delivery_time", answer: { value: "06:30" } }
    → next: news_frequency (optional)

13. POST /api/onboarding/skip
    { questionKey: "news_frequency" }
    → isComplete: true

14. POST /api/onboarding/complete
    { finalConfirmation: true }

RESULT:
{
  "knowledgeLevel": "intermediate",
  "investorSegment": "long_term",
  "deliverySchedule": { "timezone": "Asia/Seoul", "time": "06:30" },
  "personalizationInputs": {
    "watchlistTickers": ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "BRK.B"],
    "watchlistSectors": ["Technology", "Healthcare"],
    "depthPreference": "detailed",
    "portfolioTickers": ["AAPL", "MSFT", "GOOGL", "NVDA", "BRK.B"]
  }
}
```

---

## 7. Implementation Plan (Backend Tickets)

### Ticket OB-1: Database Schema Setup (v1.1 Updated)
**Priority:** P0  
**Estimate:** 3 points (was 2)

**Acceptance Criteria:**
- [ ] All tables created via Supabase migrations
- [ ] RLS policies enabled and tested
- [ ] Indexes created per specification
- [ ] **v1.1:** `job_title`, `industry`, `role_function`, `seniority` columns added to `user_profile`
- [ ] **v1.1:** Industry index created for personalization queries
- [ ] Seed data for MVP question set (v1.1) with Korean + English localization
- [ ] **v1.1:** 14 questions seeded (was 10)

**Technical Notes:**
- Use Supabase CLI for migrations
- Test RLS with service role and anon key
- job_title is freeform text (max 100 chars); industry/role_function/seniority are enums

---

### Ticket OB-2: Consent via /answer Endpoint (v1.1 Updated)
**Priority:** P0  
**Estimate:** 3 points (was 2)

**Acceptance Criteria:**
- [ ] **v1.1:** `POST /api/onboarding/answer` handles `consent_*` keys specially
- [ ] When `questionKey.startsWith('consent_')`: write to `consent_record` atomically
- [ ] Consent check middleware blocks non-consent answer storage without prior consent
- [ ] `GET /api/onboarding/consent` returns all consent statuses (read-only)
- [ ] **v1.1 DEPRECATED:** Standalone `POST /consent` marked admin-only
- [ ] IP hashing implemented for audit records
- [ ] **v1.1:** Returns `CONSENT_REQUIRED` error (403) if consent missing
- [ ] **v1.1:** Returns consent decline flow (`sessionStatus: 'consent_declined'`)

**Technical Notes:**
- Consent is the gate for all subsequent storage
- Must be first question in flow
- Transaction: answer + consent_record in single commit

---

### Ticket OB-3: Session Management API
**Priority:** P0  
**Estimate:** 3 points

**Acceptance Criteria:**
- [ ] `POST /api/onboarding/start` creates or resumes session
- [ ] `GET /api/onboarding/session` returns session state + progress
- [ ] Session locks to question_set version at creation
- [ ] Resume correctly positions user at last unanswered question
- [ ] Handles edge case: user already completed onboarding

**Technical Notes:**
- Use upsert pattern for idempotency
- Calculate progress from answered count vs total questions

---

### Ticket OB-4: Question Retrieval with Branching (v1.1 Updated)
**Priority:** P0  
**Estimate:** 4 points (was 3)

**Acceptance Criteria:**
- [ ] `GET /api/onboarding/question/next` returns next question with i18n
- [ ] **v1.1:** Implements deterministic next-question selection rule (see Section 3.2.1)
- [ ] **v1.1:** "Next = first unanswered question in sequence_order where branching = 'show'"
- [ ] Conditional logic correctly evaluates show/skip/hide
- [ ] Locale parameter works (ko default, en fallback)
- [ ] Returns `isComplete: true` when no more questions
- [ ] Previous answers included in response for frontend context
- [ ] **v1.1:** Back navigation works (PATCH null + GET next returns cleared question)

**Technical Notes:**
- Implement condition evaluator as pure function
- Cache question set in memory (invalidate on version change)
- **v1.1:** Answer with null value counts as "unanswered" for next selection
- **v1.1:** Skipped answers (is_skipped=true) count as "answered" (don't re-show)

---

### Ticket OB-5: Answer Submission API (v1.1 Updated)
**Priority:** P0  
**Estimate:** 4 points (was 3)

**Acceptance Criteria:**
- [ ] `POST /api/onboarding/answer` validates and stores answer
- [ ] **v1.1:** Handles consent questions atomically (writes consent_record)
- [ ] Validation per question type implemented
- [ ] **v1.1:** Text validation for job_title (maxLength: 100, pattern: alphanumeric + basic punctuation)
- [ ] Ticker validation against S&P 500 list
- [ ] Audit log entry created for each answer
- [ ] Returns next question in response (optimization)
- [ ] **v1.1:** job_title and industry answers persist to user_profile

**Technical Notes:**
- Use transaction for answer + audit log (+ consent_record for consent questions)
- Normalize answer for profile field mapping
- **v1.1:** job_title stored as-is (freeform); industry normalized to enum value

---

### Ticket OB-6: Skip Question API
**Priority:** P1  
**Estimate:** 1 point

**Acceptance Criteria:**
- [ ] `POST /api/onboarding/skip` marks question as skipped
- [ ] Rejects skip for non-skippable questions (400)
- [ ] Audit log entry with `answer_skipped` action
- [ ] Returns next question

**Technical Notes:**
- Skipped answers stored with `is_skipped = true`, not null

---

### Ticket OB-7: Edit Past Answer API (v1.1 Updated)
**Priority:** P0 (was P1)  
**Estimate:** 3 points (was 2)

**Acceptance Criteria:**
- [ ] `PATCH /api/onboarding/answer/:questionKey` updates existing answer
- [ ] Validates new answer same as initial submission
- [ ] **v1.1:** Supports `answer: null` to clear answer (for back navigation)
- [ ] **v1.1:** Cleared answer makes question "next" again per deterministic rule
- [ ] **v1.1:** Returns `CANNOT_CLEAR_CONSENT` error for consent questions
- [ ] Audit log with old/new values
- [ ] Triggers derived field recomputation flag
- [ ] Works during onboarding AND after completion

**Technical Notes:**
- Consider rate limiting edits (20/min)
- May need to invalidate cached profile
- **v1.1:** null answer sets answer_raw = NULL and is_skipped = FALSE

---

### Ticket OB-8: Complete Onboarding & Profile Computation
**Priority:** P0  
**Estimate:** 3 points

**Acceptance Criteria:**
- [ ] `POST /api/onboarding/complete` validates all required questions answered
- [ ] Computes all derived fields (knowledge, segment, delivery, personalization)
- [ ] Updates `user_profile` with computed values
- [ ] Creates audit log for `onboarding_completed`
- [ ] Returns complete profile in response
- [ ] Marks session as `completed`

**Technical Notes:**
- All scoring functions must be deterministic and testable
- Transaction: update session + update profile + audit log

---

### Ticket OB-9: Profile Retrieval API
**Priority:** P1  
**Estimate:** 1 point

**Acceptance Criteria:**
- [ ] `GET /api/onboarding/profile` returns computed profile
- [ ] Includes `canEdit` flag and editable fields list
- [ ] Returns 404 if onboarding not completed
- [ ] Respects RLS (user can only fetch own profile)

**Technical Notes:**
- Consider caching profile for personalization jobs

---

### Ticket OB-10: Portfolio Snapshot API
**Priority:** P2  
**Estimate:** 2 points

**Acceptance Criteria:**
- [ ] `POST /api/onboarding/portfolio-snapshot` saves ticker weights
- [ ] Requires `portfolio_data` consent
- [ ] Validates tickers against S&P 500
- [ ] Validates total allocation (warn if not ~100%)
- [ ] Snapshot can be migrated to `Holding` table post-onboarding

**Technical Notes:**
- Encrypt sensitive portfolio data
- This is temp storage; real portfolio uses `Holding` table

---

### Ticket OB-11: Rate Limiting & Security Hardening
**Priority:** P1  
**Estimate:** 2 points

**Acceptance Criteria:**
- [ ] Rate limits implemented per endpoint spec
- [ ] IP hashing for all audit logs
- [ ] Input sanitization for text fields
- [ ] CSRF protection on all POST/PATCH endpoints
- [ ] Security headers (Content-Security-Policy, etc.)

**Technical Notes:**
- Use Upstash Redis for rate limiting
- Consider honeypot field for bot detection

---

## 8. Backend Readiness Checklist (v1.1)

| Requirement | Status | Ticket |
|-------------|--------|--------|
| ✅ Consent gating works | Pending | OB-2 |
| ✅ **v1.1:** Consent via /answer endpoint (not standalone) | Pending | OB-2, OB-5 |
| ✅ Questionnaire versioning works | Pending | OB-1, OB-4 |
| ✅ Skips are tracked (not null) | Pending | OB-6 |
| ✅ Answers are typed + raw | Pending | OB-5 |
| ✅ **v1.1:** job_title/industry answers persist to profile | Pending | OB-1, OB-5 |
| ✅ Profile is queryable for personalization jobs | Pending | OB-8, OB-9 |
| ✅ Frontend can resume onboarding from any point | Pending | OB-3 |
| ✅ **v1.1:** Back navigation works (PATCH null + GET next) | Pending | OB-4, OB-7 |
| ✅ Audit trail for consent and profile changes | Pending | OB-2, OB-7, OB-8 |
| ✅ Localization support (Korean + English) | Pending | OB-4 |
| ✅ Rate limiting implemented | Pending | OB-11 |
| ✅ RLS/access control enforced | Pending | OB-1 |

---

## 9. Test Cases (v1.1)

### Test Case 1: Consent Accept Flow
**Scenario:** User accepts personalization consent

```
GIVEN: User has started onboarding session
 WHEN: POST /api/onboarding/answer
       { questionKey: "consent_personalization", answer: { value: "accept" } }
 THEN: 
   - Response status 200
   - Response contains `consentRecorded: true, consentGranted: true`
   - `consent_record` table has row with (user_id, 'personalization_data', granted=true)
   - `onboarding_answer` table has row with (session_id, 'consent_personalization', answer_raw='accept')
   - `nextQuestion.key` is 'job_title' (sequence 2)
```

### Test Case 2: Consent Decline Flow
**Scenario:** User declines personalization consent

```
GIVEN: User has started onboarding session
 WHEN: POST /api/onboarding/answer
       { questionKey: "consent_personalization", answer: { value: "decline" } }
 THEN:
   - Response status 200
   - Response contains `consentGranted: false, sessionStatus: 'consent_declined'`
   - `consent_record` table has row with (user_id, 'personalization_data', granted=false)
   - `nextQuestion` is null
   - Session can still be used for minimal features (no personalization)
```

### Test Case 3: Answer Blocked Before Consent
**Scenario:** Attempt to submit non-consent answer without prior consent

```
GIVEN: User has started onboarding session
  AND: No consent_personalization answer exists
 WHEN: POST /api/onboarding/answer
       { questionKey: "job_title", answer: { value: "Software Engineer" } }
 THEN:
   - Response status 403
   - Response error: "CONSENT_REQUIRED"
   - Response contains `redirectToQuestion: "consent_personalization"`
   - No row created in `onboarding_answer`
```

### Test Case 4: Skip job_title and industry
**Scenario:** User skips optional professional context questions

```
GIVEN: User has accepted consent
 WHEN: POST /api/onboarding/skip { questionKey: "job_title" }
  AND: POST /api/onboarding/skip { questionKey: "industry" }
 THEN:
   - Both responses status 200
   - `onboarding_answer` has rows with is_skipped=true for both keys
   - `user_profile.job_title` remains NULL
   - `user_profile.industry` remains NULL
   - Next question is 'experience_years' (sequence 4)
   - Progress reflects questions as "answered" (skipped counts)
```

### Test Case 5: Edit job_title After Completion
**Scenario:** User edits job_title after onboarding is complete

```
GIVEN: User has completed onboarding with job_title="Engineer"
 WHEN: PATCH /api/onboarding/answer/job_title
       { answer: { value: "Senior Software Engineer" } }
 THEN:
   - Response status 200
   - Response contains `previousValue: "Engineer", newValue: "Senior Software Engineer"`
   - `user_profile.job_title` updated to "Senior Software Engineer"
   - `profile_audit_log` has entry with action='answer_edited'
   - Derived fields recalculated if affected
```

### Test Case 6: Back Navigation via PATCH null
**Scenario:** User navigates back from question 5 to question 4

```
GIVEN: User has answered questions 1-5 (consent, job_title, industry, experience_years, investment_goal)
  AND: Current position is question 6 (risk_tolerance)
 WHEN: PATCH /api/onboarding/answer/investment_goal { answer: null }
 THEN:
   - Response status 200
   - Response contains `cleared: true`
   - `onboarding_answer.answer_raw` for 'investment_goal' is now NULL
   - `onboarding_answer.is_skipped` for 'investment_goal' is now FALSE
   - Response `nextQuestion.key` is 'investment_goal'
   - GET /api/onboarding/question/next returns 'investment_goal'
```

### Test Case 7: Cannot Clear Consent Answer
**Scenario:** Attempt to use back navigation to clear consent

```
GIVEN: User has accepted consent and answered subsequent questions
 WHEN: PATCH /api/onboarding/answer/consent_personalization { answer: null }
 THEN:
   - Response status 400
   - Response error: "CANNOT_CLEAR_CONSENT"
   - `consent_record` unchanged
   - `onboarding_answer` for consent unchanged
```

### Test Case 8: Branching Logic with Back Navigation
**Scenario:** Back navigation re-evaluates branching for dependent questions

```
GIVEN: User answered job_title="Engineer" (sequence 2)
  AND: User answered role_function="engineering" (sequence 10, shown because job_title exists)
  AND: User is now at question 12
 WHEN: PATCH /api/onboarding/answer/job_title { answer: null }
 THEN:
   - Response status 200
   - GET /api/onboarding/question/next returns 'job_title' (sequence 2)
   - Note: role_function answer remains but will be skipped if user skips job_title
```

---

## Appendix A: MVP Question Bank v1.1 (Korean)

```json
[
  {
    "key": "consent_personalization",
    "type": "consent",
    "sequence": 1,
    "required": true,
    "skippable": false,
    "mapsTo": null,
    "writesToConsent": "personalization_data",
    "ko": {
      "title": "맞춤형 서비스를 위해 정보를 저장할까요?",
      "description": "투자 성향과 관심 종목을 저장하여 매일 맞춤 콘텐츠를 제공합니다. 언제든 설정에서 삭제할 수 있습니다.",
      "options": {
        "accept": "동의합니다",
        "decline": "동의하지 않습니다"
      }
    },
    "en": {
      "title": "Can we save your info for personalization?",
      "description": "We'll store your preferences to deliver personalized daily content. You can delete this anytime in settings.",
      "options": {
        "accept": "I agree",
        "decline": "I don't agree"
      }
    }
  },
  {
    "key": "job_title",
    "type": "text",
    "sequence": 2,
    "required": false,
    "skippable": true,
    "mapsTo": "job_title",
    "validation": {
      "maxLength": 100,
      "pattern": "^[\\p{L}\\p{N}\\s\\-\\/\\(\\)]+$"
    },
    "ko": {
      "title": "어떤 일을 하고 계신가요?",
      "description": "자세히 알려주실수록 레터가 더 정확해져요. 예: 소프트웨어 엔지니어, 마케팅 매니저",
      "placeholder": "직무/직책을 입력해주세요",
      "skipLabel": "건너뛰기"
    },
    "en": {
      "title": "What do you do for work?",
      "description": "The more detail, the better we can personalize. e.g., Software Engineer, Marketing Manager",
      "placeholder": "Enter your job title",
      "skipLabel": "Skip"
    },
    "personalizationUse": "Content complexity, sector relevance, terminology familiarity"
  },
  {
    "key": "industry",
    "type": "single_choice",
    "sequence": 3,
    "required": false,
    "skippable": true,
    "mapsTo": "industry",
    "ko": {
      "title": "어떤 산업에서 일하시나요?",
      "description": "관련 산업 뉴스와 인사이트를 우선 제공해드려요.",
      "options": {
        "technology": "기술/IT",
        "finance": "금융/투자",
        "healthcare": "헬스케어/제약",
        "manufacturing": "제조업",
        "retail": "유통/소매",
        "education": "교육",
        "government": "공공/정부",
        "consulting": "컨설팅",
        "media": "미디어/엔터",
        "energy": "에너지",
        "real_estate": "부동산",
        "legal": "법률",
        "other": "기타"
      },
      "skipLabel": "건너뛰기"
    },
    "en": {
      "title": "What industry do you work in?",
      "description": "We'll prioritize relevant industry news and insights.",
      "options": {
        "technology": "Technology/IT",
        "finance": "Finance/Investment",
        "healthcare": "Healthcare/Pharma",
        "manufacturing": "Manufacturing",
        "retail": "Retail/E-commerce",
        "education": "Education",
        "government": "Government/Public",
        "consulting": "Consulting",
        "media": "Media/Entertainment",
        "energy": "Energy",
        "real_estate": "Real Estate",
        "legal": "Legal",
        "other": "Other"
      },
      "skipLabel": "Skip"
    },
    "personalizationUse": "Sector-relevant news, industry-specific terminology, peer context"
  },
  {
    "key": "experience_years",
    "type": "single_choice",
    "sequence": 4,
    "required": false,
    "skippable": true,
    "mapsTo": "experience_years",
    "ko": {
      "title": "주식 투자 경험이 얼마나 되셨나요?",
      "description": "맞춤 콘텐츠 난이도를 조절하는 데 활용됩니다.",
      "options": {
        "0": "처음입니다",
        "1_3": "1~3년",
        "3_5": "3~5년",
        "5_plus": "5년 이상"
      },
      "skipLabel": "건너뛰기"
    },
    "en": {
      "title": "How long have you been investing?",
      "description": "This helps us calibrate content difficulty.",
      "options": {
        "0": "I'm new",
        "1_3": "1-3 years",
        "3_5": "3-5 years",
        "5_plus": "5+ years"
      },
      "skipLabel": "Skip"
    }
  },
  {
    "key": "investment_goal",
    "type": "single_choice",
    "sequence": 5,
    "required": false,
    "skippable": true,
    "mapsTo": null,
    "ko": {
      "title": "투자의 주요 목표는 무엇인가요?",
      "options": {
        "wealth_growth": "자산 증식",
        "income": "배당/수익 창출",
        "learn": "투자 공부",
        "active_trading": "단기 트레이딩",
        "macro_understanding": "경제 흐름 이해"
      },
      "skipLabel": "건너뛰기"
    },
    "en": {
      "title": "What's your main investment goal?",
      "options": {
        "wealth_growth": "Grow wealth",
        "income": "Generate income/dividends",
        "learn": "Learn investing",
        "active_trading": "Active trading",
        "macro_understanding": "Understand the economy"
      },
      "skipLabel": "Skip"
    }
  },
  {
    "key": "risk_tolerance",
    "type": "single_choice",
    "sequence": 6,
    "required": false,
    "skippable": true,
    "mapsTo": "risk_tolerance",
    "ko": {
      "title": "투자 위험에 대한 선호도는?",
      "options": {
        "conservative": "안정 추구 (낮은 변동성 선호)",
        "moderate": "균형 (적정 수준의 위험 감수)",
        "aggressive": "공격적 (높은 수익을 위해 위험 감수)"
      },
      "skipLabel": "건너뛰기"
    },
    "en": {
      "title": "What's your risk tolerance?",
      "options": {
        "conservative": "Conservative (low volatility)",
        "moderate": "Balanced (moderate risk)",
        "aggressive": "Aggressive (high risk for high returns)"
      },
      "skipLabel": "Skip"
    }
  },
  {
    "key": "time_availability",
    "type": "single_choice",
    "sequence": 7,
    "required": false,
    "skippable": true,
    "mapsTo": "depth_preference",
    "ko": {
      "title": "하루에 투자 정보를 읽는 데 얼마나 시간을 쓰시나요?",
      "options": {
        "very_busy": "5분 이하 (요약만)",
        "moderate": "10-15분 (적당한 깊이)",
        "plenty": "30분 이상 (깊이 있게)"
      },
      "skipLabel": "건너뛰기"
    },
    "en": {
      "title": "How much time do you spend reading investment info daily?",
      "options": {
        "very_busy": "Under 5 min (summaries only)",
        "moderate": "10-15 min (moderate depth)",
        "plenty": "30+ min (deep dives)"
      },
      "skipLabel": "Skip"
    }
  },
  {
    "key": "watchlist_sectors",
    "type": "multi_choice",
    "sequence": 8,
    "required": false,
    "skippable": true,
    "mapsTo": "watchlist_sectors",
    "validation": { "max": 3 },
    "ko": {
      "title": "관심 있는 섹터를 선택해주세요 (최대 3개)",
      "options": {
        "Technology": "기술 (Tech)",
        "Healthcare": "헬스케어",
        "Financials": "금융",
        "Consumer": "소비재",
        "Energy": "에너지",
        "Industrials": "산업재",
        "Materials": "소재",
        "Utilities": "유틸리티",
        "Real Estate": "부동산",
        "Communication": "통신"
      },
      "skipLabel": "건너뛰기"
    },
    "en": {
      "title": "Which sectors interest you? (max 3)",
      "options": {
        "Technology": "Technology",
        "Healthcare": "Healthcare",
        "Financials": "Financials",
        "Consumer": "Consumer",
        "Energy": "Energy",
        "Industrials": "Industrials",
        "Materials": "Materials",
        "Utilities": "Utilities",
        "Real Estate": "Real Estate",
        "Communication": "Communication"
      },
      "skipLabel": "Skip"
    }
  },
  {
    "key": "delivery_time",
    "type": "time_picker",
    "sequence": 9,
    "required": false,
    "skippable": true,
    "mapsTo": "delivery_time",
    "validation": { "min": "05:00", "max": "22:00" },
    "ko": {
      "title": "매일 레터를 받고 싶은 시간은?",
      "description": "한국 시간 기준입니다.",
      "placeholder": "07:00",
      "skipLabel": "기본값 (07:00) 사용"
    },
    "en": {
      "title": "When would you like to receive your daily letter?",
      "description": "Times shown in your local timezone.",
      "placeholder": "07:00",
      "skipLabel": "Use default (07:00)"
    }
  },
  {
    "key": "role_function",
    "type": "single_choice",
    "sequence": 10,
    "required": false,
    "skippable": true,
    "mapsTo": "role_function",
    "conditionLogic": {
      "rules": [
        {
          "if": { "questionKey": "job_title", "operator": "not_exists" },
          "then": "skip"
        }
      ],
      "default": "show"
    },
    "ko": {
      "title": "어떤 직무 분야에서 일하시나요?",
      "description": "선택사항입니다. 더 정확한 맞춤화에 도움이 됩니다.",
      "options": {
        "engineering": "엔지니어링/개발",
        "product": "프로덕트/기획",
        "design": "디자인/UX",
        "marketing": "마케팅",
        "sales": "영업/세일즈",
        "operations": "운영/오퍼레이션",
        "finance": "재무/회계",
        "hr": "인사/HR",
        "executive": "경영/임원",
        "other": "기타"
      },
      "skipLabel": "건너뛰기"
    },
    "en": {
      "title": "What's your job function?",
      "description": "Optional. Helps us personalize better.",
      "options": {
        "engineering": "Engineering/Development",
        "product": "Product Management",
        "design": "Design/UX",
        "marketing": "Marketing",
        "sales": "Sales",
        "operations": "Operations",
        "finance": "Finance/Accounting",
        "hr": "Human Resources",
        "executive": "Executive/Leadership",
        "other": "Other"
      },
      "skipLabel": "Skip"
    }
  },
  {
    "key": "seniority",
    "type": "single_choice",
    "sequence": 11,
    "required": false,
    "skippable": true,
    "mapsTo": "seniority",
    "conditionLogic": {
      "rules": [
        {
          "if": { "questionKey": "job_title", "operator": "not_exists" },
          "then": "skip"
        }
      ],
      "default": "show"
    },
    "ko": {
      "title": "경력 수준은 어느 정도인가요?",
      "description": "선택사항입니다.",
      "options": {
        "entry": "신입/주니어 (0-2년)",
        "mid": "중급 (3-5년)",
        "senior": "시니어 (6-10년)",
        "lead": "리드/매니저 (10년+)",
        "executive": "임원/C-Level"
      },
      "skipLabel": "건너뛰기"
    },
    "en": {
      "title": "What's your career level?",
      "description": "Optional.",
      "options": {
        "entry": "Entry level (0-2 years)",
        "mid": "Mid-level (3-5 years)",
        "senior": "Senior (6-10 years)",
        "lead": "Lead/Manager (10+ years)",
        "executive": "Executive/C-Level"
      },
      "skipLabel": "Skip"
    }
  },
  {
    "key": "watchlist_tickers",
    "type": "ticker_search",
    "sequence": 12,
    "required": false,
    "skippable": true,
    "mapsTo": "watchlist_tickers",
    "validation": { "max": 10 },
    "ko": {
      "title": "관심 종목이 있으신가요? (선택, 최대 10개)",
      "description": "S&P 500 종목 중에서 검색해주세요.",
      "placeholder": "예: AAPL, MSFT, NVDA",
      "skipLabel": "건너뛰기"
    },
    "en": {
      "title": "Any specific stocks you're watching? (max 10)",
      "description": "Search from S&P 500 stocks.",
      "placeholder": "e.g., AAPL, MSFT, NVDA",
      "skipLabel": "Skip"
    }
  },
  {
    "key": "portfolio_size_range",
    "type": "single_choice",
    "sequence": 13,
    "required": false,
    "skippable": true,
    "mapsTo": "portfolio_size_range",
    "ko": {
      "title": "대략적인 투자 규모는? (선택)",
      "description": "맞춤 콘텐츠 제공에만 활용되며 외부에 공유되지 않습니다.",
      "options": {
        "none": "아직 투자하지 않음",
        "under_10k": "$10,000 미만",
        "10k_50k": "$10,000 - $50,000",
        "50k_200k": "$50,000 - $200,000",
        "200k_plus": "$200,000 이상"
      },
      "skipLabel": "답하지 않음"
    },
    "en": {
      "title": "Approximate portfolio size? (optional)",
      "description": "Used only for personalization, never shared.",
      "options": {
        "none": "Not investing yet",
        "under_10k": "Under $10,000",
        "10k_50k": "$10,000 - $50,000",
        "50k_200k": "$50,000 - $200,000",
        "200k_plus": "Over $200,000"
      },
      "skipLabel": "Prefer not to say"
    }
  },
  {
    "key": "has_portfolio",
    "type": "single_choice",
    "sequence": 14,
    "required": false,
    "skippable": true,
    "mapsTo": null,
    "conditionalNext": {
      "yes": "portfolio_entry_prompt"
    },
    "ko": {
      "title": "현재 보유 종목을 입력하시겠어요?",
      "description": "입력하시면 포트폴리오 영향 분석을 받으실 수 있습니다.",
      "options": {
        "yes": "네, 입력할게요",
        "no": "나중에 할게요"
      },
      "skipLabel": "건너뛰기"
    },
    "en": {
      "title": "Want to enter your current holdings?",
      "description": "This enables portfolio impact analysis in your daily letter.",
      "options": {
        "yes": "Yes, I'll enter them",
        "no": "Maybe later"
      },
      "skipLabel": "Skip"
    }
  }
]
```

---

## Appendix B: Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Server-side only

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Encryption
APP_ENCRYPTION_KEY=your-32-byte-key-here

# Feature Flags
FEATURE_ONBOARDING_V2=false
```

---

*Document Version: 1.1*  
*Last Updated: 2026-01-28*  
*Author: Backend Engineer Agent*

---

## Changelog

### v1.1 (2026-01-28)
- Added `job_title`, `industry`, `role_function`, `seniority` fields to user_profile schema
- Updated consent handling: now processed via `POST /answer` with `consent_*` question keys
- Deprecated standalone `POST /consent` endpoint (admin-only)
- Added deterministic next-question selection rule for reliable back navigation
- Added 4 new questions to MVP question bank (job_title, industry, role_function, seniority)
- Updated question flow: 14 questions (was 10), professional context early in flow
- Updated tickets OB-1, OB-2, OB-4, OB-5, OB-7 with v1.1 requirements
- Added 8 test cases covering consent, back-nav, job/industry fields
- Added English i18n to question bank

### v1.0 (2026-01-28)
- Initial specification
