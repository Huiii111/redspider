import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ToolMissingError, ToolTimedOutError, UnreadableOutputError } from '../core/errors.js'
import { runIsolated } from './runIsolated.js'

const WORKSPACE_PREFIX = 'blindspots-'
const INPUT_FILENAME = 'main.tf'
const KNOWN_FAILURES = [ToolTimedOutError, ToolMissingError, UnreadableOutputError]

async function scanDirectory({ adapter, bin, timeoutMs }, inputDir, outputDir) {
  const { stdout } = await runIsolated(bin, adapter.scanArgs(inputDir, outputDir), { timeoutMs })
  const report = await adapter.readReport({ stdout, outputDir })
  return adapter.parseOutput(report)
}

async function asRun(scan) {
  try {
    return { ok: true, findings: await scan() }
  } catch (error) {
    if (!KNOWN_FAILURES.some((kind) => error instanceof kind)) throw error
    return { ok: false, errorMessage: error.message }
  }
}

async function withWorkspace(useWorkspace) {
  const root = await mkdtemp(join(tmpdir(), WORKSPACE_PREFIX))
  try {
    const inputDir = join(root, 'in')
    const outputDir = join(root, 'out')
    await mkdir(inputDir)
    await mkdir(outputDir)
    return await useWorkspace(inputDir, outputDir)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

export const scanTerraform = (tool, terraform) =>
  withWorkspace(async (inputDir, outputDir) => {
    await writeFile(join(inputDir, INPUT_FILENAME), terraform)
    return asRun(() => scanDirectory(tool, inputDir, outputDir))
  })

export const scanExistingDirectory = (tool, directory) =>
  withWorkspace((_inputDir, outputDir) => asRun(() => scanDirectory(tool, directory, outputDir)))
