// Adapter contract: { id, name, license, version(), scan(dir) -> Finding[] }
import { run, parseJson } from './_run.js';

export function parse(json) {
  const findings = [];
  for (const result of json.Results ?? []) {
    for (const m of result.Misconfigurations ?? []) {
      if (m.Status !== 'FAIL') continue;
      findings.push({
        toolId: 'trivy',
        ruleId: m.ID,
        resource: m.CauseMetadata?.Resource ?? '',
        severity: m.Severity ?? null,
        message: m.Message ?? m.Title ?? '',
        line: m.CauseMetadata?.StartLine ?? 0,
      });
    }
  }
  return findings;
}

export default {
  id: 'trivy',
  name: 'Trivy',
  license: 'Apache-2.0',
  async version() {
    const { stdout } = await run('trivy', ['--version']);
    return stdout.match(/Version:\s*(\S+)/)?.[1] ?? null;
  },
  async scan(dir) {
    const { stdout, code } = await run(
      'trivy',
      ['config', '--skip-check-update', '--format', 'json', dir],
      { sandbox: true },
    );
    if (!stdout.trim()) throw new Error(`trivy produced no output (exit ${code})`);
    return parse(parseJson('trivy', stdout));
  },
};
