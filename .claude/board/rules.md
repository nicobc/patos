# board rules

## terminology
ticket: generic term for any item in an epic or in maintenance.yaml
story: alias for a `feat`-type ticket; "As a X, I want Y" format applies to stories only; other types have no prescribed format

## ticket numbering
Tickets are numbered per-epic or per-file: T1, T2, …
Numbers must read sequentially (T1, T2, T3 …) top-to-bottom with no gaps. The file is the source of truth for execution order.

## ticket type
All tickets have a `type` field. Valid values mirror the conventional commits specification:
`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`, `chore`, `build`, `revert`

## epic scope
All epics have a `scope` field: short human-readable name used in commit messages (e.g. `cost-tracker`, `kanban`).
Maintenance tickets have their own `scope` field for the same purpose.

## ticket statuses
Valid values: IDEATION, READY, IN PROGRESS, TESTING, DONE, DISCARDED.

Lifecycle: READY → IN PROGRESS → TESTING → DONE. All ticket types go through TESTING.

TESTING: PR open, CI running or awaiting manual verification.
DONE: CI passed and ticket is verified working.

When a PR has no test plan (no manual verification needed), the TESTING board commit may be skipped — make a single DONE commit after CI passes instead of two separate commits.

CI tickets requiring a live trigger to validate (tag push, scheduled run, webhook): add `workflow_dispatch:` temporarily during TESTING, remove it in the DONE commit.

DISCARDED tickets stay in their file. Do not delete or renumber.

## epic status
- READY: all tickets READY, none started
- IN PROGRESS: any ticket is IN PROGRESS, TESTING, or DONE, but not all tickets are DONE or DISCARDED
- DONE: all tickets DONE or DISCARDED; final and cannot be reopened

New work discovered after an epic is DONE goes to a new epic or the maintenance backlog — do not reopen.

Before marking a ticket DONE, groom any now-unblocked IDEATION tickets to READY.

When updating a ticket status, check whether the change requires updating the parent epic status (e.g. last ticket going DONE closes the epic; first ticket going IN PROGRESS opens the epic). Update index.yaml accordingly in the same commit.

## maintenance tickets
Cross-cutting non-`feat` work that doesn't belong to a specific epic lives in `maintenance.yaml`.
Non-`feat` tickets that do belong to a specific epic (e.g. a bug in a feature area) live in that epic's `tickets:` list.

New tickets are always appended at the bottom of their file (epic or maintenance.yaml). Never insert a ticket mid-file without an explicit instruction to do so.

Reordering READY tickets (and renumbering to keep the sequence clean) is permitted with explicit owner approval. Tickets that have been started (IN PROGRESS, TESTING, or DONE) must not be renumbered — their IDs appear in git history and commit messages.

## commit convention
Code commits: `type(scope): description [EPIC-XXX/TN]` or `[MAINT/TN]` — ticket ID in the title makes git log self-contextualizing without scanning epic files. `type` and `scope` are taken directly from the ticket; epic tickets inherit scope from the parent epic; maintenance tickets have their own `scope` field.

Board-only commits (status updates, grooming, meta-work): `chore(board): description`. No ticket ID required. `board` is a reserved scope — nothing else uses it.

Agent-facing commits (anything under `.claude/` except board YAML files, plus `CLAUDE.md`): `chore(agent): description`. No ticket ID required. `agent` is a reserved scope — nothing else uses it. Board YAML status updates and grooming remain `chore(board):`.

Board status updates can be standalone commits within the branch. The commit that transitions a ticket to DONE carries a `Closes EPIC-XXX/TN` footer (or `Closes MAINT/TN`) for traceability. Place it after `Co-Authored-By` if present.

## grooming convention
Grooming commits include the epic file and any corresponding index.yaml changes.

## maintenance index section
Open tickets from `maintenance.yaml` plus any open non-`feat` tickets from feature epics appear in the `maintenance:` section of `index.yaml`. Load individual files only when you need ticket detail.

## epic filenames
Epic yaml files use lowercase: `epic-007.yaml` not `EPIC-007.yaml`. The `id:` field inside the file stays uppercase (`id: EPIC-007`). On macOS, case renames require `git mv` (filesystem is case-insensitive).

## yaml integrity
Edit field values only. Never add or remove keys from epic or ticket entries.
Intentional schema changes (e.g. adding a new field to all epics) are exceptions and require an explicit decision.
