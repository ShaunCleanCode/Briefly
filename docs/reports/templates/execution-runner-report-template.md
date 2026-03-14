## Execution Runner Report Template (Gate Run)

### Header
- **Date**: YYYY-MM-DD
- **Runner**: Execution Runner Agent
- **Run Type**: Gate Run / Smoke Verification / Demo Verification
- **Status**: PASS / FAIL
- **Demo Readiness**: YES / NO

---

## 1) Executive Summary (max 5 lines)
- **Overall**:
- **Demo readiness**:
- **Primary blocker (if any)**:
- **What changed since last run**:

---

## 2) Environment
- OS:
- Node:
- Package manager:
- Workspace path:

---

## 3) Commands Executed (required)
> Include exact command, exit code, and duration.

| Step | Command | Exit Code | Duration | Result |
|------|---------|-----------|----------|--------|
| Install | `...` | | | |
| Lint | `...` | | | |
| Build | `...` | | | |
| Unit/Contract | `...` | | | |
| E2E Smoke | `...` | | | |
| Demo Script | `...` | | | |

---

## 4) Evidence / Artifacts (required)
- **Logs directory**: `logs/execution/YYYY-MM-DD/`
- **Key logs**
  - install: `.../install.log`
  - lint: `.../lint.log`
  - build: `.../build.log`
  - tests: `.../unit-tests.log`
  - e2e: `.../e2e-smoke.log`
  - server: `.../app-server.log` (if applicable)

---

## 5) Gate Checklist (copy from Workboard)
From `docs/ops/agent-workboard.md`:
- [ ] Gate A (Build): `npm run build` passes
- [ ] Gate B (E2E Smoke): `npm run test:e2e:smoke` passes
- [ ] Gate C (Demo): `docs/quality/qa/qa-demo-script.md` verified
- [ ] Ship criteria: `docs/quality/qa/qa-release-criteria.md` satisfied (P0 = 0 open)

---

## 6) Failures / Blockers (if FAIL)
For each blocker:
- **ID**: (e.g., BLK-001)
- **Where**: command + step
- **Symptom**: short
- **Evidence**: log excerpt + log file path
- **Suspected owner**: FE / BE / SDET / QA
- **Repro steps**: minimal

---

## 7) Next Action (PM)
- **Next agent to assign**:
- **Task ID(s)**:
- **Why**:

