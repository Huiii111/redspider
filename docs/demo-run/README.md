# Demo run with real scanners

`benchmark.demo.json` is the first run of this backend with real scanners, on 2026-11-04. It is **not evidence**: it used the 14 generated pairs in `tests/generated/` (`npm run generate`, seed 1), not the held-out set, so `npm run value-check` refuses to write it to `docs/evidence/`.

| | |
|---|---|
| Machine | Windows 11, Node 24, setup as in the README's "On Windows" section |
| Tools | Trivy 0.76.1 and Checkov 3.4.3 unsandboxed; KICS 2.2.0 in Docker with no network |
| TerraGoat | commit 729f8da62c6a85ce4af5ad3d123de97776d954c4, `terraform/aws` |

| Tool | TerraGoat findings | Detected | Silent | Error |
|---|---:|---:|---:|---:|
| Checkov | 215 | 14 | 0 | 0 |
| Trivy | 115 | 12 | 2 | 0 |
| KICS | 153 | 8 | 6 | 0 |

The heuristic picked Checkov, which missed nothing, so the value check on this set was `VALUE_REFUTED`: blind spot 0% under strict matching, 78.6% under loose matching, ablation 7.1%.

Observations to re-check on the held-out set:

- The TerraGoat heuristic favoured Checkov, as `docs/prereg.md` warned (both come from Bridgecrew).
- KICS missed all four faults planted through a `locals` value, and caught the ones set inline or through a variable default.
- Trivy missed the IAM wildcard policy and the plain-HTTP load balancer listener.
- Strict and loose matching give very different headlines, so the pitch must say which rule it uses.

To serve it: `RESULTS_FILE=docs/demo-run/benchmark.demo.json npm run server`.
