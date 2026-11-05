// Shared process runner for scanner adapters. Based on John's run.js (bad-terraform-code).
// Files starting with "_" are helpers, not adapters, so the registry skips this one.
//
// - execFile with an argument array: no shell, so pasted input can't inject commands.
// - On macOS, wraps the tool in sandbox-exec: no network, secret folders unreadable,
//   writes only to temp and cache locations.
// - Elsewhere there is no network sandbox, so it refuses to run unless ALLOW_UNSANDBOXED=1.
// - Kills the process (SIGKILL) when the timeout expires.
// - Resolves for any exit code: scanners exit non-zero when they find something.
import { execFile } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { config } from '../config.js';

export class ToolError extends Error {}

const home = os.homedir();
const SECRET_DIRS = ['.ssh', '.aws', '.azure', '.gnupg', '.kube', '.config', 'Documents', 'Desktop', 'Downloads'];

const PROFILE = `(version 1)
(allow default)
(deny network*)
(deny file-read* ${SECRET_DIRS.map((d) => `(subpath "${home}/${d}")`).join(' ')})
(deny file-write*)
(allow file-write* (subpath "/private/tmp") (subpath "/private/var/folders") (subpath "/dev")
  (subpath "${home}/Library/Caches") (subpath "${home}/.cache"))`;

const env = {
  ...process.env,
  PATH: [config.extraPath, process.env.PATH ?? ''].filter(Boolean).join(path.delimiter),
  ...(config.kicsQueriesPath ? { KICS_QUERIES_PATH: config.kicsQueriesPath } : {}),
};

const MAX_OUTPUT_BYTES = 100 * 1024 * 1024;

/**
 * @param bin   program name or path
 * @param args  argument array
 * @param opts  { sandbox: boolean, timeoutMs: number, cwd: string (default: the temp folder) }
 * @returns Promise<{ stdout, stderr, code }>
 * Rejects with ToolError if the program is missing, times out, can't start, or can't be sandboxed.
 */
export function run(bin, args, { sandbox = false, timeoutMs = config.toolTimeoutSeconds * 1000, cwd = os.tmpdir() } = {}) {
  let file = bin;
  let fileArgs = args;
  if (sandbox) {
    if (process.platform === 'darwin') {
      file = 'sandbox-exec';
      fileArgs = ['-p', PROFILE, bin, ...args];
    } else if (!config.allowUnsandboxed) {
      return Promise.reject(new ToolError(`no network sandbox on ${process.platform}; set ALLOW_UNSANDBOXED=1 to run ${bin} anyway`));
    }
  }
  return new Promise((resolve, reject) => {
    execFile(
      file,
      fileArgs,
      { env, timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer: MAX_OUTPUT_BYTES, cwd, windowsHide: true },
      (err, stdout, stderr) => {
        if (err?.killed) return reject(new ToolError(`${bin} timed out after ${Math.round(timeoutMs / 1000)}s and was stopped`));
        if (err?.code === 'ENOENT') return reject(new ToolError(`${file} is not installed or not on PATH`));
        if (err && typeof err.code !== 'number') return reject(new ToolError(`${bin} could not start: ${err.message}`));
        resolve({ stdout, stderr, code: err ? err.code : 0 });
      },
    );
  });
}

const EXCERPT = 200;

// From Anton's parseJson.js: name the tool and show the start of what it printed.
export function parseToolJson(tool, text, stderr = '') {
  if (!text || !text.trim()) {
    const last = stderr.trim().split(/\r?\n/).filter(Boolean).pop();
    throw new ToolError(`${tool} produced no output${last ? `: ${last.slice(0, EXCERPT)}` : ''}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ToolError(`${tool} returned unreadable output: ${text.trim().slice(0, EXCERPT)}`);
  }
}

export function versionFrom(tool, stdout) {
  const v = stdout.match(/\d+\.\d+\.\d+/)?.[0];
  if (!v) throw new ToolError(`${tool} printed no version`);
  return v;
}
