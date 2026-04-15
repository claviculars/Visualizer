import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoBase = '/Visualizer/'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages project sites are served from /<repo-name>/ in production.
  base: command === 'build' ? repoBase : '/',
}))
