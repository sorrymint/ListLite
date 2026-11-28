import { isAuthSessionMissingError } from '@supabase/supabase-js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	setHeaders({ 'Referrer-Policy': 'no-referrer' });
	const tokenHash = url.searchParams.get('token_hash');
	if (tokenHash) return { tokenHash, hasSession: false };

	const { data, error: userError } = await locals.supabase.auth.getUser();
	if (userError && !isAuthSessionMissingError(userError)) {
		console.error('Unable to verify the Supabase session:', userError);
		error(500, 'Unable to verify your session. Please try again.');
	}
	return { tokenHash: null, hasSession: !!data.user };
};

export const actions: Actions = {
	verify: async ({ request, locals }) => {
		const tokenHash = (await request.formData()).get('tokenHash');
		if (typeof tokenHash !== 'string' || !tokenHash) {
			return fail(400, {
				error: 'This reset link is invalid. Request a new one.',
				verificationFailed: true
			});
		}

		const { error } = await locals.supabase.auth.verifyOtp({
			token_hash: tokenHash,
			type: 'recovery'
		});
		if (error) {
			console.error('Supabase password recovery verification failed:', error);
			if (!error.status || error.status >= 500 || error.status === 429) {
				return fail(503, {
					error: 'Could not verify the reset link. Please try again later.',
					verificationFailed: true
				});
			}
			return fail(400, {
				error: 'This reset link is invalid or expired. Request a new one.',
				verificationFailed: true
			});
		}
		redirect(303, '/auth/reset-password');
	},
	update: async ({ request, locals }) => {
		const { data, error: userError } = await locals.supabase.auth.getUser();
		if (userError && !isAuthSessionMissingError(userError)) {
			console.error('Unable to verify the Supabase session:', userError);
			return fail(500, { error: 'Unable to verify your session. Please try again.' });
		}
		if (!data.user) {
			return fail(401, { error: 'Your session has expired. Request a new reset link.' });
		}

		const form = await request.formData();
		const password = form.get('password');
		const confirmation = form.get('confirmPassword');
		if (typeof password !== 'string' || !password || typeof confirmation !== 'string') {
			return fail(400, { error: 'Enter and confirm your new password.' });
		}
		if (password !== confirmation) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const { error: updateError } = await locals.supabase.auth.updateUser({ password });
		if (updateError) {
			console.error('Supabase password update failed:', updateError);
			return fail(400, { error: updateError.message });
		}

		const { error: signOutError } = await locals.supabase.auth.signOut({ scope: 'local' });
		if (signOutError) {
			console.error('Supabase sign-out after password reset failed:', signOutError);
			error(
				500,
				'Your password was changed, but we could not sign you out. Please try signing out.'
			);
		}
		redirect(303, '/auth?password=updated');
	}
};
