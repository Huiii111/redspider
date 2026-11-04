# Corpus format

`npm run benchmark` reads planted pairs from `tests/heldout/` (override with `--corpus DIR`). Whoever writes the held-out set must use this layout. `npm run generate` writes the same layout to `tests/generated/`.

```
tests/heldout/
  <case-id>/
    case.json
    clean.tf
    faulty.tf
```

- `<case-id>` may use only letters, digits, `_` and `-`, and must equal `id` in `case.json`.
- `clean.tf` and `faulty.tf` are complete single-file Terraform configurations. `faulty.tf` is `clean.tf` with exactly one planted fault.
- Each file is copied into its own empty temp directory as `main.tf` before a tool scans it, so a case can't reference other files or modules.

`case.json`:

```json
{
  "id": "rds-public",
  "title": "Database is reachable from the internet",
  "requirement": {
    "source": "CIS AWS Foundations Benchmark v3.0.0",
    "ref": "2.3.3",
    "text": "The requirement text the fault breaks",
    "url": "https://..."
  },
  "resource": "aws_db_instance.main",
  "change": "publicly_accessible set to true"
}
```

| Field | Required | Meaning |
|---|---|---|
| `id` | Yes | Same as the folder name |
| `title` | Yes | Shown on screen in plain English |
| `requirement.source`, `ref`, `text` | Yes | The requirement the fault breaks |
| `requirement.url` | No | Where the requirement text comes from |
| `resource` | Strongly recommended | Terraform address the fault is planted on. The value check's ablation needs it on every case, and is skipped otherwise |
| `change` | No | One line describing what was changed |

Any other keys are ignored.

The benchmark stops with an error naming the case if a folder is missing a file, has invalid JSON, has identical clean and faulty files, or has a `.tf` file that doesn't parse as Terraform. Scanners report nothing on a file they can't parse, which would count as a miss.

`docs/prereg.md` asks for at least 20 pairs. `npm run value-check` warns if there are fewer.
