// Trivy adapter. Parser from John (Status filter, defensive reads); flags from Anton (--quiet).
import { config } from '../config.js';
import { run, parseToolJson, versionFrom } from './_run.js';

const ID = 'trivy';

export function parse(json) {
  const findings = [];
  for (const result of json.Results ?? []) {
    for (const m of result.Misconfigurations ?? []) {
      if (m.Status && m.Status !== 'FAIL') continue; // Trivy can list passed checks too.
      findings.push({
        toolId: ID,
        ruleId: m.ID,
        resource: m.CauseMetadata?.Resource ?? '',
        severity: m.Severity ?? null,
        message: m.Message ?? m.Title ?? '',
        line: m.CauseMetadata?.StartLine ?? null,
      });
    }
  }
  return findings;
}

export default {
  id: ID,
  name: 'Trivy',
  license: 'Apache-2.0',
  async version() {
    const { stdout } = await run(config.bins.trivy, ['--version']);
    return versionFrom('Trivy', stdout);
  },
  async scan(dir, { timeoutMs } = {}) {
    // Trivy exits 0 on Terraform it can't parse and reports nothing, so input is
    // syntax-checked before any scan (server/core/terraform.js).
    const { stdout } = await run(config.bins.trivy, ['config', '--format', 'json', '--skip-check-update', '--quiet', dir], { sandbox: true, timeoutMs });
    return parse(parseToolJson('Trivy', stdout));
  },
};
