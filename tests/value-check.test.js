import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runValueCheck } from '../server/core/valueCheck.js';
import { syntaxError } from '../server/core/terraform.js';

const f = (toolId, ruleId, resource) => ({ toolId, ruleId, resource, severity: null, message: '', line: 1 });
const ok = (...findings) => ({ ok: true, findings });

// One case where tool a (the heuristic pick) misses and b catches.
function missedByA(id, { aCleanNoise = false } = {}) {
  return {
    id,
    resource: `aws_x.${id}`,
    runs: {
      a: { clean: ok(...(aCleanNoise ? [f('a', 'NOISE', `aws_x.${id}`)] : [])), faulty: ok(...(aCleanNoise ? [f('a', 'NOISE', `aws_x.${id}`)] : [])) },
      b: { clean: ok(), faulty: ok(f('b', 'R', `aws_x.${id}`)) },
    },
  };
}
function caughtByBoth(id) {
  return { id, resource: `aws_x.${id}`, runs: { a: { clean: ok(), faulty: ok(f('a', 'R', `aws_x.${id}`)) }, b: { clean: ok(), faulty: ok(f('b', 'R', `aws_x.${id}`)) } } };
}
const check = (raw) => runValueCheck({ raw, toolIds: ['a', 'b'], heuristicToolId: 'a' });

test('VALUE_PROVEN: blind spot of at least 20% and at least 3 decision changes', () => {
  const raw = [...[1, 2, 3, 4].map((i) => missedByA(`m${i}`)), ...Array.from({ length: 16 }, (_, i) => caughtByBoth(`c${i}`))];
  const r = check(raw);
  assert.equal(r.verdict, 'VALUE_PROVEN');
  assert.equal(r.strict.blindSpot, 0.2);
  assert.equal(r.strict.decisionChanges, 4);
  assert.deepEqual(r.warnings, []);
});

test('VALUE_REFUTED: fewer than 3 decision changes (kill criterion)', () => {
  const raw = [missedByA('m1'), missedByA('m2'), ...Array.from({ length: 3 }, (_, i) => caughtByBoth(`c${i}`))];
  assert.equal(check(raw).verdict, 'VALUE_REFUTED');
});

test('VALUE_UNPROVEN: between the kill line and the proven line', () => {
  // 3 of 20 = 15%: above the 10% kill line, below the 20% proven line.
  const raw = [...[1, 2, 3].map((i) => missedByA(`m${i}`)), ...Array.from({ length: 17 }, (_, i) => caughtByBoth(`c${i}`))];
  assert.equal(check(raw).verdict, 'VALUE_UNPROVEN');
});

test('ablation: findings already on the resource inflate scores when the clean twin is removed', () => {
  const raw = [...[1, 2, 3, 4].map((i) => missedByA(`m${i}`, { aCleanNoise: true })), ...Array.from({ length: 16 }, (_, i) => caughtByBoth(`c${i}`))];
  const r = check(raw);
  assert.equal(r.strict.blindSpot, 0.2);
  assert.equal(r.ablation.blindSpot, 0);
  assert.equal(r.ablation.predictionHeld, true);
});

test('ablation is skipped, not guessed, when cases have no resource', () => {
  const raw = [{ ...caughtByBoth('c1'), resource: null }];
  const r = check(raw);
  assert.equal(r.ablation.skipped, true);
  assert.match(r.ablation.reason, /c1/);
});

test('warns on a small corpus and on heuristic-tool errors', () => {
  const raw = [{ id: 'e', resource: 'aws_x.e', runs: { a: { clean: { ok: false, error: 'x' }, faulty: ok() }, b: { clean: ok(), faulty: ok() } } }];
  const { warnings } = check(raw);
  assert.ok(warnings.some((w) => /at least 20/.test(w)));
  assert.ok(warnings.some((w) => /errored on 1/.test(w)));
});

test('syntax check accepts valid Terraform and names the line of an error', async () => {
  assert.equal(await syntaxError('resource "aws_s3_bucket" "b" {\n  bucket = "x"\n}\n'), null);
  assert.equal(await syntaxError(''), null);
  assert.match(await syntaxError('resource "aws_s3_bucket" "b" {\n  bucket = \n}\n'), /^Line 2: /);
  assert.match(await syntaxError('resource "a" "b" {'), /Unclosed configuration block/);
});
