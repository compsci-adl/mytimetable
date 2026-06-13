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
	// Wait for the subject combobox to be visible and fully loaded (not in loading state)
	await expect(subjectAutocomplete).toBeVisible({ timeout: 10000 });
	await expect(subjectAutocomplete).not.toHaveAttribute(
		'placeholder',
		/Loading/i,
		{ timeout: 10000 },
	);
	await expect(subjectAutocomplete).toBeEnabled({ timeout: 10000 });

	// Focus the input, then type — typing characters opens the ComboBox via menuTrigger
	await subjectAutocomplete.focus();
	await page.waitForTimeout(200);
	// Type each character with a small delay so React Aria opens the dropdown
	await subjectAutocomplete.type('COMP SCI');
	await page.waitForTimeout(1000); // Let React state update and suggestions render

	const subjectOption = page.getByRole('option', {
		name: 'COMP SCI - Computer Science',
	});
	await expect(subjectOption).toBeVisible({ timeout: 15000 });
	await subjectOption.click();
	await page.waitForTimeout(500);

	const courseAutocomplete = page.getByLabel('Search a course');
	await expect(courseAutocomplete).toBeVisible({ timeout: 10000 });
	await expect(courseAutocomplete).toBeEnabled({ timeout: 10000 });
	await courseAutocomplete.focus();
	await page.waitForTimeout(200);
	await courseAutocomplete.type('Algorithm Design');
	await page.waitForTimeout(1000); // Let React state update and suggestions render
	const courseOption = page.getByRole('option', {
		name: '2103 - Algorithm Design & Data Structures',
	});
	await expect(courseOption).toBeVisible({ timeout: 15000 });
	await courseOption.click();
	await page.waitForTimeout(500);

	await page.getByRole('button', { name: 'Add' }).click();
}
