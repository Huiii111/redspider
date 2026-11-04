// GET /api/health: which tools are available, with versions. Check this before going on stage.
import { Router } from 'express';
import { probeTool } from '../core/runner.js';
import { asyncRoute } from './_async.js';

export function healthRouter({ getAdapters }) {
  const r = Router();
  r.get('/health', asyncRoute(async (req, res) => {
    const adapters = await getAdapters();
    const tools = await Promise.all(adapters.map(probeTool));
    res.json({ tools });
  }));
  return r;
}
