import { useCallback } from 'react'
import { getCase, getHealth } from '../api.js'
import { FailedNotice } from '../components/Notice.jsx'
import { Status } from '../components/Status.jsx'
import { lineDiff, STATUS } from '../lib/grid.js'
import { useRequest } from '../lib/useRequest.js'

const DIFF_MARK = { same: ' ', removed: '−', added: '+' }

function Diff({ before, after }) {
  return (
    <pre className="diff" tabIndex={0} aria-label="Change from the clean file to the faulty file">
      {lineDiff(before, after).map((line, index) => (
        <span key={index} className={`diff-line diff-${line.type}`}>
          <span aria-hidden="true">{DIFF_MARK[line.type]} </span>
          {line.text}
          {'\n'}
        </span>
      ))}
    </pre>
  )
}

function ToolResult({ result, toolName }) {
  return (
    <li className="tool-result">
      <div className="tool-result-head">
        <strong>{toolName}</strong>
        <Status value={result.status} />
      </div>
      {result.status === STATUS.SILENT && <p>Ran on both files and reported nothing new.</p>}
      {result.status === STATUS.ERROR && <p>This tool failed, so we don't know what it would have reported.</p>}
      {result.newFindings.length > 0 && (
        <ul className="findings">
          {result.newFindings.map((finding) => (
            <li key={`${finding.ruleId}-${finding.resource}`}>
              <span className="mono">{finding.ruleId}</span> on <span className="mono">{finding.resource}</span>
              <p>{finding.message}</p>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function FaultDetail({ id }) {
  const load = useCallback(() => Promise.all([getCase(id), getHealth()]), [id])
  const result = useRequest(load)

  if (result.status === 'loading') return <p className="empty">Loading this fault…</p>
  if (result.status === 'failed') return <FailedNotice error={result.error} retry={result.retry} />

  const [{ title, requirement, clean, faulty, results }, { tools }] = result.data
  const nameOf = (toolId) => tools.find((tool) => tool.id === toolId).name
  return (
    <article className="detail">
      <a href="#/">← All faults</a>
      <h1>{title}</h1>
      <section>
        <h2>The requirement this breaks</h2>
        <p>{requirement.text}</p>
        <p className="fault-ref mono">
          {requirement.source} {requirement.ref}
        </p>
      </section>
      <section>
        <h2>What each tool did</h2>
        <ul className="tool-results">
          {results.map((toolResult) => (
            <ToolResult key={toolResult.toolId} result={toolResult} toolName={nameOf(toolResult.toolId)} />
          ))}
        </ul>
      </section>
      <section>
        <h2>The planted change</h2>
        <Diff before={clean} after={faulty} />
      </section>
    </article>
  )
}
