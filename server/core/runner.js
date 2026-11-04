// Runs one adapter on one directory and turns every outcome into a run the grader understands.
import { Findings } from './models.js';

// The adapter kills its own process at timeoutMs. This backstop fires a little later, so a
// well-behaved adapter always reports its own timeout and a hung one can't hang a request.
const BACKSTOP_GRACE_MS = 5_000;

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * @returns {{ ok: true, findings, durationMs } | { ok: false, error, durationMs }}
 * Adapters receive scan(dir, { timeoutMs }). The second argument is optional for them to use.
 */
export async function runTool(adapter, dir, timeoutMs) {
  const started = Date.now();
  try {
    const raw = await withTimeout(
      Promise.resolve().then(() => adapter.scan(dir, { timeoutMs })),
      timeoutMs + BACKSTOP_GRACE_MS,
      `timed out after ${Math.round(timeoutMs / 1000)}s`,
    );
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
  const base = { id: adapter.id, name: adapter.name, license: adapter.license };
  try {
    const version = await withTimeout(Promise.resolve().then(() => adapter.version()), 20_000, 'version check timed out');
    if (typeof version !== 'string' || !version) throw new Error('version() returned no version');
    return { ...base, available: true, version };
  } catch (err) {
    return { ...base, available: false, version: null, reason: err?.message || String(err) };
  }
}
