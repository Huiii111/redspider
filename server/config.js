// Only file that reads env vars.
export const PORT = Number(process.env.PORT) || 3001;
export const HOST = '127.0.0.1';
export const TOOL_TIMEOUT_MS = Number(process.env.TOOL_TIMEOUT_MS) || 30000;
export const MAX_INPUT_BYTES = Number(process.env.MAX_INPUT_BYTES) || 100000;
export const BREW_BIN = process.env.BREW_BIN || '/opt/homebrew/bin';
export const KICS_QUERIES_PATH =
  process.env.KICS_QUERIES_PATH || '/opt/homebrew/opt/kics/share/kics/assets/queries';
export const ALLOW_UNSANDBOXED = process.env.ALLOW_UNSANDBOXED === '1';
