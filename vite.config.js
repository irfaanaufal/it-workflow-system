import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/@inertiajs/react/')) {
                        return 'vendor';
                    }
                    if (id.includes('node_modules/framer-motion/') || id.includes('node_modules/@hello-pangea/')) {
                        return 'ui';
                    }
                    if (id.includes('node_modules/laravel-echo/') || id.includes('node_modules/pusher-js/')) {
                        return 'echo';
                    }
                },
            },
        },
    },
});
