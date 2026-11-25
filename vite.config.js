import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: "FilmDot — Filmmaker's AI Toolkit & Storyboard",
        short_name: 'FilmDot',
        description: 'Cinematic shot planning, AI screenplay breakdown, and offline storyboard sketching.',
        theme_color: '#6366f1',
        background_color: '#020617',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/fabric')) {
            return 'fabric';
          }
          if (id.includes('node_modules/@xyflow')) {
            return 'xyflow';
          }
          if (id.includes('node_modules/dexie')) {
            return 'dexie';
          }
          if (id.includes('node_modules/@google/genai')) {
            return 'genai';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
