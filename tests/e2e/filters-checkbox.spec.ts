import { test, expect, type Page } from '@playwright/test';

import { setupPage } from './helpers';

async function openFilters(page: Page) {
	await page.goto('/');
	await page.getByRole('button', { name: 'Filters' }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	return dialog;
}

test.describe('Filter checkboxes', () => {
	test.beforeEach(async ({ page }) => {
		await setupPage(page);
	});

	for (const name of ['Undergraduate', 'University-wide elective', 'Magill']) {
		test(`clicking the box toggles "${name}"`, async ({ page }) => {
			const dialog = await openFilters(page);
			const checkbox = dialog.getByRole('checkbox', { name });
			const box = dialog
				.locator('[data-slot="checkbox"]', { hasText: name })
				.locator('[data-slot="checkbox-control"]');

			await expect(checkbox).not.toBeChecked();
			await box.click();
			await expect(checkbox).toBeChecked();
			await box.click();
			await expect(checkbox).not.toBeChecked();
		});

		test(`clicking the text toggles "${name}"`, async ({ page }) => {
			const dialog = await openFilters(page);
			const checkbox = dialog.getByRole('checkbox', { name });

			await dialog.getByText(name, { exact: true }).click();
			await expect(checkbox).toBeChecked();
			await dialog.getByText(name, { exact: true }).click();
			await expect(checkbox).not.toBeChecked();
		});

		test(`the box sits beside the text for "${name}"`, async ({ page }) => {
			const dialog = await openFilters(page);
			const root = dialog.locator('[data-slot="checkbox"]', { hasText: name });
			const box = await root
				.locator('[data-slot="checkbox-control"]')
				.boundingBox();
			const text = await root.getByText(name, { exact: true }).boundingBox();

			expect(box).not.toBeNull();
			expect(text).not.toBeNull();
			const boxMid = box!.y + box!.height / 2;
			const textMid = text!.y + text!.height / 2;
			expect(Math.abs(boxMid - textMid)).toBeLessThanOrEqual(2);
			expect(box!.x + box!.width).toBeLessThan(text!.x);
		});
	}
});
