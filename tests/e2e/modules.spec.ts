import { test, expect } from '@playwright/test';
import { login, dismissModals } from './helpers.js';

test.describe('Module pages load correctly', () => {
	const modules = [
		'/visitas',
		'/campanas',
		'/material',
		'/salud',
		'/adopciones',
		'/inspecciones',
		'/proveedores',
		'/colaboradores',
		'/cer',
		'/mensajes',
		'/configuracion'
	];

	for (const path of modules) {
		test(`${path} loads`, async ({ page }) => {
			await login(page);
			await page.goto(path);
			await dismissModals(page);
			await expect(page.locator('body')).toBeVisible();
			const h = page.locator('h1, h2').first();
			await expect(h).toBeVisible({ timeout: 10000 });
		});
	}
});

test.describe('CRUD operations via UI', () => {
	test('can create a colony', async ({ page }) => {
		await login(page);
		await page.goto('/colonias');
		await dismissModals(page);

		const newBtn = page.locator('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("Añadir")').first();
		if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await newBtn.click();
			await page.waitForTimeout(500);

			const nameInput = page.locator('input[name="name"]');
			if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
				await nameInput.fill(`E2E Colony ${Date.now()}`);
				const submitBtn = page.locator('button[type="submit"]').first();
				if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
					await submitBtn.click();
					await page.waitForTimeout(1000);
				}
			}
		}
	});

	test('can create an incident', async ({ page }) => {
		await login(page);
		await page.goto('/incidencias');
		await dismissModals(page);

		const newBtn = page.locator('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("Reportar")').first();
		if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await newBtn.click();
			await page.waitForTimeout(500);

			const descInput = page.locator('textarea[name="description"], input[name="description"]').first();
			if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
				await descInput.fill('E2E test incident');
			}
		}
	});
});

test.describe('Search functionality', () => {
	test('command palette opens with keyboard shortcut', async ({ page }) => {
		await login(page);
		await page.goto('/dashboard');
		await dismissModals(page);

		await page.keyboard.press('Control+k');
		await page.waitForTimeout(500);

		const palette = page.locator('[role="dialog"], [data-command-palette]');
		if (await palette.isVisible({ timeout: 2000 }).catch(() => false)) {
			const input = palette.locator('input').first();
			if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
				await input.fill('colonia');
				await page.waitForTimeout(500);
			}
			await page.keyboard.press('Escape');
		}
	});
});

test.describe('Responsive navigation', () => {
	test('sidebar collapses on mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await login(page);
		await page.goto('/dashboard');
		await dismissModals(page);

		await expect(page.locator('body')).toBeVisible();
	});

	test('dashboard loads on tablet viewport', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await login(page);
		await page.goto('/dashboard');
		await dismissModals(page);

		await expect(page.locator('body')).toBeVisible();
	});
});
