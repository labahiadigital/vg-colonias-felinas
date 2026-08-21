import * as Sentry from '@sentry/sveltekit';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (dsn) {
	Sentry.init({
		dsn,
		environment: (import.meta.env.VITE_SENTRY_ENVIRONMENT as string) ?? 'development',
		tracesSampleRate: 0.2,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		integrations: [Sentry.replayIntegration()]
	});
}

export const handleError = Sentry.handleErrorWithSentry();
