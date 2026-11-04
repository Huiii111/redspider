import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { config } from '../config.js'
import { summarizeRun } from '../core/benchmark.js'
import { gradeFault } from '../core/grade.js'
import { heldOutCaseSchema } from '../core/models.js'
import { scanExistingDirectory, scanTerraform } from '../sandbox/scanner.js'
import { probeTool } from '../sandbox/toolbox.js'
import { tools } from '../tools.js'

const CASE_FOLDER = /^case-/
const CORPUS_SOURCE = 'Planted by a separate agent from CIS and AWS requirement text'

async function loadHeldOutCases() {
  const folders = (await readdir(config.heldOutDir)).filter((name) => CASE_FOLDER.test(name)).sort()
  return Promise.all(
    folders.map(async (folder) => {
      const read = (name) => readFile(join(config.heldOutDir, folder, name), 'utf8')
      const metadata = heldOutCaseSchema.parse(JSON.parse(await read('case.json')))
      return { ...metadata, clean: await read('clean.tf'), faulty: await read('faulty.tf') }
    }),
  )
}

async function runCase(faultCase) {
  const entries = await Promise.all(
    tools.map(async (tool) => {
      const [clean, faulty] = await Promise.all([
        scanTerraform(tool, faultCase.clean),
        scanTerraform(tool, faultCase.faulty),
      ])
      return [tool.adapter.id, { clean, faulty }]
    }),
  )
  return Object.fromEntries(entries)
}

function caseDetail(faultCase, runs) {
  const { id, title, requirement, clean, faulty } = faultCase
  return {
    id,
    title,
    requirement,
    clean,
    faulty,
    results: Object.entries(runs).map(([toolId, run]) => ({ toolId, ...gradeFault(run.clean, run.faulty) })),
  }
}

async function countTerragoatFindings() {
  const entries = await Promise.all(
    tools.map(async (tool) => {
      const run = await scanExistingDirectory(tool, config.terragoatDir)
      if (!run.ok) throw new Error(`${tool.adapter.name} failed on TerraGoat: ${run.errorMessage}`)
      return [tool.adapter.id, run.findings.length]
    }),
  )
  return Object.fromEntries(entries)
}

const toolSummaries = await Promise.all(tools.map(probeTool))
const heldOutCases = await loadHeldOutCases()
const terragoatFindings = await countTerragoatFindings()

const raw = []
const details = {}
for (const faultCase of heldOutCases) {
  const runs = await runCase(faultCase)
  raw.push({ id: faultCase.id, resource: faultCase.resource, runs })
  details[faultCase.id] = caseDetail(faultCase, runs)
  console.info(JSON.stringify({ level: 'info', message: 'case finished', done: raw.length, of: heldOutCases.length }))
}

const faults = heldOutCases.map(({ id, title, requirement }) => ({
  id,
  title,
  requirement: { source: requirement.source, ref: requirement.ref },
  results: Object.fromEntries(details[id].results.map(({ toolId, status }) => [toolId, status])),
}))

const graded = summarizeRun({
  tools: toolSummaries.map(({ id, name, version, license }) => ({ id, name, version, license })),
  cases: faults,
  terragoatFindings,
})

const run = {
  summary: {
    runId: new Date().toISOString(),
    ranAt: new Date().toISOString(),
    corpus: { source: CORPUS_SOURCE, planted: true, faultCount: faults.length },
    ...graded,
    faults,
  },
  cases: details,
  raw,
}

await mkdir(dirname(config.runFile), { recursive: true })
await writeFile(config.runFile, JSON.stringify(run))
console.info(JSON.stringify({ level: 'info', message: 'run written', file: config.runFile }))
