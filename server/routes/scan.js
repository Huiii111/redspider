// POST /api/scan: run every tool on a before and after pair and report who noticed.
// This endpoint takes code from strangers. See "Security rules for the live scan" in architecture.md.
import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { ApiError } from '../errors.js';
import { ScanRequest } from '../core/models.js';
import { gradePair, toScanStatus } from '../core/grade.js';
import { runTool } from '../core/runner.js';
import { withTerraformDir } from '../core/workspace.js';
import { syntaxError } from '../core/terraform.js';
import { asyncRoute } from './_async.js';

const MAX_CONCURRENT_SCANS = 2; // Each scan starts 2 processes per tool; cap it so the laptop stays responsive on stage.

export function scanRouter({ config, getAdapters }) {
  const r = Router();
  let inFlight = 0;

  r.post('/scan', asyncRoute(async (req, res) => {
    const parsed = ScanRequest.safeParse(req.body ?? {});
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      throw new ApiError(400, 'INVALID_INPUT', `${i.message}. Send JSON like {"before": "...", "after": "..."}.`);
    }
    const { before, after } = parsed.data;
    for (const [name, text] of [['before', before], ['after', after]]) {
      const bytes = Buffer.byteLength(text, 'utf8');
      if (bytes > config.maxInputBytes) {
        throw new ApiError(413, 'INPUT_TOO_LARGE', `${name} is ${bytes} bytes; the limit is ${config.maxInputBytes}. Trim it to the resources you're testing.`);
      }
    }
    // Scanners exit 0 on broken Terraform and report nothing, which would grade as SILENT.
    for (const [name, text] of [['before', before], ['after', after]]) {
      const problem = await syntaxError(text);
      if (problem) {
        throw new ApiError(422, 'INVALID_TERRAFORM', `The ${name} version isn't valid Terraform, so no tool could judge it fairly. ${problem}`);
      }
    }
    if (inFlight >= MAX_CONCURRENT_SCANS) {
      throw new ApiError(429, 'BUSY', 'Another scan is still running. Try again in a few seconds.');
    }

    inFlight += 1;
    try {
      const adapters = await getAdapters();
      const timeoutMs = config.toolTimeoutSeconds * 1000;
      // Each tool gets its own pair of temp dirs, so no tool sees another's output files.
      const results = await Promise.all(adapters.map(async (adapter) => {
        const started = Date.now();
        const [beforeRun, afterRun] = await Promise.all([
          withTerraformDir(before, (dir) => runTool(adapter, dir, timeoutMs)),
          withTerraformDir(after, (dir) => runTool(adapter, dir, timeoutMs)),
        ]);
        const g = gradePair(beforeRun, afterRun, { labels: ['before', 'after'] });
        return {
          toolId: adapter.id,
          status: toScanStatus(g.status),
          newFindings: g.newFindings,
          durationMs: Date.now() - started,
          ...(g.status === 'ERROR' ? { errorMessage: g.errorMessage } : {}),
        };
      }));
      res.json({ scanId: randomUUID(), timeoutSeconds: config.toolTimeoutSeconds, results });
    } finally {
      inFlight -= 1;
    }
  }));
  return r;
}
