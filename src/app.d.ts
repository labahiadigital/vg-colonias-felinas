import type { Locale } from '$lib/i18n/index.js';

declare global {
	namespace App {
		interface Locals {
			user?: {
				id: string;
				name: string;
				email: string;
				image?: string | null;
				language?: string;
			};
			session?: {
				id: string;
				userId: string;
				expiresAt: Date;
			};
			locale: Locale;
		}
	}
}

export {};
