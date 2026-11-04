// KICS adapter. Resource address and parse checks from Anton; separate output dir from John.
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { config } from '../config.js';
import { run, parseToolJson, versionFrom, ToolError } from './_run.js';

const ID = 'kics';
const REPORT_NAME = 'kics';
// search_key looks like "aws_s3_bucket[data].acl" or "aws_s3_bucket[{{data}}]".
// resource_name is NOT the Terraform name: it is often the bucket's name attribute or "n/a".
const SEARCH_KEY = /^([\w-]+)\[(?:\{\{)?(.+?)(?:\}\})?\]/;

export function resourceAddress(searchKey = '') {
  const m = searchKey.match(SEARCH_KEY);
  return m ? `${m[1]}.${m[2]}` : '';
}

export function parse(json) {
  if (json.files_parsed < json.files_scanned || json.queries_failed_to_execute > 0) {
    throw new ToolError('KICS could not parse this Terraform');
  }
  return (json.queries ?? []).flatMap((q) =>
    (q.files ?? []).map((f) => ({
      toolId: ID,
      ruleId: q.query_id,
      resource: resourceAddress(f.search_key),
      severity: q.severity ?? null,
      message: q.query_name ?? '',
      line: f.line ?? null,
    })),
  );
}

export default {
  id: ID,
  name: 'KICS',
  license: 'Apache-2.0',
  async version() {
    const { stdout } = await run(config.bins.kics, ['version']);
    return versionFrom('KICS', stdout);
  },
  async scan(dir, { timeoutMs } = {}) {
    // Output goes outside the input dir, so the scanner never sees its own report.
    const out = await mkdtemp(path.join(os.tmpdir(), 'sbs-kics-out-'));
    try {
      // KICS exits 20 to 60 when it finds something; only a missing report is a failure.
      const { code } = await run(config.bins.kics, [
        'scan', '-p', dir, '-o', out, '--output-name', REPORT_NAME, '--report-formats', 'json',
        '--no-progress', '--type', 'Terraform',
        ...(config.kicsQueriesPath ? ['-q', config.kicsQueriesPath] : []),
      ], { sandbox: true, timeoutMs });
      let text;
      try {
        text = await readFile(path.join(out, `${REPORT_NAME}.json`), 'utf8');
      } catch {
        throw new ToolError(`KICS finished without writing a report (exit ${code})`);
      }
      return parse(parseToolJson('KICS', text));
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  },
};
