import { describe, expect, it } from 'vitest'
import { filterCounts, filterFaults, lineDiff, verdictCopy } from './grid.js'

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

describe('verdictCopy', () => {
  const benchmark = (missed, caughtByAnotherTool) => ({
    corpus: { faultCount: 24 },
    heuristic: { missed, caughtByAnotherTool },
  })

  it('states the count of silent faults and of faults another tool caught', () => {
    const copy = verdictCopy(benchmark(9, 4))
    expect(copy.headline).toBe('The tool with the most findings stayed silent on 9 of 24 planted faults.')
    expect(copy.reason).toContain('Another tool caught 4 of those')
  })

  it('does not invent a gap when no other tool caught the missed faults', () => {
    expect(verdictCopy(benchmark(9, 0)).reason).toBe('No other tool caught those either, so a second scanner would not close this gap.')
  })

  it('says plainly when the benchmark found no blind spot', () => {
    expect(verdictCopy(benchmark(0, 0)).headline).toBe('The tool with the most findings caught all 24 planted faults.')
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
