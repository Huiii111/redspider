import { run, parseJson } from './run.js';

export function parse(json) {
  const reports = Array.isArray(json) ? json : [json];
  return reports.flatMap((r) =>
    (r.results?.failed_checks ?? []).map((c) => ({
      toolId: 'checkov',
      ruleId: c.check_id,
      resource: c.resource ?? '',
      severity: c.severity ?? null,
      message: c.check_name ?? '',
      line: c.file_line_range?.[0] ?? 0,
    })),
  );
}

export default {
  id: 'checkov',
  name: 'Checkov',
  license: 'Apache-2.0',
  async version() {
    const { stdout } = await run('checkov', ['--version']);
    return stdout.match(/\d+\.\d+\.\d+/)?.[0] ?? null;
  },
  async scan(dir) {
    // Remote module download is off by default; stated explicitly anyway.
    const { stdout, code } = await run(
      'checkov',
      ['-d', dir, '-o', 'json', '--framework', 'terraform', '--download-external-modules', 'false'],
      { sandbox: true },
    );
    if (!stdout.trim()) throw new Error(`checkov produced no output (exit ${code})`);
    return parse(parseJson('checkov', stdout));
  },
};
