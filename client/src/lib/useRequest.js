import { useCallback, useEffect, useState } from 'react'

export function useRequest(load) {
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    load().then(
      (data) => current && setState({ status: 'ready', data }),
      (error) => current && setState({ status: 'failed', error }),
    )
    return () => {
      current = false
    }
  }, [load, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  return { ...state, retry }
}
