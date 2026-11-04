import { describe, expect, it } from 'vitest'
import { runValueCheck } from '../../server/core/valueCheck.js'

const hit = (resource) => ({ toolId: 't', ruleId: 'R', resource, severity: null, message: 'm', line: 1 })
const ran = (...findings) => ({ ok: true, findings })
const NOISE = hit('target.resource')

const caught = { clean: ran(), faulty: ran(hit('target.resource')) }
const silentButNoisy = { clean: ran(NOISE), faulty: ran(NOISE) }
const check = (pairs) =>
  runValueCheck({
    toolIds: ['pick', 'other'],
    heuristicToolId: 'pick',
    cases: pairs.map(([pick, other]) => ({ resource: 'target.resource', runs: { pick, other } })),
  })

const repeat = (count, pair) => Array.from({ length: count }, () => pair)

describe('runValueCheck', () => {
  it('refutes the claim when the chosen tool barely misses anything', () => {
    expect(check(repeat(20, [caught, caught])).verdict).toBe('VALUE_REFUTED')
  })

  it('refutes the claim when no other tool catches what the chosen tool misses', () => {
    expect(check(repeat(20, [silentButNoisy, silentButNoisy])).verdict).toBe('VALUE_REFUTED')
  })

  it('reports the blind spot as a share of all planted faults', () => {
    const pairs = [...repeat(5, [silentButNoisy, caught]), ...repeat(15, [caught, caught])]
    expect(check(pairs).strict).toMatchObject({ blindSpot: 0.25, missed: 5, decisionChanges: 5 })
  })

  it('shows the blind spot shrinking when the clean twin is removed, for the predicted reason', () => {
    const pairs = [...repeat(5, [silentButNoisy, caught]), ...repeat(15, [caught, caught])]
    expect(check(pairs).ablation.withoutCleanTwin.blindSpot).toBe(0)
  })

  it('does not count a tool error as a blind spot', () => {
    const failed = { clean: { ok: false, errorMessage: 'x' }, faulty: ran() }
    expect(check(repeat(20, [failed, caught])).strict.missed).toBe(0)
  })
})
