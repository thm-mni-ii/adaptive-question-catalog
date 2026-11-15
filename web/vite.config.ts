import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import eslintPlugin from 'vite-plugin-eslint'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  envDir: false,
  // Public settings for the host dev server. Production uses /config.js from Portainer.
  define: command === 'serve' ? {
    'import.meta.env.VITE_FBS_HOST_ORIGIN': JSON.stringify('http://localhost:8083'),
    'import.meta.env.VITE_FBS_PROVIDER_ID': JSON.stringify('adaptive-question-catalog')
  } : {},
  base: '/',
  css: {
    postcss: {
      plugins: [
        {
          postcssPlugin: 'internal:charset-removal',
          AtRule: {
            charset: (atRule: any) => {
              if (atRule.name === 'charset') {
                atRule.remove()
              }
            }
          }
        }
      ]
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/settings.scss";`
      }
    }
  },
  plugins: [
    vue(),
    vueJsx(),
    eslintPlugin(),
    vuetify({
      autoImport: true
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    port: 8086,
    strictPort: true,
    proxy: {
      '/api_v1': {
        target: 'http://127.0.0.1:3000/',
        changeOrigin: true,
        secure: false
      },
      '/api_v2': {
        target: 'http://127.0.0.1:3001/',
        changeOrigin: true,
        secure: false
      },
      '/core': {
        target: 'https://127.0.0.1/',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/core/, '/api/v1')
      }
    }
  }
}))
