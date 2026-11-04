// Loads every adapter file in the adapters directory. Adding a tool means adding one file.
// Contract (agreed with John): default export { id, name, license, version(), scan(dir) }
//   version(): Promise<string>  throws if the tool is not installed
//   scan(dir): Promise<Finding[]>  throws if the tool crashed or produced unreadable output
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const cache = new Map();

function checkShape(a, file) {
  const problems = [];
  for (const k of ['id', 'name', 'license']) if (typeof a?.[k] !== 'string' || !a[k]) problems.push(`${k} must be a non-empty string`);
  for (const k of ['version', 'scan']) if (typeof a?.[k] !== 'function') problems.push(`${k} must be a function`);
  if (problems.length) throw new Error(`Adapter ${file} does not match the contract: ${problems.join('; ')}`);
}

export async function loadAdapters(dir) {
  if (cache.has(dir)) return cache.get(dir);
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch (err) {
    if (err.code === 'ENOENT') entries = [];
    else throw err;
  }
  // Files starting with "_" are helpers shared between adapters, not adapters.
  const files = entries.filter((f) => /\.(m?js|cjs)$/.test(f) && !f.startsWith('_') && !/^index\./.test(f)).sort();
  const adapters = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    const a = mod.default ?? mod;
    checkShape(a, file);
    if (adapters.some((b) => b.id === a.id)) throw new Error(`Two adapters share the id "${a.id}"`);
    adapters.push(a);
  }
  cache.set(dir, adapters);
  return adapters;
}

export function clearAdapterCache() {
  cache.clear();
}
