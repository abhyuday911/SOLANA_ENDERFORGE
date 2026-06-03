<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Before implementation:

1. Read .agents/AGENT-OS.md

2. Read docs/04-ai/task-router.md

3. Determine task type.

4. Load required workflow, task skills, and expert skills for that task.

5. Implement.

6. Run 3-phase review.

7. Write audit document to docs/03-audits/.

8. Update docs/03-audits/AUDIT_INDEX.md.

Do not skip the audit step.

## Architecture Context Invariant (Mandatory)

Whenever any of the following change:
- Architecture or service interactions
- Component boundaries or repository structure
- Routing or task handling
- Recommendation engine or risk logic
- APIs or external data integrations

The agent MUST:
1. Update [docs/00-core/ARCHITECTURE_CONTEXT.md](file:///Users/abhyuday/Desktop/capstone/docs/00-core/ARCHITECTURE_CONTEXT.md) with the new state.
2. Record the change in [docs/00-core/ARCHITECTURE_CHANGELOG.md](file:///Users/abhyuday/Desktop/capstone/docs/00-core/ARCHITECTURE_CHANGELOG.md) using the required structure (Date, Added, Changed, Impact, Files).
3. Run the validation script: `npm run validate:architecture`.

A task is not considered complete until all documentation is fully synchronized and the validator passes successfully.

<!-- END:nextjs-agent-rules -->
