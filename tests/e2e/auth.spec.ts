import { test, expect } from '@playwright/test';
import { dismissModals, suppressChangelog } from './helpers';

test.describe('Authentication flow', () => {
	test.beforeEach(async ({ page }) => {
		await suppressChangelog(page);
	});

	test('login page loads correctly', async ({ page }) => {
		await page.goto('/login');
		await dismissModals(page);
		await expect(page.locator('form')).toBeVisible();
		await expect(page.locator('#email')).toBeVisible();
		await expect(page.locator('#password')).toBeVisible();
	});

	test('login page shows Gatopolis branding', async ({ page }) => {
		await page.goto('/login');
		await dismissModals(page);
		await expect(page.locator('h1')).toContainText('Gatopolis');
	});

	test('login fails with wrong credentials', async ({ page }) => {
		await page.goto('/login');
		await dismissModals(page);
		await page.locator('#email').fill('wrong@example.com');
		await page.locator('#password').fill('WrongPass123!');
		await page.locator('form button[type="submit"]').click();
		await page.waitForTimeout(3000);
		await expect(page).toHaveURL(/login/);
	});

	test('login succeeds with valid credentials', async ({ page }) => {
		await page.goto('/login');
		await dismissModals(page);
		await page.locator('#email').fill('test@gatopolis.app');
		await page.locator('#password').fill('Gatopolis2026!');
		await page.locator('form button[type="submit"]').click();
		await page.waitForURL('**/dashboard', { timeout: 15000 });
		await expect(page).toHaveURL(/dashboard/);
	});

	test('unauthenticated user redirected from dashboard to login', async ({ page }) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/login/);
	});

	test('registration page loads', async ({ page }) => {
		await page.goto('/registro');
		await dismissModals(page);
		await expect(page.locator('form')).toBeVisible();
	});
});
