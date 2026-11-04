// Syntax check for Terraform text, run before any scanner sees it.
// Why (found by Anton): Trivy, Checkov and KICS all exit 0 on Terraform they can't parse, and
// Trivy reports nothing, so a typo would be graded SILENT: a miss that never happened.
// Anton's branch ran `terraform fmt` inside macOS sandbox-exec. This uses HashiCorp's HCL parser
// compiled to WebAssembly, so it works on any OS and starts no process.
import { parse } from '@cdktf/hcl2json';

const MAX_MESSAGE = 400;

/** @returns null if the text parses as HCL, otherwise a short human-readable reason. */
export async function syntaxError(text) {
  try {
    await parse('main.tf', text);
    return null;
  } catch (err) {
    const raw = String(err?.message ?? err);
    const cleaned = raw
      .replace(/^parse config:\s*\[?/, '')
      .replace(/\]$/, '')
      // Positions look like "main.tf:2,12-13:" or, across lines, "main.tf:2,12-3,1:".
      .replace(/main\.tf:(\d+),\d+(?:-\d+(?:,\d+)?)?:\s*/g, 'Line $1: ');
    return cleaned.slice(0, MAX_MESSAGE);
  }
}
