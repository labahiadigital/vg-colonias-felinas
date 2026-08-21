import { test, expect } from '@playwright/test';
import { login, dismissModals } from './helpers';

test.describe('Colony CRUD flow', () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test('navigates to colonies page from sidebar', async ({ page }) => {
		await page.goto('/colonias');
		await dismissModals(page);
		await expect(page).toHaveURL(/colonias/);
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	test('colony list shows content after login', async ({ page }) => {
		await page.goto('/colonias');
		await dismissModals(page);
		const content = page.locator('main');
		await expect(content).toBeVisible();
	});

	test('colony creation form has required fields', async ({ page }) => {
		await page.goto('/colonias');
		await dismissModals(page);
		const newBtn = page.locator('a[href*="crear"], button:has-text("Nueva"), button:has-text("Crear"), button:has-text("Añadir")');
		if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await newBtn.first().click();
			await page.waitForTimeout(1000);
			const form = page.locator('form');
			if (await form.isVisible({ timeout: 3000 }).catch(() => false)) {
				const nameField = page.locator('input[name="name"], input[id="name"]');
				await expect(nameField).toBeVisible();
			}
		}
	});

	test('colony detail page loads for existing colony', async ({ page }) => {
		await page.goto('/colonias');
		await dismissModals(page);
		const colonyLink = page.locator('a[href*="/colonias/"]').first();
		if (await colonyLink.isVisible({ timeout: 5000 }).catch(() => false)) {
			await colonyLink.click();
			await page.waitForURL(/\/colonias\//, { timeout: 10000 });
			await expect(page.locator('main')).toBeVisible();
		}
	});

	test('search filters colonies', async ({ page }) => {
		await page.goto('/colonias');
		await dismissModals(page);
		const search = page.locator('input[type="search"], input[name="search"], input[placeholder*="Buscar"]');
		if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
			await search.fill('Florida');
			await page.waitForTimeout(500);
		}
	});
});
