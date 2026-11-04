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

export function missedLine(tool, faultCount) {
  if (tool.error === 0) return { missed: tool.silent, total: `of ${faultCount}` }
  return { missed: tool.silent, total: `of ${faultCount - tool.error} it finished` }
}

export function verdictHeadline(benchmark) {
  const { faultCount } = benchmark.corpus
  const { missed } = benchmark.heuristic
  const { scanner, sharedTop } = mostWarningsScanner(benchmark)
  const subject = sharedTop ? 'A scanner tied for the most warnings' : 'The scanner with the most warnings'

  if (missed === 0 && scanner.error === 0) return `${subject} missed none of the ${faultCount} hidden problems.`
  if (scanner.error > 0) {
    const finished = faultCount - scanner.error
    const verb = missed === 0 ? 'missed none' : `still missed ${missed}`
    return `${subject} ${verb} of the ${finished} hidden problems it finished.`
  }
  return `${subject} still missed ${missed} of ${faultCount} hidden problems.`
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
