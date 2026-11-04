import { run, parseJson } from './_run.js';

export function parse(json) {
  return (json.results?.violations ?? []).map((v) => ({
    toolId: 'terrascan',
    ruleId: v.rule_id,
    resource: v.resource_type && v.resource_name ? `${v.resource_type}.${v.resource_name}` : '',
    severity: v.severity ?? null,
    message: v.description ?? v.rule_name ?? '',
    line: v.line ?? 0,
  }));
}

export default {
  id: 'terrascan',
  name: 'Terrascan',
  license: 'Apache-2.0',
  async version() {
    const { stdout } = await run('terrascan', ['version']);
    return stdout.match(/\d+\.\d+\.\d+/)?.[0] ?? null;
  },
  // Terrascan looks up provider versions on registry.terraform.io and retries
  // for minutes when offline, so with the network denied it hits the timeout
  // and reports ERROR. Set sandbox:false only after a deliberate decision.
  async scan(dir) {
    const { stdout, code } = await run('terrascan', ['scan', '-i', 'terraform', '-d', dir, '-o', 'json'], {
      sandbox: true,
      timeoutMs: 20000,
    });
    if (!stdout.trim()) throw new Error(`terrascan produced no output (exit ${code})`);
    return parse(parseJson('terrascan', stdout));
  },
};
