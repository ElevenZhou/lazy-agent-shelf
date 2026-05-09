import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/lazy-agent-shelf/' : '/',
  plugins: [react()]
});
