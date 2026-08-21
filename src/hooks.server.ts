import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from '$lib/server/auth/index.js';
import { getLocale } from '$lib/i18n/index.js';
import { getOrganizationId } from '$lib/server/tenant.js';
import { createLogger, correlationIdFromRequest, requestTimer } from '$lib/server/logger.js';
import type { Handle } from '@sveltejs/kit';

const appHandle: Handle = async ({ event, resolve }) => {
	const correlationId = correlationIdFromRequest(event.request);
	const log = createLogger('http', correlationId);
	const done = requestTimer(log, event.request);

	const sessionCookie = event.cookies.get('better-auth.session_token');
	const localeCookie = event.cookies.get('locale');

	event.locals.locale = getLocale(localeCookie);
	event.locals.organizationId = null;
	event.locals.correlationId = correlationId;

	if (sessionCookie) {
		try {
			const session = await auth.api.getSession({
				headers: event.request.headers
			});
			if (session) {
				event.locals.user = session.user;
				event.locals.session = session.session;
				event.locals.organizationId = await getOrganizationId(session.user.id);
			}
		} catch {
			// Session invalid
		}
	}

	const response = await resolve(event);

	done(response.status);

	response.headers.set('X-Request-Id', correlationId);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');
	response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

	return response;
};

export const handle = sequence(Sentry.sentryHandle(), appHandle);

export const handleError = Sentry.handleErrorWithSentry();
