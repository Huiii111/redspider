// Reads a corpus of planted pairs. Format (see docs/corpus-format.md):
//   <corpusDir>/<caseId>/case.json   { id, title, requirement: { source, ref, text } }
//   <corpusDir>/<caseId>/clean.tf
//   <corpusDir>/<caseId>/faulty.tf
import fs from 'node:fs/promises';
import path from 'node:path';
import { CaseMeta } from './models.js';

export async function readCorpus(corpusDir) {
  let entries;
  try {
    entries = await fs.readdir(corpusDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error(`Corpus directory not found: ${corpusDir}`);
    throw err;
  }
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const cases = [];
  for (const name of dirs) {
    const caseDir = path.join(corpusDir, name);
    const where = `${name}/`;
    let meta;
    try {
      meta = JSON.parse(await fs.readFile(path.join(caseDir, 'case.json'), 'utf8'));
    } catch (err) {
      throw new Error(`${where}case.json: ${err.message}`);
    }
    const parsed = CaseMeta.safeParse(meta);
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      throw new Error(`${where}case.json: ${i.path.join('.')} ${i.message}`);
    }
    if (parsed.data.id !== name) throw new Error(`${where}case.json: id "${parsed.data.id}" must match its folder name`);
    const [clean, faulty] = await Promise.all(
      ['clean.tf', 'faulty.tf'].map((f) => fs.readFile(path.join(caseDir, f), 'utf8').catch(() => {
        throw new Error(`${where}${f} is missing`);
      })),
    );
    if (clean === faulty) throw new Error(`${where}clean.tf and faulty.tf are identical, so nothing is planted`);
    cases.push({ ...parsed.data, clean, faulty });
  }
  if (cases.length === 0) throw new Error(`Corpus ${corpusDir} contains no cases`);
  return cases;
}
