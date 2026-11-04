import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { samplePlugin } from './dev-sample/samplePlugin.js'

// The backend listens on 3001 (architecture.md). Set API_SERVER to point elsewhere.
const API_SERVER = process.env.API_SERVER || 'http://127.0.0.1:3001'
const SAMPLE_MODE = 'sample'

export default defineConfig(({ mode }) => ({
  plugins: mode === SAMPLE_MODE ? [react(), samplePlugin()] : [react()],
  server: mode === SAMPLE_MODE ? {} : { proxy: { '/api': API_SERVER } },
}))
