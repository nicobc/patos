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

## Process

Ship `feat`/`fix` tickets continuously — don't batch. After each merge, ask "Ship a new tag?"

1. `export TICKET=EPIC-XX/TN && scripts/start-ticket.sh` — validates, marks IN PROGRESS, cuts branch.
2. Implement. Run `scripts/commit.sh "<description>"` for each commit.
3. `scripts/mark-done.sh` — marks ticket DONE, closes epic if all tickets done.
4. `git push origin HEAD`
5. `scripts/open-pr.sh "<description>" "<body>"`
6. `scripts/watch-ci.sh <pr>` — CI is authoritative; fix and re-push on failure; never merge a failing PR.
7. Get explicit approval, then `scripts/merge-pr.sh <pr>`.
8. `scripts/cleanup-branch.sh`
9. After a `feat` or `fix` merge: ask "Ship a new tag?"
10. _(If yes)_ `scripts/create-release-tag.sh`. Watch the deploy and report success or failure.

## GHA workflow testing

When iterating on a GHA workflow: commit and push the change, dispatch with `gh workflow run <file> --ref <branch> --repo nicobc/patos`, then immediately watch with `gh run watch <run-id> --repo nicobc/patos`. On failure, fetch logs with `gh run view <run-id> --log-failed --repo nicobc/patos`, diagnose, fix, and repeat — without waiting for the user to paste output. `gh` is at `/opt/homebrew/bin/gh`.
