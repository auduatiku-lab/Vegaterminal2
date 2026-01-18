import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // We add a fallback to an empty string to prevent "undefined" from breaking the build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "")
  },
  build: {
    // This helps prevent small warnings from stopping the build on Netlify
    chunkSizeWarningLimit: 1000,
  }
});