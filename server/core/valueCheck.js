// The pre-registered value check (docs/prereg.md). Ported from Anton's valueCheck.js. No I/O.
//
// Verdict, exactly as registered:
//   VALUE_REFUTED  blind spot under 10%, or fewer than 3 decision changes (kill criterion)
//   VALUE_PROVEN   blind spot at least 20% and at least 3 decision changes
//   VALUE_UNPROVEN anything in between
// Strict matching decides the verdict. Loose matching and the ablation are reported alongside,
// as the pre-registration's "Sensitivity" and "Ablation" sections ask.
import { gradePair, STRICT, LOOSE } from './grade.js';

export const THRESHOLDS = Object.freeze({ provenBlindSpot: 0.2, killBlindSpot: 0.1, minDecisionChanges: 3, minCorpus: 20 });

function measure(statusesByCase, toolIds, pick) {
  const total = statusesByCase.length;
  const missed = statusesByCase.filter((s) => s[pick] === 'SILENT');
  const decisionChanges = missed.filter((s) => toolIds.some((id) => id !== pick && s[id] === 'DETECTED')).length;
  return {
    blindSpot: total ? missed.length / total : 0,
    missed: missed.length,
    decisionChanges,
    heuristicErrors: statusesByCase.filter((s) => s[pick] === 'ERROR').length,
  };
}

const onResource = (finding, resource) => finding.resource === resource || finding.resource.startsWith(`${resource}[`);

// The ablation: no clean twin. Any finding on the faulty resource counts as a detection.
function gradeWithoutCleanTwin({ faulty }, resource) {
  if (!faulty.ok) return 'ERROR';
  return faulty.findings.some((f) => onResource(f, resource)) ? 'DETECTED' : 'SILENT';
}

/**
 * @param raw             [{ id, resource|null, runs: { [toolId]: { clean, faulty } } }]
 * @param toolIds         every tool in the run
 * @param heuristicToolId the tool the TerraGoat heuristic picked
 */
export function runValueCheck({ raw, toolIds, heuristicToolId }) {
  const statuses = (gradeOne) => raw.map((c) => Object.fromEntries(toolIds.map((id) => [id, gradeOne(c.runs[id], c)])));
  const withMatch = (match) => statuses((r) => gradePair(r.clean, r.faulty, { match }).status);

  const strict = measure(withMatch(STRICT), toolIds, heuristicToolId);
  const loose = measure(withMatch(LOOSE), toolIds, heuristicToolId);

  const missingResource = raw.filter((c) => !c.resource).map((c) => c.id);
  const ablation = missingResource.length
    ? { skipped: true, reason: `${missingResource.length} case(s) have no "resource" in case.json, e.g. ${missingResource.slice(0, 3).join(', ')}` }
    : (() => {
      const m = measure(statuses((r, c) => gradeWithoutCleanTwin(r, c.resource)), toolIds, heuristicToolId);
      // Registered prediction: without the clean twin, scores inflate and the blind spot shrinks.
      return { ...m, predictionHeld: m.blindSpot < strict.blindSpot };
    })();

  const t = THRESHOLDS;
  let verdict = 'VALUE_UNPROVEN';
  if (strict.blindSpot < t.killBlindSpot || strict.decisionChanges < t.minDecisionChanges) verdict = 'VALUE_REFUTED';
  else if (strict.blindSpot >= t.provenBlindSpot) verdict = 'VALUE_PROVEN';

  const warnings = [];
  if (raw.length < t.minCorpus) warnings.push(`Only ${raw.length} cases; the pre-registration asks for at least ${t.minCorpus}.`);
  if (strict.heuristicErrors) warnings.push(`The heuristic tool errored on ${strict.heuristicErrors} case(s). Errors are not misses, so the blind spot may be understated.`);
  if (loose.blindSpot < t.provenBlindSpot && verdict === 'VALUE_PROVEN') warnings.push('The headline does not hold under loose matching. Report both.');

  return { verdict, thresholds: t, cases: raw.length, strict, sensitivity: { loose }, ablation, warnings };
}
