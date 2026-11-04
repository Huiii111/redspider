import { gradeFault, LOOSE_MATCH, STRICT_MATCH } from './grade.js'

const PROVEN_BLIND_SPOT = 0.2
const KILL_BLIND_SPOT = 0.1
const MIN_DECISION_CHANGES = 3

function measure(toolIds, heuristicToolId, caseStatuses) {
  const missed = caseStatuses.filter((statuses) => statuses[heuristicToolId] === 'SILENT')
  const decisionChanges = missed.filter((statuses) =>
    toolIds.some((id) => id !== heuristicToolId && statuses[id] === 'DETECTED'),
  ).length
  return { blindSpot: missed.length / caseStatuses.length, missed: missed.length, decisionChanges }
}

const statusesFor = (cases, toolIds, gradeOne) =>
  cases.map((faultCase) =>
    Object.fromEntries(toolIds.map((id) => [id, gradeOne(faultCase.runs[id], faultCase.resource)])),
  )

const gradeWithoutCleanTwin = ({ faulty }, resource) => {
  if (!faulty.ok) return 'ERROR'
  return faulty.findings.some((finding) => finding.resource === resource) ? 'DETECTED' : 'SILENT'
}

export function runValueCheck({ cases, toolIds, heuristicToolId }) {
  const gradeWith = (match) => ({ clean, faulty }) => gradeFault(clean, faulty, match).status
  const strict = measure(toolIds, heuristicToolId, statusesFor(cases, toolIds, gradeWith(STRICT_MATCH)))
  const loose = measure(toolIds, heuristicToolId, statusesFor(cases, toolIds, gradeWith(LOOSE_MATCH)))
  const ablated = measure(toolIds, heuristicToolId, statusesFor(cases, toolIds, gradeWithoutCleanTwin))

  const meets = ({ blindSpot, decisionChanges }) =>
    blindSpot >= PROVEN_BLIND_SPOT && decisionChanges >= MIN_DECISION_CHANGES
  const killed = strict.blindSpot < KILL_BLIND_SPOT || strict.decisionChanges < MIN_DECISION_CHANGES

  let verdict = 'VALUE_UNPROVEN'
  if (killed) verdict = 'VALUE_REFUTED'
  else if (meets(strict) && meets(loose) && ablated.blindSpot < strict.blindSpot) verdict = 'VALUE_PROVEN'

  return { verdict, strict, sensitivity: { loose }, ablation: { withoutCleanTwin: ablated } }
}
