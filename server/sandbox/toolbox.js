import { ToolMissingError, ToolTimedOutError } from '../core/errors.js'
import { gradeScan } from '../core/grade.js'
import { runIsolated } from './runIsolated.js'
import { scanTerraform } from './scanner.js'

const VERSION_PATTERN = /\d+\.\d+\.\d+/
const VERSION_TIMEOUT_MS = 20000
const MAX_MESSAGE_LENGTH = 400

export async function probeTool({ adapter, bin }) {
  const summary = { id: adapter.id, name: adapter.name, license: adapter.license }
  try {
    const { stdout } = await runIsolated(bin, adapter.versionArgs, { timeoutMs: VERSION_TIMEOUT_MS })
    const version = stdout.match(VERSION_PATTERN)
    return { ...summary, available: Boolean(version), version: version ? version[0] : null }
  } catch (error) {
    if (!(error instanceof ToolMissingError || error instanceof ToolTimedOutError)) throw error
    return { ...summary, available: false, version: null }
  }
}

export async function scanPair(tools, before, after) {
  return Promise.all(
    tools.map(async (tool) => {
      const started = Date.now()
      const [beforeRun, afterRun] = await Promise.all([scanTerraform(tool, before), scanTerraform(tool, after)])
      return { toolId: tool.adapter.id, ...gradeScan(beforeRun, afterRun), durationMs: Date.now() - started }
    }),
  )
}

export async function findSyntaxError(terraformBin, terraform, timeoutMs) {
  const { exitCode, stderr } = await runIsolated(terraformBin, ['fmt', '-no-color', '-'], { timeoutMs, input: terraform })
  return exitCode === 0 ? null : stderr.trim().slice(0, MAX_MESSAGE_LENGTH)
}
