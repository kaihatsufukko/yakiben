import { defineConfig } from 'vite';

// Vite 設定（最小）
// - 開発サーバ: `npm run dev`
// - 本番ビルド: `npm run build`（dist/ に出力）
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
