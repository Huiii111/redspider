// NOT LOADED: the registry only reads files directly in server/adapters/.
// From John's branch. Terrascan contacts registry.terraform.io during a scan and retries for
// minutes with the network denied, so every run times out as ERROR. Anton's branch cut it too.
// To include it, move this file up one level, after the team decides to allow it network access.
import { run, parseToolJson, versionFrom } from '../_run.js';

const ID = 'terrascan';

export function parse(json) {
  return (json.results?.violations ?? []).map((v) => ({
    toolId: ID,
    ruleId: v.rule_id,
    resource: v.resource_type && v.resource_name ? `${v.resource_type}.${v.resource_name}` : '',
    severity: v.severity ?? null,
    message: v.description ?? v.rule_name ?? '',
    line: v.line ?? null,
  }));
}

export default {
  id: ID,
  name: 'Terrascan',
  license: 'Apache-2.0',
  async version() {
    const { stdout } = await run('terrascan', ['version']);
    return versionFrom('Terrascan', stdout);
  },
  async scan(dir) {
    const { stdout } = await run('terrascan', ['scan', '-i', 'terraform', '-d', dir, '-o', 'json'], { sandbox: true, timeoutMs: 20_000 });
    return parse(parseToolJson('Terrascan', stdout));
  },
};
