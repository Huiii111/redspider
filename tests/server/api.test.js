import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../server/app.js'

const finding = { toolId: 'fake', ruleId: 'R1', resource: 'a.b', severity: null, message: 'm', line: 1 }
const MAX_BYTES = 1000

const health = [{ id: 'fake', name: 'Fake', available: true, version: '1.0.0' }]
const stored = {
  summary: { runId: 'r1', faults: [{ id: 'f1' }] },
  cases: { f1: { id: 'f1', title: 'Fault one' } },
}

function start(overrides) {
  const app = createApp({
    health: () => health,
    loadRun: async () => stored,
    syntaxError: async () => null,
    scanPair: async () => [{ toolId: 'fake', status: 'NOTICED', newFindings: [finding], durationMs: 5 }],
    limits: { maxTerraformBytes: MAX_BYTES, scanTimeoutSeconds: 30 },
    ...overrides,
  })
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server))
  })
}

const url = (server, path) => `http://127.0.0.1:${server.address().port}${path}`
const post = (server, body) =>
  fetch(url(server, '/api/scan'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('API contract', () => {
  let server
  beforeAll(async () => {
    server = await start({})
  })
  afterAll(() => server.close())

  it('lists tools on health', async () => {
    const response = await fetch(url(server, '/api/health'))
    expect(await response.json()).toEqual({ tools: health })
  })

  it('serves the stored summary without the case details', async () => {
    const body = await (await fetch(url(server, '/api/benchmark'))).json()
    expect(body.runId).toBe('r1')
    expect(body.cases).toBeUndefined()
  })

  it('serves one case', async () => {
    const body = await (await fetch(url(server, '/api/cases/f1'))).json()
    expect(body.title).toBe('Fault one')
  })

  it('returns a named error for an unknown case', async () => {
    const response = await fetch(url(server, '/api/cases/nope'))
    expect(response.status).toBe(404)
    expect((await response.json()).error.code).toBe('CASE_NOT_FOUND')
  })

  it('returns scan results with the timeout shown to viewers', async () => {
    const body = await (await post(server, { before: 'a', after: 'b' })).json()
    expect(body.timeoutSeconds).toBe(30)
    expect(body.results[0].status).toBe('NOTICED')
  })

  it('rejects a missing field', async () => {
    const response = await post(server, { before: 'a' })
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('INVALID_INPUT')
  })

  it('rejects oversized Terraform', async () => {
    const response = await post(server, { before: 'a', after: 'x'.repeat(MAX_BYTES + 1) })
    expect(response.status).toBe(413)
    expect((await response.json()).error.code).toBe('INPUT_TOO_LARGE')
  })

  it('rejects a body too large to parse with the same error', async () => {
    const response = await post(server, { before: 'a', after: 'x'.repeat(MAX_BYTES * 10) })
    expect(response.status).toBe(413)
    expect((await response.json()).error.code).toBe('INPUT_TOO_LARGE')
  })
})

describe('API failure states', () => {
  it('says no run exists instead of returning sample data', async () => {
    const server = await start({ loadRun: async () => null })
    const response = await fetch(url(server, '/api/benchmark'))
    expect(response.status).toBe(503)
    expect((await response.json()).error.code).toBe('NO_RUN')
    server.close()
  })

  it('refuses Terraform that does not parse, so no tool can look silent on it', async () => {
    const server = await start({ syntaxError: async () => 'Line 2: expected a value' })
    const response = await post(server, { before: 'a', after: 'b' })
    expect(response.status).toBe(422)
    const { error } = await response.json()
    expect(error.code).toBe('INVALID_TERRAFORM')
    expect(error.message).toContain('Line 2')
    server.close()
  })
})
