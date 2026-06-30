import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function localAiRuntime() {
  return {
    name: 'theseus-local-ai-runtime',
    apply: 'serve',
    async configureServer() {
      if (process.env.THESEUS_ELECTRON_DEV === '1') return;

      // The browser cannot execute Claude Code or read private persona files.
      // Start the loopback-only runtime inside the same `npm run dev` process.
      await import('./bridge-server/server.js')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [localAiRuntime(), react()],
})
