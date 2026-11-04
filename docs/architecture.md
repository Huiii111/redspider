# Scanner Blind Spots: architecture

A benchmark that plants known faults in Terraform and shows which open-source audit tools stay silent on each one. A clean scan only means something if you know what the tool would have missed.

Team handoff. The product name is a working title. Nothing here has been built or measured yet, so every JSON value below shows shape only and is not a result.

## Stack

| Part | Choice | Why |
|---|---|---|
| Frontend | React with Vite, plain JS | Team's choice |
| Backend | Node with Express, plain JS | A browser can't run scanners. Node runs them as separate programs and keeps everything in one language |
| Validation | zod | Checks every request and every piece of tool output at the boundary |
| Database | None | A benchmark run is one JSON file. Nothing else needs storing for the demo |

In development, Vite's `server.proxy` sends `/api` to Express on port 3101, so the frontend calls `/api/...` with no CORS setup.

## How it fits together

```
 Browser                 Node + Express                    Scanner programs
+--------------+  /api  +-----------------------------+   +-----------+
| React + Vite | -----> | API routes                  |   | Checkov   |
+--------------+        |   |            |            |   | Trivy     |
                        |   v            v            |   | KICS      |
                        | stored      Grader -> Tool  |-->| Terrascan |
                        | result             adapters |   +-----------+
                        +---|------------^------------+
                            v            |
              results/run.json     |
                            ^            |
                            |            |
                    npm run benchmark ---+
                            ^
                            |
              tests/heldout/ (clean and faulty pairs)
```

Two paths share one grader:

1. **First screen, stored result.** `npm run benchmark` runs every tool on every pair and writes `results/run.json`. The page loads that file, so results appear at once with no scanning.
2. **Live moment.** A judge edits Terraform in the browser. `POST /api/scan` runs each tool on the before and after versions and reports who noticed.

## How a tool is graded

Each case is a clean Terraform file and a twin with exactly one planted fault. We compare what each tool reports on the two files, so nobody has to interpret rule names by hand.

| Status | Meaning |
|---|---|
| `DETECTED` | A finding appears on the faulty twin that isn't on the clean twin, matched by rule ID and resource address |
| `SILENT` | The tool ran successfully on both files and reported nothing new |
| `ERROR` | The tool crashed, timed out or returned unreadable output. Never counted as silent, or we'd be accusing a tool of a miss we didn't observe |

Line numbers are left out of the match because planting a fault can shift them. There's no overall score or league table, by design: the screen shows what each tool misses.

## Endpoints

| Route | What it's for | Used by |
|---|---|---|
| `GET /api/health` | Which tools are available, with versions. Check this before going on stage | Setup, footer |
| `GET /api/benchmark` | The stored run: headline, tools and the fault-by-tool grid | First screen |
| `GET /api/cases/:id` | One fault: both Terraform files, the requirement it breaks and each tool's findings | Detail view |
| `POST /api/scan` | Run all tools on a before and after pair, and report who noticed | Live moment |

### GET /api/health

```json
{
  "tools": [
    { "id": "trivy", "name": "Trivy", "available": true, "version": "0.76.1" }
  ]
}
```

### GET /api/benchmark

Returns `503` with code `NO_RUN` if no stored run exists. It never returns sample data in its place.

```json
{
  "runId": "string",
  "ranAt": "ISO 8601 timestamp",
  "corpus": { "source": "string", "planted": true, "faultCount": 0 },
  "heuristic": {
    "rule": "Tool with the most findings on TerraGoat",
    "toolId": "string",
    "missed": 0,
    "caughtByAnotherTool": 0
  },
  "tools": [{
    "id": "string", "name": "string", "version": "string", "license": "string",
    "terragoatFindings": 0, "detected": 0, "silent": 0, "error": 0
  }],
  "faults": [{
    "id": "string",
    "title": "Plain-English fault",
    "requirement": { "source": "string", "ref": "string" },
    "results": { "<toolId>": "DETECTED | SILENT | ERROR" }
  }]
}
```

### GET /api/cases/:id

Returns `404` with code `CASE_NOT_FOUND` if the ID is unknown.

```json
{
  "id": "string",
  "title": "string",
  "requirement": { "source": "string", "ref": "string", "text": "string" },
  "clean": "Terraform text",
  "faulty": "Terraform text",
  "results": [{
    "toolId": "string",
    "status": "DETECTED | SILENT | ERROR",
    "newFindings": ["Finding"],
    "cleanFindingCount": 0
  }]
}
```

### POST /api/scan

Tools run in parallel, each with its own timeout. If one tool fails, the response is still `200` with that tool marked `ERROR`.

Request:

```json
{ "before": "Terraform text", "after": "Terraform text" }
```

Response:

```json
{
  "scanId": "string",
  "timeoutSeconds": 0,
  "results": [{
    "toolId": "string",
    "status": "NOTICED | SILENT | ERROR",
    "newFindings": ["Finding"],
    "durationMs": 0,
    "errorMessage": "string, only when status is ERROR"
  }]
}
```

### Shared shapes

Finding: every adapter turns its tool's output into this.

```json
{
  "toolId": "string",
  "ruleId": "string",
  "resource": "aws_s3_bucket.data",
  "severity": "string or null, as the tool reports it",
  "message": "string",
  "line": 0
}
```

Error, for any non-2xx response:

```json
{ "error": { "code": "INVALID_INPUT", "message": "What went wrong and how to fix it" } }
```

| Status | Code | When |
|---|---|---|
| 400 | `INVALID_INPUT` | A field is missing or isn't a string |
| 404 | `CASE_NOT_FOUND` | Unknown case ID |
| 413 | `INPUT_TOO_LARGE` | Terraform is over the size limit |
| 422 | `INVALID_TERRAFORM` | Before or After doesn't parse. Scanners exit 0 on broken files, and Trivy reports its checks as passed, so we reject these first |
| 503 | `NO_RUN` | The benchmark hasn't been run yet |

## Tool adapters

Each adapter is one file exporting the same interface: `{ id, name, license, version(), scan(dir) }`, where `scan` returns `Finding[]`. Adding a tool means adding one file.

| Tool | Version tested | Command |
|---|---|---|
| Trivy | 0.76.1 | `trivy config --format json --skip-check-update --quiet DIR` |
| Checkov | 3.4.3 | `checkov -d DIR -o json --quiet --compact --skip-download` |
| KICS | 2.2.0 | `kics scan -p DIR -q QUERIES -o OUT --output-name kics --report-formats json --no-progress --type Terraform` |

These commands were run against real output, saved in `tests/fixtures/`.

- **Exit codes mean nothing here.** Checkov exits 1 and KICS exits 20 to 60 when they find something, and all three exit 0 on broken Terraform. A tool's result is decided from its report.
- **Terrascan is cut.** It contacts `registry.terraform.io` during a scan and hangs with no network.
- **Prowler is cut.** Its code scanning runs Trivy, so including it would count one engine twice.

### Sandbox (John)

`server/sandbox/runIsolated.js` is the one place scanners get launched. The current version uses macOS `sandbox-exec` to deny network, plus a throwaway directory per scan and a hard kill on timeout. It doesn't restrict file reads, and it only works on macOS. John's Docker sandbox replaces this one file: keep the signature `runIsolated(bin, args, { timeoutMs, input })`, returning `{ stdout, stderr, exitCode }`.

### Running it

Copy `server/.env.example` to `server/.env` and fill in your paths. Then run `npm start` in `server/`, and `npm run dev` in `client/`. `npm run benchmark` followed by `npm run value-check` produces the results and the verdict.

## Repo layout

```
client/                  React + Vite
  src/api.js             All fetch calls, one place
  src/screens/           Results, CaseDetail, LiveScan
server/
  index.js               Express setup
  config.js              Only file that reads env vars
  routes/                health, benchmark, cases, scan
  core/grade.js          Comparison logic, no I/O, used by both paths
  core/valueCheck.js     The pre-registered check
  core/models.js         zod schemas
  adapters/              checkov, trivy, kics
  sandbox/               Isolated scanner runs, replaceable by John
  scripts/               benchmark.js and valueCheck.js
results/run.json         Output of a real run
tests/fixtures/          Real tool output, for adapter tests
tests/heldout/           Planted pairs. Builders don't open this.
docs/                    Claim, cut list, evidence
```

## Security rules for the live scan

This endpoint takes code from strangers, and our security judge will ask about it.

- Run tools with `execFile` and an argument array, never through a shell.
- Write each input to a fresh temp directory under a fixed filename, and delete it afterwards. Never use a user-supplied path.
- Never run `terraform init`, `plan` or `apply` on pasted code. Scanners read it as static text.
- Turn off remote module downloads in every tool. Pasted Terraform can point at any URL. Confirm the flag for each tool.
- Enforce a size limit and a per-tool timeout, and kill the process when it expires. Show the timeout on screen.
- Bind the server to `127.0.0.1` for the demo. It isn't hardened for the public internet.

## Who does what

| Person | Owns | Delivers | Needs from |
|---|---|---|---|
| John | Sandbox and tool adapters. Each scanner runs isolated, with no network, a timeout and a throwaway directory | `scan(dir)` for each tool, returning `Finding[]` | Nobody, so John can start now |
| Huiru | Messy Terraform generator, grader, Express routes and benchmark script | The API in this file and `results/run.json` | John's `scan(dir)` |
| Anton | React frontend: first screen, fault detail and live scan | The three screens | Huiru's API |

Still to assign: who presents, and who reviews five random planted faults for realism. John is the natural reviewer because of his Terraform expertise. Check that he is happy with that, and that his code hasn't shaped the faults he reviews.

The contract between John and Huiru is the `Finding` shape and `scan(dir)`. The contract between Huiru and Anton is the endpoint shapes. Agree any change to either before making it.

A separate agent writes `tests/heldout/` from requirement text, without seeing tool rules. Nobody on the team opens it before the value run, or the result stops counting as evidence. Output from Huiru's generator can be used for demos and for stress testing, but it doesn't replace the held-out set in the value check. If the team wants it to count, the change must be re-registered in `docs/prereg.md`.

## Build order

| Build minute | Done means |
|---|---|
| 0 to 20 | Edit Terraform in the browser, one real tool runs, and the answer on screen changes. Everything else grows from this |
| 20 to 45 | All adapters, the grader and the value run on the held-out pairs |
| 60 | Cut decision, taken from `docs/cut-list.md` |
| 60 to 80 | First screen designed around the real result, then a comprehension test |
| 80 | Freeze. Fixes and copy changes only after this |
| 80 to end | Independent check, backups and three timed rehearsals |

These assume a full 2-hour build. Shorten them once the real deadline is known.

## What can still change this

- **The claim is unproven.** If tools catch nearly the same faults, the pre-registered check fails and the pitch has to change. We can't say "better" unless it passes.
- **These are scanners, not full GRC platforms.** They're open-source code scanners with compliance mappings. Tell the judges that before they point it out.
- **The faults are planted.** Results apply to this set of faults and don't predict real-world catch rates.
- **Open questions for the team:** the real deadline, the presentation slot length, and whether the event requires using Claude. This design doesn't use a model at the moment.
