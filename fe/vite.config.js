import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: '../build/fe/', // <-- Change this to your desired folder name
  },
  plugins: [react()],
})
