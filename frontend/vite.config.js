import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// base 必须从环境变量注入：
//   本地 /，GitHub Pages /仓库名/，否则线上资源路径全 404
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useMock = env.VITE_USE_MOCK === 'true'

  return {
    base: env.VITE_BASE || '/',
    plugins: [
      vue(),
      // Element Plus 按需引入：不这么做打包会到 2.4MB 以上
      AutoImport({ resolvers: [ElementPlusResolver()], imports: ['vue', 'vue-router', 'pinia'] }),
      Components({ resolvers: [ElementPlusResolver()] })
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    },
    server: {
      port: 5173,
      // 开发时用代理绕开跨域；生产走 Nginx 同域或后端 CORS
      proxy: useMock
        ? {}
        : {
            '/api': { target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8080', changeOrigin: true },
            '/upload': { target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8080', changeOrigin: true }
          }
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          // 把重的第三方拆出来，首屏更稳（Vite 8 / rolldown 只支持函数形式）
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('element-plus')) return 'element'
            if (id.includes('echarts')) return 'echarts'
            return 'vendor'
          }
        }
      }
    }
  }
})
