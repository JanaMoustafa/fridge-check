import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // Signs the suite in as a test member where accounts are on (see tests/e2e/member.ts).
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    storageState: 'tests/e2e/.auth/member.json',
    // The programme intros play on every entry; tests opt back in where they test the intro.
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // e2e runs against a fresh production server of the current build (`pnpm build` first).
  // Reusing an already-running server is opt-in: a stale server serves deleted chunks.
  webServer: {
    command: `pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
    timeout: 120_000,
    // The suite never calls a live recipe API, and every test comes from one address, which the
    // per-IP rate limit would otherwise throttle.
    env: { RECIPE_PROVIDER: 'local', RATE_LIMIT_PER_MINUTE: '0' },
  },
})
