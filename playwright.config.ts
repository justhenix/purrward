// Playwright E2E config for mobile-first screenshot flows.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	testMatch: '**/*.e2e.ts',
	outputDir: './test-results/artifacts',
	timeout: 90_000,
	fullyParallel: false,
	use: {
		baseURL: 'http://127.0.0.1:4174',
		actionTimeout: 10_000,
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'bun run dev -- --host 127.0.0.1 --port 4174',
		url: 'http://127.0.0.1:4174',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
	projects: [
		{
			name: 'mobile-chrome',
			use: {
				...devices['Pixel 7'],
				viewport: { width: 390, height: 844 }
			}
		}
	]
});
