// Checkov adapter. Parse-error detection from Anton; list/object handling from John.
import { config } from '../config.js';
import { run, parseToolJson, versionFrom, ToolError } from './_run.js';

const ID = 'checkov';

export function parse(json) {
  // One object per framework, or a list of them. With no resources Checkov prints only a summary.
  const reports = Array.isArray(json) ? json : [json];
  const findings = [];
  for (const report of reports) {
    const summary = report.summary ?? report;
    if (summary.parsing_errors > 0) throw new ToolError('Checkov could not parse this Terraform');
    for (const c of report.results?.failed_checks ?? []) {
      findings.push({
        toolId: ID,
        ruleId: c.check_id,
        resource: c.resource ?? '',
        severity: c.severity ?? null,
        message: c.check_name ?? '',
        line: c.file_line_range?.[0] ?? null,
      });
    }
  }
  return findings;
}

export default {
  id: ID,
  name: 'Checkov',
  license: 'Apache-2.0',
  async version() {
    const { stdout } = await run(config.bins.checkov.file, [...config.bins.checkov.args, '--version']);
    return versionFrom('Checkov', stdout);
  },
  async scan(dir, { timeoutMs } = {}) {
    // Checkov exits 1 when it finds something; the result is decided from the report.
    // cwd is the scanned folder: Checkov computes paths relative to cwd, which crashes on Windows
    // when they're on different drives ("path is on mount 'D:', start on mount 'C:'").
    const { stdout, stderr } = await run(config.bins.checkov.file, [
      ...config.bins.checkov.args,
      '-d', dir, '-o', 'json', '--quiet', '--compact', '--framework', 'terraform',
      '--skip-download', '--download-external-modules', 'false',
    ], { sandbox: true, timeoutMs, cwd: dir });
    return parse(parseToolJson('Checkov', stdout, stderr));
  },
};
