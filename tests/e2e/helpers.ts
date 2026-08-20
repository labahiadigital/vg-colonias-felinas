import type { Page } from '@playwright/test';

export async function dismissModals(page: Page) {
	await page.evaluate(() => {
		localStorage.setItem('gatopolis-changelog-version', '1.0.0');
	});
	await page.waitForTimeout(300);
	const dialog = page.locator('[role="dialog"], [aria-modal="true"]');
	if (await dialog.isVisible({ timeout: 500 }).catch(() => false)) {
		const entendidoBtn = page.locator('button:has-text("Entendido")');
		if (await entendidoBtn.isVisible({ timeout: 500 }).catch(() => false)) {
			await entendidoBtn.click({ force: true });
			await page.waitForTimeout(300);
		} else {
			await page.keyboard.press('Escape');
			await page.waitForTimeout(300);
		}
	}
}

export async function suppressChangelog(page: Page) {
	await page.addInitScript(() => {
		localStorage.setItem('gatopolis-changelog-version', '1.0.0');
	});
}

export async function login(page: Page) {
	await suppressChangelog(page);
	await page.goto('/login');
	await dismissModals(page);
	await page.locator('#email').fill('test@gatopolis.app');
	await page.locator('#password').fill('Gatopolis2026!');
	await page.locator('form button[type="submit"]').click();
	await page.waitForURL('**/dashboard', { timeout: 15000 });
	await dismissModals(page);
}
