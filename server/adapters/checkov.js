import { UnreadableOutputError } from '../core/errors.js'
import { parseToolJson } from './parseJson.js'

const NAME = 'Checkov'

export const checkov = {
  id: 'checkov',
  name: NAME,
  license: 'Apache-2.0',
  versionArgs: ['--version'],
  scanArgs: (inputDir) => ['-d', inputDir, '-o', 'json', '--quiet', '--compact', '--skip-download'],
  readReport: ({ stdout }) => stdout,
  parseOutput(text) {
    const report = parseToolJson(NAME, text)
    const summary = report.summary ?? report
    if (summary.parsing_errors > 0) {
      throw new UnreadableOutputError(`${NAME} could not parse this Terraform`)
    }
    return (report.results?.failed_checks ?? []).map((check) => ({
      toolId: 'checkov',
      ruleId: check.check_id,
      resource: check.resource,
      severity: check.severity,
      message: check.check_name,
      line: check.file_line_range[0],
    }))
  },
}
