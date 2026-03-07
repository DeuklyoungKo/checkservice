---
name: global_rules
description: Behavioral guidelines to reduce common LLM coding mistakes and ensure simplicity and goal-driven execution.
---

# CLAUDE.md (Global Rules)

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 5. Project Initialization (Vibe Coding)

**Set up the foundation manually. AI coding starts after the scaffold is ready.**

Before starting AI-assisted coding on a new frontend project:

1. Go to https://ui.shadcn.com/create and design your theme
   - Component Library: **Base UI** (Radix UI is no longer actively maintained)
   - Icon Library: **Hugeicons** (recommended over Lucide for new projects)
   - Set base color, accent theme, font, and radius to taste
2. Click **Create Project** → select framework (Next.js / TanStack / Vite) → copy the command
3. Run the copied command in terminal — it scaffolds the project with your theme applied automatically
4. Write `CLAUDE.md` / `GEMINI.md` based on the generated project structure
5. **Then** start AI coding (vibe coding)

> ⚠️ **Do NOT ask AI to handle project initialization** (shadcn setup, folder structure, theme config).
> Complete this step yourself first. AI coding begins only after the scaffold is in place.

## 6. Apply Skills Before Coding (skills.sh)

**Once the project overview is ready, find and apply relevant skills before writing a single line of code.**

Skills are `SKILL.md` files that give AI agents domain-specific expertise. Install once per project — the AI will automatically reference them during relevant tasks.

### Installation
```bash
# Step 1: Install find-skills first (lets the AI discover relevant skills itself)
npx skills add vercel-labs/agent-skills

# Step 2: Run find-skills inside the project
# Tell Claude: "Run find-skills and apply any relevant skills to this project"
```

### Workflow
```
1. Project overview finalized
       ↓
2. npx skills add vercel-labs/agent-skills   # installs find-skills + core skills
       ↓
3. Ask Claude to run find-skills             # AI searches and installs relevant skills
       ↓
4. Verify .claude/skills/ folder contents
       ↓
5. Start AI coding with skills active
```

### Trusted skill sources
- `vercel-labs/agent-skills` — React best practices, web design guidelines
- `anthropics/skills` — frontend-design, skill-creator
- `remotion-dev/skills` — Remotion video production

> ⚠️ Only install skills from verified publishers. Review SKILL.md content on GitHub before installing unknown packages.
> Remove unused skills — accumulated skill files waste AI context and can cause unexpected behavior.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 7. How to Reuse in Other Projects

To apply these global rules to a new project:

1.  **Copy Folder**: Copy the entire `.agents/skills/global_rules` folder.
2.  **Paste**: Paste it into the `.agents/skills/` directory of your new project. (If `.agents/skills` doesn't exist, create it first).
3.  **Automatic Detection**: Antigravity will automatically detect the new skill and follow these guidelines in the new project.
