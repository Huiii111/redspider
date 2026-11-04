# Backend: generator, grader, API, benchmark, value check

Owner: Huiru. Contracts are in [architecture.md](../architecture.md). Setup and usage are in the [README](../README.md). This file lists where the code differs from architecture.md, and what's still open.

## Differences from architecture.md

All of these are additions. None removes or renames a field.

**Adapter contract (John)**

- `scan(dir, { timeoutMs })`: the second argument is optional. It lets TerraGoat get a longer limit than a single file. Adapters that ignore it still work.
- `Finding.line` may be `null` when a tool gives no line.
- The server's own timeout fires 5 seconds after `timeoutMs`, as a backstop. The adapter must kill its process. `_run.js` does.

**Endpoints (Anton)**

- `GET /api/health`: each tool also has `license`. An unavailable tool has `version: null` and a `reason`.
- `POST /api/scan` can return `422 INVALID_TERRAFORM`, as Anton's branch already did, and `429 BUSY` when two scans are already running.
- `GET /api/cases/:id`: an `ERROR` result also has an `errorMessage`. Returns `503 NO_RUN` when no run is stored.
- Unknown routes return `404 NOT_FOUND`. Unexpected failures return `500 INTERNAL`.

**Stored run**

`results/benchmark.json` holds the summary, the per-case detail, every tool's raw findings on both twins (`raw`), and `provenance` (corpus hash, platform, Node version, whether the sandbox was on). The API serves only the summary and case detail. `npm run value-check` reads `raw`.

**Held-out format**

`case.json` accepts Anton's optional fields: `resource`, `change` and `requirement.url`. See [corpus-format.md](corpus-format.md).

## Decisions for the team

1. **Value-check verdict.** Anton's `valueCheck.js` required the threshold to hold under loose matching too, and required the ablation to shrink the blind spot, before saying `VALUE_PROVEN`. `docs/prereg.md` only registers the two strict thresholds, and asks for the sensitivity and ablation to be *reported*. This backend follows the registered text and adds a warning when loose matching disagrees. Changing it means re-registering.
2. **Three backends.** `anton/current-version` and `bad-terraform-code` each have their own server. This one now includes John's sandbox and adapters and Anton's parsing fixes and value check. Pick one backend before more work is done on any of them.
3. **Terrascan.** It hangs without network. It is kept in `server/adapters/disabled/`, not loaded.
4. **Platform.** The network sandbox is macOS-only. Real scans should run on a Mac, or with `ALLOW_UNSANDBOXED=1` knowingly.
5. **Same rule, same resource.** The grader can't see a second fault on a resource if a tool reports that rule only once per resource. For example, a security group that already allows HTTPS from `0.0.0.0/0` hides a new open SSH rule from a tool with one "open to the world" rule. Worth a sentence in the pitch.

## Not done yet

- No real scanner has run on this backend yet. Adapters are tested against saved output only.
- TerraGoat isn't cloned or pinned.
- `tests/heldout/` doesn't exist.
