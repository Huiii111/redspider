// End to end: generate a corpus, run the benchmark script with the fake adapter, check the stored run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readStoredRun } from '../server/core/store.js';
import { config } from '../server/config.js';

const run = promisify(execFile);
const env = { ...process.env, ADAPTERS_DIR: 'tests/fake-adapters', TERRAGOAT_DIR: '' };

test('npm run benchmark produces a valid stored run from a generated corpus', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sbs-bench-'));
  try {
    const corpus = path.join(tmp, 'corpus');
    const goat = path.join(tmp, 'terragoat');
    const out = path.join(tmp, 'benchmark.json');
    await fs.mkdir(goat);
    await fs.writeFile(path.join(goat, 'main.tf'), 'resource "aws_ebs_volume" "v" {\n  encrypted = false\n}\n');
    await run(process.execPath, ['server/scripts/generate.js', '--seed', '3', '--out', corpus], { cwd: config.root, env });
    const { stdout } = await run(process.execPath, ['server/scripts/benchmark.js', '--corpus', corpus, '--terragoat', goat, '--out', out], { cwd: config.root, env });
    assert.match(stdout, /Heuristic pick: fake/);

    const stored = await readStoredRun(out); // throws if it doesn't match the schema
    assert.equal(stored.corpus.faultCount, stored.faults.length);
    const t = stored.tools[0];
    assert.equal(t.terragoatFindings, 1);
    assert.equal(t.detected + t.silent + t.error, stored.faults.length);
    assert.equal(t.error, 0);
    assert.ok(t.detected > 0, 'fake adapter should catch some literal faults');
    assert.ok(t.silent > 0, 'fake adapter should miss some faults');
    for (const f of stored.faults) assert.ok(stored.cases[f.id], `case detail for ${f.id}`);
    assert.equal(stored.raw.length, stored.faults.length);
    assert.ok(stored.raw.every((c) => c.resource), 'generated cases carry their resource address');
    assert.match(stored.provenance.corpusSha256, /^[0-9a-f]{64}$/);

    const check = await run(process.execPath, ['server/scripts/value-check.js', '--run', out], { cwd: config.root, env });
    assert.match(check.stdout, /Verdict: VALUE_(PROVEN|UNPROVEN|REFUTED)/);
    assert.match(check.stdout, /ablation +\d/);
    assert.match(check.stdout, /not evidence/, 'a generated corpus must never be written as evidence');
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('benchmark stops on a case that is not valid Terraform', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sbs-bad-'));
  try {
    const c = path.join(tmp, 'corpus', 'broken-1');
    await fs.mkdir(c, { recursive: true });
    await fs.writeFile(path.join(c, 'case.json'), JSON.stringify({ id: 'broken-1', title: 't', requirement: { source: 's', ref: 'r', text: 't' } }));
    await fs.writeFile(path.join(c, 'clean.tf'), 'resource "a" "b" {}\n');
    await fs.writeFile(path.join(c, 'faulty.tf'), 'resource "a" "b" {\n');
    await assert.rejects(
      run(process.execPath, ['server/scripts/benchmark.js', '--corpus', path.join(tmp, 'corpus'), '--terragoat', tmp, '--out', path.join(tmp, 'o.json')], { cwd: config.root, env }),
      (err) => /broken-1\/faulty\.tf is not valid Terraform/.test(err.stderr),
    );
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test('benchmark refuses to run without a TerraGoat path', async () => {
  await assert.rejects(
    run(process.execPath, ['server/scripts/benchmark.js', '--corpus', 'tests/generated', '--out', path.join(os.tmpdir(), 'sbs-never.json')], { cwd: config.root, env }),
    (err) => /TerraGoat path not set/.test(err.stderr),
  );
});

test('generate refuses to write into tests/heldout', async () => {
  await assert.rejects(
    run(process.execPath, ['server/scripts/generate.js', '--out', 'tests/heldout'], { cwd: config.root }),
    (err) => /refusing to write into tests\/heldout/.test(err.stderr),
  );
});
