import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  '@messages': fileURLToPath(new URL('./messages', import.meta.url)),
  // `server-only` throws when imported outside a React Server environment; tests run server modules directly.
  'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
}

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: [
            'src/lib/**/*.test.ts',
            'src/types/**/*.test.ts',
            'src/i18n/**/*.test.ts',
            'scripts/**/*.test.ts',
            'tests/unit/**/*.test.ts',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/components/**/*.test.tsx', 'src/hooks/**/*.test.{ts,tsx}'],
          setupFiles: ['./tests/setup/dom.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/*.test.ts', 'src/lib/**/index.ts'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
      reporter: ['text', 'html', 'json-summary'],
    },
  },
})
