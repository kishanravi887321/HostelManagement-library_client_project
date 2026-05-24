import tailwindcss from '@tailwindcss/vite'; // 💡 1. Import the Tailwind compiler plugin
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // 💡 2. Initialize it inside the plugins array
  ],
});