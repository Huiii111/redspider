// One error shape for every non-2xx response:
//   { "error": { "code": "INVALID_INPUT", "message": "What went wrong and how to fix it" } }
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  // body-parser errors
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'INPUT_TOO_LARGE', message: 'Request body is too large. Paste a smaller Terraform file.' } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Request body is not valid JSON.' } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Unexpected server error. Check the server log.' } });
}
