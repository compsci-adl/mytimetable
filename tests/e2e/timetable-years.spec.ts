import { test, expect, type Page } from '@playwright/test';

import { setupPage, enrollMockCourse } from './helpers';

const COURSE_DETAILS_URL = /\/mock\/courses\/[^/?]+$/;
const YEARS_URL = /\/mock\/years/;

async function openApp(page: Page) {
	const yearsResponse = page.waitForResponse(YEARS_URL);
	await page.goto('/');
	await yearsResponse;
	await expect(
		page.getByRole('button', { name: /Select a year/ }),
	).toBeEnabled();
}

async function selectYear(page: Page, year: number) {
	const yearSelect = page.getByRole('button', { name: /Select a year/ });
	await expect(yearSelect).toBeEnabled();
	await yearSelect.click();
	await page.waitForTimeout(500); // Let popover open
	await page.getByRole('option', { name: String(year) }).click();
	await page.waitForTimeout(500);
}

async function selectTerm(page: Page, term: string) {
	await page.getByRole('button', { name: /Select a term/ }).click();
	await page.waitForTimeout(500); // Let popover open
	await page.getByRole('option', { name: term }).click();
	await page.waitForTimeout(500);
}

async function delayRequests(page: Page, url: RegExp) {
	// Keep matching requests until the test releases them
	await page.addInitScript((source) => {
		const pattern = new RegExp(source);
		let release = () => {};
		const released = new Promise<void>((resolve) => {
			release = resolve;
		});
		Object.assign(window, { releaseRequests: () => release() });
		const originalFetch = window.fetch.bind(window);
		window.fetch = async (input, init) => {
			const url = input instanceof Request ? input.url : String(input);
			if (pattern.test(url)) {
				await released;
			}
			return originalFetch(input, init);
		};
	}, url.source);
}

async function releaseRequests(page: Page, url: RegExp) {
	const response = page.waitForResponse(url);
	await page.evaluate('releaseRequests()');
	await response;
	await page.waitForTimeout(500); // Let the app handle the response
}

test.describe('MyTimetable App Year End-to-End Tests', () => {
	test.beforeEach(async ({ page }) => {
		await setupPage(page);
	});

	test('should keep a course in its own year when the year changes before the course loads', async ({
		page,
	}) => {
		await delayRequests(page, COURSE_DETAILS_URL);
		await openApp(page);

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

		await releaseRequests(page, COURSE_DETAILS_URL);

		await selectYear(page, 2027);
		await expect(courseChip.first()).toBeVisible();
		await expect(
			page.locator('text=Lecture').filter({ visible: true }).first(),
		).toBeVisible();
	});

	test('should keep a course in its own year when another tab changes the year before the course loads', async ({
		page,
		context,
	}) => {
		// Two tabs and a course search take longer than the default timeout
		test.slow();
		const otherPage = await context.newPage();
		await setupPage(otherPage);
		await openApp(otherPage);
		await selectYear(otherPage, 2028);

		await delayRequests(page, COURSE_DETAILS_URL);
		await openApp(page);
		await selectYear(page, 2027);

		await enrollMockCourse(page);
		const courseChip = page.locator('span').filter({ hasText: '2103' });
		await expect(courseChip.first()).toBeVisible();

		// Switch to the empty 2026 timetable before the course details load
		await selectYear(page, 2026);
		await page.getByRole('button', { name: 'Switch', exact: true }).click();
		await expect(courseChip).toHaveCount(0);

		// The other tab selects 2027 and changes the saved year
		await selectYear(otherPage, 2027);
		await expect(
			otherPage.locator('span').filter({ hasText: '2103' }).first(),
		).toBeVisible();

		await releaseRequests(page, COURSE_DETAILS_URL);

		await selectYear(page, 2027);
		await expect(courseChip.first()).toBeVisible();
		await expect(
			page.locator('text=Lecture').filter({ visible: true }).first(),
		).toBeVisible();
	});

	test('should keep a timetable saved before multi-year support in 2026', async ({
		page,
	}) => {
		await page.clock.setFixedTime(new Date('2027-01-15T10:00:00'));
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
		await openApp(page);

		const yearSelect = page.getByRole('button', { name: /Select a year/ });
		await expect(yearSelect).toContainText('2026');
		const courseChip = page.locator('span').filter({ hasText: '2103' });
		await expect(courseChip.first()).toBeVisible();

		await selectYear(page, 2027);
		await page.getByRole('button', { name: 'Switch', exact: true }).click();
		await expect(courseChip).toHaveCount(0);

		await selectYear(page, 2026);
		await expect(courseChip.first()).toBeVisible();
	});

	test('should load the timetable of the selected year when the saved year is not available', async ({
		page,
	}) => {
		await page.addInitScript(() => {
			window.localStorage.setItem('MTT.year', '2025');
			window.localStorage.setItem(
				'mytimetable_2025_sem1',
				JSON.stringify([
					{
						id: '8b8afe1b-449b-4cce-b108-8dd8eef4648e',
						name: '2103',
						classes: [],
						color: 0,
					},
				]),
			);
			window.localStorage.setItem(
				'mytimetable_2027_sem1',
				JSON.stringify([
					{
						id: '35dcf831-4888-475a-a172-7842ae3c526e',
						name: '1104',
						classes: [],
						color: 0,
					},
				]),
			);
		});
		await openApp(page);

		// The mock API does not offer 2025, so the app selects 2027
		const yearSelect = page.getByRole('button', { name: /Select a year/ });
		await expect(yearSelect).toContainText('2027');
		const savedCourseChip = page.locator('span').filter({ hasText: '1104' });
		const otherYearCourseChip = page
			.locator('span')
			.filter({ hasText: '2103' });
		await expect(savedCourseChip.first()).toBeVisible();
		await expect(otherYearCourseChip).toHaveCount(0);

		await selectYear(page, 2026);
		await page.getByRole('button', { name: 'Switch', exact: true }).click();
		await selectYear(page, 2027);
		await expect(savedCourseChip.first()).toBeVisible();
		await expect(otherYearCourseChip).toHaveCount(0);
	});

	test('should keep the term and both timetables when a term switch is cancelled', async ({
		page,
	}) => {
		await page.addInitScript(() => {
			// Seed storage on the first load only, so the reload keeps what the app saved
			if (window.localStorage.getItem('mytimetable_2027_sem1') !== null) {
				return;
			}
			window.localStorage.setItem('MTT.year', '2027');
			window.localStorage.setItem('MTT.term', 'sem1');
			window.localStorage.setItem(
				'mytimetable_2027_sem1',
				JSON.stringify([
					{
						id: '8b8afe1b-449b-4cce-b108-8dd8eef4648e',
						name: '2103',
						classes: [],
						color: 0,
					},
				]),
			);
			window.localStorage.setItem(
				'mytimetable_2027_sem2',
				JSON.stringify([
					{
						id: '35dcf831-4888-475a-a172-7842ae3c526e',
						name: '1104',
						classes: [],
						color: 0,
					},
				]),
			);
		});
		await openApp(page);

		await selectTerm(page, 'Semester 2');
		await page.getByRole('button', { name: 'Cancel', exact: true }).click();

		await openApp(page);
		await expect(
			page.getByRole('button', { name: /Select a term/ }),
		).toContainText('Semester 1');

		await page
			.getByRole('button', { name: 'Remove course', exact: true })
			.click();
		await expect(page.locator('span').filter({ hasText: '2103' })).toHaveCount(
			0,
		);

		await selectTerm(page, 'Semester 2');
		await expect(
			page.locator('span').filter({ hasText: '1104' }).first(),
		).toBeVisible();
	});

	test('should wait for the year to load before searching courses or switching term', async ({
		page,
	}) => {
		await page.clock.setFixedTime(new Date('2026-08-01T10:00:00'));
		await page.addInitScript(() => {
			window.localStorage.setItem('MTT.year', '2027');
		});
		await delayRequests(page, YEARS_URL);
		const subjectYears: string[] = [];
		page.on('request', (request) => {
			const url = new URL(request.url());
			if (url.pathname.endsWith('/mock/subjects')) {
				subjectYears.push(url.searchParams.get('year') ?? '');
			}
		});
		await page.goto('/');

		// The selected year stays at the calendar year until the years request finishes
		await page.waitForTimeout(1000); // Give a subjects request for 2026 time to start
		expect(subjectYears).not.toContain('2026');
		await expect(
			page.getByRole('combobox', { name: 'Choose a subject area' }),
		).toBeDisabled();
		await expect(
			page.getByRole('button', { name: /Select a term/ }),
		).toBeDisabled();

		await releaseRequests(page, YEARS_URL);
		await expect(
			page.getByRole('button', { name: /Select a year/ }),
		).toContainText('2027');

		await enrollMockCourse(page);
		const courseChip = page.locator('span').filter({ hasText: '2103' });
		await expect(courseChip.first()).toBeVisible();

		await selectYear(page, 2026);
		await page.getByRole('button', { name: 'Switch', exact: true }).click();
		await expect(courseChip).toHaveCount(0);

		await selectYear(page, 2027);
		await expect(courseChip.first()).toBeVisible();
	});
});
