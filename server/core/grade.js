// Comparison logic shared by `npm run benchmark` and POST /api/scan. No I/O.
//
// A "run" is what one tool produced on one file:
//   { ok: true, findings: Finding[] }  or  { ok: false, error: string }

// Line numbers are deliberately not part of the key: planting a fault shifts them.
// STRICT is the registered rule (docs/prereg.md). LOOSE is the sensitivity check: the same
// resource with any rule counts as already reported.
export const STRICT = (f) => `${f.ruleId.trim()}\u0000${f.resource.trim()}`;
export const LOOSE = (f) => f.resource.trim();
export const findingKey = STRICT;

/**
 * Compare a tool's runs on the clean and faulty twin.
 * DETECTED: a (ruleId, resource) on the faulty twin that the clean twin doesn't have.
 * SILENT:   both runs succeeded and nothing new appeared.
 * ERROR:    either run failed. Never counted as silent: we did not observe a miss.
 */
export function gradePair(cleanRun, faultyRun, { labels = ['clean', 'faulty'], match = STRICT } = {}) {
  const errors = [[cleanRun, labels[0]], [faultyRun, labels[1]]].filter(([r]) => !r.ok).map(([r, l]) => `${l}: ${r.error}`);
  if (errors.length) {
    return { status: 'ERROR', newFindings: [], cleanFindingCount: cleanRun.ok ? cleanRun.findings.length : 0, errorMessage: errors.join('; ') };
  }
  const cleanKeys = new Set(cleanRun.findings.map(match));
  const seen = new Set();
  const newFindings = [];
  for (const f of faultyRun.findings) {
    const k = match(f);
    if (cleanKeys.has(k) || seen.has(k)) continue;
    seen.add(k);
    newFindings.push(f);
  }
  return {
    status: newFindings.length > 0 ? 'DETECTED' : 'SILENT',
    newFindings,
    cleanFindingCount: cleanRun.findings.length,
  };
}

// Live scan uses NOTICED in place of DETECTED; the logic is identical.
export function toScanStatus(status) {
  return status === 'DETECTED' ? 'NOTICED' : status;
}

export const HEURISTIC_RULE = 'Tool with the most findings on TerraGoat';

/**
 * Build the GET /api/benchmark summary.
 * @param tools  [{ id, name, version, license, terragoatFindings }] in display order
 * @param cases  [{ id, title, requirement, results: [{ toolId, status }] }]
 * @returns { tools, faults, heuristic, ties }  ties lists tool ids that shared the top TerraGoat count
 */
export function summarise(tools, cases) {
  if (tools.length === 0) throw new Error('summarise: no tools');

  const faults = cases.map((c) => ({
    id: c.id,
    title: c.title,
    requirement: { source: c.requirement.source, ref: c.requirement.ref },
    results: Object.fromEntries(c.results.map((r) => [r.toolId, r.status])),
  }));

  const toolRows = tools.map((t) => {
    const counts = { DETECTED: 0, SILENT: 0, ERROR: 0 };
    for (const f of faults) {
      const s = f.results[t.id];
      if (!s) throw new Error(`summarise: case ${f.id} has no result for tool ${t.id}`);
      counts[s] += 1;
    }
    return {
      id: t.id, name: t.name, version: t.version, license: t.license,
      terragoatFindings: t.terragoatFindings,
      detected: counts.DETECTED, silent: counts.SILENT, error: counts.ERROR,
    };
  });

  // The tool a reasonable person would pick by looking at raw finding volume.
  const top = Math.max(...toolRows.map((t) => t.terragoatFindings));
  const ties = toolRows.filter((t) => t.terragoatFindings === top).map((t) => t.id);
  const pick = ties[0];
  const missedFaults = faults.filter((f) => f.results[pick] === 'SILENT');
  const caughtByAnotherTool = missedFaults.filter((f) =>
    Object.entries(f.results).some(([id, s]) => id !== pick && s === 'DETECTED'),
  ).length;

  return {
    tools: toolRows,
    faults,
    heuristic: { rule: HEURISTIC_RULE, toolId: pick, missed: missedFaults.length, caughtByAnotherTool },
    ties,
  };
}
