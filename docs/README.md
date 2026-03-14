## Docs Index (Briefly;)

### What this folder is
- This `docs/` directory is the **single source of truth** for product specs, architecture decisions, and agent runbooks.
- If something is not in `docs/`, it is considered **not finalized**.

---

## Quick links

### Product / Scope
- `product/briefly-context.md` — product definition, IA, plan gating (Basic vs Intelligence)
- `product/mvp-backlog.md` — implementation epics/tickets (acceptance criteria)
- `product/briefly-character-spec.md` — Briefly character (브리플리) WebGL implementation spec

### Data / API
- `engineering/data-model.md` — entities & workflows (Daily, Personalization, Portfolio, News)
- `engineering/api-spec.md` — REST API surface + jobs/events (high-level)

### Onboarding (critical path)
- `onboarding/onboarding-backend-spec.md` — backend contract + schema + flows
- `onboarding/onboarding-frontend-spec.md` — UI/UX + component/motion + integration

### Quality / Release
- `quality/sdet/sdet-onboarding-test-plan.md` — test strategy + automation plan
- `quality/qa/qa-onboarding-checklist.md` — manual QA checklist (smoke + regression)
- `quality/qa/qa-demo-script.md` — demo script for user interview
- `quality/qa/qa-edge-cases.md` — edge case catalog
- `quality/qa/qa-release-criteria.md` — go/no-go criteria
- `quality/qa/qa-bug-template.md` — bug reporting standard

### Execution / Logs
- `ops/execution-run-report.md` — latest execution runner result (build/tests/demo readiness)
- Logs live under `logs/execution/YYYY-MM-DD/`
- Report templates live under `docs/reports/templates/`

### Operations / Troubleshooting
- `ops/memory-bank.md` — **check here first** for recurring issues and solutions (build failures, test timeouts, common errors)

### Agent operations
- `ops/agent-workboard.md` — PM control center (owners, tasks, gates)
- `agents/` — stored prompts + templates for hiring/operating agents

### Architecture / Decisions
- `architecture/overview.md` — system overview (draft)
- `architecture/repo-structure.md` — repo structure conventions
- `architecture/contract-change-checklist.md` — prevent contract/mock drift
- `adr/` — architecture decision records (ADRs)

---

## Rules (non-negotiable)
- **Folder architecture (non-negotiable)**:
  - `docs/product/` — product scope/backlog/context
  - `docs/onboarding/` — onboarding specs (critical path)
  - `docs/engineering/` — API/data model/spec-level engineering docs
  - `docs/quality/` — QA/SDET plans, checklists, release criteria
  - `docs/ops/` — workboard, execution reports, memory bank (operational)
  - `docs/reports/` — dated outputs + templates
  - `docs/architecture/`, `docs/adr/` — architecture docs + decisions
- **No new docs at `docs/` root** (except `README.md`). Put new docs in the right subfolder.
- **File naming (non-negotiable)**:
  - **Format**: kebab-case only (lowercase, hyphens). No spaces.
  - **Suffix-first (platform-friendly)**: Prefer putting the **document type at the end** (suffix), not at the beginning (prefix).
    - ✅ Prefer: `onboarding-backend-spec.md`, `qa-release-criteria.md`, `contract-change-checklist.md`
    - ❌ Avoid: `spec-onboarding-backend.md`, `checklist-contract-change.md` (prefix-style)
  - **Docs should look like what they are** (standard suffixes):
    - Specs: `*-spec.md`
    - Checklists: `*-checklist.md`
    - Runbooks: `*-runbook.md`
    - Templates: `*-template.md`
    - Plans: `*-plan.md`
    - Scripts: `*-script.md`
    - Reports: `docs/reports/agents/<agent>/<TASK-ID>-<agent>-report-YYYY-MM-DD.md`
    - Gate runs: `docs/reports/gate-runs/GATE-RUN-YYYY-MM-DD.md`
    - Prompts: `docs/agents/prompts/<role>-vX.md`
  - **Time-scoped docs** must include `YYYY-MM-DD` in the filename (reports, incident notes, gate runs).
  - **Versioning**: put the version in the document title (e.g., “Draft v0.2”), not in the filename.
- **One source of truth**: If a spec changes, update the spec first, then code/tests.
- **Version important docs** in the title (e.g., `v1.1`) and add a short “Change Summary”.
- **Prefer ADRs** for irreversible decisions (see `docs/adr/`).
- **Prompts are artifacts**: store agent prompts in `docs/agents/prompts/` with dates/versions.

