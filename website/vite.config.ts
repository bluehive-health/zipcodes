import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The site runs the real library in the browser. It is aliased to the TypeScript
// source in the repo root, so the playground always matches the code in this commit.
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@bluehive/zipcodes': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
        },
    },
    build: {
        // The dataset is one ~1.5 MB chunk, loaded on demand by the playground.
        chunkSizeWarningLimit: 1600,
    },
    ssr: {
        // Bundle everything into the prerender build so it runs with plain `node`.
        noExternal: true,
    },
});
