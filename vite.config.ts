import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'まもるノート',
        short_name: 'まもるノート',
        description: 'からだの感じを自由に描くフォーカシングノート',
        theme_color: '#FAF6EC',
        background_color: '#FAF6EC',
        display: 'standalone',
        start_url: '/',
        icons: [],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
    }),
  ],
});
