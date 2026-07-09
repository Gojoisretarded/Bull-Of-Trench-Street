import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Bull of Trench Street — dev/build config
export default defineConfig({
  plugins: [react()],
  server: { port: 5188, host: true },
});
