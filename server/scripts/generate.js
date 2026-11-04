// npm run generate [-- --seed 7 --count 26 --out tests/generated]
// Writes messy planted pairs for demos and stress testing. Never writes to tests/heldout/.
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { config } from '../config.js';
import { generate, ALL_FAULTS } from '../generator/index.js';

const { values: args } = parseArgs({
  options: {
    seed: { type: 'string', default: '1' },
    count: { type: 'string', default: String(ALL_FAULTS.length) },
    out: { type: 'string', default: 'tests/generated' },
  },
});

const seed = Number.parseInt(args.seed, 10);
const count = Number.parseInt(args.count, 10);
if (!Number.isInteger(seed) || !Number.isInteger(count) || count < 1) {
  console.error('generate: --seed and --count must be integers, and --count at least 1');
  process.exit(1);
}
const outDir = path.resolve(config.root, args.out);
const heldout = path.resolve(config.root, 'tests/heldout');
if (outDir === heldout || outDir.startsWith(heldout + path.sep)) {
  console.error('generate: refusing to write into tests/heldout/. That set is written separately and must stay unseen.');
  process.exit(1);
}

// Only clear a directory this script created before.
const MARKER = '.generated-by-npm-run-generate';
try {
  await fs.access(path.join(outDir, MARKER));
  await fs.rm(outDir, { recursive: true, force: true });
} catch {
  const existing = await fs.readdir(outDir).catch(() => []);
  if (existing.length) {
    console.error(`generate: ${outDir} exists and wasn't made by this script. Pick another --out.`);
    process.exit(1);
  }
}

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, MARKER), 'Safe to delete. Regenerate with npm run generate.\n');
const cases = generate({ seed, count });
for (const c of cases) {
  const dir = path.join(outDir, c.id);
  await fs.mkdir(dir);
  const meta = { id: c.id, title: c.title, requirement: c.requirement, resource: c.resource, change: c.change, generator: c.generator };
  await fs.writeFile(path.join(dir, 'case.json'), `${JSON.stringify(meta, null, 2)}\n`);
  await fs.writeFile(path.join(dir, 'clean.tf'), c.clean);
  await fs.writeFile(path.join(dir, 'faulty.tf'), c.faulty);
}
console.log(`Wrote ${cases.length} pairs (seed ${seed}) to ${path.relative(config.root, outDir)}`);
