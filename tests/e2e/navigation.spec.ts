import { test, expect } from '@playwright/test';
import { login, dismissModals } from './helpers';

test.describe('Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await login(page);
	});

	test('navigate to colonies', async ({ page }) => {
		await dismissModals(page);
		await page.locator('a[href*="colonias"]').first().click();
		await page.waitForURL('**/colonias', { timeout: 5000 });
		await expect(page).toHaveURL(/colonias/);
	});

	test('navigate to cats', async ({ page }) => {
		await dismissModals(page);
		await page.locator('a[href*="gatos"]').first().click();
		await page.waitForURL('**/gatos', { timeout: 5000 });
		await expect(page).toHaveURL(/gatos/);
	});

	test('navigate to map', async ({ page }) => {
		await dismissModals(page);
		await page.locator('a[href*="mapa"]').first().click();
		await page.waitForURL('**/mapa', { timeout: 5000 });
		await expect(page).toHaveURL(/mapa/);
	});

	test('navigate to incidents', async ({ page }) => {
		await dismissModals(page);
		await page.locator('a[href*="incidencias"]').first().click();
		await page.waitForURL('**/incidencias', { timeout: 5000 });
		await expect(page).toHaveURL(/incidencias/);
	});

	test('navigate to visits', async ({ page }) => {
		await dismissModals(page);
		await page.locator('a[href*="visitas"]').first().click();
		await page.waitForURL('**/visitas', { timeout: 5000 });
		await expect(page).toHaveURL(/visitas/);
	});

	test('navigate to reports', async ({ page }) => {
		await dismissModals(page);
		await page.locator('a[href*="informes"]').first().click();
		await page.waitForURL('**/informes', { timeout: 5000 });
		await expect(page).toHaveURL(/informes/);
	});
});
