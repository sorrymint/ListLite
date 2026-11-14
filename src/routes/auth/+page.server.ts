import { isAuthSessionMissingError } from '@supabase/supabase-js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data, error } = await locals.supabase.auth.getUser();
	if (error && !isAuthSessionMissingError(error)) {
		console.error('Unable to verify the Supabase session:', error);
		throw new Error('Unable to verify your session. Check the Supabase connection and try again.');
	}
	if (data.user) {
		redirect(303, '/lists');
	}
	return { user: null };
};

function credentials(form: FormData) {
	const email = form.get('email');
	const password = form.get('password');
	if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
		return null;
	}
	return { email: email.trim(), password };
}

export const actions: Actions = {
	signOut: async ({ locals }) => {
		const { error: signOutError } = await locals.supabase.auth.signOut({ scope: 'local' });
		if (signOutError) {
			console.error('Supabase sign-out failed:', signOutError);
			error(500, 'Could not sign out. Please try again.');
		}
		redirect(303, '/auth');
	},
	signIn: async ({ request, locals }) => {
		const input = credentials(await request.formData());
		if (!input) return fail(400, { error: 'Enter your email and password.' });

		const { error } = await locals.supabase.auth.signInWithPassword(input);
		if (error) {
			console.error('Supabase sign-in failed:', error);
			return fail(400, { error: error.message });
		}
		redirect(303, '/lists');
	},
	signUp: async ({ request, locals, url }) => {
		const form = await request.formData();
		const input = credentials(form);
		if (!input) return fail(400, { error: 'Enter your email and password.' });
		const displayName = form.get('displayName');
		if (typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > 100) {
			return fail(400, { error: 'Enter a display name of up to 100 characters.' });
		}

		const { data, error } = await locals.supabase.auth.signUp({
			...input,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`,
				data: { display_name: displayName.trim() }
			}
		});
		if (error) {
			console.error('Supabase sign-up failed:', error);
			return fail(400, { error: error.message });
		}
		if (!data.session) {
			return { message: 'Check your email for a confirmation link before signing in.' };
		}
		redirect(303, '/lists');
	}
};
