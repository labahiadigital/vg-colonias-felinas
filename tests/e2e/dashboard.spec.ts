import { test, expect } from '@playwright/test';
import { login, dismissModals } from './helpers';

test.describe('Dashboard', () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test('dashboard loads with heading', async ({ page }) => {
		const heading = page.locator('h1, h2').first();
		await expect(heading).toBeVisible();
	});

	test('sidebar or navigation is visible', async ({ page }) => {
		await expect(page.locator('nav, aside').first()).toBeVisible();
	});

	test('has link to colonies', async ({ page }) => {
		const coloniesLink = page.locator('a[href*="colonias"]').first();
		await expect(coloniesLink).toBeVisible();
	});
});
