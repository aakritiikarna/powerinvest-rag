import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The AI assistant backend (server/) runs on port 8787. Forwarding /api to it means the
// browser only talks to one origin, so no CORS setup is needed and the API key stays on the server.
const assistantApi = { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 3000, proxy: assistantApi },
  preview: { host: '0.0.0.0', port: 3000, proxy: assistantApi }
});
