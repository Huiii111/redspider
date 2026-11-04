import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Set ${name} in server/.env. See server/.env.example.`)
  return value
}

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

export const config = {
  port: Number(required('BLINDSPOTS_PORT')),
  host: required('BLINDSPOTS_HOST'),
  bins: {
    checkov: required('CHECKOV_BIN'),
    trivy: required('TRIVY_BIN'),
    kics: required('KICS_BIN'),
    terraform: required('TERRAFORM_BIN'),
  },
  kicsQueriesPath: required('KICS_QUERIES_PATH'),
  scanTimeoutSeconds: Number(required('SCAN_TIMEOUT_SECONDS')),
  maxTerraformBytes: Number(required('MAX_TERRAFORM_BYTES')),
  runFile: join(projectRoot, 'results', 'run.json'),
  heldOutDir: join(projectRoot, 'tests', 'heldout'),
  terragoatDir: join(projectRoot, 'docs', 'research', 'samples', 'terragoat'),
}
