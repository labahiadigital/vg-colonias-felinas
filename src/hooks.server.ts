import { auth } from '$lib/server/auth/index.js';
import { getLocale } from '$lib/i18n/index.js';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('better-auth.session_token');
	const localeCookie = event.cookies.get('locale');

	event.locals.locale = getLocale(localeCookie);

	if (sessionCookie) {
		try {
			const session = await auth.api.getSession({
				headers: event.request.headers
			});
			if (session) {
				event.locals.user = session.user;
				event.locals.session = session.session;
			}
		} catch {
			// Session invalid
		}
	}

	const response = await resolve(event);

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');

	return response;
};
