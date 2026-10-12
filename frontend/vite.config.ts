import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build` — обычная сборка в dist/.
// `npm run build:single` — один самодостаточный index.html (для демо/артефакта).
export default defineConfig(({ mode }) => ({
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  // В разработке /api уходит на локальный бэкенд (uvicorn на :8000), как nginx в бою.
  server: { proxy: { '/api': 'http://localhost:8000' } },
}))
