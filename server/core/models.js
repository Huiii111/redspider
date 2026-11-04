// zod schemas for everything that crosses a boundary: HTTP requests, adapter output,
// the stored benchmark file, and case files on disk.
import { z } from 'zod';

// --- John <-> Huiru contract -------------------------------------------------

export const Finding = z.object({
  toolId: z.string().min(1),
  ruleId: z.string().min(1),
  resource: z.string(), // Terraform address, e.g. "aws_s3_bucket.data". Empty if the tool gives none.
  severity: z.string().nullable(),
  message: z.string(),
  line: z.number().int().nonnegative().nullable(),
});

export const Findings = z.array(Finding);

// --- Corpus on disk (tests/heldout, tests/generated) -------------------------

export const Requirement = z.object({
  source: z.string().min(1),
  ref: z.string().min(1),
  text: z.string().min(1),
});

export const CaseMeta = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]+$/, 'id may only contain letters, digits, _ and -'),
  title: z.string().min(1),
  requirement: Requirement,
});

// --- Grading ------------------------------------------------------------------

export const CaseStatus = z.enum(['DETECTED', 'SILENT', 'ERROR']);
export const ScanStatus = z.enum(['NOTICED', 'SILENT', 'ERROR']);

// --- Stored run: results/benchmark.json --------------------------------------

export const CaseToolResult = z.object({
  toolId: z.string(),
  status: CaseStatus,
  newFindings: Findings,
  cleanFindingCount: z.number().int().nonnegative(),
  errorMessage: z.string().optional(),
});

export const CaseDetail = CaseMeta.extend({
  clean: z.string(),
  faulty: z.string(),
  results: z.array(CaseToolResult),
});

export const BenchmarkSummary = z.object({
  runId: z.string(),
  ranAt: z.string().datetime(),
  corpus: z.object({ source: z.string(), planted: z.boolean(), faultCount: z.number().int().nonnegative() }),
  heuristic: z.object({
    rule: z.string(),
    toolId: z.string(),
    missed: z.number().int().nonnegative(),
    caughtByAnotherTool: z.number().int().nonnegative(),
  }),
  tools: z.array(z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    license: z.string(),
    terragoatFindings: z.number().int().nonnegative(),
    detected: z.number().int().nonnegative(),
    silent: z.number().int().nonnegative(),
    error: z.number().int().nonnegative(),
  })),
  faults: z.array(z.object({
    id: z.string(),
    title: z.string(),
    requirement: Requirement.pick({ source: true, ref: true }),
    results: z.record(z.string(), CaseStatus),
  })),
});

// One file holds the summary served by GET /api/benchmark plus the per-case
// detail served by GET /api/cases/:id.
export const StoredRun = BenchmarkSummary.extend({
  cases: z.record(z.string(), CaseDetail),
});

// --- HTTP ---------------------------------------------------------------------

export const ScanRequest = z.object({
  before: z.string({ required_error: 'before is required', invalid_type_error: 'before must be a string' }),
  after: z.string({ required_error: 'after is required', invalid_type_error: 'after must be a string' }),
});
