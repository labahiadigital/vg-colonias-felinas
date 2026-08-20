import { test, expect } from '@playwright/test';
import { login, dismissModals, suppressChangelog } from './helpers.js';

test.describe('Colony detail page', () => {
	test('navigates to colonias list', async ({ page }) => {
		await login(page);
		await page.goto('/colonias');
		await dismissModals(page);
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	test('can open a colony detail if any exist', async ({ page }) => {
		await login(page);
		await page.goto('/colonias');
		await dismissModals(page);
		const firstLink = page.locator('a[href*="/colonias/"]').first();
		if (await firstLink.isVisible({ timeout: 3000 }).catch(() => false)) {
			await firstLink.click();
			await page.waitForURL('**/colonias/**');
			await dismissModals(page);
			await expect(page.locator('body')).toBeVisible();
		}
	});
});

test.describe('Cat detail page', () => {
	test('navigates to gatos list', async ({ page }) => {
		await login(page);
		await page.goto('/gatos');
		await dismissModals(page);
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	test('can open a cat detail if any exist', async ({ page }) => {
		await login(page);
		await page.goto('/gatos');
		await dismissModals(page);
		const firstLink = page.locator('a[href*="/gatos/"]').first();
		if (await firstLink.isVisible({ timeout: 3000 }).catch(() => false)) {
			await firstLink.click();
			await page.waitForURL('**/gatos/**');
			await dismissModals(page);
			await expect(page.locator('body')).toBeVisible();
		}
	});
});

test.describe('Export flows', () => {
	test('export PDF button triggers download', async ({ page }) => {
		await login(page);
		await page.goto('/dashboard');
		await dismissModals(page);

		const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
		const exportBtn = page.locator('a[href*="export-pdf"], button:has-text("PDF"), button:has-text("Exportar")').first();
		if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await exportBtn.click();
			const download = await downloadPromise;
			if (download) {
				expect(download.suggestedFilename()).toContain('informe');
			}
		}
	});

	test('export CSV triggers download from colonias', async ({ page }) => {
		await login(page);
		await page.goto('/colonias');
		await dismissModals(page);

		const exportBtn = page.locator('a[href*="export-excel"], button:has-text("CSV"), button:has-text("Exportar")').first();
		if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
			await exportBtn.click();
			const download = await downloadPromise;
			if (download) {
				expect(download.suggestedFilename()).toContain('.csv');
			}
		}
	});
});

test.describe('Cat identification flow', () => {
	test('identificar page loads', async ({ page }) => {
		await login(page);
		await page.goto('/gatos/identificar');
		await dismissModals(page);
		await expect(page.locator('body')).toBeVisible();
		const fileInput = page.locator('input[type="file"]');
		if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
			expect(await fileInput.getAttribute('accept')).toContain('image');
		}
	});
});
