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
    "source": "NIST SP 800-53 Rev. 5",
    "ref": "SC-7",
    "text": "The requirement text the fault breaks"
  }
}
```

`title` is shown on screen in plain English. Any other keys in the file are ignored.

The benchmark stops with an error naming the case if a folder is missing a file, has invalid JSON, or has identical clean and faulty files.
