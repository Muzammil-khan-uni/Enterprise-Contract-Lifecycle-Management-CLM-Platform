import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@features': path.resolve(import.meta.dirname, 'src/features'),
      '@shared': path.resolve(import.meta.dirname, 'src/shared'),
      '@app': path.resolve(import.meta.dirname, 'src/app'),
    },
  },
  server: { port: 5173 },
  
  
  
  
  
  
  
  
  
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    
    
    
    
    
    
    
    
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
