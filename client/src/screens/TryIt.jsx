import { useEffect, useState } from 'react'
import { ApiError, getBenchmark, getCase, getHealth, NO_RUN, postScan } from '../api.js'
import { FailedNotice } from '../components/Notice.jsx'
import { Status } from '../components/Status.jsx'
import { STATUS } from '../lib/grid.js'
import { useRequest } from '../lib/useRequest.js'

async function loadStart() {
  const { tools } = await getHealth()
  try {
    const { faults } = await getBenchmark()
    return { tools, example: await getCase(faults[0].id) }
  } catch (error) {
    if (error instanceof ApiError && error.code === NO_RUN) return { tools, example: null }
    throw error
  }
}

function useElapsedSeconds(running) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!running) return undefined
    const started = Date.now()
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250)
    return () => {
      clearInterval(timer)
      setSeconds(0)
    }
  }, [running])
  return seconds
}

function ScanResult({ result, toolName, stale }) {
  return (
    <li className={stale ? 'tool-result stale' : 'tool-result'}>
      <div className="tool-result-head">
        <strong>{toolName}</strong>
        <Status value={result.status} />
        <span className="mono tool-meta">{(result.durationMs / 1000).toFixed(1)} s</span>
      </div>
      {result.status === STATUS.SILENT && <p>Ran on both versions and reported nothing new.</p>}
      {result.status === STATUS.ERROR && <p>{result.errorMessage}</p>}
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

function Scanner({ tools, example }) {
  const [before, setBefore] = useState(example ? example.clean : '')
  const [after, setAfter] = useState(example ? example.clean : '')
  const [scan, setScan] = useState({ status: 'idle' })
  const running = scan.status === 'running'
  const elapsed = useElapsedSeconds(running)
  const available = tools.filter((tool) => tool.available)
  const unavailable = tools.filter((tool) => !tool.available)
  const nameOf = (toolId) => tools.find((tool) => tool.id === toolId).name
  const stale = scan.status === 'done' && (scan.before !== before || scan.after !== after)

  async function runScan() {
    setScan({ status: 'running' })
    try {
      setScan({ status: 'done', before, after, response: await postScan(before, after) })
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      setScan({ status: 'failed', message: error.message })
    }
  }

  return (
    <>
      <section className="verdict compact">
        <h1>Change the Terraform and see which tools notice</h1>
        <p className="reason">
          Each tool scans both versions. A tool notices your change only if it reports something new on the
          second version.
        </p>
      </section>

      <div className="editors">
        <label>
          <span>Before</span>
          <textarea id="before" spellCheck="false" value={before} onChange={(event) => setBefore(event.target.value)} />
        </label>
        <label>
          <span>After</span>
          <textarea id="after" spellCheck="false" value={after} onChange={(event) => setAfter(event.target.value)} />
        </label>
      </div>

      <div className="actions">
        <button type="button" className="button" disabled={running || before === after} onClick={runScan}>
          {before === after ? 'Change the After version to scan' : 'Scan my change'}
        </button>
        {example && (
          <button type="button" className="filter" disabled={running} onClick={() => setAfter(example.faulty)}>
            Plant a fault: {example.title}
          </button>
        )}
        {running && (
          <span className="progress" role="status">
            Scanning with {available.map((tool) => tool.name).join(', ')}… <span className="mono">{elapsed} s</span>
          </span>
        )}
      </div>

      {unavailable.length > 0 && (
        <p className="scope">Not available on this server: {unavailable.map((tool) => tool.name).join(', ')}.</p>
      )}
      {scan.status === 'failed' && <p className="inline-error" role="alert">{scan.message}</p>}

      {scan.status === 'done' && (
        <section aria-live="polite">
          {stale && <p className="inline-error">You've edited the Terraform, so these results are out of date.</p>}
          <ul className="tool-results">
            {scan.response.results.map((result) => (
              <ScanResult key={result.toolId} result={result} toolName={nameOf(result.toolId)} stale={stale} />
            ))}
          </ul>
          <p className="scope">
            Each tool gets {scan.response.timeoutSeconds} seconds, a limit we chose. A tool that runs out of time
            shows Error, not Silent.
          </p>
        </section>
      )}
    </>
  )
}

export function TryIt() {
  const result = useRequest(loadStart)
  if (result.status === 'loading') return <p className="empty">Loading…</p>
  if (result.status === 'failed') return <FailedNotice error={result.error} retry={result.retry} />
  return <Scanner tools={result.data.tools} example={result.data.example} />
}
