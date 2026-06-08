import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
// PERF-10: para ativar compressão Brotli/Gzip no build, instale e descomente:
// npm install -D vite-plugin-compression
// import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    // viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    // viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // registramos manualmente em src/pwa.ts
      includeAssets: ['icons/apple-touch-icon.png', 'assets/favicon.ico'],
      manifest: {
        name: 'Arcaika — Marketplace de Serviços',
        short_name: 'Arcaika',
        description: 'Encontre e contrate os melhores serviços perto de você.',
        lang: 'pt-BR',
        theme_color: '#F97316',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache apenas o shell do app; imagens/landing pesadas ficam em runtime cache.
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2,ico}'],
        globIgnores: ['**/assets/landing/**'],
        navigateFallback: '/index.html',
        // Não interceptar a API (outra origem) nem rotas de auth como navegação SPA.
        navigateFallbackDenylist: [/^\/api/, /^\/auth\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Google Fonts (stylesheet)
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // Google Fonts (arquivos de fonte)
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Imagens estáticas servidas pelo próprio app
            urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        // Permite testar o PWA com `npm run dev`.
        enabled: false,
        type: 'module',
      },
    }),
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
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
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
