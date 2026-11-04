import { useMemo, useState } from 'react'
import { getBenchmark, NO_RUN } from '../api.js'
import { FailedNotice, Notice } from '../components/Notice.jsx'
import { Status } from '../components/Status.jsx'
import { FILTERS, filterCounts, filterFaults, verdictCopy } from '../lib/grid.js'
import { useRequest } from '../lib/useRequest.js'

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function Provenance({ benchmark }) {
  const { ranAt, corpus, tools } = benchmark
  return (
    <dl className="provenance">
      <div>
        <dt>Run</dt>
        <dd>{formatDate(ranAt)}</dd>
      </div>
      <div>
        <dt>Faults from</dt>
        <dd>{corpus.source}</dd>
      </div>
      <div>
        <dt>Tools</dt>
        <dd className="mono">{tools.map((tool) => `${tool.name} ${tool.version}`).join(' · ')}</dd>
      </div>
    </dl>
  )
}

function Grid({ tools, faults, faultCount }) {
  return (
    <div className="grid-scroll" tabIndex={0} role="region" aria-label="Planted faults by tool">
      <table className="grid">
        <thead>
          <tr>
            <th scope="col" className="grid-corner">
              Planted fault
            </th>
            {tools.map((tool) => (
              <th scope="col" key={tool.id}>
                <span className="tool-name">{tool.name}</span>
                <span className="tool-meta mono">{tool.version}</span>
                <span className="tool-meta">
                  silent on <strong>{tool.silent}</strong> of {faultCount}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {faults.map((fault) => (
            <tr key={fault.id}>
              <th scope="row">
                <a href={`#/fault/${fault.id}`}>{fault.title}</a>
                <span className="fault-ref mono">
                  {fault.requirement.source} {fault.requirement.ref}
                </span>
              </th>
              {tools.map((tool) => (
                <td key={tool.id}>
                  <a
                    className="cell-link"
                    href={`#/fault/${fault.id}`}
                    aria-label={`${tool.name}, ${fault.title}: ${fault.results[tool.id]}`}
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
      <section className="verdict">
        <h1>{headline}</h1>
        <p className="reason">{reason}</p>
        <a className="button" href="#/try">
          Try it on your own Terraform
        </a>
      </section>

      <Provenance benchmark={benchmark} />

      <div className="filters" role="group" aria-label="Filter faults">
        {FILTERS.map(({ id, label }) => (
          <button
            type="button"
            key={id}
            className="filter"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label} <span className="mono">{counts[id]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="empty">No faults match this filter.</p>
      ) : (
        <Grid tools={tools} faults={visible} faultCount={corpus.faultCount} />
      )}

      <p className="scope">
        Covers {corpus.faultCount} faults we planted in AWS Terraform, so it says nothing about how often these
        tools catch faults in real code. These are open-source code scanners, not complete GRC platforms. A
        silent result means the tool ran and reported nothing new on this fault.
      </p>
    </>
  )
}

export function Results() {
  const result = useRequest(getBenchmark)

  if (result.status === 'loading') return <p className="empty">Loading results…</p>
  if (result.status === 'ready') return <Benchmark benchmark={result.data} />
  if (result.error.code === NO_RUN) {
    return (
      <Notice
        title="No benchmark results yet"
        action={
          <a className="button" href="#/try">
            Try it on your own Terraform
          </a>
        }
      >
        Results appear here after the first full run. You can still compare the tools on your own Terraform.
      </Notice>
    )
  }
  return <FailedNotice error={result.error} retry={result.retry} />
}
