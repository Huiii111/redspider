import { useEffect, useState } from 'react'
import { FaultDetail } from './screens/FaultDetail.jsx'
import { Results } from './screens/Results.jsx'
import { TryIt } from './screens/TryIt.jsx'

const FAULT_ROUTE = /^#\/fault\/(.+)$/

function useHash() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash)
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

function Screen({ hash }) {
  const fault = hash.match(FAULT_ROUTE)
  if (fault) return <FaultDetail key={fault[1]} id={decodeURIComponent(fault[1])} />
  if (hash === '#/try') return <TryIt />
  return <Results />
}

export default function App() {
  const hash = useHash()
  const onTry = hash === '#/try'
  return (
    <>
      {import.meta.env.MODE === 'sample' && (
        <div className="sample-banner" role="alert">
          Sample data for layout work. These tools are fictional and these aren't benchmark results.
        </div>
      )}
      <header className="topbar">
        <a className="wordmark" href="#/">
          Red<span>Spider</span>
        </a>
        <span className="topbar-tagline">What open-source audit tools miss in Terraform</span>
        <nav aria-label="Main">
          <a href="#/" aria-current={onTry ? undefined : 'page'}>
            Results
          </a>
          <a href="#/try" aria-current={onTry ? 'page' : undefined}>
            Try it
          </a>
        </nav>
      </header>
      <main className="page">
        <Screen hash={hash} />
      </main>
    </>
  )
}
