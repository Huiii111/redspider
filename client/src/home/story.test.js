import { describe, expect, it } from 'vitest'
import { buildStory, nodeStates, stepIndexAt, stepOpacity } from './story.js'

const benchmark = {
  corpus: { faultCount: 4 },
  tools: [
    { id: 'a', name: 'Alpha', silent: 2, error: 0 },
    { id: 'b', name: 'Beta', silent: 1, error: 1 },
  ],
  faults: [
    { id: 'f1', results: { a: 'DETECTED', b: 'DETECTED' } },
    { id: 'f2', results: { a: 'SILENT', b: 'SILENT' } },
    { id: 'f3', results: { a: 'SILENT', b: 'DETECTED' } },
    { id: 'f4', results: { a: 'DETECTED', b: 'ERROR' } },
  ],
}

const big = (steps, id) => steps.find((step) => step.id === id).big

describe('buildStory', () => {
  const steps = buildStory(benchmark)

  it('opens with the name and ends with the next action', () => {
    expect(steps[0].kind).toBe('title')
    expect(steps.at(-1).kind).toBe('finish')
  })

  it('takes the number of hidden problems from the results', () => {
    expect(big(steps, 'hidden')).toBe('4 hidden problems.')
  })

  it('gives each scanner its own step with its own count', () => {
    expect(big(steps, 'tool-a')).toBe('Missed 2 of 4')
  })

  it('counts only finished problems for a scanner that could not finish some', () => {
    expect(big(steps, 'tool-b')).toBe('Missed 1 of 3 it finished')
  })

  it('counts the problems no scanner caught', () => {
    expect(big(steps, 'nobody')).toBe('1 got past every scanner.')
  })

  it('leaves out that step when every problem was caught by someone', () => {
    const allCaught = { ...benchmark, faults: [benchmark.faults[0]] }
    expect(buildStory(allCaught).some((step) => step.id === 'nobody')).toBe(false)
  })

  it('tells the story without numbers when no results exist', () => {
    const noResults = buildStory(null)
    expect(noResults.map((step) => step.kind)).toEqual(['title', 'finish'])
    expect(JSON.stringify(noResults)).not.toMatch(/\d/)
  })
})

describe('nodeStates', () => {
  it('shows a scanner result on each problem', () => {
    expect(nodeStates(benchmark.faults, { show: 'tool', toolId: 'b' })).toEqual(['caught', 'missed', 'caught', 'error'])
  })

  it('highlights only problems no scanner caught', () => {
    expect(nodeStates(benchmark.faults, { show: 'nobody' })).toEqual(['faded', 'missed', 'faded', 'faded'])
  })

  it('keeps problems out of sight before they are introduced', () => {
    expect(nodeStates(benchmark.faults, { show: 'web' })).toEqual(['hidden', 'hidden', 'hidden', 'hidden'])
  })
})

describe('scroll position', () => {
  it('maps progress to a step, and stays on the last at the very end', () => {
    expect(stepIndexAt(0, 4)).toBe(0)
    expect(stepIndexAt(0.5, 4)).toBe(2)
    expect(stepIndexAt(1, 4)).toBe(3)
  })

  it('shows the first step fully at the top of the page', () => {
    expect(stepOpacity(0, 0, 4)).toBe(1)
  })

  it('keeps the last step fully visible at the end', () => {
    expect(stepOpacity(1, 3, 4)).toBe(1)
  })

  it('shows a step fully in the middle of its range and not at all in another', () => {
    expect(stepOpacity(0.375, 1, 4)).toBe(1)
    expect(stepOpacity(0.875, 1, 4)).toBe(0)
  })
})
