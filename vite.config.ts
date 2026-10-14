import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { apiServerPlugin } from './server/apiPlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiServerPlugin()],
  envPrefix: ['VITE_', 'SUPABASE_', 'NEXT_PUBLIC_'],
})
