import { execFile } from 'node:child_process'
import { ToolMissingError, ToolTimedOutError } from '../core/errors.js'

const NO_NETWORK_POLICY = '(version 1)(allow default)(deny network*)'
const MAX_OUTPUT_BYTES = 100 * 1024 * 1024

export function runIsolated(bin, args, { timeoutMs, input }) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'sandbox-exec',
      ['-p', NO_NETWORK_POLICY, bin, ...args],
      { timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer: MAX_OUTPUT_BYTES },
      (error, stdout, stderr) => {
        if (error?.killed) return reject(new ToolTimedOutError(`${bin} ran out of time`))
        if (error?.code === 'ENOENT') return reject(new ToolMissingError('sandbox-exec is not available'))
        if (error && typeof error.code !== 'number') return reject(error)
        return resolve({ stdout, stderr, exitCode: error ? error.code : 0 })
      },
    )
    if (input !== undefined) child.stdin.end(input)
  })
}
