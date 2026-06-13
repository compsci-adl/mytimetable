import { test, expect } from '@playwright/test';

import { setupPage, enrollMockCourse } from './helpers';

test.describe('MyTimetable App Desktop End-to-End Tests', () => {
	test.beforeEach(async ({ page }) => {
		await setupPage(page);
	});

	test('should customise auto-timetable preferences (Desktop layout) and verify lunch break settings and mode selection', async ({
		page,
	}) => {
		await page.goto('/');

		// Enroll in a mock course
		await enrollMockCourse(page);

		// Wait for the course classes to render on the calendar to ensure data is loaded
		await expect(
			page.locator('text=Lecture').filter({ visible: true }).first(),
		).toBeVisible();

		// Trigger Auto Timetable Preferences popover
		const autoTimetableBtn = page.getByRole('button', {
			name: 'AUTO-TIMETABLE',
		});
		await expect(autoTimetableBtn).toBeVisible();
		await autoTimetableBtn.click();
		await page.waitForTimeout(500); // Let popover open

		// Check the earliest start select
		const earliestStartSelect = page.getByRole('button', {
			name: /Earliest start/,
		});
		await expect(earliestStartSelect).toBeVisible();
		await earliestStartSelect.click();
		await page.waitForTimeout(500);
		await page.getByRole('option', { name: '8am' }).first().click();
		await page.waitForTimeout(500);

		// Select the latest end select
		const latestEndSelect = page.getByRole('button', { name: /Latest end/ });
		await expect(latestEndSelect).toBeVisible();
		await latestEndSelect.click();
		await page.waitForTimeout(500);
		await page.getByRole('option', { name: '6pm' }).first().click();
		await page.waitForTimeout(500);

		// Enable preferred lunch break switch
		const lunchSwitch = page.getByLabel('Enable preferred lunch break');
		await expect(lunchSwitch).toBeVisible();
		// Let's check its state, click it to enable
		await lunchSwitch.click({ force: true });

		// Check that lunch start and end time inputs become visible
		const lunchStartSelect = page.getByRole('button', { name: /Lunch start/ });
		await expect(lunchStartSelect).toBeVisible();
		const lunchEndSelect = page.getByRole('button', { name: /Lunch end/ });
		await expect(lunchEndSelect).toBeVisible();

		// Select "ONLINE" mode
		const onlineModeBtn = page
			.locator('button')
			.filter({ hasText: /^ONLINE$/ });
		await expect(onlineModeBtn).toBeVisible();
		await onlineModeBtn.click();

		// Click "Allow lecture clashes" switch
		const ignoreLecturesSwitch = page.getByLabel('Ignore lectures');
		await expect(ignoreLecturesSwitch).toBeVisible();
		await ignoreLecturesSwitch.click({ force: true });

		// Click GO button to run auto-timetable solver
		const goButton = page.getByRole('button', { name: 'GO' });
		await expect(goButton).toBeVisible();
		await goButton.click();

		await page.waitForTimeout(2000);
		const toasts = await page.evaluate(() => {
			return Array.from(document.querySelectorAll('*'))
				.filter((el) => {
					const id = el.id || '';
					const cls = typeof el.className === 'string' ? el.className : '';
					const dataAttr = el.outerHTML.slice(0, 100);
					return (
						id.includes('toast') ||
						cls.includes('toast') ||
						dataAttr.includes('toast')
					);
				})
				.map((el) => ({
					tagName: el.tagName,
					id: el.id,
					className: el.className,
					outerHTML: el.outerHTML.slice(0, 200),
				}));
		});
		// eslint-disable-next-line no-console
		console.log('FOUND TOASTS IN TEST 2:', toasts);

		// We should see a success/warning toast message
		const toast = page.locator('[data-sonner-toast]');
		await expect(toast).toBeVisible({ timeout: 15000 });
	});
});
