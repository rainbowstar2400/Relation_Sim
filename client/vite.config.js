import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 環境変数を読み込む（.envファイルを明示的に反映）
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173
    },
    define: {
      'import.meta.env': {
        ...env,
      }
    }
  }
})
