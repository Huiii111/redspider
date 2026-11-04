import { filterFaults, missedLine, STATUS } from '../lib/grid.js'

const FADE_SHARE = 0.18

const STATE_BY_RESULT = {
  [STATUS.DETECTED]: 'caught',
  [STATUS.SILENT]: 'missed',
  [STATUS.ERROR]: 'error',
}

const TITLE_STEP = {
  id: 'title',
  kind: 'title',
  big: 'Project Red Spider',
  line: 'What do security scanners miss?',
  scene: { show: 'web' },
}

const finishStep = (scene) => ({
  id: 'finish',
  kind: 'finish',
  big: 'A clean scan only means something if you know what it misses.',
  scene,
})

function toolStep(tool, faultCount) {
  const { missed, total } = missedLine(tool, faultCount)
  return {
    id: `tool-${tool.id}`,
    kind: 'tool',
    kicker: tool.name,
    big: `Missed ${missed} ${total}`,
    scene: { show: 'tool', toolId: tool.id },
  }
}

export function buildStory(benchmark) {
  if (!benchmark) return [TITLE_STEP, finishStep({ show: 'web' })]

  const { corpus, tools, faults } = benchmark
  const nobodyCaught = filterFaults(faults, 'detected-by-none').length
  const scanners = tools.length === 1 ? '1 scanner' : `${tools.length} scanners`
  const closing = { show: nobodyCaught > 0 ? 'nobody' : 'problems' }

  return [
    TITLE_STEP,
    {
      id: 'hidden',
      kind: 'statement',
      big: `${corpus.faultCount} hidden problems.`,
      line: 'We planted known security problems in cloud setup code.',
      scene: { show: 'problems' },
    },
    {
      id: 'scan',
      kind: 'statement',
      big: `${scanners}.`,
      line: 'Each one scanned the code with every problem, and without it.',
      scene: { show: 'problems' },
    },
    ...tools.map((tool) => toolStep(tool, corpus.faultCount)),
    ...(nobodyCaught > 0
      ? [{ id: 'nobody', kind: 'statement', big: `${nobodyCaught} got past every scanner.`, scene: { show: 'nobody' } }]
      : []),
    finishStep(closing),
  ]
}

export function nodeStates(faults, scene) {
  return faults.map((fault) => {
    if (scene.show === 'web') return 'hidden'
    if (scene.show === 'problems') return 'neutral'
    if (scene.show === 'tool') return STATE_BY_RESULT[fault.results[scene.toolId]]
    return filterFaults([fault], 'detected-by-none').length > 0 ? 'missed' : 'faded'
  })
}

export function stepIndexAt(progress, count) {
  return Math.min(Math.floor(progress * count), count - 1)
}

const clamp01 = (value) => Math.min(1, Math.max(0, value))

export function stepOpacity(progress, index, count) {
  const position = progress * count - index
  const fadeIn = index === 0 ? 1 : clamp01(position / FADE_SHARE)
  const fadeOut = index === count - 1 ? 1 : clamp01((1 - position) / FADE_SHARE)
  return position < 0 && index !== 0 ? 0 : Math.min(fadeIn, fadeOut)
}
