import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite configuration: React plugin plus the Tailwind plugin
export default defineConfig({
  plugins: [react(), tailwindcss()],
})