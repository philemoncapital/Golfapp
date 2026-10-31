import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Pulse Golf Training',
        short_name: 'Pulse',
        start_url: '/',
        display: 'standalone',
        background_color: '#0E0F11',
        theme_color: '#0E0F11',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'], navigateFallback: '/index.html' },
    }),
  ],
  test: { environment: 'node' },
});
