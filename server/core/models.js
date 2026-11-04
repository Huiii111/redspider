import { z } from 'zod'

export const scanRequestSchema = z.object({ before: z.string(), after: z.string() })

export const heldOutCaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  resource: z.string().min(1),
  change: z.string().min(1),
  requirement: z.object({
    source: z.string().min(1),
    ref: z.string(),
    text: z.string().min(1),
    url: z.string(),
  }),
})
