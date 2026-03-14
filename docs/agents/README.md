## Agents (Briefly;)

### Why this exists
Agent prompts are **project assets**. We store them here so we can:
- reuse them,
- version them,
- audit what we asked an agent to do,
- avoid prompt drift across time.

### ⚠️ Before Starting Any Task
**Check `docs/ops/memory-bank.md` first!**  
It contains solutions to recurring issues (build failures, test timeouts, common errors).  
Avoid re-debugging problems that have already been solved.

### Structure
- `prompts/` — canonical prompts to hire/operate each agent role

### Naming
Use:
- `ROLE-vX.md` (e.g., `frontend-engineer-v1.md`)

