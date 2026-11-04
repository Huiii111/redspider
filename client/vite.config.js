import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_SERVER = 'http://127.0.0.1:3101'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': API_SERVER } },
})
