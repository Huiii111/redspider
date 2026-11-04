# Pre-registration

Written before any fixture or source file.

## Value claim

On infrastructure code with known planted faults, the benchmark shows a GRC engineer which faults each open-source tool stays silent on, so they know what a clean result does not prove.

## Decision changed

Which tool or tools to rely on, and which faults need a second tool or a manual check.

## Trivial heuristic

Run each tool on TerraGoat and choose the one reporting the most findings. In code: `argmax(tool => findings(tool, terragoat).length)`.

TerraGoat comes from Bridgecrew, the maker of Checkov, so this heuristic may favour Checkov. We keep it because it is what a practitioner could run, and we say so.

## How a fault is graded

Each held-out case is a clean Terraform file and a twin with exactly one planted fault.

- **DETECTED:** the tool reports a finding on the faulty twin that it does not report on the clean twin, matched by rule ID and resource address.
- **SILENT:** the tool ran successfully on both and reported no such new finding.
- **ERROR:** the tool failed or timed out. This is never counted as SILENT.

## Metric and threshold

1. **Blind spot:** the share of planted faults the heuristic's chosen tool stays silent on. Threshold: at least 20%.
2. **Decision change:** the number of faults the heuristic's tool misses and another tool catches. Threshold: at least 3.

Both must hold for VALUE_PROVEN.

## Kill criterion

The blind spot is under 10%, or fewer than 3 faults are caught by another tool and missed by the heuristic's tool. Either means choosing a tool by finding count is good enough on this data.

## Held-out source

A separate agent writes `tests/heldout/` from requirement text (CIS AWS Foundations Benchmark and AWS documentation), without tool rule lists or tool output. At least 20 pairs. The builders do not read it before the value run. Its hash goes in docs/evidence/heldout.sha256. This is planted data, not field evidence, and we say so.

Domain validity: every file passes `terraform validate`, and a teammate reviews five random faults.

## Ablation

Remove the clean twin and count any finding on the faulty resource as a detection. Prediction: scores inflate, because tools also report unrelated findings on that resource, so the blind spot shrinks for a reason that has nothing to do with the planted fault.

## Sensitivity

The matching rule is an assumption. Report the headline under strict matching (rule ID and resource address) and loose matching (resource address only).

## Number provenance

| Number | Tag |
|---|---|
| Faults planted, per-tool detected, silent and error counts | counted |
| Findings on the clean twin | counted |
| Findings per tool on TerraGoat | counted |
| Tool versions and run time | counted |
| Control IDs on a fault | sourced(catalog or benchmark named on the case) |
| Live scan result | counted from the viewer's input |
| Per-tool timeout | assumption, shown on screen |

No composite score and no league table.

## Forbidden claims

"Differs from", test counts, latency, "AI-powered", "best tool overall", "this tool is bad", any detection rate presented as true for real-world code, and anything implying compliance or certification.

## Performance budget

- Stored benchmark result on first screen: under 500 ms, because judges should see the result immediately.
- Live scan: target under 15 s from cold, because a judge is standing there waiting. Measured at the skeleton. If it fails, reduce the live tool set and say so.
