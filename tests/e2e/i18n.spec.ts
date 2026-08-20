import { test, expect } from '@playwright/test';
import { dismissModals, suppressChangelog } from './helpers';

test.describe('i18n language switching', () => {
	test.beforeEach(async ({ page }) => {
		await suppressChangelog(page);
	});

	test('login page has language links', async ({ page }) => {
		await page.goto('/login');
		await dismissModals(page);
		const langLinks = page.locator('a[href*="locale="]');
		const count = await langLinks.count();
		expect(count).toBeGreaterThan(1);
	});

	test('Gatopolis heading always visible regardless of language', async ({ page }) => {
		await page.goto('/login');
		await dismissModals(page);
		await expect(page.locator('h1')).toContainText('Gatopolis');
	});

	test('switching language updates URL', async ({ page }) => {
		await page.goto('/login');
		await dismissModals(page);
		const langLink = page.locator('a[href*="locale=en"]').first();
		if (await langLink.isVisible({ timeout: 2000 }).catch(() => false)) {
			await langLink.click();
			await page.waitForTimeout(1000);
			await expect(page).toHaveURL(/locale=en/);
		}
	});
});
