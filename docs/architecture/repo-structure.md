## Repo Structure (Recommended)

### Goals
- Make it easy to find: product specs, contracts, tests, and run artifacts.
- Keep “generated/run artifacts” out of the way.
- Keep agent prompts versioned and discoverable.

### Proposed structure
```
docs/
  README.md
  product/
    briefly-context.md
    mvp-backlog.md
  onboarding/
    onboarding-backend-spec.md
    onboarding-frontend-spec.md
  engineering/
    api-spec.md
    data-model.md
  quality/
    qa/
      qa-*.md
    sdet/
      sdet-*.md
  ops/
    agent-workboard.md
    execution-run-report.md
    memory-bank.md
  agents/
    README.md
    prompts/
      *.md
  adr/
    README.md
    0001-*.md
  architecture/
    overview.md
    repo-structure.md
  reports/
    templates/
      *.md
    <dated-reports>.md

src/
  app/...
  components/...
  hooks/...
  lib/...
  types/...

tests/
  contract/...
  e2e/...

logs/
  execution/YYYY-MM-DD/*.log
```

### Naming conventions
- Docs (general):
  - Use **kebab-case** only (no spaces).
  - Prefer **descriptive nouns** (`runbook-…`, `checklist-…`, `spec-…`, `template-…`).
  - If the doc is versioned, add the version in the **title inside the doc** (e.g., “Draft v0.1”), not in the filename.
  - If the doc is time-scoped, include `YYYY-MM-DD` in the filename.
- Docs (suffix-first):
  - Prefer putting the **document type at the end** (suffix), not at the beginning (prefix).
    - ✅ Prefer: `onboarding-backend-spec.md`, `qa-release-criteria.md`
    - ❌ Avoid: `spec-onboarding-backend.md`, `criteria-qa-release.md`
- Docs (by category):
  - Product: `docs/product/*.md`
  - Specs: `docs/**/**-spec.md`
  - Checklists: `docs/**/**-checklist.md`
  - Runbooks: `docs/**/**-runbook.md` (or `*-run-report.md` for execution outputs)
  - QA/SDET: `docs/quality/{qa,sdet}/*.md`
  - Ops: `docs/ops/*.md`
  - Reports:
    - Task report: `docs/reports/agents/<agent>/<TASK-ID>-<agent>-report-YYYY-MM-DD.md`
    - Gate run: `docs/reports/gate-runs/GATE-RUN-YYYY-MM-DD.md`
  - Prompts: `docs/agents/prompts/<role>-vX.md`
- Tests:
  - Contract: `tests/contract/*.test.ts`
  - E2E: `tests/e2e/*.spec.ts`

