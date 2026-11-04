// Adapter parsers against real tool output saved by John (trivy.json, checkov.json, kics.json,
// terrascan.json) and Anton (*-s3.json, *-broken.json, *-no-*.json).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Finding } from '../server/core/models.js';
import { config } from '../server/config.js';
import { loadAdapters } from '../server/core/registry.js';
import { ToolError, run } from '../server/adapters/_run.js';
import { parse as trivy } from '../server/adapters/trivy.js';
import { parse as checkov } from '../server/adapters/checkov.js';
import { parse as kics, resourceAddress } from '../server/adapters/kics.js';
import { parse as terrascan } from '../server/adapters/disabled/terrascan.js';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/tools/${name}.json`, import.meta.url)));
const ADDRESS = /^[a-z0-9_]+\.[A-Za-z0-9_-]+(\[[^\]]+\])?$/;

const withFindings = [
  ['trivy', trivy, 'trivy'], ['trivy', trivy, 'trivy-s3'],
  ['checkov', checkov, 'checkov'], ['checkov', checkov, 'checkov-s3'],
  ['kics', kics, 'kics'], ['kics', kics, 'kics-s3'],
  ['terrascan', terrascan, 'terrascan'],
];

for (const [id, parse, name] of withFindings) {
  test(`${name}.json parses to valid findings with Terraform addresses`, () => {
    const findings = parse(fixture(name));
    assert.ok(findings.length > 0);
    for (const f of findings) {
      assert.equal(f.toolId, id);
      Finding.parse(f);
      // KICS reports some account-level checks (e.g. "IAM Access Analyzer Not Enabled") with no resource.
      if (f.resource === '' && id === 'kics') continue;
      assert.match(f.resource, ADDRESS, `${name}: "${f.resource}" is not a Terraform address`);
    }
  });
}

test('KICS addresses come from search_key, not resource_name (which is often the bucket name or n/a)', () => {
  const resources = new Set(kics(fixture('kics')).map((f) => f.resource));
  assert.ok(resources.has('aws_s3_bucket.data'));
  assert.ok(!resources.has('aws_s3_bucket.example-data-bucket'), 'bucket name attribute leaked into the address');
  for (const r of resources) assert.ok(!r.includes('n/a') && !r.includes('${'), r);
  assert.equal(resourceAddress('aws_s3_bucket[{{data}}]'), 'aws_s3_bucket.data');
  assert.equal(resourceAddress('aws_s3_bucket_public_access_block[data].block_public_acls'), 'aws_s3_bucket_public_access_block.data');
  assert.equal(resourceAddress('resource'), '');
});

test('Trivy keeps the resource address and line', () => {
  const f = trivy(fixture('trivy')).find((x) => x.ruleId === 'AWS-0086');
  assert.equal(f.resource, 'aws_s3_bucket_public_access_block.data');
  assert.equal(f.line, 7);
});

test('Trivy skips checks that passed', () => {
  const json = { Results: [{ Misconfigurations: [
    { ID: 'A', Status: 'PASS', CauseMetadata: { Resource: 'x.y' } },
    { ID: 'B', Status: 'FAIL', CauseMetadata: { Resource: 'x.y' } },
  ] }] };
  assert.deepEqual(trivy(json).map((f) => f.ruleId), ['B']);
});

test('a parse failure is an error, never an empty result that grades as SILENT', () => {
  assert.throws(() => checkov(fixture('checkov-broken')), ToolError);
  assert.throws(() => kics(fixture('kics-broken')), ToolError);
});

test('clean files parse to no findings', () => {
  assert.deepEqual(trivy(fixture('trivy-no-findings')), []);
  assert.deepEqual(checkov(fixture('checkov-no-resources')), []);
  assert.deepEqual(kics(fixture('kics-no-findings')), []);
  for (const parse of [trivy, checkov, kics, terrascan]) assert.deepEqual(parse({}), []);
});

test('the registry loads trivy, checkov and kics, and skips helpers and disabled adapters', async () => {
  const ids = (await loadAdapters(config.adaptersDir)).map((a) => a.id);
  assert.deepEqual(ids, ['checkov', 'kics', 'trivy']);
});

test('runner: never runs a scanner unsandboxed by accident', { skip: process.platform === 'darwin' || config.allowUnsandboxed }, async () => {
  await assert.rejects(run('trivy', ['--version'], { sandbox: true }), /no network sandbox/);
});

test('runner: kills a process that outlives its timeout', async () => {
  const started = Date.now();
  await assert.rejects(run(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { timeoutMs: 500 }), /timed out/);
  assert.ok(Date.now() - started < 5000);
});

test('runner: a non-zero exit still resolves, because scanners exit non-zero when they find something', async () => {
  const r = await run(process.execPath, ['-e', 'process.stdout.write("{}"); process.exit(1)']);
  assert.equal(r.code, 1);
  assert.equal(r.stdout, '{}');
});

test('runner: a missing program is reported as not installed', async () => {
  await assert.rejects(run('definitely-not-a-scanner-xyz', []), /not installed/);
});
