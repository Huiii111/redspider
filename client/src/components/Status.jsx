import { STATUS } from '../lib/grid.js'

const BENCHMARK_DISPLAY = {
  [STATUS.DETECTED]: { word: 'Caught', symbol: '✓', className: 'status-detected' },
  [STATUS.NOTICED]: { word: 'Noticed', symbol: '✓', className: 'status-detected' },
  [STATUS.SILENT]: { word: 'Missed', symbol: '▲', className: 'status-silent' },
  [STATUS.ERROR]: { word: "Couldn't finish", symbol: '?', className: 'status-error' },
}

const TRY_IT_DISPLAY = {
  ...BENCHMARK_DISPLAY,
  [STATUS.SILENT]: { word: 'Said nothing', symbol: '–', className: 'status-said-nothing' },
}

export function Status({ value, live = false }) {
  const { word, symbol, className } = (live ? TRY_IT_DISPLAY : BENCHMARK_DISPLAY)[value]
  return (
    <span className={`status ${className}`}>
      <span aria-hidden="true">{symbol}</span> {word}
    </span>
  )
}
