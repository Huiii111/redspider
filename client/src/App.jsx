import { useEffect, useState } from 'react'
import { FaultDetail } from './screens/FaultDetail.jsx'
import { Home } from './screens/Home.jsx'
import { Results } from './screens/Results.jsx'
import { TryIt } from './screens/TryIt.jsx'

const FAULT_ROUTE = /^#\/fault\/(.+)$/
const HOME_ROUTE = '#/home'

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
  const onHome = hash === HOME_ROUTE
  return (
    <>
      <header className={onHome ? 'topbar topbar-home' : 'topbar'}>
        <a className="wordmark" href={HOME_ROUTE}>
          Project <span>Red Spider</span>
        </a>
        <p className="product-line">
          We hide known security problems in cloud setup code, then run security scanners on it to see which problems
          each one misses.
        </p>
        <nav aria-label="Main">
          <a href="#/" aria-current={onTry || onHome ? undefined : 'page'}>
            Scanner results
          </a>
          <a href="#/try" aria-current={onTry ? 'page' : undefined}>
            Try the scanners yourself
          </a>
        </nav>
      </header>
      {onHome ? (
        <main>
          <Home />
        </main>
      ) : (
        <main className="page">
          <Screen hash={hash} />
        </main>
      )}
    </>
  )
}
