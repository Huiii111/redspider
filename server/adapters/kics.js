import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { run, parseJson } from './run.js';

export function parse(json) {
  return (json.queries ?? []).flatMap((q) =>
    (q.files ?? []).map((f) => ({
      toolId: 'kics',
      ruleId: q.query_id,
      resource: f.resource_type && f.resource_name ? `${f.resource_type}.${f.resource_name}` : '',
      severity: q.severity ?? null,
      message: q.query_name ?? '',
      line: f.line ?? 0,
    })),
  );
}

export default {
  id: 'kics',
  name: 'KICS',
  license: 'Apache-2.0',
  async version() {
    const { stdout } = await run('kics', ['version']);
    return stdout.match(/\d+\.\d+\.\d+/)?.[0] ?? null;
  },
  async scan(dir) {
    const out = await mkdtemp(path.join(tmpdir(), 'kics-out-'));
    try {
      // Exit codes 20-60 mean "found issues"; only a missing report is an error.
      const { code } = await run(
        'kics',
        ['scan', '-p', dir, '-o', out, '--report-formats', 'json', '--no-progress'],
        { sandbox: true },
      );
      let text;
      try {
        text = await readFile(path.join(out, 'results.json'), 'utf8');
      } catch {
        throw new Error(`kics wrote no report (exit ${code})`);
      }
      return parse(parseJson('kics', text));
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  },
};
