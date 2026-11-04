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

export const config = Object.freeze({
  root,
  host: process.env.HOST || '127.0.0.1', // Demo only: not hardened for the public internet.
  port: int('PORT', 3001),
  adaptersDir: dir('ADAPTERS_DIR', 'server/adapters'),
  resultsFile: dir('RESULTS_FILE', 'results/benchmark.json'),
  corpusDir: dir('CORPUS_DIR', 'tests/heldout'),
  terragoatDir: process.env.TERRAGOAT_DIR ? path.resolve(root, process.env.TERRAGOAT_DIR) : null,
  maxInputBytes: int('MAX_INPUT_BYTES', 100 * 1024),
  toolTimeoutSeconds: int('TOOL_TIMEOUT_SECONDS', 60),
});
