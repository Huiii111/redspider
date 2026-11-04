import { useMemo, useState } from 'react'
import { getBenchmark, NO_RUN } from '../api.js'
import { FailedNotice, Notice } from '../components/Notice.jsx'
import { Status } from '../components/Status.jsx'
import { StatusKey } from '../components/StatusKey.jsx'
import {
  BENCHMARK_RESULT_WORDS,
  emptyFilterMessage,
  FILTERS,
  filterCounts,
  filterFaults,
  mostWarningsScanner,
  verdictCopy,
} from '../lib/grid.js'
import { useRequest } from '../lib/useRequest.js'

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function TryYourOwn() {
  return (
    <a className="button" href="#/try">
      Try it on your own code
    </a>
  )
}

function HowTheTestWorks({ faultCount, scannerCount }) {
  return (
    <section className="test-steps" aria-labelledby="test-steps-title">
      <h2 id="test-steps-title">How the test works</h2>
      <ol>
        <li>
          <strong>Hide a problem</strong>
          <span>We hid {faultCount} known security problems in cloud setup code (Terraform), one at a time.</span>
        </li>
        <li>
          <strong>Run every scanner</strong>
          <span>{scannerCount} security scanners checked the code with each problem and without it.</span>
        </li>
        <li>
          <strong>See who caught it</strong>
          <span>A scanner caught a problem only if it gave a new warning once the problem was there.</span>
        </li>
      </ol>
    </section>
  )
}

function RunDetails({ benchmark }) {
  const { ranAt, corpus, tools, heuristic } = benchmark
  return (
    <section className="run-details" aria-labelledby="run-details-title">
      <h2 id="run-details-title">Run details</h2>
      <dl>
        <div>
          <dt>Run on</dt>
          <dd>{formatDate(ranAt)}</dd>
        </div>
        <div>
          <dt>Hidden problems from</dt>
          <dd>{corpus.source}</dd>
        </div>
        <div>
          <dt>Scanner versions</dt>
          <dd className="mono">{tools.map((tool) => `${tool.name} ${tool.version}`).join(' · ')}</dd>
        </div>
        <div>
          <dt>Warnings on the test project</dt>
          <dd className="mono">{tools.map((tool) => `${tool.name} ${tool.terragoatFindings}`).join(' · ')}</dd>
        </div>
        <div>
          <dt>Rule for the scanner in the headline</dt>
          <dd className="mono">{heuristic.rule}</dd>
        </div>
      </dl>
    </section>
  )
}

function ScannerHeading({ tool, faultCount, mostWarnings }) {
  return (
    <th scope="col">
      <span className="tool-name">{tool.name}</span>
      {mostWarnings && (
        <span className="most-warnings">{mostWarnings.sharedTop ? 'Tied for most warnings' : 'Most warnings'}</span>
      )}
      <span className="tool-meta">
        Missed <strong>{tool.silent}</strong> of {faultCount}
      </span>
      {tool.error > 0 && <span className="tool-meta">Couldn't finish {tool.error}</span>}
    </th>
  )
}

function Grid({ benchmark, faults }) {
  const { tools, corpus } = benchmark
  const mostWarnings = mostWarningsScanner(benchmark)
  return (
    <div className="grid-scroll" tabIndex={0} role="region" aria-label="Hidden problems and what each scanner did">
      <table className="grid">
        <thead>
          <tr>
            <th scope="col" className="grid-corner">
              <span className="grid-corner-title">Hidden problem</span>
              <span className="tool-meta">Open any row to see the code</span>
            </th>
            {tools.map((tool) => (
              <ScannerHeading
                key={tool.id}
                tool={tool}
                faultCount={corpus.faultCount}
                mostWarnings={tool.id === mostWarnings.scanner.id ? mostWarnings : null}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {faults.map((fault) => (
            <tr key={fault.id}>
              <th scope="row">
                <a className="row-link" href={`#/fault/${fault.id}`}>
                  <span className="row-link-title">{fault.title}</span>
                  <span className="row-link-arrow" aria-hidden="true">
                    ›
                  </span>
                </a>
                <span className="fault-ref mono">
                  Breaks {fault.requirement.source} {fault.requirement.ref}
                </span>
              </th>
              {tools.map((tool) => (
                <td key={tool.id}>
                  <a
                    className="cell-link"
                    href={`#/fault/${fault.id}`}
                    aria-label={`${tool.name}, ${fault.title}: ${BENCHMARK_RESULT_WORDS[fault.results[tool.id]]}`}
                  >
                    <Status value={fault.results[tool.id]} />
                  </a>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Benchmark({ benchmark }) {
  const [filter, setFilter] = useState('all')
  const { corpus, faults, tools } = benchmark
  const counts = useMemo(() => filterCounts(faults), [faults])
  const visible = useMemo(() => filterFaults(faults, filter), [faults, filter])
  const { headline, reason } = verdictCopy(benchmark)

  return (
    <>
      <div className="results-intro">
        <section className="verdict">
          <h1>{headline}</h1>
          <p className="reason">{reason}</p>
          <div className="next-step">
            <TryYourOwn />
            <span>Change some code and see which scanners notice.</span>
          </div>
        </section>
        <HowTheTestWorks faultCount={corpus.faultCount} scannerCount={tools.length} />
      </div>

      <p className="scope">
        We hid these {corpus.faultCount} problems ourselves, so these results don't predict how often a scanner catches
        problems in real projects. These are code scanners, not complete compliance products.
      </p>

      <div className="grid-guide">
        <div className="filters" role="group" aria-label="Show hidden problems">
          {FILTERS.map(({ id, label }) => (
            <button
              type="button"
              key={id}
              className="filter"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label} <span className="filter-count mono">{counts[id]}</span>
            </button>
          ))}
        </div>
        <StatusKey />
      </div>

      {visible.length === 0 ? (
        <div className="filter-empty">
          <p>{emptyFilterMessage(filter, counts)}</p>
          <button type="button" className="filter" onClick={() => setFilter('all')}>
            Show all hidden problems
          </button>
        </div>
      ) : (
        <Grid benchmark={benchmark} faults={visible} />
      )}

      <RunDetails benchmark={benchmark} />
    </>
  )
}

function NoResultsYet() {
  return (
    <Notice title="No test results yet" action={<TryYourOwn />}>
      Results appear here once every scanner has been run against the hidden problems. You can already try the scanners
      on your own cloud setup code (Terraform).
    </Notice>
  )
}

export function Results() {
  const result = useRequest(getBenchmark)

  if (result.status === 'loading') return <p className="empty">Loading results…</p>
  if (result.status === 'ready') {
    if (result.data.faults.length === 0) return <NoResultsYet />
    return <Benchmark benchmark={result.data} />
  }
  if (result.error.code === NO_RUN) return <NoResultsYet />
  return <FailedNotice error={result.error} retry={result.retry} />
}
