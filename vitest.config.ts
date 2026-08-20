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
			]
		}
	}
});
