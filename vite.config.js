import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages (project pages), we must serve under "/<repo-name>/".
// This workflow sets BASE_PATH to "/<repo-name>/" so assets resolve correctly.
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  plugins: [react()],
  base
})
