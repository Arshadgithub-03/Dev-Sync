// Vite configuration for React project
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Export the configuration
export default defineConfig({
  // Register React plugin
  plugins: [react()],

  // Build options
  build: {
    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 1000,
  },

  // Dev server options
  server: {
    // Set security headers for cross-origin isolation (for things like SharedArrayBuffer)
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin"
    }
  },

  // Optimize dependencies for faster dev startup
  optimizeDeps: {
    include: [
      "@codemirror/state",
      "@codemirror/view",
      "@codemirror/lang-javascript",
      "@codemirror/lang-html",
      "@codemirror/lang-css",
      "@codemirror/lang-markdown"
    ]
  }
})