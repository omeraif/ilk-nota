import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages, siteyi /ilk-nota/ alt yolundan servis eder.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ilk-nota/' : '/',
  plugins: [react(), tailwindcss()],
}))
