# Releasing

Production deploys are triggered by pushing a CalVer tag using the script at `scripts/create-release-tag.sh`.

Commit convention follows `.claude/board/rules.md`.

## PR scope

One ticket = one PR. Include more only when tickets are directly dependent (e.g. a chore that unblocks the feat in the same PR). Keep PRs lean — a focused PR is easier to review and revert.

Keep the PR description current: update the summary when new commits change the scope, and tick test plan items as CI validates them.

Omit the test plan section when there is nothing to test — changes confined to `.claude/` files, `.md` files, or other non-executable assets do not require one.

## Local setup

After cloning, activate the pre-commit hook:
```bash
git config core.hooksPath .githooks
```

## Branching

Work on short-lived feature branches cut directly from `main`. Branch name mirrors the commit type and scope: `type/scope` (e.g. `feat/cost-tracker`, `ci/deployment`, `fix/kanban`). Delete the branch after the PR merges.

Each branch gets its own Cloudflare Pages preview deployment.

## Commit modes

`commit.sh`, `open-pr.sh`, `push-pr.sh`, and `cut-branch.sh` each support three modes via an optional leading flag:

- _(default)_ — code commit; requires `TICKET` env var or a `.current-ticket` file written by `start-ticket.sh`; branch named `type/scope`
- `--board` — grooming; use when writing or updating epic/ticket files and `index.yaml`; branch named `chore/board`
- `--agent` — harness or agent infrastructure work; branch named `chore/agent`

## Coding process

1. `export TICKET=EPIC-XX/TN && scripts/start-ticket.sh` — validates, marks IN PROGRESS, cuts branch, saves ticket to `.current-ticket`.
2. Implement. Run `scripts/commit.sh "<description>"` for each commit. (auto-stages all changes)
3. `scripts/mark-done.sh` — marks ticket DONE, closes epic if all tickets done.
4. `scripts/push-pr.sh "<title>" "<body>"` — pushes, opens PR, watches CI.
5. Get explicit approval, then `scripts/finish-ticket.sh <pr>` — merges and cleans up branch.
6. After a `feat` or `fix` merge: ask "Ship a new tag?"
7. _(If yes)_ `scripts/create-release-tag.sh`. Watch the deploy and report success or failure.

## Grooming process

1. `scripts/cut-branch.sh --board`
2. Edit epic files and/or `index.yaml`.
3. `git add .claude/board/... && scripts/commit.sh --board "<description>"`
4. `scripts/push-pr.sh --board "<title>" "<body>"` — pushes, opens PR, watches CI.
5. Get explicit approval, then `scripts/finish-ticket.sh <pr>` — merges and cleans up branch.
