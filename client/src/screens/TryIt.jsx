import { useEffect, useRef, useState } from 'react'
import { ApiError, getBenchmark, getCase, getHealth, NO_RUN, postScan } from '../api.js'
import { FailedNotice } from '../components/Notice.jsx'
import { Status } from '../components/Status.jsx'
import { STATUS } from '../lib/grid.js'
import { useRequest } from '../lib/useRequest.js'
import '../styles/tryit.css'

const PROBLEMS_SHOWN_FIRST = 5
const TOPBAR_CLEARANCE_PX = 72
const COMFORTABLE_VIEWPORT_SHARE = 0.6

const SCAN_FAILURE_COPY = {
  INVALID_TERRAFORM: {
    what: "The scanners couldn't read this code, so nothing was scanned.",
    next: 'Look for a missing bracket or quote near your last change, then scan again.',
  },
  INPUT_TOO_LARGE: {
    what: 'This code is too long to scan.',
    next: "Cut it down to the part you're testing, then scan again.",
  },
  BUSY: {
    what: 'Another scan is still running.',
    next: 'Wait a few seconds, then scan again.',
  },
  UNREACHABLE: {
    what: "The scan didn't reach the server.",
    next: 'Check that the server is running, then scan again.',
  },
}

const UNRECOGNISED_SCAN_FAILURE_COPY = {
  what: "The scan couldn't run.",
  next: 'Try scanning again. If it fails the same way, the exact message below says what went wrong.',
}

async function loadStart() {
  const { tools } = await getHealth()
  try {
    const { faults } = await getBenchmark()
    return { tools, faults }
  } catch (error) {
    if (error instanceof ApiError && error.code === NO_RUN) return { tools, faults: [] }
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

const scannerWord = (count) => (count === 1 ? 'scanner' : 'scanners')

function countByStatus(results) {
  const countOf = (status) => results.filter((result) => result.status === status).length
  return {
    total: results.length,
    noticed: countOf(STATUS.NOTICED),
    saidNothing: countOf(STATUS.SILENT),
    couldNotFinish: countOf(STATUS.ERROR),
  }
}

function answerHeadline({ total, noticed, couldNotFinish }) {
  if (noticed > 0) return `${noticed} of ${total} ${scannerWord(total)} noticed`
  if (couldNotFinish === total) return `None of the ${total} ${scannerWord(total)} could finish`
  return `None of the ${total} ${scannerWord(total)} noticed`
}

function answerBreakdown({ total, saidNothing, couldNotFinish }) {
  if (couldNotFinish === total) return "This scan can't tell you anything about this code. Try scanning again."
  const parts = []
  if (saidNothing > 0) parts.push(`${saidNothing} said nothing.`)
  if (couldNotFinish > 0) {
    parts.push(`${couldNotFinish} couldn't finish, which doesn't count against ${couldNotFinish === 1 ? 'it' : 'them'}.`)
  }
  return parts.join(' ')
}

function subjectOf(problem, before, after) {
  if (!problem) return 'Your change'
  const untouched = before === problem.clean && after === problem.faulty
  return untouched ? `Hidden problem: ${problem.title}` : `Your edited version of: ${problem.title}`
}

function whyScanIsBlocked({ running, noScanners, before, after }) {
  if (running) return 'A scan is running.'
  if (noScanners) return 'No scanners are available right now, so nothing can be scanned.'
  if (before === after && before.trim() === '') return 'Paste your code into both boxes to scan.'
  if (before === after) return 'The two versions are the same. Change one to scan.'
  return null
}

function ProblemPicker({ faults, chosenId, running, noScanners, onPick }) {
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? faults : faults.slice(0, PROBLEMS_SHOWN_FIRST)
  const hasMore = faults.length > PROBLEMS_SHOWN_FIRST

  return (
    <section className="try-picker" aria-labelledby="try-picker-heading">
      <h2 id="try-picker-heading">Pick a hidden problem</h2>
      <ul className="try-problems">
        {shown.map((fault) => {
          const chosen = fault.id === chosenId
          return (
            <li key={fault.id}>
              <button
                type="button"
                className={chosen ? 'try-problem chosen' : 'try-problem'}
                aria-current={chosen ? 'true' : undefined}
                disabled={running || noScanners}
                onClick={() => onPick(fault)}
              >
                <span className="try-problem-title">{fault.title}</span>
                <span className="try-problem-action">
                  {chosen && running ? 'Scanning…' : chosen ? 'Scan again' : 'Scan'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {hasMore && (
        <button
          type="button"
          className="try-show-more"
          aria-expanded={showAll}
          disabled={running}
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll ? 'Show fewer problems' : `Show all ${faults.length} problems`}
        </button>
      )}
    </section>
  )
}

function NoProblemsNotice() {
  return (
    <section className="try-picker">
      <h2>No hidden problems to pick yet</h2>
      <p className="try-picker-empty">
        The problems come from a finished benchmark run, and there isn't one on this server. You can still scan your
        own code below.
      </p>
    </section>
  )
}

function ScannerRow({ name, label, outOfDate, children }) {
  return (
    <li className={outOfDate ? 'try-scanner out-of-date' : 'try-scanner'}>
      <div className="try-scanner-head">
        <strong>{name}</strong>
        {label}
        {outOfDate && <span className="try-out-of-date-tag">Out of date</span>}
      </div>
      {children}
    </li>
  )
}

function ScanResultRow({ result, name, outOfDate }) {
  return (
    <ScannerRow name={name} label={<Status value={result.status} live />} outOfDate={outOfDate}>
      {result.status === STATUS.SILENT && (
        <p>
          It scanned both versions and gave no new warning. We don't call this a miss here, because a change you make
          may not be a problem at all.
        </p>
      )}
      {result.status === STATUS.ERROR && (
        <>
          <p>This scanner didn't finish, so this doesn't count against it.</p>
          <p className="try-expert">{result.errorMessage}</p>
        </>
      )}
      {result.newFindings.length > 0 && (
        <ul className="try-warnings">
          {result.newFindings.map((warning) => (
            <li key={`${warning.ruleId}-${warning.resource}`}>
              <p>{warning.message}</p>
              <p className="try-expert">
                Rule {warning.ruleId} on {warning.resource}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="try-duration">Took {(result.durationMs / 1000).toFixed(1)} s</p>
    </ScannerRow>
  )
}

function UnavailableRows({ tools }) {
  return tools.map((tool) => (
    <ScannerRow key={tool.id} name={tool.name} label={<span className="try-state">Not available</span>}>
      <p>This scanner can't run on this server, so it isn't part of the scan.</p>
      {tool.reason && <p className="try-expert">{tool.reason}</p>}
    </ScannerRow>
  ))
}

function WaitingRows({ tools, stateWord }) {
  return tools.map((tool) => (
    <ScannerRow key={tool.id} name={tool.name} label={<span className="try-state">{stateWord}</span>} />
  ))
}

function AnswerPanel({ panelRef, scan, tools, outOfDate, elapsed, idleHint }) {
  const available = tools.filter((tool) => tool.available)
  const reported = scan.status === 'done' ? scan.response.results : []
  const reportedIds = new Set(reported.map((result) => result.toolId))
  const unavailable = tools.filter((tool) => !tool.available && !reportedIds.has(tool.id))
  const nameOf = (toolId) => tools.find((tool) => tool.id === toolId).name
  const counts = countByStatus(reported)

  return (
    <section className="try-answer" ref={panelRef} aria-labelledby="try-answer-heading">
      <h2 id="try-answer-heading">Which scanners noticed?</h2>

      <div aria-live="polite" className="try-answer-summary">
        {scan.status === 'idle' && <p className="try-answer-idle">{idleHint}</p>}
        {scan.status === 'running' && (
          <>
            <p className="try-answer-line">
              Scanning… <span role="timer" className="mono">{elapsed} s</span>
            </p>
            <p className="try-answer-note">Each scanner reads both versions. This takes a few seconds, sometimes longer.</p>
          </>
        )}
        {scan.status === 'failed' && scan.stage === 'load' && (
          <>
            <p className="try-answer-line">This problem's code didn't load</p>
            <p className="try-answer-note">Pick it again, or pick another one.</p>
            <p className="try-expert">{scan.message}</p>
          </>
        )}
        {scan.status === 'failed' && scan.stage === 'scan' && (
          <>
            <p className="try-answer-line">No answer yet</p>
            <p className="try-answer-note">The scan couldn't run. The reason is next to the code.</p>
          </>
        )}
        {scan.status === 'done' && (
          <>
            {outOfDate && (
              <p className="try-out-of-date-banner">
                <strong>Out of date.</strong> You changed the code after this scan, so these answers are for the earlier
                version. Scan again to update them.
              </p>
            )}
            <p className="try-answer-subject">{scan.subject}</p>
            <p className="try-answer-line">{answerHeadline(counts)}</p>
            <p className="try-answer-note">{answerBreakdown(counts)}</p>
          </>
        )}
      </div>

      <ul className="try-scanners">
        {scan.status === 'done' ? (
          reported.map((result) => (
            <ScanResultRow key={result.toolId} result={result} name={nameOf(result.toolId)} outOfDate={outOfDate} />
          ))
        ) : (
          <WaitingRows tools={available} stateWord={scan.status === 'running' ? 'Scanning…' : 'Ready'} />
        )}
        <UnavailableRows tools={unavailable} />
      </ul>

      {scan.status === 'done' && (
        <p className="try-timeout">
          Each scanner gets up to {scan.response.timeoutSeconds} seconds, a limit we chose. One that runs out of time
          shows Couldn't finish.
        </p>
      )}
    </section>
  )
}

function ScanFailure({ failureRef, failure }) {
  const { what, next } = SCAN_FAILURE_COPY[failure.code] ?? UNRECOGNISED_SCAN_FAILURE_COPY
  return (
    <div className="try-failure" ref={failureRef} role="alert">
      <p className="try-failure-what">{what}</p>
      <p>{next} Your code is still here.</p>
      <p className="try-expert">Exact message: {failure.message}</p>
    </div>
  )
}

function CodeEditors({
  problem,
  before,
  after,
  onBeforeChange,
  onAfterChange,
  running,
  blockedReason,
  onScan,
  scan,
  failureRef,
  outOfDate,
  open,
  onToggle,
}) {
  const beforeLabel = problem ? 'The code without the problem' : 'Your code now'
  const afterLabel = problem ? 'The code with the hidden problem' : 'Your code with a change'

  return (
    <details className="try-code" open={open} onToggle={(event) => onToggle(event.currentTarget.open)}>
      <summary>{problem ? 'See or change the code for this problem' : 'Try your own code instead'}</summary>
      <div className="try-code-body">
        {problem && <p className="try-code-note">Picking a problem above replaces whatever is in these boxes.</p>}
        {scan.status === 'failed' && scan.stage === 'scan' && <ScanFailure failureRef={failureRef} failure={scan} />}
        <div className="editors try-editors">
          <label>
            <span>{beforeLabel}</span>
            <textarea
              id="before"
              spellCheck="false"
              readOnly={running}
              placeholder="Paste cloud setup code here"
              value={before}
              onChange={(event) => onBeforeChange(event.target.value)}
            />
          </label>
          <label>
            <span>{afterLabel}</span>
            <textarea
              id="after"
              spellCheck="false"
              readOnly={running}
              placeholder="Paste the same code with your change here"
              value={after}
              onChange={(event) => onAfterChange(event.target.value)}
            />
          </label>
        </div>
        <div className="try-code-actions">
          <button
            type="button"
            className="button"
            disabled={blockedReason !== null}
            aria-describedby={blockedReason ? 'try-scan-blocked' : undefined}
            onClick={onScan}
          >
            Scan these two versions
          </button>
          {blockedReason && (
            <span id="try-scan-blocked" className="try-blocked">
              {blockedReason}
            </span>
          )}
          {outOfDate && !running && (
            <span className="try-out-of-date-inline">
              <strong>Out of date:</strong> the answers shown are for the earlier version.
            </span>
          )}
        </div>
      </div>
    </details>
  )
}

function Scanner({ tools, faults }) {
  const [chosenId, setChosenId] = useState(null)
  const [problem, setProblem] = useState(null)
  const [before, setBefore] = useState('')
  const [after, setAfter] = useState('')
  const [scan, setScan] = useState({ status: 'idle' })
  const [codeOpen, setCodeOpen] = useState(faults.length === 0)
  const panelRef = useRef(null)
  const failureRef = useRef(null)

  const running = scan.status === 'running'
  const elapsed = useElapsedSeconds(running)
  const noScanners = !tools.some((tool) => tool.available)
  const outOfDate = scan.status === 'done' && (scan.before !== before || scan.after !== after)
  const blockedReason = whyScanIsBlocked({ running, noScanners, before, after })
  const scanFailed = scan.status === 'failed' && scan.stage === 'scan'

  useEffect(() => {
    if (scanFailed) failureRef.current.scrollIntoView({ block: 'center' })
  }, [scanFailed])

  function bringAnswerIntoView() {
    const { top } = panelRef.current.getBoundingClientRect()
    const comfortablyVisible = top >= TOPBAR_CLEARANCE_PX && top <= window.innerHeight * COMFORTABLE_VIEWPORT_SHARE
    if (!comfortablyVisible) panelRef.current.scrollIntoView({ block: 'start' })
  }

  function recordFailure(stage, error) {
    setScan({ status: 'failed', stage, code: error.code, message: error.message })
    if (stage === 'scan') setCodeOpen(true)
    if (!(error instanceof ApiError)) throw error
  }

  async function runScan(scannedBefore, scannedAfter, scannedProblem) {
    try {
      const response = await postScan(scannedBefore, scannedAfter)
      setScan({
        status: 'done',
        before: scannedBefore,
        after: scannedAfter,
        subject: subjectOf(scannedProblem, scannedBefore, scannedAfter),
        response,
      })
    } catch (error) {
      recordFailure('scan', error)
    }
  }

  async function pickProblem(fault) {
    setChosenId(fault.id)
    setScan({ status: 'running' })
    bringAnswerIntoView()
    let picked
    try {
      picked = await getCase(fault.id)
    } catch (error) {
      recordFailure('load', error)
      return
    }
    setProblem(picked)
    setBefore(picked.clean)
    setAfter(picked.faulty)
    await runScan(picked.clean, picked.faulty, picked)
  }

  function scanEditors() {
    setScan({ status: 'running' })
    bringAnswerIntoView()
    runScan(before, after, problem)
  }

  const idleHint = noScanners
    ? 'No scanners are available right now, so nothing can be scanned.'
    : faults.length > 0
      ? 'Pick a problem and the answer appears here.'
      : 'Scan your code and the answer appears here.'

  return (
    <div className="try">
      <section className="verdict compact">
        <h1>Hide a problem and see which scanners notice</h1>
        <p className="reason">
          We take cloud setup code (Terraform), hide one known security problem in it, then run every scanner on both
          versions. A scanner noticed if it gives a new warning on the second one.
        </p>
      </section>

      <div className="try-main">
        {faults.length > 0 ? (
          <ProblemPicker
            faults={faults}
            chosenId={chosenId}
            running={running}
            noScanners={noScanners}
            onPick={pickProblem}
          />
        ) : (
          <NoProblemsNotice />
        )}
        <AnswerPanel
          panelRef={panelRef}
          scan={scan}
          tools={tools}
          outOfDate={outOfDate}
          elapsed={elapsed}
          idleHint={idleHint}
        />
      </div>

      <CodeEditors
        problem={problem}
        before={before}
        after={after}
        onBeforeChange={setBefore}
        onAfterChange={setAfter}
        running={running}
        blockedReason={blockedReason}
        onScan={scanEditors}
        scan={scan}
        failureRef={failureRef}
        outOfDate={outOfDate}
        open={codeOpen}
        onToggle={setCodeOpen}
      />

      <p className="scope">
        We hid these problems ourselves, so results here don't predict how often a scanner catches real-world problems.
        These are code scanners, not complete compliance products.
      </p>
    </div>
  )
}

export function TryIt() {
  const result = useRequest(loadStart)
  if (result.status === 'loading') return <p className="empty">Loading…</p>
  if (result.status === 'failed') return <FailedNotice error={result.error} retry={result.retry} />
  return <Scanner tools={result.data.tools} faults={result.data.faults} />
}
