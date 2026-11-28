import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const email = (await request.formData()).get('email');
		if (typeof email !== 'string' || !email.trim()) {
			return fail(400, { error: 'Enter your email address.' });
		}

		const { error } = await locals.supabase.auth.resetPasswordForEmail(email.trim(), {
			redirectTo: `${url.origin}/auth/reset-password`
		});
		if (error) {
			console.error('Supabase password reset request failed:', error);
			return fail(500, { error: 'Could not request a reset email. Please try again later.' });
		}

		return { message: 'If an account exists for that email, a reset link has been sent.' };
	}
};
