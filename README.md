# Scanner Blind Spots

A benchmark that plants known faults in Terraform and shows which open-source scanners (Checkov, Trivy, KICS, Terrascan) stay silent on each one. A clean scan only means something if you know what the tool would have missed.

The design, API contract and team split are in [architecture.md](architecture.md). This README covers how to install, run and work on the project.

> **Status.** The backend (grader, API, benchmark script and Terraform generator) is built and tested. The real scanner adapters and the frontend are not built yet. Until the adapters exist, every result comes from **fake dev-only scanners** and means nothing about real tools.

## Contents

1. [Requirements](#requirements)
2. [Install](#install)
3. [Quick start: run everything with fake data](#quick-start-run-everything-with-fake-data)
4. [Guide for frontend work (Anton)](#guide-for-frontend-work-anton)
5. [Guide for adapter work (John)](#guide-for-adapter-work-john)
6. [Running the real benchmark](#running-the-real-benchmark)
7. [Command reference](#command-reference)
8. [Configuration](#configuration)
9. [How grading works](#how-grading-works)
10. [The Terraform generator](#the-terraform-generator)
11. [Project layout](#project-layout)
12. [Tests](#tests)
13. [Rules everyone must follow](#rules-everyone-must-follow)
14. [Troubleshooting](#troubleshooting)

## Requirements

| Tool | Version | Needed for |
|---|---|---|
| Node.js | 20.6 or later (developed on 24) | Everything. 20.6 is the first version with `--env-file`, which the `:fake` scripts use |
| npm | Comes with Node | Installing dependencies |
| Git | Any recent version | Cloning |
| Checkov, Trivy, KICS, Terrascan | See [Running the real benchmark](#running-the-real-benchmark) | Real results only. Not needed for development |

Check your Node version with `node --version`.

## Install

```sh
git clone https://github.com/Huiii111/redspider.git
cd redspider
npm install
```

Check the install worked:

```sh
npm test
```

All tests should pass. They use no scanners and no network.

## Quick start: run everything with fake data

One command generates planted Terraform pairs, runs the fake scanners on them and starts the API:

```sh
npm run dev:fake
```

You should see:

```
Wrote 14 pairs (seed 1) to tests/generated
...
Heuristic pick: fake. It missed 10 of 14 faults; another tool caught 3 of those.
Wrote results/benchmark.fake.json (run ...)
API on http://127.0.0.1:3001/api  (tools: fake, fake-net)
```

Leave it running and open http://127.0.0.1:3001/api/benchmark in a browser. Stop it with `Ctrl+C`.

After the first time, you only need `npm run server:fake`, because the generated pairs and the fake result stay on disk.

Fake mode uses settings from [.env.fake](.env.fake):

- two fake scanners from `tests/fake-adapters/` (`fake` and `fake-net`)
- the generated pairs in `tests/generated/` in place of the held-out set
- a tiny stand-in for TerraGoat in `tests/fixtures/fake-terragoat/`
- a separate result file, `results/benchmark.fake.json`, so a fake run can never be mistaken for the real `results/benchmark.json`

The fake scanners only match literal text. They miss any fault that is planted through a variable or a local, which gives the screens realistic `DETECTED` and `SILENT` mixes to display.

## Guide for frontend work (Anton)

### 1. Start the API

In one terminal, from the repo root:

```sh
npm run dev:fake      # first time
npm run server:fake   # after that
```

The API listens on `127.0.0.1:3001` only. It is not reachable from other machines, by design.

### 2. Proxy `/api` from Vite

In `client/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
});
```

Use `127.0.0.1`, not `localhost`. On recent Node versions `localhost` can resolve to the IPv6 address `::1`, where the API isn't listening.

Then call `fetch('/api/benchmark')` and so on from the browser, with no CORS setup. Architecture.md asks for all fetch calls to live in `client/src/api.js`.

### 3. Endpoints

Full shapes are in [architecture.md](architecture.md#endpoints). Additions to those shapes are listed in [docs/backend.md](docs/backend.md#for-anton-additions-to-the-endpoint-shapes).

| Route | Screen | Notes |
|---|---|---|
| `GET /api/health` | Footer, setup check | Each tool has `available` and `version`. An unavailable tool has `version: null` and a `reason` |
| `GET /api/benchmark` | First screen | Headline, tools, and the fault-by-tool grid in `faults[].results` |
| `GET /api/cases/:id` | Fault detail | Use an `id` from `faults[]`. Includes both Terraform files and each tool's new findings |
| `POST /api/scan` | Live scan | Body `{ "before": "...", "after": "..." }`. Takes a few seconds with real tools. Show a loading state and the `timeoutSeconds` value |

Try them from a terminal:

```sh
curl http://127.0.0.1:3001/api/health
curl http://127.0.0.1:3001/api/benchmark
curl http://127.0.0.1:3001/api/cases/gen-1-007-rds-public
curl -X POST http://127.0.0.1:3001/api/scan -H "content-type: application/json" \
  -d "{\"before\": \"resource \\\"aws_db_instance\\\" \\\"db\\\" {\\n  publicly_accessible = false\\n}\", \"after\": \"resource \\\"aws_db_instance\\\" \\\"db\\\" {\\n  publicly_accessible = true\\n}\"}"
```

In Windows PowerShell, type `curl.exe`, because `curl` there is an alias for a different command.

### 4. Statuses to display

| Where | Value | Meaning | Suggested display |
|---|---|---|---|
| Benchmark and cases | `DETECTED` | The tool reported something new on the faulty file | Caught |
| Live scan | `NOTICED` | Same as `DETECTED`, for the before and after pair | Noticed |
| Both | `SILENT` | The tool ran fine and reported nothing new | The headline result: a miss |
| Both | `ERROR` | The tool crashed, timed out or gave unreadable output | Visibly different from `SILENT`. This is not a miss, because we didn't observe one |

There is no overall score or ranking, by design. The first screen shows what each tool misses.

### 5. Errors to handle

Every non-2xx response has the shape `{ "error": { "code": "...", "message": "..." } }`. The `message` is written to be shown to a user.

| Status | Code | When | What the screen should do |
|---|---|---|---|
| 400 | `INVALID_INPUT` | Missing field, field not a string, or invalid JSON | Show the message |
| 404 | `CASE_NOT_FOUND` | Unknown case id | Go back to the first screen |
| 413 | `INPUT_TOO_LARGE` | A Terraform field is over 100 KB | Show the message |
| 429 | `BUSY` | Two scans are already running | Ask the user to retry in a few seconds |
| 503 | `NO_RUN` | No benchmark has been run | Show "no results yet". Never show placeholder numbers |
| 500 | `INTERNAL` | Unexpected server failure | Show a generic error. Details are in the server log |

To see `NO_RUN`, stop the server, rename `results/benchmark.fake.json`, and start it again.

## Guide for adapter work (John)

### The contract

Add one file per scanner in `server/adapters/`. The server loads every `.js`, `.mjs` and `.cjs` file there, except files starting with `_` (use those for shared helpers, such as `_exec.js`) and `index.*`.

```js
// server/adapters/trivy.js
export default {
  id: 'trivy',              // unique, lowercase; used as the key everywhere
  name: 'Trivy',            // shown on screen
  license: 'Apache-2.0',
  async version() {
    // Return the installed version, e.g. '0.76.1'. Throw if the tool isn't installed.
  },
  async scan(dir) {
    // dir contains exactly one file: main.tf.
    // Return an array of findings. Throw if the tool crashed or its output can't be read.
  },
};
```

Each finding must have this shape. The server validates it with zod and marks the run `ERROR` if it doesn't match.

```js
{
  toolId: 'trivy',                 // must equal the adapter's id
  ruleId: 'AVD-AWS-0080',          // the tool's own rule id
  resource: 'aws_db_instance.db',  // the Terraform address; use '' if the tool gives none
  severity: 'HIGH',                // as the tool reports it, or null
  message: 'Instance does not have storage encryption enabled.',
  line: 12,                        // or null
}
```

### What matters most

- **Normalise `resource` to the Terraform address**, such as `aws_s3_bucket.logs` or `aws_db_instance.db[0]`. The grader matches findings on `ruleId` plus `resource`. If a tool reports the address differently on the clean and faulty files, the grade will be wrong.
- **Kill the child process when it times out.** The server has its own timeout (60 seconds by default) as a backstop, but it can't kill a process your adapter started.
- **Don't treat a non-zero exit code as failure.** Many scanners exit non-zero when they find something. Decide failure from whether the output is valid.
- **Don't write into `dir`.** Send tool output files somewhere else. Each `dir` is deleted after the scan.
- Follow the security rules in [architecture.md](architecture.md#security-rules-for-the-live-scan): use `execFile` with an argument array, never a shell, and turn off remote module downloads.

### Try your adapter

Save a real output sample in `tests/fixtures/` and write a parser test next to the other tests. Then run the API with your adapters, which is the default directory:

```sh
npm run server
curl http://127.0.0.1:3001/api/health
```

`health` should list your tool with `available: true` and a version. If the server refuses to start, the message names the adapter file and what doesn't match the contract.

Then send a live scan with the `curl` command in the frontend guide above and check your tool shows `NOTICED`.

## Running the real benchmark

This produces `results/benchmark.json`, the result shown on stage.

1. **Install the scanners.** Commands are from architecture.md and need confirming on each machine:

   | Tool | Install |
   |---|---|
   | Trivy | See https://trivy.dev, or `brew install trivy` |
   | Checkov | `pip install checkov` |
   | KICS | `brew install kics` |
   | Terrascan | `brew install terrascan` |

2. **Add the adapters** to `server/adapters/`, and check `npm run server` followed by `curl http://127.0.0.1:3001/api/health` shows every tool as available.

3. **Clone TerraGoat at a fixed commit**, so the heuristic can be reproduced. Record the commit in `docs/`.

   ```sh
   git clone https://github.com/bridgecrewio/terragoat ../terragoat
   git -C ../terragoat rev-parse HEAD
   ```

4. **Make sure `tests/heldout/` exists.** It is written separately, in the format in [docs/corpus-format.md](docs/corpus-format.md). Don't open it. See the [rules](#rules-everyone-must-follow).

5. **Run:**

   ```sh
   npm run benchmark -- --terragoat ../terragoat/terraform/aws
   ```

   The script stops if any tool is unavailable, if TerraGoat is missing, or if the TerraGoat scan fails. It prints one line per case and a summary table, then writes `results/benchmark.json`.

6. **Serve it:**

   ```sh
   npm run server
   ```

If the summary reports any `ERROR` results, fix the adapter and run again before treating the result as evidence.

## Command reference

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm test` | Run all tests. No scanners needed |
| `npm run server` | Start the API with the real adapters in `server/adapters/` and `results/benchmark.json` |
| `npm run benchmark -- --terragoat DIR` | Run the real benchmark on `tests/heldout/` |
| `npm run generate` | Write messy planted pairs to `tests/generated/` |
| `npm run dev:fake` | Generate pairs, run the fake benchmark, and start the API in fake mode |
| `npm run benchmark:fake` | Run the fake benchmark only |
| `npm run server:fake` | Start the API in fake mode only |

Options go after `--`:

```sh
npm run benchmark -- --corpus tests/generated --terragoat ../terragoat/terraform/aws --out results/try.json
npm run generate -- --seed 7 --count 28 --out tests/generated
```

| Script | Option | Default |
|---|---|---|
| `benchmark` | `--corpus DIR` | `tests/heldout` |
| `benchmark` | `--terragoat DIR` | `TERRAGOAT_DIR`, else required |
| `benchmark` | `--out FILE` | `results/benchmark.json` |
| `generate` | `--seed N` | `1`. The same seed always gives the same files |
| `generate` | `--count N` | `14`, one per fault type. Higher counts repeat fault types with different styles |
| `generate` | `--out DIR` | `tests/generated`. Refuses `tests/heldout`, and refuses a folder it didn't create |

## Configuration

All settings are environment variables, read only in [server/config.js](server/config.js). Defaults suit local development.

| Variable | Default | Meaning |
|---|---|---|
| `HOST` | `127.0.0.1` | Address the API binds to. Keep the default for the demo |
| `PORT` | `3001` | API port |
| `ADAPTERS_DIR` | `server/adapters` | Where scanner adapters are loaded from |
| `RESULTS_FILE` | `results/benchmark.json` | Stored run that the API serves and the benchmark writes |
| `CORPUS_DIR` | `tests/heldout` | Planted pairs the benchmark reads |
| `TERRAGOAT_DIR` | none | TerraGoat folder for the heuristic |
| `MAX_INPUT_BYTES` | `102400` | Size limit for each Terraform field in a live scan |
| `TOOL_TIMEOUT_SECONDS` | `60` | Per-tool timeout for each scan. TerraGoat gets five times this |

How to set one for a single command:

```sh
# macOS, Linux, Git Bash
PORT=3002 npm run server
```

```powershell
# Windows PowerShell
$env:PORT = "3002"; npm run server
```

Or put settings in a file and use `node --env-file=FILE server/index.js`, as the `:fake` scripts do with `.env.fake`.

## How grading works

Each case is a clean Terraform file and a twin with exactly one planted fault. Each tool scans both, in separate fresh temp folders. The grader in [server/core/grade.js](server/core/grade.js) compares the two sets of findings:

- **DETECTED** (`NOTICED` in a live scan): the faulty file has a finding, identified by rule id and resource address, that the clean file doesn't have.
- **SILENT**: both scans succeeded and nothing new appeared.
- **ERROR**: either scan failed. Never counted as silent.

Line numbers are ignored, because planting a fault can shift them.

The **heuristic** on the first screen answers: if you picked the tool with the most findings on TerraGoat, how many planted faults would it miss, and how many of those would another tool have caught? If two tools tie, the first by id is picked and the benchmark prints a warning.

## The Terraform generator

`npm run generate` writes realistic, inconsistently written Terraform pairs for demos and stress tests. It covers 14 faults across S3, security groups, RDS, EBS, KMS, CloudTrail, IAM and load balancer listeners. Each fault is linked to a NIST SP 800-53 Rev. 5 control.

Each pair varies on purpose:

- indentation (2 spaces, 4 spaces or tabs), `=` alignment, `#` or `//` comments, and CRLF line endings
- attribute and block order, unrelated filler resources, and `count` on some resources, which changes the address to `name[0]`
- where the faulty value lives: inline, in a variable default, or in a local
- IAM policies written as a heredoc or with `jsonencode`

The clean and faulty files differ only where the fault was planted. Tests check that every generated file is valid HCL.

**Generated pairs don't replace the held-out set** in the value check. To count them, the change must be re-registered in `docs/prereg.md`.

## Project layout

```
README.md                  This file
architecture.md            Design, API contract, team split
docs/
  backend.md               Backend notes and differences from architecture.md
  corpus-format.md         Folder format for planted pairs
server/
  index.js                 Starts the API
  app.js                   Express setup and routes
  config.js                The only file that reads environment variables
  errors.js                Shared error shape
  routes/                  health, benchmark, cases, scan
  core/
    grade.js               Comparison logic, no I/O
    models.js              zod schemas for every boundary
    registry.js            Loads adapters
    runner.js              Runs one adapter, with timeout and validation
    workspace.js           Fresh temp folder per scan
    corpus.js              Reads planted pairs
    store.js               Reads and writes the stored run
  generator/               Messy Terraform generator
  scripts/                 benchmark.js, generate.js
  adapters/                Real scanner adapters (John)
client/                    React frontend (Anton), not added yet
results/
  benchmark.json           Output of a real run
tests/
  *.test.js                Tests
  fake-adapters/           Dev-only stand-in scanners
  fixtures/                Sample inputs, and real tool output for adapter tests
  generated/               Output of npm run generate (not committed)
  heldout/                 Planted pairs for the value run. Nobody on the team opens this
```

## Tests

```sh
npm test
```

| File | Covers |
|---|---|
| `tests/grade.test.js` | Grading rules and the heuristic |
| `tests/generator.test.js` | Generated files parse as HCL, declare their variables, and differ only by the fault |
| `tests/api.test.js` | Every endpoint and error code, tool failures and timeouts, temp folder cleanup |
| `tests/benchmark.test.js` | The benchmark script end to end with fake adapters |

Tests use Node's built-in runner, so no extra framework is needed. Run one file with `node --test tests/api.test.js`.

## Rules everyone must follow

- **Never open `tests/heldout/`** before the value run, and don't let your code shape it. If anyone sees it, the result stops counting as evidence.
- **Never commit `results/benchmark.fake.json`** or present fake results as real. `.gitignore` excludes it.
- **Agree contract changes first.** The `Finding` shape and `scan(dir)` are the contract between John and Huiru. The endpoint shapes are the contract between Huiru and Anton.
- **Keep the API on `127.0.0.1`.** The live scan runs scanners on code from strangers and isn't hardened for the internet.
- **This repository is public.** Don't commit secrets, credentials or anything from the held-out set before the value run.

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| `503 NO_RUN` from `/api/benchmark` | No stored run. Run `npm run benchmark:fake` (fake mode) or `npm run benchmark -- --terragoat DIR` (real) |
| `node: bad option: --env-file` | Node is older than 20.6. Upgrade Node |
| `EADDRINUSE` on start | Port 3001 is taken, usually by another copy of the server. Stop it, or set `PORT` |
| Frontend gets connection refused | The API isn't running, or Vite proxies to `localhost`. Use `http://127.0.0.1:3001` |
| `Adapter X does not match the contract` | The adapter file is missing `id`, `name`, `license`, `version` or `scan`. The message says which |
| `tools not available` from the benchmark | A scanner isn't installed or isn't on `PATH`. Check with `/api/health`, which shows the `reason` |
| A tool shows `ERROR` everywhere | Look at `errorMessage` in `/api/cases/:id` or the scan response. Common causes are a wrong command, a timeout, or output that changed format |
| `TerraGoat path not set` | Pass `--terragoat DIR` or set `TERRAGOAT_DIR` |
| `generate: ... exists and wasn't made by this script` | The output folder has other files. Pick another `--out` |
| `VAR=value npm run ...` fails on Windows | That syntax is for bash. Use the PowerShell form in [Configuration](#configuration), or Git Bash |
