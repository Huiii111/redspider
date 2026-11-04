# Scanner Blind Spots: scanner adapters (`bad-terraform-code` branch)

A benchmark that plants known faults in Terraform and shows which open-source audit tools stay silent on each one. The full design is in [docs/architecture.md](docs/architecture.md).

This branch covers the adapter and sandbox part of that design: running Trivy, Checkov, KICS and Terrascan safely and turning their output into one common `Finding` shape. It also holds the repo scaffold. The grader, routes and benchmark script are not built here.

## What's on this branch

| Area | State |
|---|---|
| Repo layout from the architecture doc | Done, with stubs for the parts below |
| Vite + React client | Set up and loads. The three screens are empty stubs |
| Express server | Runs on `127.0.0.1:3001`. Only `GET /api/health` is implemented |
| Scanner adapters | Trivy, Checkov and KICS work. Terrascan always reports `ERROR` (see below) |
| Sandbox for scanner processes | Done, macOS only |
| Parser tests | 6 tests against real tool output |
| Grader, `/api/scan`, `/api/benchmark`, `/api/cases`, `npm run benchmark` | Not built. Stubs only |
| Held-out test pairs in `tests/heldout/` | Not created |

## Scanner adapters

Each adapter in `server/adapters/` is one file with the same default export:

```js
{ id, name, license, version(), scan(dir) }   // scan returns Finding[]
```

A finding looks like this:

```json
{ "toolId": "trivy", "ruleId": "AWS-0086", "resource": "aws_s3_bucket_public_access_block.data",
  "severity": "HIGH", "message": "...", "line": 7 }
```

| Tool | Version tested | Command used | Live result on the sample file |
|---|---|---|---|
| Trivy | 0.76.1 | `trivy config --skip-check-update --format json DIR` | 7 findings, about 1s |
| Checkov | 3.4.0 | `checkov -d DIR -o json --framework terraform --download-external-modules false` | 4 findings, about 4s |
| KICS | 2.2.0 | `kics scan -p DIR -o OUT --report-formats json --no-progress` | 7 findings, about 8s |
| Terrascan | 1.19.9 | `terrascan scan -i terraform -d DIR -o json` | Timed out after 20s |

The commands were confirmed by running each tool and saving its real output in `tests/fixtures/`.

Scanners exit non-zero when they find something (Checkov 1, KICS 40, Terrascan 3). An adapter treats a run as failed only when the tool is missing, times out, or produces no readable output. That keeps a real finding from being mistaken for a crash.

### Known issue: Terrascan

Terrascan looks up providers on `registry.terraform.io` and retries for minutes when it can't connect. With the network denied it never finishes, so its adapter hits the 20-second timeout and reports `ERROR`. Per the grading rules `ERROR` is never counted as `SILENT`, so results stay honest. The options are to keep it denied, allow network for Terrascan only (set `sandbox: false` in `server/adapters/terrascan.js`), or drop it. This hasn't been decided.

## Sandbox

`server/adapters/run.js` runs every scanner with these protections:

- **No shell.** It uses `execFile` with an argument array, so pasted input can't inject commands.
- **No network.** On macOS it wraps the command in `sandbox-exec` with `(deny network*)`.
- **Restricted files.** Reads of `~/.ssh`, `~/.aws`, `~/.azure`, `~/.gnupg`, `~/.kube`, `~/.config`, `~/Documents`, `~/Desktop` and `~/Downloads` are denied. Writes are allowed only under temp and cache locations.
- **Timeout and kill.** The default is 30 seconds per tool, then `SIGKILL`.
- **No silent fallback.** Off macOS there is no network sandbox, so the runner refuses to start a scanner unless `ALLOW_UNSANDBOXED=1` is set.

`server/core/workdir.js` has `withScanDir(terraform, fn)`. It writes the input to a fresh temp directory under the fixed name `main.tf`, calls `fn(dir)`, and always deletes the directory. It throws `INPUT_TOO_LARGE` over 100 KB. No route calls it yet.

I tested the sandbox directly: reads of `~/.config` and writes to the home directory were denied, a write to `/tmp` worked, and the network was blocked. Terraform with a remote `module` source scans in 1 to 8 seconds without downloading anything.

Limits: this is a local-demo sandbox, not a container. It sets no memory or CPU caps, and `sandbox-exec` is deprecated by Apple. Bind the server to `127.0.0.1` only.

## Requirements

- macOS, for the network sandbox
- Node.js (developed on 26) and npm
- Trivy, Checkov, KICS and Terrascan. On macOS: `brew install trivy checkov kics terrascan`

The paths in `server/config.js` assume Homebrew on Apple silicon (`/opt/homebrew`). Override them with `BREW_BIN` and `KICS_QUERIES_PATH`.

## Run it

```sh
npm install                  # server dependencies (express, zod)
cd client && npm install     # client dependencies
cd ..

npm run server               # API on http://127.0.0.1:3001
cd client && npm run dev     # client on http://localhost:5173, proxies /api to the server
npm test                     # parser tests
```

`GET /api/health` lists each tool with its availability and version. Check it before a demo.

Configuration, all through environment variables read only in `server/config.js`: `PORT`, `TOOL_TIMEOUT_MS`, `MAX_INPUT_BYTES`, `BREW_BIN`, `KICS_QUERIES_PATH`, `ALLOW_UNSANDBOXED`.

## Layout

```
client/                  React + Vite (screens are stubs)
server/
  index.js               Express setup
  config.js              Only file that reads env vars
  routes/                health is implemented, the rest are stubs
  core/workdir.js        Temp directory and size limit
  core/models.js         zod Finding schema
  core/grade.js          Stub
  adapters/              run.js (sandboxed runner), trivy, checkov, kics, terrascan
  scripts/benchmark.js   Stub
tests/
  adapters.test.js       Parser tests
  fixtures/              Real tool output and the sample Terraform file
  heldout/               Empty. Builders must not open it once it is filled
docs/architecture.md     Design and team split
```

## Relationship to other branches

This branch started from an empty repository and shares no history with `huiru/backend` or `anton/current-version`. Those branches have their own grader, API and adapters, and merging is a team decision.

The adapter contract matches the one `huiru/backend` expects. One thing would need changing to run these adapters there: they import named settings from `server/config.js`, while that branch's config exports a single `config` object.
