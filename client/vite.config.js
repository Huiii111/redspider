import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { samplePlugin } from './dev-sample/samplePlugin.js'

const API_SERVER = 'http://127.0.0.1:3101'
const SAMPLE_MODE = 'sample'

export default defineConfig(({ mode }) => ({
  plugins: mode === SAMPLE_MODE ? [react(), samplePlugin()] : [react()],
  server: mode === SAMPLE_MODE ? {} : { proxy: { '/api': API_SERVER } },
}))
