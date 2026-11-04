import { describe, expect, it } from 'vitest'
import { emptyFilterMessage, filterCounts, filterFaults, lineDiff, verdictCopy, missedLine } from './grid.js'

const faults = [
  { id: 'all-caught', results: { a: 'DETECTED', b: 'DETECTED' } },
  { id: 'one-silent', results: { a: 'DETECTED', b: 'SILENT' } },
  { id: 'all-silent', results: { a: 'SILENT', b: 'SILENT' } },
  { id: 'silent-and-error', results: { a: 'SILENT', b: 'ERROR' } },
  { id: 'only-errors', results: { a: 'ERROR', b: 'ERROR' } },
]

const ids = (list) => list.map((fault) => fault.id)

describe('filterFaults', () => {
  it('keeps every fault under the all filter', () => {
    expect(filterFaults(faults, 'all')).toHaveLength(5)
  })

  it('counts a fault as missed only when a tool actually stayed silent', () => {
    expect(ids(filterFaults(faults, 'missed-by-any'))).toEqual(['one-silent', 'all-silent', 'silent-and-error'])
  })

  it('does not claim nobody detected a fault when every tool errored', () => {
    expect(ids(filterFaults(faults, 'detected-by-none'))).toEqual(['all-silent', 'silent-and-error'])
  })

  it('rejects an unknown filter instead of showing everything', () => {
    expect(() => filterFaults(faults, 'nope')).toThrow('nope')
  })
})

describe('filterCounts', () => {
  it('reports the size of each filter', () => {
    expect(filterCounts(faults)).toEqual({ all: 5, 'missed-by-any': 3, 'detected-by-none': 2 })
  })
})

describe('emptyFilterMessage', () => {
  it('says no scanner missed anything when nothing was missed', () => {
    expect(emptyFilterMessage('missed-by-any', { 'missed-by-any': 0, 'detected-by-none': 0 })).toBe(
      'No scanner missed any of these problems.',
    )
  })

  it('says every miss was caught elsewhere when only the stricter filter is empty', () => {
    expect(emptyFilterMessage('detected-by-none', { 'missed-by-any': 3, 'detected-by-none': 0 })).toBe(
      'At least one scanner caught every problem that another scanner missed.',
    )
  })

  it('refuses to explain away a filter that has results', () => {
    expect(() => emptyFilterMessage('missed-by-any', { 'missed-by-any': 3, 'detected-by-none': 0 })).toThrow(
      'missed-by-any',
    )
  })
})

describe('missedLine', () => {
  it('uses all problems as the total when the scanner finished them all', () => {
    expect(missedLine({ silent: 4, error: 0 }, 10)).toEqual({ missed: 4, total: 'of 10' })
  })

  it('uses only the finished problems as the total when it could not finish some', () => {
    expect(missedLine({ silent: 3, error: 2 }, 10)).toEqual({ missed: 3, total: 'of 8 it finished' })
  })
})

describe('verdictCopy', () => {
  const benchmark = (missed, caughtByAnotherTool, { unfinished = 0, otherWarnings = 100 } = {}) => ({
    corpus: { faultCount: 24 },
    heuristic: { toolId: 'top', missed, caughtByAnotherTool },
    tools: [
      { id: 'top', terragoatFindings: 300, error: unfinished },
      { id: 'other', terragoatFindings: otherWarnings, error: 0 },
    ],
  })

  it('states how many hidden problems the scanner with the most warnings missed', () => {
    expect(verdictCopy(benchmark(9, 4)).headline).toBe(
      'The scanner with the most warnings on a standard test project (300) still missed 9 of the 24 problems we hid.',
    )
  })

  it('counts misses only against the problems that scanner finished', () => {
    expect(verdictCopy(benchmark(9, 4, { unfinished: 4 })).headline).toBe(
      'The scanner with the most warnings on a standard test project (300) still missed 9 of the 20 problems it finished.',
    )
  })

  it('says how many of the misses another scanner caught', () => {
    expect(verdictCopy(benchmark(9, 4)).reason).toContain('At least one other scanner caught 4 of those 9.')
  })

  it('says when another scanner caught every miss', () => {
    expect(verdictCopy(benchmark(9, 9)).reason).toContain('Every one of those 9 was caught by at least one other scanner.')
  })

  it('reads naturally when the only miss was caught by another scanner', () => {
    expect(verdictCopy(benchmark(1, 1)).reason).toContain('Another scanner caught that one.')
  })

  it('does not promise a second scanner helps when none caught the misses', () => {
    expect(verdictCopy(benchmark(9, 0)).reason).toContain(
      "No other scanner we ran caught those either, so in this test a second opinion wouldn't have helped.",
    )
  })

  it('says scanners miss different things when another scanner caught a miss', () => {
    expect(verdictCopy(benchmark(9, 4)).reason).toContain(
      'Scanners miss different things, so a clean scan only tells you something if you know what it would have missed.',
    )
  })

  it('does not say scanners differ when no other scanner caught a miss', () => {
    expect(verdictCopy(benchmark(9, 0)).reason).not.toContain('Scanners miss different things')
  })

  it('says plainly when the test found no misses', () => {
    expect(verdictCopy(benchmark(0, 0)).headline).toBe(
      'The scanner with the most warnings on a standard test project (300) missed none of the 24 problems we hid.',
    )
  })

  it('does not call a scanner free of blind spots when it could not finish', () => {
    expect(verdictCopy(benchmark(0, 0, { unfinished: 2 })).reason).toBe(
      "It couldn't finish on 2 of them, so this test can't say how it does on those.",
    )
  })

  it('does not claim a single top scanner when two share the most warnings', () => {
    expect(verdictCopy(benchmark(9, 4, { otherWarnings: 300 })).headline).toContain(
      'A scanner tied for the most warnings on a standard test project',
    )
  })
})

describe('lineDiff', () => {
  it('marks only the changed lines', () => {
    expect(lineDiff('a\nb\nc', 'a\nx\nc')).toEqual([
      { type: 'same', text: 'a' },
      { type: 'removed', text: 'b' },
      { type: 'added', text: 'x' },
      { type: 'same', text: 'c' },
    ])
  })
})
