import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { config } from '../config.js'
import { runValueCheck } from '../core/valueCheck.js'
import { loadStoredRun } from '../store.js'

const evidenceDir = join(config.runFile, '..', '..', 'docs', 'evidence')
const run = await loadStoredRun(config.runFile)
if (!run) throw new Error('No stored run. Run npm run benchmark first.')

const report = runValueCheck({
  cases: run.raw,
  toolIds: run.summary.tools.map((tool) => tool.id),
  heuristicToolId: run.summary.heuristic.toolId,
})

await mkdir(join(evidenceDir, 'value'), { recursive: true })
await writeFile(join(evidenceDir, 'value', 'report.json'), JSON.stringify({ ...report, heuristic: run.summary.heuristic, tools: run.summary.tools }, null, 2))
await writeFile(join(evidenceDir, 'value-verdict.txt'), `${report.verdict}\n${JSON.stringify(report.strict)}\n`)
console.info(JSON.stringify(report, null, 2))
