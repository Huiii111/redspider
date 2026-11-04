import { useCallback } from 'react'
import { getBenchmark, getCase, NO_RUN } from '../api.js'
import { FailedNotice, Notice } from '../components/Notice.jsx'
import { Status } from '../components/Status.jsx'
import { lineDiff, STATUS } from '../lib/grid.js'
import { useRequest } from '../lib/useRequest.js'
import '../styles/detail.css'

const CASE_NOT_FOUND = 'CASE_NOT_FOUND'

const RESULT_GROUPS = [
  { status: STATUS.DETECTED, meaning: 'Gave a new warning on the version with the hidden problem.', className: 'fault-group-caught' },
  { status: STATUS.SILENT, meaning: 'Ran on both versions of the code and gave no new warning.', className: 'fault-group-missed' },
  { status: STATUS.ERROR, meaning: "Didn't finish running, so this doesn't count as a miss.", className: 'fault-group-failed' },
]

const scanners = (count) => (count === 1 ? '1 scanner' : `${count} scanners`)

function failedNote(failed) {
  return failed === 1 ? "1 couldn't finish, so it doesn't count as a miss." : `${failed} couldn't finish, so they don't count as misses.`
}

function summaryOf(results) {
  const countOf = (status) => results.filter((result) => result.status === status).length
  const total = results.length
  const caught = countOf(STATUS.DETECTED)
  const missed = countOf(STATUS.SILENT)
  const failed = countOf(STATUS.ERROR)

  if (total === 0) return { headline: 'No scanner results for this problem', detail: '' }
  if (failed === total) {
    return {
      headline:
        total === 1
          ? "The scanner couldn't finish, so we don't know if it would catch this problem"
          : `None of the ${total} scanners could finish, so we don't know if they would catch this problem`,
      detail: '',
    }
  }
  if (missed === total) {
    return { headline: total === 1 ? 'The scanner missed this problem' : `All ${total} scanners missed this problem`, detail: '' }
  }
  if (caught === total) {
    return { headline: total === 1 ? 'The scanner caught this problem' : `All ${total} scanners caught this problem`, detail: '' }
  }

  const failedDetail = failed > 0 ? ` ${failedNote(failed)}` : ''
  if (missed > 0) {
    const caughtDetail = caught > 0 ? `${caught} caught it.` : 'None caught it.'
    return { headline: `${missed} of ${scanners(total)} missed this problem`, detail: `${caughtDetail}${failedDetail}` }
  }
  return { headline: `${caught} of ${scanners(total)} caught this problem`, detail: `None missed it.${failedDetail}` }
}

function comparisonRows(before, after) {
  const rows = []
  let removed = []
  let added = []
  const flushChange = () => {
    const length = Math.max(removed.length, added.length)
    for (let index = 0; index < length; index += 1) {
      rows.push({ changed: true, safe: removed[index], hidden: added[index], startsChange: index === 0 })
    }
    removed = []
    added = []
  }
  for (const line of lineDiff(before, after)) {
    if (line.type === 'removed') removed.push(line.text)
    else if (line.type === 'added') added.push(line.text)
    else {
      flushChange()
      rows.push({ changed: false, safe: line.text, hidden: line.text, startsChange: false })
    }
  }
  flushChange()
  return rows
}

function differingPart(text, otherText) {
  if (otherText === undefined) return { start: text, changed: '', end: '' }
  let prefix = 0
  while (prefix < text.length && text[prefix] === otherText[prefix]) prefix += 1
  let suffix = 0
  while (
    suffix < text.length - prefix &&
    suffix < otherText.length - prefix &&
    text[text.length - 1 - suffix] === otherText[otherText.length - 1 - suffix]
  ) {
    suffix += 1
  }
  return {
    start: text.slice(0, prefix),
    changed: text.slice(prefix, text.length - suffix),
    end: text.slice(text.length - suffix),
  }
}

function CodeLine({ text, otherText, changed }) {
  if (text === undefined) return <span className="fault-code-line fault-code-absent">Not in this version</span>
  if (!changed) {
    return (
      <span className="fault-code-line">
        <span className="fault-code-gutter" aria-hidden="true">
          {' '}
        </span>
        {text}
      </span>
    )
  }
  const { start, changed: changedPart, end } = differingPart(text, otherText)
  return (
    <span className="fault-code-line fault-code-changed">
      <span className="fault-code-gutter" aria-hidden="true">
        ›
      </span>
      <span className="fault-visually-hidden">Changed: </span>
      {start}
      {changedPart && <mark>{changedPart}</mark>}
      {end}
    </span>
  )
}

function CodeSide({ label, rows, side, otherSide, wrap }) {
  return (
    <div className="fault-code-side">
      <h3>{label}</h3>
      <pre className={wrap ? 'fault-code fault-code-wrapped' : 'fault-code'} tabIndex={0} aria-label={label}>
        {rows.map((row, index) => (
          <span key={index}>
            {wrap && index > 0 && row.startsChange && <span className="fault-code-gap" aria-hidden="true">⋯</span>}
            <CodeLine text={row[side]} otherText={row[otherSide]} changed={row.changed} />
          </span>
        ))}
      </pre>
    </div>
  )
}

function CodeComparison({ rows, wrap }) {
  return (
    <div className="fault-code-sides">
      <CodeSide label="Safe version" rows={rows} side="safe" otherSide="hidden" wrap={wrap} />
      <CodeSide label="With the hidden problem" rows={rows} side="hidden" otherSide="safe" wrap={wrap} />
    </div>
  )
}

function CodeChange({ clean, faulty }) {
  const rows = comparisonRows(clean, faulty)
  const changedRows = rows.filter((row) => row.changed)
  return (
    <section className="fault-section">
      <h2>What we changed in the code</h2>
      {changedRows.length === 0 ? (
        <p className="fault-note">The two versions have no differences.</p>
      ) : (
        <CodeComparison rows={changedRows} wrap />
      )}
      <details className="fault-expert">
        <summary>See the whole file</summary>
        <CodeComparison rows={rows} wrap={false} />
      </details>
    </section>
  )
}

function FindingFacts({ finding }) {
  return (
    <dl className="fault-facts">
      <dt>Rule ID</dt>
      <dd className="mono">{finding.ruleId}</dd>
      {finding.resource && (
        <>
          <dt>Resource</dt>
          <dd className="mono">{finding.resource}</dd>
        </>
      )}
      {finding.severity !== null && (
        <>
          <dt>Severity</dt>
          <dd>{finding.severity}</dd>
        </>
      )}
      {finding.line !== null && (
        <>
          <dt>Line</dt>
          <dd className="mono">{finding.line}</dd>
        </>
      )}
    </dl>
  )
}

function ScannerResult({ result, tool }) {
  const finished = result.status !== STATUS.ERROR
  return (
    <li className="fault-scanner">
      <strong className="fault-scanner-name">{tool.name}</strong>
      {result.newFindings.length > 0 && (
        <ul className="fault-warnings">
          {result.newFindings.map((finding) => (
            <li key={`${finding.ruleId}-${finding.resource}`}>
              {finding.message || 'This scanner gave a warning with no description.'}
            </li>
          ))}
        </ul>
      )}
      <details className="fault-expert">
        <summary>Technical details</summary>
        <dl className="fault-facts">
          <dt>Scanner version</dt>
          <dd className="mono">{tool.version}</dd>
          {finished && (
            <>
              <dt>Warnings on the safe version</dt>
              <dd className="mono">{result.cleanFindingCount}</dd>
            </>
          )}
          {result.errorMessage && (
            <>
              <dt>What went wrong</dt>
              <dd className="mono">{result.errorMessage}</dd>
            </>
          )}
        </dl>
        {result.newFindings.map((finding) => (
          <FindingFacts key={`${finding.ruleId}-${finding.resource}`} finding={finding} />
        ))}
      </details>
    </li>
  )
}

function ResultGroup({ group, results, tools }) {
  const toolFor = (toolId) => tools.find((tool) => tool.id === toolId)
  return (
    <div className={`fault-group ${group.className}`}>
      <h3 className="fault-group-head">
        <Status value={group.status} />
        <span>{scanners(results.length)}</span>
      </h3>
      <p className="fault-note">{group.meaning}</p>
      <ul className="fault-scanners">
        {results.map((result) => (
          <ScannerResult key={result.toolId} result={result} tool={toolFor(result.toolId)} />
        ))}
      </ul>
    </div>
  )
}

function BackLink() {
  return (
    <a className="fault-back" href="#/">
      <span aria-hidden="true">←</span> Back to all results
    </a>
  )
}

function Unavailable({ title, children }) {
  return (
    <div className="fault">
      <BackLink />
      <Notice title={title}>{children}</Notice>
    </div>
  )
}

export function FaultDetail({ id }) {
  const load = useCallback(() => Promise.all([getCase(id), getBenchmark()]), [id])
  const request = useRequest(load)

  if (request.status === 'loading') return <p className="empty">Loading this hidden problem…</p>
  if (request.status === 'failed') {
    if (request.error.code === CASE_NOT_FOUND) {
      return <Unavailable title="We can't find this problem">It isn't in the latest results.</Unavailable>
    }
    if (request.error.code === NO_RUN) {
      return <Unavailable title="No results yet">The scanners haven't been run yet.</Unavailable>
    }
    return (
      <div className="fault">
        <BackLink />
        <FailedNotice error={request.error} retry={request.retry} />
      </div>
    )
  }

  const [{ title, requirement, clean, faulty, results }, { tools }] = request.data
  const { headline, detail } = summaryOf(results)
  const groups = RESULT_GROUPS.map((group) => ({
    group,
    members: results.filter((result) => result.status === group.status),
  })).filter(({ members }) => members.length > 0)

  return (
    <article className="fault">
      <BackLink />
      <header className="fault-header">
        <p className="fault-eyebrow">Hidden problem</p>
        <h1>{title}</h1>
        <p className="fault-summary">{headline}</p>
        {detail && <p className="fault-summary-detail">{detail}</p>}
        <p className="fault-note">
          We hid this problem in cloud setup code (Terraform), then ran each scanner on the safe version and on the
          version with the hidden problem.
        </p>
      </header>

      <section className="fault-section fault-rule">
        <h2>The security rule this breaks</h2>
        <p className="fault-rule-text">{requirement.text}</p>
        <p className="fault-rule-source">
          Source: {requirement.source} <span className="mono">{requirement.ref}</span>
        </p>
      </section>

      {groups.length > 0 && (
        <section className="fault-section">
          <h2>What each scanner did</h2>
          <div className="fault-groups">
            {groups.map(({ group, members }) => (
              <ResultGroup key={group.status} group={group} results={members} tools={tools} />
            ))}
          </div>
        </section>
      )}

      <CodeChange clean={clean} faulty={faulty} />

      <p className="fault-limits">
        We hid these problems ourselves, so these results don't predict how often a scanner catches problems in real
        use. These are code scanners, not complete compliance products.
      </p>

      <footer className="fault-next">
        <BackLink />
        <a className="button" href="#/try">
          Try it yourself
        </a>
      </footer>
    </article>
  )
}
