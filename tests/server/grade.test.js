import { describe, expect, it } from 'vitest'
import { summarizeRun } from '../../server/core/benchmark.js'
import { gradeFault, gradeScan, LOOSE_MATCH, newFindings, STRICT_MATCH } from '../../server/core/grade.js'

const finding = (ruleId, resource) => ({ toolId: 't', ruleId, resource, severity: null, message: 'm', line: 1 })
const ran = (...findings) => ({ ok: true, findings })
const failed = { ok: false, errorMessage: 'tool crashed' }

describe('newFindings', () => {
  it('ignores findings present in both versions, even when their line moves', () => {
    const before = [finding('R1', 'a.b')]
    const after = [{ ...finding('R1', 'a.b'), line: 99 }]
    expect(newFindings(before, after, STRICT_MATCH)).toEqual([])
  })

  it('keeps a known rule that newly fires on a different resource under strict matching', () => {
    expect(newFindings([finding('R1', 'a.b')], [finding('R1', 'a.c')], STRICT_MATCH)).toHaveLength(1)
  })

  it('needs only a resource not already flagged under loose matching', () => {
    const before = [finding('R1', 'a.b')]
    expect(newFindings(before, [finding('R2', 'a.b')], LOOSE_MATCH)).toEqual([])
    expect(newFindings(before, [finding('R2', 'a.c')], LOOSE_MATCH)).toHaveLength(1)
  })
})

describe('gradeFault', () => {
  it('is detected when the faulty file gains a finding', () => {
    expect(gradeFault(ran(), ran(finding('R1', 'a.b'))).status).toBe('DETECTED')
  })

  it('is silent when the tool ran on both files and reported nothing new', () => {
    expect(gradeFault(ran(finding('R1', 'a.b')), ran(finding('R1', 'a.b'))).status).toBe('SILENT')
  })

  it('is an error, never silent, when either run failed', () => {
    expect(gradeFault(failed, ran()).status).toBe('ERROR')
    expect(gradeFault(ran(), failed).status).toBe('ERROR')
  })

  it('records how many findings the clean file already had', () => {
    expect(gradeFault(ran(finding('R1', 'a.b')), ran(finding('R1', 'a.b'))).cleanFindingCount).toBe(1)
  })
})

describe('gradeScan', () => {
  it('uses the live vocabulary for a noticed change', () => {
    expect(gradeScan(ran(), ran(finding('R1', 'a.b'))).status).toBe('NOTICED')
  })

  it('passes the failure message through', () => {
    expect(gradeScan(failed, ran())).toMatchObject({ status: 'ERROR', errorMessage: 'tool crashed' })
  })
})

describe('summarizeRun', () => {
  const tools = [
    { id: 'noisy', name: 'Noisy', version: '1', license: 'x' },
    { id: 'quiet', name: 'Quiet', version: '1', license: 'x' },
  ]
  const cases = [
    { id: 'f1', results: { noisy: 'SILENT', quiet: 'DETECTED' } },
    { id: 'f2', results: { noisy: 'SILENT', quiet: 'SILENT' } },
    { id: 'f3', results: { noisy: 'DETECTED', quiet: 'ERROR' } },
    { id: 'f4', results: { noisy: 'ERROR', quiet: 'DETECTED' } },
  ]
  const summary = summarizeRun({ tools, cases, terragoatFindings: { noisy: 90, quiet: 10 } })

  it('picks the tool with the most findings on the sample repository', () => {
    expect(summary.heuristic.toolId).toBe('noisy')
  })

  it('counts only that tool’s silent faults as missed, not its errors', () => {
    expect(summary.heuristic.missed).toBe(2)
  })

  it('counts missed faults another tool actually detected', () => {
    expect(summary.heuristic.caughtByAnotherTool).toBe(1)
  })

  it('counts each state per tool', () => {
    expect(summary.tools[1]).toMatchObject({ detected: 2, silent: 1, error: 1, terragoatFindings: 10 })
  })
})
