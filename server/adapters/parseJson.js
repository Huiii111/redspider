import { UnreadableOutputError } from '../core/errors.js'

const EXCERPT_LENGTH = 200

export function parseToolJson(toolName, text) {
  try {
    return JSON.parse(text)
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    throw new UnreadableOutputError(`${toolName} returned unreadable output: ${text.slice(0, EXCERPT_LENGTH)}`)
  }
}
