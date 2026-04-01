import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// PERF-10: para ativar compressão Brotli/Gzip no build, instale e descomente:
// npm install -D vite-plugin-compression
// import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    // viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    // viteCompression({ algorithm: 'gzip', ext: '.gz' }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-router': ['react-router-dom'],
          'vendor-form': ['react-hook-form', 'zod'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-toast'],
        },
      },
    },
  },
})
