## ADR-0001: Documentation & Agent Artifacts Management

### Context
Briefly; is being developed with multiple specialized agents (Backend, Frontend, SDET, QA, Execution Runner, domain experts).
Agent prompts and outputs (specs, checklists, runbooks) are **critical project assets** that must be versioned and discoverable.

### Decision
1) `docs/` is the **single source of truth** for specs and operations.
2) Agent prompts are stored under `docs/agents/prompts/` as Markdown files.
3) Day-to-day task assignment is managed in `docs/ops/agent-workboard.md`.
4) Long-lived decisions are recorded in `docs/adr/` with numbered ADR files.

### Consequences
- Faster onboarding for new agents/humans
- Reduced drift between frontend/backend/tests
- Clear audit trail for why choices were made

### Alternatives considered
- Keeping prompts only in chat history (rejected: not discoverable, not versioned)
- Using an external doc tool (rejected for MVP speed; can migrate later)

