import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDocker = process.env.DOCKER === 'true';
  const backendTarget = isDocker ? 'http://backend:3000' : (env.VITE_API_BASE_URL || 'http://127.0.0.1:3001');

  return {
    base: '/',
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: false,
        workbox: {
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: { cacheName: 'html-cache' },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@views': path.resolve(__dirname, './src/views'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': { target: backendTarget, changeOrigin: true },
        '/uploads': { target: backendTarget, changeOrigin: true },
      },
    },
    define: {
      __APP_NAME__: JSON.stringify(env.VITE_APP_TITLE || 'EcoBank'),
    },
  };
});
