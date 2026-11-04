// Reads a corpus of planted pairs. Format (see docs/corpus-format.md):
//   <corpusDir>/<caseId>/case.json   { id, title, requirement: { source, ref, text, url? }, resource?, change? }
//   <corpusDir>/<caseId>/clean.tf
//   <corpusDir>/<caseId>/faulty.tf
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CaseMeta } from './models.js';
import { syntaxError } from './terraform.js';

const FILES = ['case.json', 'clean.tf', 'faulty.tf'];

/** @returns {{ cases, sha256 }}  sha256 covers every file in every case, in a fixed order. */
export async function readCorpus(corpusDir) {
  let entries;
  try {
    entries = await fs.readdir(corpusDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error(`Corpus directory not found: ${corpusDir}`);
    throw err;
  }
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const hash = createHash('sha256');
  const cases = [];
  for (const name of dirs) {
    const where = `${name}/`;
    const text = {};
    for (const f of FILES) {
      try {
        text[f] = await fs.readFile(path.join(corpusDir, name, f), 'utf8');
      } catch {
        throw new Error(`${where}${f} is missing`);
      }
      hash.update(`${name}/${f}\0${text[f]}\0`);
    }
    let meta;
    try {
      meta = JSON.parse(text['case.json']);
    } catch (err) {
      throw new Error(`${where}case.json: ${err.message}`);
    }
    const parsed = CaseMeta.safeParse(meta);
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      throw new Error(`${where}case.json: ${i.path.join('.')} ${i.message}`);
    }
    if (parsed.data.id !== name) throw new Error(`${where}case.json: id "${parsed.data.id}" must match its folder name`);
    const clean = text['clean.tf'];
    const faulty = text['faulty.tf'];
    if (clean === faulty) throw new Error(`${where}clean.tf and faulty.tf are identical, so nothing is planted`);
    // A file scanners can't parse would grade as SILENT, so the whole run stops instead.
    for (const [f, t] of [['clean.tf', clean], ['faulty.tf', faulty]]) {
      const problem = await syntaxError(t);
      if (problem) throw new Error(`${where}${f} is not valid Terraform: ${problem}`);
    }
    cases.push({ ...parsed.data, clean, faulty });
  }
  if (cases.length === 0) throw new Error(`Corpus ${corpusDir} contains no cases`);
  return { cases, sha256: hash.digest('hex') };
}
