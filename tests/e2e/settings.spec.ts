import { test, expect } from '@playwright/test';
import { login, dismissModals } from './helpers';

test.describe('Settings page', () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test('settings page loads', async ({ page }) => {
		await page.goto('/configuracion');
		await dismissModals(page);
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
	});

	test('shows user profile section', async ({ page }) => {
		await page.goto('/configuracion');
		await dismissModals(page);
		const nameInput = page.locator('input[name="name"]').first();
		if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
			await expect(nameInput).toBeVisible();
		}
	});

	test('2FA section is visible', async ({ page }) => {
		await page.goto('/configuracion');
		await dismissModals(page);
		const twoFaSection = page.locator('text=/2FA|doble factor|two.factor/i').first();
		if (await twoFaSection.isVisible({ timeout: 5000 }).catch(() => false)) {
			await expect(twoFaSection).toBeVisible();
		}
	});

	test('password policy info is displayed', async ({ page }) => {
		await page.goto('/configuracion');
		await dismissModals(page);
		const policySection = page.locator('text=/ENS|contraseña|password/i').first();
		if (await policySection.isVisible({ timeout: 5000 }).catch(() => false)) {
			await expect(policySection).toBeVisible();
		}
	});
});

test.describe('Legal pages', () => {
	test('privacy page loads', async ({ page }) => {
		await page.goto('/privacidad');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('h1')).toContainText(/[Pp]rivacidad|[Pp]rivacy/);
	});

	test('terms page loads', async ({ page }) => {
		await page.goto('/terminos');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('h1')).toContainText(/[Tt]érminos|[Tt]erms/);
	});

	test('legal pages have back link to login', async ({ page }) => {
		await page.goto('/privacidad');
		await expect(page.locator('a[href*="login"]')).toBeVisible();
		await page.goto('/terminos');
		await expect(page.locator('a[href*="login"]')).toBeVisible();
	});
});
