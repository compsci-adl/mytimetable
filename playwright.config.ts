import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './tests/e2e',
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 1,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: 'http://localhost:5174',

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			testIgnore: /.*-mobile\.spec\.ts/,
		},

		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
			testIgnore: /.*-mobile\.spec\.ts/,
		},

		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
			testIgnore: /.*-mobile\.spec\.ts/,
		},

		/* Test against mobile viewports. */
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
			testIgnore: /.*-desktop\.spec\.ts/,
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] },
			testIgnore: /.*-desktop\.spec\.ts/,
		},
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: 'pnpm dev --port 5174',
		url: 'http://localhost:5174',
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
		env: {
			VITE_API_BASE_URL: '/mock',
			VITE_YEAR: '2024',
		},
	},
});
