import { test, expect } from '@playwright/test';
import { dismissModals, suppressChangelog } from './helpers';

test.describe('Citizen Report (public)', () => {
	test.beforeEach(async ({ page }) => {
		await suppressChangelog(page);
	});

	test('report page loads without authentication', async ({ page }) => {
		await page.goto('/reportar');
		await dismissModals(page);
		await expect(page).toHaveURL(/reportar/);
		await expect(page.locator('h1')).toBeVisible();
	});

	test('has category selector', async ({ page }) => {
		await page.goto('/reportar');
		await dismissModals(page);
		await expect(page.locator('#category')).toBeVisible();
	});

	test('has description textarea', async ({ page }) => {
		await page.goto('/reportar');
		await dismissModals(page);
		await expect(page.locator('#description')).toBeVisible();
	});

	test('submit button disabled when description empty', async ({ page }) => {
		await page.goto('/reportar');
		await dismissModals(page);
		const submitBtn = page.locator('button').filter({ hasText: /enviar|submit|reportar/i }).first();
		await expect(submitBtn).toBeDisabled();
	});
});
