import { execFile } from 'node:child_process';
import os from 'node:os';
import { TOOL_TIMEOUT_MS, BREW_BIN, KICS_QUERIES_PATH, ALLOW_UNSANDBOXED } from '../config.js';

const home = os.homedir();

// Seatbelt profile (macOS): network denied, secrets unreadable, writes limited
// to temp and cache locations.
const PROFILE = `(version 1)
(allow default)
(deny network*)
(deny file-read* ${['.ssh', '.aws', '.azure', '.gnupg', '.kube', '.config', 'Documents', 'Desktop', 'Downloads']
  .map((d) => `(subpath "${home}/${d}")`)
  .join(' ')})
(deny file-write*)
(allow file-write* (subpath "/private/tmp") (subpath "/private/var/folders") (subpath "/dev")
  (subpath "${home}/Library/Caches") (subpath "${home}/.cache"))`;

const env = {
  ...process.env,
  PATH: `${BREW_BIN}:${process.env.PATH ?? ''}`,
  KICS_QUERIES_PATH,
};

// Runs a command with execFile (no shell). Resolves with { stdout, stderr, code }
// for any exit code: scanners exit non-zero when they find something.
// Rejects if the program is missing, times out (and is killed) or can't start.
// With sandbox:true the tool runs without network access. Off macOS that can't
// be guaranteed, so it refuses unless ALLOW_UNSANDBOXED=1 is set.
export function run(cmd, args, { sandbox = false, timeoutMs = TOOL_TIMEOUT_MS } = {}) {
  let file = cmd;
  let fileArgs = args;
  if (sandbox) {
    if (process.platform === 'darwin') {
      file = 'sandbox-exec';
      fileArgs = ['-p', PROFILE, cmd, ...args];
    } else if (!ALLOW_UNSANDBOXED) {
      return Promise.reject(
        new Error(`no network sandbox on ${process.platform}; set ALLOW_UNSANDBOXED=1 to run ${cmd} anyway`),
      );
    }
  }
  return new Promise((resolve, reject) => {
    execFile(
      file,
      fileArgs,
      { env, timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer: 50 * 1024 * 1024, cwd: '/tmp' },
      (err, stdout, stderr) => {
        if (err && err.killed) return reject(new Error(`${cmd} timed out after ${timeoutMs}ms`));
        if (err && typeof err.code !== 'number') return reject(new Error(`${cmd}: ${err.message}`));
        resolve({ stdout, stderr, code: err ? err.code : 0 });
      },
    );
  });
}

export function parseJson(tool, text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${tool} returned unreadable output`);
  }
}
