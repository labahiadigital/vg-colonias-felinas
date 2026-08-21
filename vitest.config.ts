import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/**/*.test.{js,ts}'],
		exclude: ['tests/e2e/**'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: [
				'src/lib/**/*.ts',
				'src/routes/**/*.ts',
				'src/hooks.server.ts'
			],
			exclude: [
				'src/lib/i18n/locales/**',
				'**/*.d.ts',
				'src/routes/**/+page.svelte',
				'src/routes/**/+layout.svelte'
			],
			thresholds: {
				'src/lib/server/*.ts': {
					statements: 70,
					branches: 60,
					functions: 65,
					lines: 70
				},
				'src/lib/stores/*.ts': {
					statements: 80,
					branches: 75,
					functions: 80,
					lines: 80
				},
				'src/lib/utils/*.ts': {
					statements: 65,
					branches: 70,
					functions: 60,
					lines: 65
				},
				'src/lib/i18n/*.ts': {
					statements: 95,
					branches: 95,
					functions: 95,
					lines: 95
				}
			}
		}
	}
});
