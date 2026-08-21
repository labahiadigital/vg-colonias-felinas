import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { isLocale } from '$lib/i18n/index.js';
import { getFormField } from '$lib/server/action-helpers.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const formData = await request.formData();
	const locale = getFormField(formData, 'locale');

	if (isLocale(locale)) {
		cookies.set('locale', locale, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			maxAge: 60 * 60 * 24 * 365
		});
	}

	const referer = request.headers.get('referer');
	let safeTarget = '/dashboard';
	if (referer) {
		try {
			const url = new URL(referer);
			safeTarget = url.pathname + url.search;
		} catch {
			safeTarget = '/dashboard';
		}
	}
	redirect(303, safeTarget);
};
