import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: ''
        },
        {
          src: 'public/assets/*',
          dest: 'assets'
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'index.html',
        content: 'src/content/index.ts',
        background: 'src/background.ts'  

      },
      output: {
        entryFileNames: '[name].js',
      },
    },
    outDir: 'dist',
    assetsDir: '.',
  },
  base: "",
})