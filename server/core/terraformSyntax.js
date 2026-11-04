import { execFile } from 'node:child_process';

const MAX_MESSAGE_LENGTH = 400;
const TIMEOUT_MS = 10_000;

export function terraformSyntaxError(text) {
  return new Promise((resolve, reject) => {
    const child = execFile('terraform', ['fmt', '-no-color', '-'], { timeout: TIMEOUT_MS }, (err, _stdout, stderr) => {
      if (!err) return resolve(null);
      if (typeof err.code !== 'number') return reject(new Error(`terraform syntax check failed to run: ${err.message}`));
      return resolve(stderr.trim().slice(0, MAX_MESSAGE_LENGTH));
    });
    child.stdin.end(text);
  });
}
