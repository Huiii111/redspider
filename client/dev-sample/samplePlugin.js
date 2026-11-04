const CLEAN = `resource "sample_bucket" "records" {
  name       = "sample-records"
  public     = false
  encrypted  = true
}
`

const FAULTY = `resource "sample_bucket" "records" {
  name       = "sample-records"
  public     = true
  encrypted  = true
}
`

const TOOLS = [
  { id: 'scanner-a', name: 'Scanner A', version: 'v0.0-sample', license: 'Sample', terragoatFindings: 300 },
  { id: 'scanner-b', name: 'Scanner B', version: 'v0.0-sample', license: 'Sample', terragoatFindings: 200 },
  { id: 'scanner-c', name: 'Scanner C', version: 'v0.0-sample', license: 'Sample', terragoatFindings: 100 },
]

const MATRIX = [
  ['Sample fault one, a long plain-English title to test wrapping', 'DETECTED', 'DETECTED', 'DETECTED'],
  ['Sample fault two', 'SILENT', 'DETECTED', 'DETECTED'],
  ['Sample fault three', 'DETECTED', 'SILENT', 'ERROR'],
  ['Sample fault four', 'SILENT', 'SILENT', 'SILENT'],
  ['Sample fault five', 'DETECTED', 'DETECTED', 'SILENT'],
  ['Sample fault six', 'SILENT', 'SILENT', 'DETECTED'],
  ['Sample fault seven', 'ERROR', 'DETECTED', 'DETECTED'],
  ['Sample fault eight', 'DETECTED', 'SILENT', 'SILENT'],
  ['Sample fault nine', 'SILENT', 'SILENT', 'ERROR'],
  ['Sample fault ten', 'DETECTED', 'DETECTED', 'DETECTED'],
]

const REQUIREMENT = { source: 'Sample source', ref: '0.0', text: 'Sample requirement text for layout work.' }

const faults = MATRIX.map(([title, ...cells], index) => ({
  id: `sample-${index + 1}`,
  title,
  requirement: { source: REQUIREMENT.source, ref: REQUIREMENT.ref },
  results: Object.fromEntries(TOOLS.map((tool, column) => [tool.id, cells[column]])),
}))

const countFor = (toolId, status) => faults.filter((fault) => fault.results[toolId] === status).length

const heuristicTool = TOOLS[0]
const missedByHeuristic = faults.filter((fault) => fault.results[heuristicTool.id] === 'SILENT')

const benchmark = {
  runId: 'sample',
  ranAt: new Date().toISOString(),
  corpus: { source: 'Sample faults for layout work', planted: true, faultCount: faults.length },
  heuristic: {
    rule: 'Tool with the most findings on a sample repository',
    toolId: heuristicTool.id,
    missed: missedByHeuristic.length,
    caughtByAnotherTool: missedByHeuristic.filter((fault) => Object.values(fault.results).includes('DETECTED')).length,
  },
  tools: TOOLS.map((tool) => ({
    ...tool,
    detected: countFor(tool.id, 'DETECTED'),
    silent: countFor(tool.id, 'SILENT'),
    error: countFor(tool.id, 'ERROR'),
  })),
  faults,
}

const finding = (toolId) => ({
  toolId,
  ruleId: 'SAMPLE-001',
  resource: 'sample_bucket.records',
  severity: null,
  message: 'Sample finding for layout work.',
  line: 3,
})

function caseFor(id) {
  const fault = faults.find((candidate) => candidate.id === id)
  if (!fault) return null
  return {
    id,
    title: fault.title,
    requirement: REQUIREMENT,
    clean: CLEAN,
    faulty: FAULTY,
    results: TOOLS.map((tool) => {
      const status = fault.results[tool.id]
      return {
        toolId: tool.id,
        status,
        newFindings: status === 'DETECTED' ? [finding(tool.id)] : [],
        cleanFindingCount: 0,
      }
    }),
  }
}

const scanResponse = {
  scanId: 'sample',
  timeoutSeconds: 30,
  results: [
    { toolId: 'scanner-a', status: 'NOTICED', newFindings: [finding('scanner-a')], durationMs: 1200 },
    { toolId: 'scanner-b', status: 'SILENT', newFindings: [], durationMs: 2300 },
    { toolId: 'scanner-c', status: 'ERROR', newFindings: [], durationMs: 800, errorMessage: 'Sample tool failure.' },
  ],
}

const health = {
  tools: TOOLS.map(({ id, name, version }) => ({ id, name, available: true, version })),
}

const SCAN_DELAY_MS = 1500

function send(response, status, body) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(body))
}

export function samplePlugin() {
  return {
    name: 'sample-api',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const caseMatch = request.url.match(/^\/api\/cases\/(.+)$/)
        if (request.url === '/api/health') return send(response, 200, health)
        if (request.url === '/api/benchmark') return send(response, 200, benchmark)
        if (caseMatch) {
          const found = caseFor(decodeURIComponent(caseMatch[1]))
          return found
            ? send(response, 200, found)
            : send(response, 404, { error: { code: 'CASE_NOT_FOUND', message: 'No sample fault has this ID.' } })
        }
        if (request.url === '/api/scan') {
          request.resume()
          return request.on('end', () => setTimeout(() => send(response, 200, scanResponse), SCAN_DELAY_MS))
        }
        return next()
      })
    },
  }
}
