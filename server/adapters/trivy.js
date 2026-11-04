import { parseToolJson } from './parseJson.js'

const NAME = 'Trivy'

export const trivy = {
  id: 'trivy',
  name: NAME,
  license: 'Apache-2.0',
  versionArgs: ['--version'],
  scanArgs: (inputDir) => ['config', '--format', 'json', '--skip-check-update', '--quiet', inputDir],
  readReport: ({ stdout }) => stdout,
  parseOutput(text) {
    const { Results: results } = parseToolJson(NAME, text)
    return results.flatMap((result) => result.Misconfigurations ?? []).map((misconfiguration) => ({
      toolId: 'trivy',
      ruleId: misconfiguration.ID,
      resource: misconfiguration.CauseMetadata.Resource,
      severity: misconfiguration.Severity,
      message: misconfiguration.Message,
      line: misconfiguration.CauseMetadata.StartLine,
    }))
  },
}
