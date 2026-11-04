// GET /api/benchmark: the stored run, without the per-case detail.
import { Router } from 'express';
import { ApiError } from '../errors.js';
import { readStoredRun } from '../core/store.js';
import { asyncRoute } from './_async.js';

export const noRunError = () =>
  new ApiError(503, 'NO_RUN', 'No benchmark has been run yet. Run `npm run benchmark` and reload.');

export function benchmarkRouter({ config }) {
  const r = Router();
  r.get('/benchmark', asyncRoute(async (req, res) => {
    const run = await readStoredRun(config.resultsFile);
    if (!run) throw noRunError();
    const { cases, raw, provenance, ...summary } = run;
    res.json(summary);
  }));
  return r;
}
