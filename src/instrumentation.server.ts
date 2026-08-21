import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/private';
import { initPersistentRateLimiter } from '$lib/server/rate-limit.js';

if (env.SENTRY_DSN) {
	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.SENTRY_ENVIRONMENT ?? 'development',
		tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE
			? parseFloat(env.SENTRY_TRACES_SAMPLE_RATE)
			: 0.2,
		beforeSend(event) {
			if (event.request?.headers) {
				delete event.request.headers['cookie'];
				delete event.request.headers['authorization'];
			}
			return event;
		}
	});
}

void initPersistentRateLimiter();
