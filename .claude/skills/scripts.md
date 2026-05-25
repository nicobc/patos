# Scripts

Applies to any change under `scripts/**`.

## Naming

Kebab-case verb-object phrases that describe exactly what the script does — `create-release-tag.sh`, `sync-local-types.sh`. No abbreviations, no generic names (`run.sh`, `utils.sh`).

## MUST DO — enforce on every script without exception

**Every script must start with:**
```bash
#!/usr/bin/env bash
set -euo pipefail
```

**No silent failures.** `set -euo pipefail` catches unset variables (`-u`), pipeline failures (`-o pipefail`), and exits on first error (`-e`). Never suppress these.

**No positional argument magic without documentation.** If a script takes arguments, validate them and fail fast with a usage message if they're missing or wrong.

**Scripts are single-purpose.** One script does one thing. Shared logic belongs in a shared helper — not copy-pasted across scripts.
