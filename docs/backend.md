# Backend: generator, grader, API, benchmark

Owner: Huiru. Contracts are in [architecture.md](../architecture.md). This file covers how to run things and where the code differs from that document.

## Run it

See the [README](../README.md) for install, fake mode (`npm run dev:fake`) and every command.

`npm run benchmark` stops if any tool is unavailable, if TerraGoat isn't given (`--terragoat` or `TERRAGOAT_DIR`), or if a TerraGoat scan fails. A run with a missing tool would make that tool's column all `ERROR`. Configuration is in `server/config.js`.

## For John: the adapter contract as coded

Put one file per tool in `server/adapters/`, with a default export (ESM or CommonJS):

```js
export default {
  id: 'trivy', name: 'Trivy', license: 'Apache-2.0',
  async version() { /* return '0.76.1'; throw if not installed */ },
  async scan(dir) { /* return Finding[]; throw if the tool crashed or its output is unreadable */ },
};
```

- `dir` holds a single `main.tf`. Write tool output files somewhere else.
- Every finding is validated with zod. A malformed finding, or one whose `toolId` isn't the adapter's `id`, turns that run into `ERROR`.
- `resource` must be the Terraform address, such as `aws_s3_bucket.data` or `aws_db_instance.db[0]`. The grader matches on `ruleId` plus `resource`, so normalise each tool's format to this.
- `line` may be `null` if a tool gives no line. **This differs from architecture.md**, which shows only a number.
- The server applies its own timeout (`TOOL_TIMEOUT_SECONDS`, default 60) as a backstop, but it can't kill your child process. Your adapter must kill it.
- Files starting with `_` are ignored, so shared helpers can go in `_exec.js`.

## For Anton: additions to the endpoint shapes

None of these remove or rename a field in architecture.md.

- `GET /api/health`: an unavailable tool has `"version": null` and a `reason` string.
- `POST /api/scan` can return `429` with code `BUSY` if two scans are already running. Each scan starts two processes per tool, so the limit keeps the demo laptop responsive.
- `GET /api/cases/:id`: an `ERROR` result also has an `errorMessage`.
- `GET /api/cases/:id` returns `503 NO_RUN`, like `/api/benchmark`, when no run is stored.
- Unknown routes return `404 NOT_FOUND`, and unexpected failures return `500 INTERNAL`, both in the shared error shape.

## Messy Terraform generator

`server/generator/` builds 14 faults across S3, security groups, RDS, EBS, KMS, CloudTrail, IAM and load balancer listeners. Requirements are NIST SP 800-53 Rev. 5 controls in my own wording. Each case varies:

- indentation (2 spaces, 4 spaces or tabs), `=` alignment, `#` or `//` comments, CRLF line endings
- attribute and block order, filler resources, and `count` on some resources, which changes addresses to `[0]`
- where the faulty value lives: inline, in a variable default, or in a local
- IAM policies as a heredoc or as `jsonencode`

The same seed always gives the same output. Tests check that every generated file parses as HCL and declares every `var.` and `local.` it uses.

This set is for demos and stress testing only. It does not replace `tests/heldout/`, and the script refuses to write there.

## Not done yet

- Real adapters (John). Nothing has run against a real scanner, so no result exists yet.
- TerraGoat isn't downloaded yet. Pin a commit when we clone it, so the heuristic can be reproduced.
- `tests/heldout/` doesn't exist. It needs the separate agent, using [corpus-format.md](corpus-format.md).
