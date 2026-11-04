export const STRICT_MATCH = (finding) => `${finding.ruleId}|${finding.resource}`
export const LOOSE_MATCH = (finding) => finding.resource

export function newFindings(baseline, changed, matchKey) {
  const known = new Set(baseline.map(matchKey))
  return changed.filter((finding) => !known.has(matchKey(finding)))
}

function grade(baselineRun, changedRun, positiveStatus, matchKey) {
  const failedRun = [baselineRun, changedRun].find((run) => !run.ok)
  if (failedRun) return { status: 'ERROR', newFindings: [], errorMessage: failedRun.errorMessage }

  const added = newFindings(baselineRun.findings, changedRun.findings, matchKey)
  return { status: added.length > 0 ? positiveStatus : 'SILENT', newFindings: added }
}

export function gradeFault(cleanRun, faultyRun, matchKey = STRICT_MATCH) {
  const cleanFindingCount = cleanRun.ok ? cleanRun.findings.length : null
  return { ...grade(cleanRun, faultyRun, 'DETECTED', matchKey), cleanFindingCount }
}

export function gradeScan(beforeRun, afterRun) {
  return grade(beforeRun, afterRun, 'NOTICED', STRICT_MATCH)
}
