import { STATUS } from '../lib/grid.js'
import { Status } from './Status.jsx'

const MEANINGS = [
  { status: STATUS.DETECTED, meaning: 'The scanner gave a new warning once we hid the problem.' },
  { status: STATUS.SILENT, meaning: 'The scanner ran properly but gave no new warning.' },
  { status: STATUS.ERROR, meaning: "The scanner failed or ran out of time. This doesn't count against it." },
]

export function StatusKey() {
  return (
    <dl className="status-key">
      {MEANINGS.map(({ status, meaning }) => (
        <div key={status}>
          <dt>
            <Status value={status} />
          </dt>
          <dd>{meaning}</dd>
        </div>
      ))}
    </dl>
  )
}
