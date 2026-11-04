export class ApiError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

export const NO_RUN = 'NO_RUN'
const UNREACHABLE = 'UNREACHABLE'

async function request(path, options) {
  let response
  let body
  try {
    response = await fetch(path, options)
    body = await response.json()
  } catch {
    throw new ApiError(UNREACHABLE, "Can't reach the server. Check that it's running, then try again.")
  }

  if (!response.ok) throw new ApiError(body.error.code, body.error.message)
  return body
}

export const getHealth = () => request('/api/health')
export const getBenchmark = () => request('/api/benchmark')
export const getCase = (id) => request(`/api/cases/${encodeURIComponent(id)}`)
export const postScan = (before, after) =>
  request('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ before, after }),
  })
