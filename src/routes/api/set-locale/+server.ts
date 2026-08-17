import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const formData = await request.formData();
	const locale = formData.get('locale') as string;

	if (['es', 'eu', 'ca', 'en'].includes(locale)) {
		cookies.set('locale', locale, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 365
		});
	}

	const referer = request.headers.get('referer') ?? '/dashboard';
	redirect(303, referer);
};
