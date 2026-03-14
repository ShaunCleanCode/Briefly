import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Briefly; Onboarding Tests
 * 
 * Usage:
 *   npm run test:e2e:smoke      - Run smoke tests (< 3 min)
 *   npm run test:e2e:regression - Run full regression
 *   npm run test:e2e:headed     - Run with visible browser
 */

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Action timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 15000,
  },

  // Global timeout for each test
  timeout: 30000,
  
  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Configure projects for major browsers
  projects: [
    // Debug tests - for troubleshooting
    {
      name: 'debug',
      testDir: './tests/e2e/debug',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
      },
      timeout: 30000,
    },
    
    // Smoke tests - fast, critical paths only
    {
      name: 'smoke',
      testDir: './tests/e2e/smoke',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
      },
      timeout: 60000, // 1 min per test max
    },
    
    // Regression tests - comprehensive coverage
    {
      name: 'regression',
      testDir: './tests/e2e/regression',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
      },
      timeout: 120000, // 2 min per test max
    },
    
    // Mobile Chrome tests
    {
      name: 'mobile',
      testDir: './tests/e2e',
      use: { 
        ...devices['Pixel 5'],
        headless: true,
      },
      testIgnore: ['**/smoke/**'], // Skip smoke for mobile, run regression only
    },
  ],

  // Run your local dev server before starting the tests
  // For local development: run `npm run dev` separately
  // For CI: uncomment and set reuseExistingServer: false
  webServer: process.env.CI ? {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120000,
  } : undefined,
});
