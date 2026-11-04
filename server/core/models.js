// zod schemas: Finding, scan request, error shape.
import { z } from 'zod';

export const Finding = z.object({
  toolId: z.string(),
  ruleId: z.string(),
  resource: z.string(),
  severity: z.string().nullable(),
  message: z.string(),
  line: z.number(),
});
