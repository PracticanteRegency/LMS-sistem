import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  // Use relative base so built assets resolve correctly when served from file or CDN roots
  base: './',
  plugins: [react()],
  // Allow specific hosts (e.g., ngrok) to access the dev server.
  // Add additional hosts separated by commas in the ALLOWED_HOSTS env var if needed.
  server: {
    allowedHosts: (process.env.ALLOWED_HOSTS
      ? process.env.ALLOWED_HOSTS.split(",").map((h) => h.trim())
      : ["juvenescent-tamelessly-dennis.ngrok-free.dev"]),
    // Configure HMR to work when accessing the dev server through an external HTTPS tunnel (e.g. ngrok).
    // This ensures the client connects to the tunnel domain over wss (port 443) instead of trying to open
    // a websocket directly to localhost which may fail with SSL errors.
    // Configure HMR client connection. Only set a port if explicitly provided
    // via environment variables to avoid attempting to bind the dev server
    // to an external IP/port (which causes EADDRNOTAVAIL when the address
    // isn't available locally).
    hmr: {
      protocol: process.env.HMR_PROTOCOL || 'wss',
      host: process.env.HMR_HOST || 'juvenescent-tamelessly-dennis.ngrok-free.dev',
      port: process.env.HMR_PORT ? parseInt(process.env.HMR_PORT, 10) : undefined,
    },
  },
})
