## Reports Templates (PM Standard)

### Purpose
All agent reports must follow a template so PM can:
- compare results across runs,
- audit evidence (commands/logs),
- avoid "it works on my machine" ambiguity.

### ⚠️ Before Reporting a Failure
**Check `docs/ops/memory-bank.md` first!**  
Many recurring failures have documented solutions. If you find the issue there:
1. Apply the fix
2. Re-run the commands
3. Only report if the documented fix doesn't work

If you discover a new recurring issue, **add it to the memory bank** after fixing.

---

## Rules (non-negotiable)

### 1) File naming
- **Task report**: `docs/reports/agents/<agent>/<TASK-ID>-<agent>-report-YYYY-MM-DD.md`
  - Example: `docs/reports/agents/frontend/W-001-frontend-report-2026-01-29.md`
- **Execution runner gate run**: `docs/reports/gate-runs/GATE-RUN-YYYY-MM-DD.md`

### 2) Evidence required
Every report must include:
- exact commands run + exit codes
- pointers to raw logs under `logs/execution/YYYY-MM-DD/`
- acceptance criteria checklist marked

### 3) Logs location
Execution Runner must write raw logs to:
- `logs/execution/YYYY-MM-DD/`

### 4) Single source of truth
If results differ from:
- `docs/ops/agent-workboard.md` (task status)
- `docs/ops/execution-run-report.md` (latest run report)
then the report must explicitly explain why.

---

## Templates
- `agent-task-report-template.md` — generic template for any agent work item
- `execution-runner-report-template.md` — standard for gate run execution + demo readiness

