import { test, expect } from '@playwright/test';

import { setupPage } from './helpers';

test.describe('MyTimetable App Splash Screen End-to-End Tests', () => {
	test('should display splash screen on first visit, allow starting, persist state, and allow re-opening from footer', async ({
		page,
	}) => {
		// 1. Visit with a clean storage environment (no addInitScript to skip splash)
		await page.goto('/');

		// Verify splash screen elements are visible
		const mainHeading = page.getByRole('main').getByRole('heading', {
			name: 'MyTimetable',
			exact: true,
		});
		await expect(mainHeading).toBeVisible();

		const badge = page.locator('text=Made by Adelaide Uni CS Club');
		await expect(badge).toBeVisible();

		const startButton = page.getByRole('button', {
			name: 'Start scheduling!',
		});
		await expect(startButton).toBeVisible();

		const featuresHeader = page.getByRole('heading', {
			name: 'Powerful Features',
		});
		await expect(featuresHeader).toBeVisible();

		const howToUseHeader = page.getByRole('heading', { name: 'How to Use' });
		await expect(howToUseHeader).toBeVisible();

		const contribCard = page.locator('text=Interested in Contributing?');
		await expect(contribCard).toBeVisible();

		// 2. Click Start button to enter the application
		await startButton.click({ force: true });
		await page.waitForTimeout(500);
		try {
			await expect(startButton).not.toBeVisible({ timeout: 2000 });
		} catch (e) {
			// Fallback click in case of transient hydration/event-loop lag
			await startButton.click({ force: true });
			await page.waitForTimeout(500);
		}

		// Verify that the splash screen is gone and the main dashboard is visible
		await expect(startButton).not.toBeVisible();
		const termSelector = page.getByRole('button', { name: /Select a term/ });
		await expect(termSelector).toBeVisible();

		// 3. Reload the page and verify that we go directly to the dashboard
		await page.goto('/');
		await expect(startButton).not.toBeVisible();
		await expect(termSelector).toBeVisible();

		// 4. Click the "About" link in the footer to re-open the splash screen
		const aboutLink = page.getByRole('heading', { name: 'About' });
		await expect(aboutLink).toBeVisible();
		await aboutLink.click();
		await page.waitForTimeout(500);

		// Verify that the splash screen is displayed again
		await expect(mainHeading).toBeVisible();
		await expect(startButton).toBeVisible();

		// 5. Close the splash screen again using the start button
		await startButton.click({ force: true });
		await page.waitForTimeout(500);
		try {
			await expect(startButton).not.toBeVisible({ timeout: 2000 });
		} catch (e) {
			await startButton.click({ force: true });
			await page.waitForTimeout(500);
		}
		await expect(startButton).not.toBeVisible();
		await expect(termSelector).toBeVisible();
	});
});
