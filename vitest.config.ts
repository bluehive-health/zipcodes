import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.test.ts'],
        coverage: {
            include: ['src/**/*.ts'],
            exclude: ['src/data.generated.ts', 'src/codes.ts'],
            reporter: ['text', 'lcov'],
        },
    },
});
