import { describe, expect, it } from 'vitest'
import { emptyFilterMessage, filterCounts, filterFaults, lineDiff, verdictHeadline, missedLine } from './grid.js'

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

describe('verdictHeadline', () => {
  const benchmark = (missed, { unfinished = 0, otherWarnings = 100 } = {}) => ({
    corpus: { faultCount: 30 },
    heuristic: { toolId: 'top', missed },
    tools: [
      { id: 'top', terragoatFindings: 215, error: unfinished },
      { id: 'other', terragoatFindings: otherWarnings, error: 0 },
    ],
  })

  it('states the core message in one line', () => {
    expect(verdictHeadline(benchmark(9))).toBe('The scanner with the most warnings still missed 9 of 30 hidden problems.')
  })

  it('counts misses only against the problems that scanner finished', () => {
    expect(verdictHeadline(benchmark(9, { unfinished: 4 }))).toBe(
      'The scanner with the most warnings still missed 9 of the 26 hidden problems it finished.',
    )
  })

  it('says plainly when nothing was missed', () => {
    expect(verdictHeadline(benchmark(0))).toBe('The scanner with the most warnings missed none of the 30 hidden problems.')
  })

  it('does not claim one top scanner when two tied', () => {
    expect(verdictHeadline(benchmark(9, { otherWarnings: 215 }))).toBe(
      'A scanner tied for the most warnings still missed 9 of 30 hidden problems.',
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
