// npm run benchmark [-- --corpus DIR --terragoat DIR --out FILE]
// Runs every tool on every planted pair and writes results/benchmark.json.
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { config } from '../config.js';
import { loadAdapters } from '../core/registry.js';
import { probeTool, runTool } from '../core/runner.js';
import { withTerraformDir } from '../core/workspace.js';
import { readCorpus } from '../core/corpus.js';
import { gradePair, summarise } from '../core/grade.js';
import { writeStoredRun } from '../core/store.js';

const { values: args } = parseArgs({
  options: {
    corpus: { type: 'string' },
    terragoat: { type: 'string' },
    out: { type: 'string' },
  },
});

const corpusDir = args.corpus ? path.resolve(args.corpus) : config.corpusDir;
const terragoatDir = args.terragoat ? path.resolve(args.terragoat) : config.terragoatDir;
const outFile = args.out ? path.resolve(args.out) : config.resultsFile;
const timeoutMs = config.toolTimeoutSeconds * 1000;
const rel = (p) => path.relative(config.root, p).replaceAll('\\', '/') || '.';

function fail(msg) {
  console.error(`\nbenchmark: ${msg}`);
  process.exit(1);
}

// 1. Tools. A missing tool would turn a whole column into ERROR, so stop instead.
const adapters = await loadAdapters(config.adaptersDir);
if (adapters.length === 0) fail(`no adapters in ${rel(config.adaptersDir)}`);
const probes = await Promise.all(adapters.map(probeTool));
const missing = probes.filter((p) => !p.available);
if (missing.length) fail(`tools not available: ${missing.map((p) => `${p.id} (${p.reason})`).join(', ')}. Install them or remove their adapter.`);
console.log(`Tools: ${probes.map((p) => `${p.id} ${p.version}`).join(', ')}`);

// 2. Corpus.
let cases;
try {
  cases = await readCorpus(corpusDir);
} catch (err) {
  fail(err.message);
}
console.log(`Corpus: ${cases.length} planted pairs from ${rel(corpusDir)}`);

// 3. TerraGoat finding counts, for the "pick the noisiest tool" heuristic.
if (!terragoatDir) fail('TerraGoat path not set. Clone https://github.com/bridgecrewio/terragoat and pass --terragoat <dir>/terraform/aws (or set TERRAGOAT_DIR).');
console.log(`TerraGoat: scanning ${terragoatDir}`);
const terragoat = await Promise.all(adapters.map((a) => runTool(a, terragoatDir, timeoutMs * 5)));
const tgFailed = terragoat.map((r, i) => [adapters[i].id, r]).filter(([, r]) => !r.ok);
if (tgFailed.length) fail(`TerraGoat scan failed for ${tgFailed.map(([id, r]) => `${id}: ${r.error}`).join('; ')}`);

// 4. Every tool on every pair. Tools run in parallel within a case.
const details = {};
for (const [n, c] of cases.entries()) {
  const results = await Promise.all(adapters.map(async (a) => {
    const [cleanRun, faultyRun] = await Promise.all([
      withTerraformDir(c.clean, (dir) => runTool(a, dir, timeoutMs)),
      withTerraformDir(c.faulty, (dir) => runTool(a, dir, timeoutMs)),
    ]);
    const g = gradePair(cleanRun, faultyRun);
    return { toolId: a.id, ...g };
  }));
  details[c.id] = { id: c.id, title: c.title, requirement: c.requirement, clean: c.clean, faulty: c.faulty, results };
  const line = results.map((r) => `${r.toolId}=${r.status}`).join(' ');
  console.log(`  [${String(n + 1).padStart(String(cases.length).length)}/${cases.length}] ${c.id}: ${line}`);
}

// 5. Summarise and store.
const tools = adapters.map((a, i) => ({
  id: a.id, name: a.name, license: a.license, version: probes[i].version,
  terragoatFindings: terragoat[i].findings.length,
}));
const summary = summarise(tools, Object.values(details));
const ranAt = new Date().toISOString();
const run = {
  runId: `${ranAt.slice(0, 19).replace(/[-:T]/g, '')}-${randomUUID().slice(0, 8)}`,
  ranAt,
  corpus: { source: rel(corpusDir), planted: true, faultCount: cases.length },
  heuristic: summary.heuristic,
  tools: summary.tools,
  faults: summary.faults,
  cases: details,
};
await writeStoredRun(outFile, run);

console.log('\n tool         TerraGoat  detected  silent  error');
for (const t of summary.tools) {
  console.log(` ${t.id.padEnd(12)} ${String(t.terragoatFindings).padStart(9)} ${String(t.detected).padStart(9)} ${String(t.silent).padStart(7)} ${String(t.error).padStart(6)}`);
}
const h = summary.heuristic;
console.log(`\nHeuristic pick: ${h.toolId}. It missed ${h.missed} of ${cases.length} faults; another tool caught ${h.caughtByAnotherTool} of those.`);
if (summary.ties.length > 1) console.warn(`Warning: TerraGoat tie between ${summary.ties.join(', ')}; picked ${h.toolId} (first in id order).`);
const errors = summary.tools.reduce((s, t) => s + t.error, 0);
if (errors) console.warn(`Warning: ${errors} ERROR results. Check the adapters before treating this run as evidence.`);
console.log(`Wrote ${rel(outFile)} (run ${run.runId})`);
