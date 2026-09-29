import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Bind all interfaces: on some Windows setups localhost resolves to
    // 127.0.0.1 while the default bind is IPv6-only, causing connection refusals.
    host: true,
  },
})