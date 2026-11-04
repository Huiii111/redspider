import { createApp } from './app.js'
import { config } from './config.js'
import { findSyntaxError, probeTool, scanPair } from './sandbox/toolbox.js'
import { loadStoredRun } from './store.js'
import { tools } from './tools.js'

const timeoutMs = config.scanTimeoutSeconds * 1000
const toolHealth = await Promise.all(tools.map(probeTool))

const app = createApp({
  health: () => toolHealth,
  loadRun: () => loadStoredRun(config.runFile),
  syntaxError: (terraform) => findSyntaxError(config.bins.terraform, terraform, timeoutMs),
  scanPair: (before, after) => scanPair(tools, before, after),
  limits: { maxTerraformBytes: config.maxTerraformBytes, scanTimeoutSeconds: config.scanTimeoutSeconds },
})

app.listen(config.port, config.host, (error) => {
  if (error) throw error
  console.info(JSON.stringify({ level: 'info', message: 'listening', host: config.host, port: config.port, tools: toolHealth }))
})
