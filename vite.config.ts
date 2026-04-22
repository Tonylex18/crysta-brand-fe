import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    target: ['es2020', 'safari13'],
    cssTarget: 'safari13',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('axios')) return 'network';
          if (id.includes('react-paystack')) return 'payments';

          return 'vendor';
        },
      },
    },
  },
});
