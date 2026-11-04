import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradePair, summarise, toScanStatus, LOOSE } from '../server/core/grade.js';

const f = (ruleId, resource, line = 1) => ({ toolId: 't', ruleId, resource, severity: null, message: 'm', line });
const ok = (...findings) => ({ ok: true, findings });

test('new (rule, resource) on the faulty twin is DETECTED', () => {
  const g = gradePair(ok(f('A', 'x.y')), ok(f('A', 'x.y'), f('B', 'x.y')));
  assert.equal(g.status, 'DETECTED');
  assert.deepEqual(g.newFindings.map((x) => x.ruleId), ['B']);
  assert.equal(g.cleanFindingCount, 1);
});

test('same rule on a different resource counts as new', () => {
  assert.equal(gradePair(ok(f('A', 'x.one')), ok(f('A', 'x.one'), f('A', 'x.two'))).status, 'DETECTED');
});

test('loose matching: a new rule on an already-reported resource is SILENT', () => {
  const clean = ok(f('A', 'x.y'));
  const faulty = ok(f('A', 'x.y'), f('B', 'x.y'));
  assert.equal(gradePair(clean, faulty).status, 'DETECTED');
  assert.equal(gradePair(clean, faulty, { match: LOOSE }).status, 'SILENT');
});

test('shifted line numbers alone are SILENT', () => {
  assert.equal(gradePair(ok(f('A', 'x.y', 3)), ok(f('A', 'x.y', 9))).status, 'SILENT');
});

test('a finding that disappears is not a detection', () => {
  assert.equal(gradePair(ok(f('A', 'x.y')), ok()).status, 'SILENT');
});

test('duplicate new findings are reported once', () => {
  assert.equal(gradePair(ok(), ok(f('B', 'x.y', 1), f('B', 'x.y', 2))).newFindings.length, 1);
});

test('a failed run on either side is ERROR, never SILENT', () => {
  assert.equal(gradePair({ ok: false, error: 'boom' }, ok()).status, 'ERROR');
  const g = gradePair(ok(), { ok: false, error: 'timed out' }, { labels: ['before', 'after'] });
  assert.equal(g.status, 'ERROR');
  assert.equal(g.errorMessage, 'after: timed out');
});

test('live scan says NOTICED where the benchmark says DETECTED', () => {
  assert.equal(toScanStatus('DETECTED'), 'NOTICED');
  assert.equal(toScanStatus('SILENT'), 'SILENT');
  assert.equal(toScanStatus('ERROR'), 'ERROR');
});

test('summarise picks the noisiest TerraGoat tool and counts what others caught', () => {
  const tools = [
    { id: 'a', name: 'A', version: '1', license: 'MIT', terragoatFindings: 10 },
    { id: 'b', name: 'B', version: '1', license: 'MIT', terragoatFindings: 90 },
  ];
  const req = { source: 's', ref: 'r', text: 't' };
  const cases = [
    { id: 'c1', title: 'one', requirement: req, results: [{ toolId: 'a', status: 'DETECTED' }, { toolId: 'b', status: 'SILENT' }] },
    { id: 'c2', title: 'two', requirement: req, results: [{ toolId: 'a', status: 'SILENT' }, { toolId: 'b', status: 'SILENT' }] },
    { id: 'c3', title: 'three', requirement: req, results: [{ toolId: 'a', status: 'ERROR' }, { toolId: 'b', status: 'DETECTED' }] },
  ];
  const s = summarise(tools, cases);
  assert.deepEqual(s.heuristic, { rule: 'Tool with the most findings on TerraGoat', toolId: 'b', missed: 2, caughtByAnotherTool: 1 });
  assert.deepEqual(s.tools.find((t) => t.id === 'a'), { id: 'a', name: 'A', version: '1', license: 'MIT', terragoatFindings: 10, detected: 1, silent: 1, error: 1 });
  assert.deepEqual(s.faults[0], { id: 'c1', title: 'one', requirement: { source: 's', ref: 'r' }, results: { a: 'DETECTED', b: 'SILENT' } });
  assert.deepEqual(s.ties, ['b']);
});
