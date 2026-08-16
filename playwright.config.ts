import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

// Next.js auto-loads .env.local for the app itself, but this test runner
// is a separate Node process — CI sets these as real environment
// variables (GitHub Secrets), so only load .env.local locally where it
// exists.
loadEnv({ path: '.env.local' });

export default defineConfig({
  testDir: './e2e',
  // Mapbox GL's WebGL context init is genuinely slower under concurrent
  // browser load (verified locally: 10/10 pass serially, intermittent
  // under full parallelism) — a higher ceiling here plus running Map
  // tests serially (see explore-map.spec.ts) addresses the actual cause
  // rather than masking it with retries alone.
  timeout: 45_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
});
