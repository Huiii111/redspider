import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MAX_INPUT_BYTES } from '../config.js';

export class InputTooLargeError extends Error {
  constructor() {
    super(`Terraform is over the ${MAX_INPUT_BYTES}-byte limit. Shorten it and try again.`);
    this.code = 'INPUT_TOO_LARGE';
  }
}

// Writes Terraform text to a fresh temp directory under a fixed filename,
// runs fn(dir), and always deletes the directory. Never uses a caller path.
export async function withScanDir(terraform, fn) {
  if (Buffer.byteLength(terraform, 'utf8') > MAX_INPUT_BYTES) throw new InputTooLargeError();
  const dir = await mkdtemp(path.join(tmpdir(), 'sbs-scan-'));
  try {
    await writeFile(path.join(dir, 'main.tf'), terraform, { mode: 0o600 });
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
