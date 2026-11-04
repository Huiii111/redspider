import { config } from './config.js';
import { createApp } from './app.js';
import { loadAdapters } from './core/registry.js';

const adapters = await loadAdapters(config.adaptersDir); // Fail at startup, not mid-demo, if an adapter is malformed.
if (adapters.length === 0) console.warn(`No adapters found in ${config.adaptersDir}. /api/scan will return no results.`);

createApp({ config }).listen(config.port, config.host, () => {
  console.log(`API on http://${config.host}:${config.port}/api  (tools: ${adapters.map((a) => a.id).join(', ') || 'none'})`);
});
