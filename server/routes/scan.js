import { randomUUID } from 'node:crypto'
import { scanRequestSchema } from '../core/models.js'
import { HttpError } from './httpError.js'

function validate(body, maxBytes) {
  const parsed = scanRequestSchema.safeParse(body)
  if (!parsed.success) {
    throw new HttpError(400, 'INVALID_INPUT', 'Send both the before and after Terraform as text.')
  }
  const { before, after } = parsed.data
  if (Buffer.byteLength(before) > maxBytes || Buffer.byteLength(after) > maxBytes) {
    throw new HttpError(413, 'INPUT_TOO_LARGE', `Terraform must be ${maxBytes / 1000} KB or smaller. Shorten it and try again.`)
  }
  return { before, after }
}

export const scanRoute = ({ scanPair, syntaxError, limits }) => async (request, response) => {
  const { before, after } = validate(request.body, limits.maxTerraformBytes)
  for (const [label, terraform] of [['Before', before], ['After', after]]) {
    const problem = await syntaxError(terraform)
    if (problem) {
      throw new HttpError(422, 'INVALID_TERRAFORM', `The ${label} version isn't valid Terraform, so no tool could judge it fairly. ${problem}`)
    }
  }
  response.json({
    scanId: randomUUID(),
    timeoutSeconds: limits.scanTimeoutSeconds,
    results: await scanPair(before, after),
  })
}
