import { test, expect } from '@playwright/test';
import { dismissModals, suppressChangelog } from './helpers';

test.describe('Password recovery flow', () => {
	test.beforeEach(async ({ page }) => {
		await suppressChangelog(page);
	});

	test('recovery page loads from login', async ({ page }) => {
		await page.goto('/login');
		await dismissModals(page);
		const recoveryLink = page.locator('a[href*="recuperar"]').first();
		await expect(recoveryLink).toBeVisible();
		await recoveryLink.click();
		await page.waitForURL('**/recuperar-contrasena', { timeout: 5000 });
		await expect(page.locator('h1')).toBeVisible();
	});

	test('recovery form has email input', async ({ page }) => {
		await page.goto('/recuperar-contrasena');
		await dismissModals(page);
		await expect(page.locator('#identifier')).toBeVisible();
		await expect(page.locator('form button[type="submit"]')).toBeVisible();
	});

	test('recovery shows success message after submission', async ({ page }) => {
		await page.goto('/recuperar-contrasena');
		await dismissModals(page);
		await page.locator('#identifier').fill('test@gatopolis.app');
		await page.locator('form button[type="submit"]').click();
		await page.waitForTimeout(2000);
		const successMsg = page.locator('.bg-success-subtle, [class*="success"]');
		await expect(successMsg).toBeVisible({ timeout: 5000 });
	});

	test('recovery page has back to login link', async ({ page }) => {
		await page.goto('/recuperar-contrasena');
		await dismissModals(page);
		const backLink = page.locator('a[href*="login"]');
		await expect(backLink).toBeVisible();
	});

	test('recovery page has privacy and terms links', async ({ page }) => {
		await page.goto('/recuperar-contrasena');
		await dismissModals(page);
		await expect(page.locator('a[href*="privacidad"]')).toBeVisible();
		await expect(page.locator('a[href*="terminos"]')).toBeVisible();
	});
});
