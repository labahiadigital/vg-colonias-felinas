import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { sentrySvelteKit } from '@sentry/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			autoUploadSourceMaps: !!process.env.SENTRY_AUTH_TOKEN,
			sourceMapsUploadOptions: process.env.SENTRY_AUTH_TOKEN
				? {
						org: 'la-bahia-digital',
						project: 'coloniasfelinas',
						authToken: process.env.SENTRY_AUTH_TOKEN
					}
				: undefined
		}),
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			experimental: {
				instrumentation: { server: true },
				tracing: { server: true }
			}
		})
	]
});
