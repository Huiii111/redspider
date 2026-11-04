// Builds the Express app. Kept apart from index.js so tests can start it on a random port.
import express from 'express';
import { config as defaultConfig } from './config.js';
import { loadAdapters } from './core/registry.js';
import { errorHandler, notFoundHandler } from './errors.js';
import { healthRouter } from './routes/health.js';
import { benchmarkRouter } from './routes/benchmark.js';
import { casesRouter } from './routes/cases.js';
import { scanRouter } from './routes/scan.js';

export function createApp({ config = defaultConfig, getAdapters = () => loadAdapters(config.adaptersDir) } = {}) {
  const app = express();
  app.disable('x-powered-by');
  // Two Terraform fields plus JSON escaping overhead. Per-field limits are checked in the scan route.
  app.use(express.json({ limit: config.maxInputBytes * 3 }));

  const deps = { config, getAdapters };
  const api = express.Router();
  api.use(healthRouter(deps));
  api.use(benchmarkRouter(deps));
  api.use(casesRouter(deps));
  api.use(scanRouter(deps));
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
