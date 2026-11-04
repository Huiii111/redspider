import { HttpError } from './httpError.js'

const NO_RUN_MESSAGE = 'No benchmark has been run yet. Run npm run benchmark in the server folder.'

async function requireRun(loadRun) {
  const run = await loadRun()
  if (!run) throw new HttpError(503, 'NO_RUN', NO_RUN_MESSAGE)
  return run
}

export const benchmarkRoute = ({ loadRun }) => async (_request, response) => {
  const { summary } = await requireRun(loadRun)
  response.json(summary)
}

export const caseRoute = ({ loadRun }) => async (request, response) => {
  const { cases } = await requireRun(loadRun)
  const found = Object.hasOwn(cases, request.params.id) ? cases[request.params.id] : null
  if (!found) throw new HttpError(404, 'CASE_NOT_FOUND', `No planted fault has the ID ${request.params.id}.`)
  response.json(found)
}
