import { test, expect } from '@playwright/test';

import { setupPage, enrollMockCourse } from './helpers';

test.describe('MyTimetable App Mobile End-to-End Tests', () => {
	test.beforeEach(async ({ page }) => {
		await setupPage(page);
	});

	test('should open mobile Drawer layout on mobile devices and verify it functions properly', async ({
		page,
	}) => {
		// Use a viewport matching mobile (Pixel 5 or iPhone 12)
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto('/');

		// Enroll in a mock course
		await enrollMockCourse(page);

		// Verify "AUTO-TIMETABLE" button is visible and opens Drawer
		const autoTimetableBtn = page.getByRole('button', {
			name: 'AUTO-TIMETABLE',
		});
		await expect(autoTimetableBtn).toBeVisible();
		await autoTimetableBtn.click();

		// Drawer Header contains the text
		const drawerHeader = page.getByText('Auto-Timetable Preferences');
		await expect(drawerHeader).toBeVisible();

		// Confirm "Earliest start time" select is visible inside Drawer
		const earliestStartSelect = page.getByRole('button', {
			name: /Earliest start/,
		});
		await expect(earliestStartSelect).toBeVisible();

		// Verify close of Drawer works via pressing escape
		await page.keyboard.press('Escape');
		await expect(drawerHeader).not.toBeVisible();
	});
});
