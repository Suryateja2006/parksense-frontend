import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(),react()],
  server: {
    host: true,  // Set to `true` to listen on all network interfaces
    allowedHosts: ['.ngrok-free.app'],  // Allow Ngrok URLs
  },
})
