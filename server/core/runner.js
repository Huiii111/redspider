// Runs one adapter on one directory and turns every outcome into a run the grader understands.
import { Findings } from './models.js';

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * @returns {{ ok: true, findings, durationMs } | { ok: false, error, durationMs }}
 * The timeout here is a backstop so a hung adapter can't hang a request.
 * Killing the child process on timeout is the adapter's job (John's sandbox).
 */
export async function runTool(adapter, dir, timeoutMs) {
  const started = Date.now();
  try {
    const raw = await withTimeout(Promise.resolve().then(() => adapter.scan(dir)), timeoutMs);
    const parsed = Findings.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(`adapter returned invalid findings: ${issue.path.join('.') || '(root)'} ${issue.message}`);
    }
    const wrong = parsed.data.find((f) => f.toolId !== adapter.id);
    if (wrong) throw new Error(`adapter returned a finding with toolId "${wrong.toolId}"`);
    return { ok: true, findings: parsed.data, durationMs: Date.now() - started };
  } catch (err) {
    return { ok: false, error: err?.message || String(err), durationMs: Date.now() - started };
  }
}

export async function probeTool(adapter) {
  try {
    const version = await withTimeout(Promise.resolve().then(() => adapter.version()), 15_000);
    if (typeof version !== 'string' || !version) throw new Error('version() returned no version');
    return { id: adapter.id, name: adapter.name, available: true, version };
  } catch (err) {
    return { id: adapter.id, name: adapter.name, available: false, version: null, reason: err?.message || String(err) };
  }
}
