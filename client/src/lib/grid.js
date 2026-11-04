export const STATUS = { DETECTED: 'DETECTED', SILENT: 'SILENT', ERROR: 'ERROR', NOTICED: 'NOTICED' }

const statuses = (fault) => Object.values(fault.results)
const anySilent = (fault) => statuses(fault).includes(STATUS.SILENT)
const noneDetected = (fault) => !statuses(fault).includes(STATUS.DETECTED)

const FILTER_RULES = {
  all: () => true,
  'missed-by-any': anySilent,
  'detected-by-none': (fault) => anySilent(fault) && noneDetected(fault),
}

export const FILTERS = [
  { id: 'all', label: 'All hidden problems' },
  { id: 'missed-by-any', label: 'Missed by at least one scanner' },
  { id: 'detected-by-none', label: 'Missed, and no scanner caught it' },
]

export const BENCHMARK_RESULT_WORDS = {
  [STATUS.DETECTED]: 'Caught',
  [STATUS.SILENT]: 'Missed',
  [STATUS.ERROR]: "Couldn't finish",
}

export function filterFaults(faults, filterId) {
  const rule = FILTER_RULES[filterId]
  if (!rule) throw new Error(`Unknown filter: ${filterId}`)
  return faults.filter(rule)
}

export function filterCounts(faults) {
  return Object.fromEntries(FILTERS.map(({ id }) => [id, filterFaults(faults, id).length]))
}

export function emptyFilterMessage(filterId, counts) {
  if (counts['missed-by-any'] === 0) return 'No scanner missed any of these problems.'
  if (filterId === 'detected-by-none') return 'At least one scanner caught every problem that another scanner missed.'
  throw new Error(`Filter has results, so it has no empty message: ${filterId}`)
}

export function mostWarningsScanner({ tools, heuristic }) {
  const scanner = tools.find((tool) => tool.id === heuristic.toolId)
  const sharedTop = tools.filter((tool) => tool.terragoatFindings === scanner.terragoatFindings).length > 1
  return { scanner, sharedTop }
}

const WHY_IT_MATTERS = 'A clean scan only tells you something if you know what the scanner would have missed.'
const SCANNERS_DIFFER = 'Scanners miss different things, so a clean scan only tells you something if you know what it would have missed.'

export function missedLine(tool, faultCount) {
  if (tool.error === 0) return { missed: tool.silent, total: `of ${faultCount}` }
  return { missed: tool.silent, total: `of ${faultCount - tool.error} it finished` }
}

function caughtElsewhereSentence(missed, caughtElsewhere) {
  const those = missed === 1 ? 'that one' : 'those'
  if (caughtElsewhere === 0) {
    return `No other scanner we ran caught ${those} either, so in this test a second opinion wouldn't have helped.`
  }
  if (caughtElsewhere < missed) return `At least one other scanner caught ${caughtElsewhere} of those ${missed}.`
  if (missed === 1) return 'Another scanner caught that one.'
  return `Every one of those ${missed} was caught by at least one other scanner.`
}

function noMissesReason(unfinished) {
  if (unfinished === 0) return 'This test found no blind spot in that scanner on these problems.'
  const those = unfinished === 1 ? 'that one' : 'those'
  return `It couldn't finish on ${unfinished} of them, so this test can't say how it does on ${those}.`
}

export function verdictCopy(benchmark) {
  const { faultCount } = benchmark.corpus
  const { missed, caughtByAnotherTool } = benchmark.heuristic
  const { scanner, sharedTop } = mostWarningsScanner(benchmark)
  const warnings = scanner.terragoatFindings
  const subject = sharedTop
    ? `A scanner tied for the most warnings on a standard test project (${warnings})`
    : `The scanner with the most warnings on a standard test project (${warnings})`
  const outOf = scanner.error === 0
    ? `${faultCount} problems we hid`
    : `${faultCount - scanner.error} problems it finished`

  if (missed === 0) {
    return {
      headline: `${subject} missed none of the ${outOf}.`,
      reason: noMissesReason(scanner.error),
    }
  }

  return {
    headline: `${subject} still missed ${missed} of the ${outOf}.`,
    reason: `${caughtElsewhereSentence(missed, caughtByAnotherTool)} ${caughtByAnotherTool > 0 ? SCANNERS_DIFFER : WHY_IT_MATTERS}`,
  }
}

export function lineDiff(before, after) {
  const a = before.split('\n')
  const b = after.split('\n')
  const lengths = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1])
    }
  }

  const lines = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push({ type: 'same', text: a[i] })
      i += 1
      j += 1
    } else if (j === b.length || (i < a.length && lengths[i + 1][j] >= lengths[i][j + 1])) {
      lines.push({ type: 'removed', text: a[i] })
      i += 1
    } else {
      lines.push({ type: 'added', text: b[j] })
      j += 1
    }
  }
  return lines
}
