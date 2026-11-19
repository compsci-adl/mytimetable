import { test, expect, type Page } from '@playwright/test';

import { setupPage, enrollMockCourse } from './helpers';

async function selectYear(page: Page, year: number) {
	const yearSelect = page.getByRole('button', { name: /Select a year/ });
	await expect(yearSelect).toBeEnabled();
	await yearSelect.click();
	await page.waitForTimeout(500); // Let popover open
	await page.getByRole('option', { name: String(year) }).click();
	await page.waitForTimeout(500);
}

test.describe('MyTimetable App Year End-to-End Tests', () => {
	test.beforeEach(async ({ page }) => {
		await setupPage(page);
	});

	test('should keep a course in its own year when the year changes before the course loads', async ({
		page,
	}) => {
		// Keep course detail requests until the test releases them
		await page.addInitScript(() => {
			let release = () => {};
			const released = new Promise<void>((resolve) => {
				release = resolve;
			});
			Object.assign(window, { releaseCourseRequests: () => release() });
			const originalFetch = window.fetch.bind(window);
			window.fetch = async (input, init) => {
				const url = input instanceof Request ? input.url : String(input);
				if (/\/mock\/courses\/[^/?]+$/.test(url)) {
					await released;
				}
				return originalFetch(input, init);
			};
		});
		await page.goto('/');

		// The mock API makes 2027 the default year
		const yearSelect = page.getByRole('button', { name: /Select a year/ });
		await expect(yearSelect).toContainText('2027');

		await enrollMockCourse(page);
		const courseChip = page.locator('span').filter({ hasText: '2103' });
		await expect(courseChip.first()).toBeVisible();

		// Switch to the empty 2026 timetable before the course details load
		await selectYear(page, 2026);
		await page.getByRole('button', { name: 'Switch', exact: true }).click();
		await expect(courseChip).toHaveCount(0);

		const courseResponse = page.waitForResponse(/\/mock\/courses\/[^/?]+$/);
		await page.evaluate('releaseCourseRequests()');
		await courseResponse;
		await page.waitForTimeout(500); // Let the course classes save
		await expect(courseChip).toHaveCount(0);

		await selectYear(page, 2027);
		await expect(courseChip.first()).toBeVisible();
		await expect(
			page.locator('text=Lecture').filter({ visible: true }).first(),
		).toBeVisible();
	});

	test('should keep a timetable saved before multi-year support in the year it opens in', async ({
		page,
	}) => {
		await page.clock.setFixedTime(new Date('2026-08-01T10:00:00'));
		await page.addInitScript(() => {
			window.localStorage.setItem(
				'MTT.enrolled-courses',
				JSON.stringify({
					state: {
						courses: [
							{
								id: '8b8afe1b-449b-4cce-b108-8dd8eef4648e',
								name: '2103',
								classes: [],
								color: 0,
							},
						],
					},
					version: 0,
				}),
			);
		});
		const yearsResponse = page.waitForResponse(/\/mock\/years/);
		await page.goto('/');
		await yearsResponse;

		const yearSelect = page.getByRole('button', { name: /Select a year/ });
		await expect(yearSelect).toBeEnabled();
		await expect(yearSelect).toContainText('2026');
		const courseChip = page.locator('span').filter({ hasText: '2103' });
		await expect(courseChip.first()).toBeVisible();

		await selectYear(page, 2027);
		await page.getByRole('button', { name: 'Switch', exact: true }).click();
		await expect(courseChip).toHaveCount(0);

		await selectYear(page, 2026);
		await expect(courseChip.first()).toBeVisible();
	});
});
