# board rules

## terminology
ticket: generic term for any item in an epic
story: alias for a `feat`-type ticket; "As a X, I want Y" format applies to stories only; other types have no prescribed format

## ticket numbering
Tickets are numbered per-epic: T1, T2, …
Numbers must be sequential top-to-bottom with no gaps. The file is the source of truth for execution order.

New tickets are always appended at the bottom of their epic file. Never insert mid-file without an explicit instruction to do so.

Reordering READY tickets (and renumbering to keep the sequence clean) is permitted with explicit owner approval. Tickets that have been started (IN PROGRESS or DONE) must not be renumbered — their IDs appear in git history and commit messages.

## ticket type
All tickets have a `type` field. Valid values mirror the conventional commits specification:
`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`, `chore`, `build`, `revert`

## epic scope
All epics have a `scope` field: short human-readable name used in commit messages (e.g. `cost-tracker`, `kanban`).

## ticket statuses
Valid values: IDEATION, READY, IN PROGRESS, DONE, DISCARDED.

Lifecycle: READY → IN PROGRESS → DONE.

DISCARDED tickets stay in their file. Do not delete or renumber.

## epic status
- READY: all tickets READY, none started
- IN PROGRESS: any ticket is IN PROGRESS or DONE, but not all tickets are DONE or DISCARDED
- DONE: all tickets DONE or DISCARDED

New work may be appended to a DONE epic and the epic reopened to IN PROGRESS.

Before marking a ticket DONE, groom any now-unblocked IDEATION tickets to READY.

When updating a ticket status, check whether the change requires updating the parent epic status (e.g. last ticket going DONE closes the epic; first ticket going IN PROGRESS opens the epic). Update index.yaml accordingly in the same commit.

## commit convention
All commits go through `scripts/commit.sh`. Code commits take a description; type, scope, and ticket ID are derived from `$TICKET`. Board commits use `--board`; agent commits use `--agent`. Grooming commits (`--board`) include the epic file and any index.yaml changes.

## release order
The `ready` and `ideation` lists in `index.yaml` are maintained in planned release order — top entry ships next. Reordering these lists requires explicit owner approval, the same rule as reordering READY tickets within an epic.

## epic filenames
Epic yaml files use lowercase with 2-digit numbering: `epic-07.yaml`. The `id:` field inside the file stays uppercase (`id: EPIC-07`).

## yaml integrity
Edit field values only. Never add or remove keys from epic or ticket entries.
Intentional schema changes (e.g. adding a new field to all epics) are exceptions and require an explicit decision.
