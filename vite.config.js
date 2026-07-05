import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Electron বিল্ডে অ্যাপ file:// দিয়ে লোড হয় → relative base ('./') দরকার।
// Web / GitHub Pages বিল্ডে আগের মতোই absolute base থাকবে।
const isElectron = process.env.BUILD_TARGET === 'electron'

// https://vite.dev/config/
export default defineConfig({
  base: isElectron ? './' : '/Al-azhar-management/',
  plugins: [react()],
})
