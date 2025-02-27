import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 根据环境变量设置基础路径
  // 在GitHub Pages环境中使用仓库名称作为基础路径
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".jsx", ".vue"],
    alias: {
      '@': resolve(__dirname, "./src")
    }
  }
})