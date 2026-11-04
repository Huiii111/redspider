import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Finding } from '../server/core/models.js';
import { parse as trivy } from '../server/adapters/trivy.js';
import { parse as checkov } from '../server/adapters/checkov.js';
import { parse as kics } from '../server/adapters/kics.js';
import { parse as terrascan } from '../server/adapters/terrascan.js';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url)));

const cases = { trivy, checkov, kics, terrascan };

for (const [id, parse] of Object.entries(cases)) {
  test(`${id}: fixture parses to valid findings`, () => {
    const findings = parse(fixture(id));
    assert.ok(findings.length > 0);
    for (const f of findings) {
      assert.equal(f.toolId, id);
      Finding.parse(f);
    }
  });
}

test('trivy: public access block finding keeps resource address', () => {
  const f = trivy(fixture('trivy')).find((x) => x.ruleId === 'AWS-0086');
  assert.equal(f.resource, 'aws_s3_bucket_public_access_block.data');
  assert.equal(f.line, 7);
});

test('empty output parses to no findings', () => {
  for (const parse of Object.values(cases)) assert.deepEqual(parse({}), []);
});
