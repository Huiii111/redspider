// npm run value-check [-- --run FILE]
// Applies the pre-registered value check (docs/prereg.md) to a stored benchmark run.
// Writes evidence to docs/evidence/ only when the run used the held-out set.
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { config } from '../config.js';
import { readStoredRun } from '../core/store.js';
import { runValueCheck } from '../core/valueCheck.js';

const { values: args } = parseArgs({ options: { run: { type: 'string' } } });
const runFile = args.run ? path.resolve(args.run) : config.resultsFile;

const run = await readStoredRun(runFile);
if (!run) {
  console.error(`value-check: no stored run at ${runFile}. Run npm run benchmark first.`);
  process.exit(1);
}

const report = runValueCheck({
  raw: run.raw,
  toolIds: run.tools.map((t) => t.id),
  heuristicToolId: run.heuristic.toolId,
});
const pct = (x) => `${(x * 100).toFixed(1)}%`;

console.log(`Run ${run.runId}, ${report.cases} cases from ${run.corpus.source}`);
console.log(`Heuristic tool: ${run.heuristic.toolId}\n`);
console.log(` matching    blind spot   missed   decision changes`);
console.log(` strict      ${pct(report.strict.blindSpot).padStart(10)}   ${String(report.strict.missed).padStart(6)}   ${String(report.strict.decisionChanges).padStart(16)}`);
console.log(` loose       ${pct(report.sensitivity.loose.blindSpot).padStart(10)}   ${String(report.sensitivity.loose.missed).padStart(6)}   ${String(report.sensitivity.loose.decisionChanges).padStart(16)}`);
if (report.ablation.skipped) console.log(` ablation    skipped: ${report.ablation.reason}`);
else console.log(` ablation    ${pct(report.ablation.blindSpot).padStart(10)}   ${String(report.ablation.missed).padStart(6)}   ${String(report.ablation.decisionChanges).padStart(16)}   prediction ${report.ablation.predictionHeld ? 'held' : 'did NOT hold'}`);
console.log(`\nVerdict: ${report.verdict}`);
for (const w of report.warnings) console.warn(`Warning: ${w}`);

const isHeldOut = path.resolve(config.root, run.corpus.source) === path.resolve(config.root, 'tests/heldout');
if (!isHeldOut) {
  console.log(`\nNot written to ${path.relative(config.root, config.evidenceDir)}/: this run used ${run.corpus.source}, not tests/heldout, so it is not evidence.`);
  process.exit(0);
}

const valueDir = path.join(config.evidenceDir, 'value');
await fs.mkdir(valueDir, { recursive: true });
await fs.writeFile(path.join(valueDir, 'report.json'), `${JSON.stringify({ runId: run.runId, ranAt: run.ranAt, heuristic: run.heuristic, tools: run.tools, provenance: run.provenance, ...report }, null, 2)}\n`);
await fs.writeFile(path.join(config.evidenceDir, 'value-verdict.txt'), `${report.verdict}\n${JSON.stringify(report.strict)}\n`);
await fs.writeFile(path.join(config.evidenceDir, 'heldout.sha256'), `${run.provenance.corpusSha256}  tests/heldout\n`);
console.log(`\nWrote ${path.relative(config.root, config.evidenceDir)}/value/report.json, value-verdict.txt and heldout.sha256`);
