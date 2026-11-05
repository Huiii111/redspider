// The only file that reads environment variables. Everything else imports from here.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function int(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name} must be a positive integer, got "${raw}"`);
  return n;
}

function dir(name, fallback) {
  const raw = process.env[name];
  return raw ? path.resolve(root, raw) : path.join(root, fallback);
}

const isMac = process.platform === 'darwin';

function command(prefix, fallback) {
  const args = (process.env[`${prefix}_BIN_ARGS`] || '').split(' ').filter(Boolean);
  return Object.freeze({ file: process.env[`${prefix}_BIN`] || fallback, args: Object.freeze(args) });
}

export const config = Object.freeze({
  root,
  host: process.env.HOST || '127.0.0.1', // Demo only: not hardened for the public internet.
  port: int('PORT', 3001),
  adaptersDir: dir('ADAPTERS_DIR', 'server/adapters'),
  resultsFile: dir('RESULTS_FILE', 'results/benchmark.json'),
  corpusDir: dir('CORPUS_DIR', 'tests/heldout'),
  evidenceDir: dir('EVIDENCE_DIR', 'docs/evidence'),
  terragoatDir: process.env.TERRAGOAT_DIR ? path.resolve(root, process.env.TERRAGOAT_DIR) : null,
  maxInputBytes: int('MAX_INPUT_BYTES', 100 * 1024),
  toolTimeoutSeconds: int('TOOL_TIMEOUT_SECONDS', 30), // John and Anton both chose 30s; prereg budgets the live scan under 15s.

  // Scanner programs. A bare name is looked up on PATH. X_BIN_ARGS adds leading arguments, for
  // tools that must be started through an interpreter, e.g. on Windows, where pip installs
  // Checkov as a .cmd that can't run without a shell:
  //   CHECKOV_BIN=.../python.exe  CHECKOV_BIN_ARGS="-m checkov.main"
  bins: Object.freeze({
    trivy: command('TRIVY', 'trivy'),
    checkov: command('CHECKOV', 'checkov'),
    kics: command('KICS', 'kics'),
  }),
  // Prepended to PATH for scanner processes. Defaults to Homebrew on Apple silicon.
  extraPath: process.env.BREW_BIN ?? (isMac ? '/opt/homebrew/bin' : ''),
  kicsQueriesPath: process.env.KICS_QUERIES_PATH || (isMac ? '/opt/homebrew/opt/kics/share/kics/assets/queries' : ''),
  // The network sandbox only exists on macOS. Elsewhere scanners refuse to run unless this is set.
  allowUnsandboxed: process.env.ALLOW_UNSANDBOXED === '1',
  // Run KICS in this Docker image (e.g. checkmarx/kics:v2.2.0) with no network, instead of a local binary.
  kicsDockerImage: process.env.KICS_DOCKER_IMAGE || '',
});
