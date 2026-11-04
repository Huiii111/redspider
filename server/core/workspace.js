// Every scan gets a fresh temp directory with the input under a fixed filename.
// User-supplied paths are never used.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const INPUT_FILENAME = 'main.tf';

export async function withTerraformDir(terraformText, fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sbs-'));
  try {
    await fs.writeFile(path.join(dir, INPUT_FILENAME), terraformText, 'utf8');
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
