import { checkov } from './adapters/checkov.js'
import { createKics } from './adapters/kics.js'
import { trivy } from './adapters/trivy.js'
import { config } from './config.js'

const timeoutMs = config.scanTimeoutSeconds * 1000

export const tools = [
  { adapter: trivy, bin: config.bins.trivy, timeoutMs },
  { adapter: checkov, bin: config.bins.checkov, timeoutMs },
  { adapter: createKics(config.kicsQueriesPath), bin: config.bins.kics, timeoutMs },
]
