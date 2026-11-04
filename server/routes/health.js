import { Router } from 'express';
import checkov from '../adapters/checkov.js';
import trivy from '../adapters/trivy.js';
import kics from '../adapters/kics.js';
import terrascan from '../adapters/terrascan.js';

const adapters = [checkov, trivy, kics, terrascan];
const router = Router();

router.get('/', async (_req, res) => {
  const tools = await Promise.all(
    adapters.map(async (a) => {
      let version = null;
      try {
        version = (await a.version()) ?? null;
      } catch {
        // tool missing or broken: reported as unavailable
      }
      return { id: a.id, name: a.name, available: version !== null, version };
    }),
  );
  res.json({ tools });
});

export default router;
