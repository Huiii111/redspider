import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server/app.js';
import { config as baseConfig } from '../server/config.js';
import { writeStoredRun } from '../server/core/store.js';

// Test adapters, injected directly.
const finding = (toolId, ruleId, resource) => ({ toolId, ruleId, resource, severity: 'HIGH', message: 'm', line: 1 });
const seesWorld = {
  id: 'sees', name: 'Sees', license: 'MIT', version: async () => '1.0',
  scan: async (dir) => {
    const text = await fs.readFile(path.join(dir, 'main.tf'), 'utf8');
    return text.includes('0.0.0.0/0') ? [finding('sees', 'OPEN', 'aws_security_group.sg')] : [];
  },
};
const blind = { id: 'blind', name: 'Blind', license: 'MIT', version: async () => '2.0', scan: async () => [] };
const crashes = { id: 'crash', name: 'Crash', license: 'MIT', version: async () => { throw new Error('not installed'); }, scan: async () => { throw new Error('exit 2: no output'); } };
const garbage = { id: 'garbage', name: 'Garbage', license: 'MIT', version: async () => '1', scan: async () => [{ nope: true }] };
const hangs = { id: 'hangs', name: 'Hangs', license: 'MIT', version: async () => '1', scan: () => new Promise(() => {}) };
const seenDirs = [];
const spy = { id: 'spy', name: 'Spy', license: 'MIT', version: async () => '1', scan: async (dir) => { seenDirs.push(dir); return []; } };

let tmp; let server; let base; let cfg;

before(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'sbs-test-'));
  cfg = { ...baseConfig, resultsFile: path.join(tmp, 'benchmark.json'), toolTimeoutSeconds: 1, maxInputBytes: 1000 };
  const app = createApp({ config: cfg, getAdapters: async () => [seesWorld, blind, crashes, garbage, hangs, spy] });
  await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  server.close();
  await fs.rm(tmp, { recursive: true, force: true });
});

const post = (body, raw = false) => fetch(`${base}/scan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: raw ? body : JSON.stringify(body) });

test('health lists every tool and whether it is available', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  const { tools } = await res.json();
  assert.deepEqual(tools.find((t) => t.id === 'sees'), { id: 'sees', name: 'Sees', available: true, version: '1.0' });
  const c = tools.find((t) => t.id === 'crash');
  assert.equal(c.available, false);
  assert.equal(c.version, null);
});

test('benchmark and cases return 503 NO_RUN before any run, never sample data', async () => {
  for (const url of [`${base}/benchmark`, `${base}/cases/anything`]) {
    const res = await fetch(url);
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error.code, 'NO_RUN');
  }
});

test('scan reports who noticed, and isolates each failing tool', async () => {
  const res = await post({ before: 'resource "aws_security_group" "sg" { cidr = "10.0.0.0/8" }', after: 'resource "aws_security_group" "sg" { cidr = "0.0.0.0/0" }' });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.timeoutSeconds, 1);
  assert.match(body.scanId, /^[0-9a-f-]{36}$/);
  const by = Object.fromEntries(body.results.map((r) => [r.toolId, r]));
  assert.equal(by.sees.status, 'NOTICED');
  assert.equal(by.sees.newFindings[0].ruleId, 'OPEN');
  assert.equal(by.blind.status, 'SILENT');
  assert.equal(by.blind.errorMessage, undefined);
  assert.equal(by.crash.status, 'ERROR');
  assert.match(by.crash.errorMessage, /before: exit 2/);
  assert.equal(by.garbage.status, 'ERROR');
  assert.match(by.garbage.errorMessage, /invalid findings/);
  assert.equal(by.hangs.status, 'ERROR');
  assert.match(by.hangs.errorMessage, /timed out/);
  for (const r of body.results) assert.equal(typeof r.durationMs, 'number');
});

test('scan uses fresh temp dirs and deletes them', async () => {
  seenDirs.length = 0;
  await post({ before: 'a = 1', after: 'a = 2' });
  assert.equal(seenDirs.length, 2);
  assert.notEqual(seenDirs[0], seenDirs[1]);
  for (const d of seenDirs) {
    assert.ok(d.startsWith(os.tmpdir()));
    await assert.rejects(fs.access(d), 'temp dir should be deleted');
  }
});

test('scan input errors use the shared error shape', async () => {
  const cases = [
    [{ after: 'x' }, 400, 'INVALID_INPUT'],
    [{ before: 1, after: 'x' }, 400, 'INVALID_INPUT'],
    [{ before: 'x'.repeat(1001), after: 'x' }, 413, 'INPUT_TOO_LARGE'],
    [{ before: 'x'.repeat(5000), after: 'x' }, 413, 'INPUT_TOO_LARGE'], // rejected by the body parser itself
  ];
  for (const [body, status, code] of cases) {
    const res = await post(body);
    assert.equal(res.status, status, JSON.stringify(body).slice(0, 40));
    const json = await res.json();
    assert.equal(json.error.code, code);
    assert.ok(json.error.message.length > 0);
  }
  const bad = await post('{not json', true);
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error.code, 'INVALID_INPUT');
});

test('stored run: benchmark omits case detail, cases serves it, unknown id is 404', async () => {
  const req = { source: 'NIST SP 800-53 Rev. 5', ref: 'SC-7', text: 'Control the boundary.' };
  await writeStoredRun(cfg.resultsFile, {
    runId: 'r1', ranAt: new Date().toISOString(),
    corpus: { source: 'tests/heldout', planted: true, faultCount: 1 },
    heuristic: { rule: 'Tool with the most findings on TerraGoat', toolId: 'sees', missed: 0, caughtByAnotherTool: 0 },
    tools: [{ id: 'sees', name: 'Sees', version: '1', license: 'MIT', terragoatFindings: 3, detected: 1, silent: 0, error: 0 }],
    faults: [{ id: 'c1', title: 'SSH open', requirement: { source: req.source, ref: req.ref }, results: { sees: 'DETECTED' } }],
    cases: { c1: { id: 'c1', title: 'SSH open', requirement: req, clean: 'a', faulty: 'b', results: [{ toolId: 'sees', status: 'DETECTED', newFindings: [finding('sees', 'OPEN', 'x.y')], cleanFindingCount: 0 }] } },
  });
  const bm = await (await fetch(`${base}/benchmark`)).json();
  assert.equal(bm.runId, 'r1');
  assert.equal(bm.cases, undefined);
  const c = await (await fetch(`${base}/cases/c1`)).json();
  assert.equal(c.requirement.text, 'Control the boundary.');
  assert.equal(c.results[0].newFindings.length, 1);
  for (const id of ['nope', 'constructor', '__proto__']) {
    const res = await fetch(`${base}/cases/${id}`);
    assert.equal(res.status, 404, id);
    assert.equal((await res.json()).error.code, 'CASE_NOT_FOUND');
  }
});
