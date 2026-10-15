import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // Precisa vir antes do plugin do React para as rotas geradas serem transformadas.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(import.meta.dirname, './src') },
      // O MSW só usa o tough-cookie para cookies, que o app não usa; a versão mínima evita 257 KB do tldts.
      { find: /^tough-cookie$/, replacement: path.resolve(import.meta.dirname, './src/mocks/shims/tough-cookie.ts') },
    ],
  },
})
