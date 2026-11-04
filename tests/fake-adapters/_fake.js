// DEV ONLY. Builds stand-in scanners so the pipeline runs before John's real adapters exist.
// They match literal text only, so faults planted through a variable or local are missed:
// a deliberate, visible blind spot. Files starting with "_" are not loaded as adapters.
import fs from 'node:fs/promises';
import path from 'node:path';

function resources(text) {
  const heads = [...text.matchAll(/^resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/gm)];
  return heads.map((m, i) => ({
    address: `${m[1]}.${m[2]}`,
    body: text.slice(m.index, i + 1 < heads.length ? heads[i + 1].index : text.length),
    line: text.slice(0, m.index).split('\n').length,
  }));
}

export function fakeAdapter({ id, name, rules }) {
  return {
    id,
    name,
    license: 'none',
    async version() { return '0.0.0-dev'; },
    async scan(dir) {
      const text = await fs.readFile(path.join(dir, 'main.tf'), 'utf8');
      const findings = [];
      for (const r of resources(text)) {
        for (const rule of rules) {
          if (rule.re.test(r.body)) findings.push({ toolId: id, ruleId: rule.id, resource: r.address, severity: rule.severity ?? 'HIGH', message: rule.message, line: r.line });
        }
      }
      return findings;
    },
  };
}
