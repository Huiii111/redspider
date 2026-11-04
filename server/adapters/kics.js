import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { UnreadableOutputError } from '../core/errors.js'
import { parseToolJson } from './parseJson.js'

const NAME = 'KICS'
const REPORT_NAME = 'kics'
const SEARCH_KEY_RESOURCE = /^([\w-]+)\[(?:\{\{)?(.+?)(?:\}\})?\]/

export function resourceAddress(searchKey) {
  const match = searchKey.match(SEARCH_KEY_RESOURCE)
  return match ? `${match[1]}.${match[2]}` : searchKey
}

export function createKics(queriesPath) {
  return {
    id: 'kics',
    name: NAME,
    license: 'Apache-2.0',
    versionArgs: ['version'],
    scanArgs: (inputDir, outputDir) => [
      'scan', '-p', inputDir, '-q', queriesPath, '-o', outputDir,
      '--output-name', REPORT_NAME, '--report-formats', 'json', '--no-progress', '--type', 'Terraform',
    ],
    async readReport({ outputDir }) {
      try {
        return await readFile(join(outputDir, `${REPORT_NAME}.json`), 'utf8')
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
        throw new UnreadableOutputError(`${NAME} finished without writing a report`)
      }
    },
    parseOutput(text) {
      const report = parseToolJson(NAME, text)
      if (report.files_parsed < report.files_scanned || report.queries_failed_to_execute > 0) {
        throw new UnreadableOutputError(`${NAME} could not parse this Terraform`)
      }
      return report.queries.flatMap((query) =>
        query.files.map((file) => ({
          toolId: 'kics',
          ruleId: query.query_id,
          resource: resourceAddress(file.search_key),
          severity: query.severity,
          message: query.query_name,
          line: file.line,
        })),
      )
    },
  }
}

export const kics = createKics('')
