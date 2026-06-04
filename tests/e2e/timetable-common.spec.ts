import { test, expect } from '@playwright/test';

import { setupPage, enrollMockCourse } from './helpers';

test.describe('MyTimetable App Common End-to-End Tests', () => {
	test.beforeEach(async ({ page }) => {
		await setupPage(page);
	});

	test('should allow changing terms, searching and adding a course, opening the course modal, and updating class options', async ({
		page,
		isMobile,
	}) => {
		await page.goto('/');

		// 1. Term Selector and changing term
		const termSelect = page.getByRole('button', { name: /Select a term/ });
		await expect(termSelect).toBeVisible();
		await termSelect.click();
		await page.waitForTimeout(500); // Let popover open

		// Let's select Semester 2
		const sem2Option = page.getByRole('option', { name: 'Semester 2' });
		await expect(sem2Option).toBeVisible();
		await sem2Option.click();
		await page.waitForTimeout(500); // Let transition finish

		// Enroll the mock course using shared helper
		await enrollMockCourse(page);

		// 2. Verify course chip appears
		// Since name of course in enrolled-courses has sanitized name: `2103` (sans `$`)
		const courseChip = page.locator('span').filter({ hasText: '2103' }).first();
		await expect(courseChip).toBeVisible();

		// Click on course chip to open modal
		await courseChip.click();

		// Verify course modal is open
		const modalHeader = page.getByRole('dialog').locator('header');
		await expect(modalHeader).toContainText(
			'2103 - Algorithm Design & Data Structures',
		);

		// 3. Modifying class selections inside the modal
		const practicalSelect = page.getByRole('button', {
			name: /Practical Time/,
		});
		await expect(practicalSelect).toBeVisible();

		if (!isMobile) {
			const listbox = page.locator('[role="listbox"]');
			// Open the select dropdown. We retry clicking if it fails to open
			let opened = false;
			for (let attempt = 1; attempt <= 3; attempt++) {
				await practicalSelect.click();
				await page.waitForTimeout(500);
				if (await listbox.isVisible()) {
					opened = true;
					break;
				}
			}
			if (!opened) {
				await practicalSelect.focus();
				await practicalSelect.click();
				await page.waitForTimeout(1000);
			}

			await expect(listbox).toBeVisible({ timeout: 5000 });
			const class25026Option = listbox
				.locator('[role="option"]')
				.filter({ hasText: /25026/ })
				.first();
			await expect(class25026Option).toBeVisible();
			await class25026Option.click();
		} else {
			const nativeSelect = page
				.locator('select')
				.filter({ hasText: /25026/ })
				.first();
			await expect(nativeSelect).toBeAttached();
			await nativeSelect.selectOption('25026');
		}
		await page.waitForTimeout(500);

		// Verify selection has updated (disabled keys prevent re-clicking, so selected key should be 25026)
		await expect(practicalSelect).toContainText('25026');

		// Close modal by pressing Escape
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeVisible();
	});
});
