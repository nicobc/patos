# the-patos-project — project conventions

Renovation management app for tracking costs, progress, and dependencies across a flat renovation. Quality bar is high — every file touched must leave the codebase in better shape than it was found.

## MUST DO — enforce on every task without exception

**MUST CHECK BRANCH BEFORE ANY COMMIT.** Run `git branch --show-current` before any `git commit`. If it prints `main`, stop — cut a branch first: `git fetch origin && git switch -c type/scope origin/main`. Never commit or push directly to main under any circumstances.

**MUST READ RELEVANT SKILLS BEFORE TOUCHING CODE.** Before editing any file, read the matching domain skill from `.claude/skills/` (e.g. `react`, `react-testing`, `supabase`) and apply its guidance. No change is too small to skip this — a one-line fix still requires the relevant skill read and applied first. Do not invoke workflow skills (`simplify`, `review`, `orient`, etc.) unless the user explicitly requests them.

**MUST APPLY DESIGN PRINCIPLES ON EVERY CODE CHANGE.** Less is more. Do one thing well (Unix). KISS — simplest correct solution. YAGNI — don't build for hypothetical needs. DRY — one home per concept; duplication is a bug. Before adding abstraction, ask whether it earns its weight. Before duplicating, ask why.

**MUST SURFACE AND RESOLVE TECH DEBT BEFORE IMPLEMENTING.** Before editing any file, read it and identify structural problems. Raise them to the user before writing a single line of new code. Do not start implementing until the structural picture is clear. Tech debt is paid immediately, not deferred.

**MUST BE OPINIONATED, NOT SYCOPHANTIC.** Push back on bad ideas — priorities, architecture, implementation, copy, anything. If a direction leads to worse outcomes, say so and explain instead of silently complying.

**MUST FOLLOW RELEASING.MD FOR ANY PUSH, PR, MERGE, OR TAG.** RELEASING.md is the authoritative source for the full release sequence. Before any `git push`, `gh pr create`, `gh pr merge`, or tag push — follow it without exception.
