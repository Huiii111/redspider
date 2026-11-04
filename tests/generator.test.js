import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '@cdktf/hcl2json';
import { generate, ALL_FAULTS } from '../server/generator/index.js';
import { CaseMeta } from '../server/core/models.js';

const SEEDS = [1, 2, 3, 4, 5, 42, 2026];
const all = SEEDS.flatMap((seed) => generate({ seed, count: ALL_FAULTS.length }));

test('covers every fault in the catalogue', () => {
  assert.ok(ALL_FAULTS.length >= 10);
  assert.equal(new Set(generate({ seed: 1 }).map((c) => c.generator.fault)).size, ALL_FAULTS.length);
});

test('same seed gives the same output; different seeds differ', () => {
  assert.deepEqual(generate({ seed: 9, count: 5 }), generate({ seed: 9, count: 5 }));
  assert.notDeepEqual(generate({ seed: 9, count: 5 }).map((c) => c.clean), generate({ seed: 10, count: 5 }).map((c) => c.clean));
});

test('every case has valid metadata and a planted difference', () => {
  for (const c of all) {
    assert.ok(CaseMeta.safeParse(c).success, c.id);
    assert.notEqual(c.clean, c.faulty, c.id);
  }
});

test('every file is valid HCL and declares every var and local it uses', async () => {
  for (const c of all) {
    for (const [side, text] of [['clean', c.clean], ['faulty', c.faulty]]) {
      const where = `${c.id} ${side}`;
      let json;
      try {
        json = await parse('main.tf', text);
      } catch (err) {
        assert.fail(`${where} does not parse: ${err.message}\n${text}`);
      }
      const vars = new Set(Object.keys(json.variable ?? {}));
      const locals = new Set((json.locals ?? []).flatMap((l) => Object.keys(l)));
      for (const [, v] of text.matchAll(/\bvar\.([A-Za-z0-9_]+)/g)) assert.ok(vars.has(v), `${where}: var.${v} not declared`);
      for (const [, l] of text.matchAll(/\blocal\.([A-Za-z0-9_]+)/g)) assert.ok(locals.has(l), `${where}: local.${l} not declared`);
      assert.ok(Object.keys(json.resource ?? {}).length > 0, `${where}: no resources`);
    }
  }
});

test('the faulty twin keeps every resource address of the clean twin, except for omission faults', async () => {
  const addresses = async (text) => {
    const json = await parse('main.tf', text);
    return Object.entries(json.resource ?? {}).flatMap(([type, byName]) => Object.keys(byName).map((n) => `${type}.${n}`)).sort();
  };
  for (const c of all) {
    const clean = await addresses(c.clean);
    const faulty = await addresses(c.faulty);
    if (c.generator.fault === 's3-encryption-removed') assert.equal(faulty.length, clean.length - 1, c.id);
    else assert.deepEqual(faulty, clean, c.id);
  }
});
