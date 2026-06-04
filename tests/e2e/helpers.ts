import { expect, type Page } from '@playwright/test';

export async function setupPage(page: Page) {
	page.on('requestfailed', (request) => {
		console.error(
			`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`,
		);
	});
	page.on('response', (response) => {
		if (
			response.status() >= 400 &&
			!response.url().includes('umami.csclub.org.au')
		) {
			console.error(
				`RESPONSE ERROR: ${response.url()} status=${response.status()}`,
			);
		}
	});
	page.on('pageerror', (error) => {
		console.error(`PAGE EXCEPTION: ${error.stack || error.message}`);
	});

	// Set first-time flag to false so the help tour modal does not show up
	await page.addInitScript(() => {
		window.localStorage.setItem('MTT.first-time', 'false');
	});
}

export async function enrollMockCourse(page: Page) {
	const subjectAutocomplete = page.getByLabel('Choose a subject area');
	await subjectAutocomplete.click();
	await subjectAutocomplete.fill('COMP SCI');
	await page.waitForTimeout(500); // Let suggestions settle
	const subjectOption = page.getByRole('option', {
		name: 'COMP SCI - Computer Science',
	});
	await expect(subjectOption).toBeVisible();
	await subjectOption.click();
	await page.waitForTimeout(500);

	const courseAutocomplete = page.getByLabel('Search a course');
	await courseAutocomplete.click();
	await courseAutocomplete.fill('Algorithm Design');
	await page.waitForTimeout(500); // Let suggestions settle
	const courseOption = page.getByRole('option', {
		name: '2103 - Algorithm Design & Data Structures',
	});
	await expect(courseOption).toBeVisible();
	await courseOption.click();
	await page.waitForTimeout(500);

	await page.getByRole('button', { name: 'Add' }).click();
}
