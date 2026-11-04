import { STATUS } from '../lib/grid.js'

const DISPLAY = {
  [STATUS.DETECTED]: { word: 'Detected', symbol: '✓', className: 'status-detected' },
  [STATUS.NOTICED]: { word: 'Noticed', symbol: '✓', className: 'status-detected' },
  [STATUS.SILENT]: { word: 'Silent', symbol: '▲', className: 'status-silent' },
  [STATUS.ERROR]: { word: 'Error', symbol: '?', className: 'status-error' },
}

export function Status({ value }) {
  const { word, symbol, className } = DISPLAY[value]
  return (
    <span className={`status ${className}`}>
      <span aria-hidden="true">{symbol}</span> {word}
    </span>
  )
}
