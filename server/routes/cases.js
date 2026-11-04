// GET /api/cases/:id: one fault, both Terraform files, the requirement and each tool's findings.
import { Router } from 'express';
import { ApiError } from '../errors.js';
import { readStoredRun } from '../core/store.js';
import { noRunError } from './benchmark.js';
import { asyncRoute } from './_async.js';

export function casesRouter({ config }) {
  const r = Router();
  r.get('/cases/:id', asyncRoute(async (req, res) => {
    const run = await readStoredRun(config.resultsFile);
    if (!run) throw noRunError();
    const detail = Object.hasOwn(run.cases, req.params.id) ? run.cases[req.params.id] : null;
    if (!detail) throw new ApiError(404, 'CASE_NOT_FOUND', `No case with id "${req.params.id}". IDs are listed in GET /api/benchmark under faults.`);
    res.json(detail);
  }));
  return r;
}
