// Reads and writes results/benchmark.json. Never invents sample data when the file is missing.
import fs from 'node:fs/promises';
import path from 'node:path';
import { StoredRun } from './models.js';

/** @returns the parsed run, or null if no run has been stored yet. Throws if the file is corrupt. */
export async function readStoredRun(file) {
  let text;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  const parsed = StoredRun.safeParse(JSON.parse(text));
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    throw new Error(`${file} does not match the stored-run schema at ${i.path.join('.')}: ${i.message}`);
  }
  return parsed.data;
}

export async function writeStoredRun(file, run) {
  const data = StoredRun.parse(run);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await fs.rename(tmp, file); // So the server never reads a half-written file.
}
