import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  
  plugins: [react(),tailwindcss()],
  server: {port: 5174},
  alias: {
    '@': '/src', // Ensure this points to your src directory
  },
});
