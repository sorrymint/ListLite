import { isAuthSessionMissingError } from '@supabase/supabase-js';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data, error } = await locals.supabase.auth.getUser();
	if (error && !isAuthSessionMissingError(error)) {
		console.error('Unable to verify the Supabase session:', error);
		throw new Error('Unable to verify your session. Check the Supabase connection and try again.');
	}
	if (!data.user) return { user: null, profile: null };
	const { data: profile, error: profileError } = await locals.supabase
		.from('profiles')
		.select('display_name')
		.eq('id', data.user.id)
		.maybeSingle();
	if (profileError) {
		console.error('Unable to load the Supabase profile:', profileError);
		throw new Error('Unable to load your profile. Check the Supabase connection and try again.');
	}
	return { user: { email: data.user.email }, profile };
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
	signIn: async ({ request, locals }) => {
		const input = credentials(await request.formData());
		if (!input) return fail(400, { error: 'Enter your email and password.' });

		const { error } = await locals.supabase.auth.signInWithPassword(input);
		if (error) {
			console.error('Supabase sign-in failed:', error);
			return fail(400, { error: error.message });
		}
		redirect(303, '/');
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
		redirect(303, '/');
	},
	completeProfile: async ({ request, locals }) => {
		const form = await request.formData();
		const displayName = form.get('displayName');
		if (typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > 100) {
			return fail(400, { error: 'Enter a display name of up to 100 characters.' });
		}
		const { data, error: userError } = await locals.supabase.auth.getUser();
		if (userError || !data.user) {
			console.error('Unable to verify the user while saving a profile:', userError);
			return fail(401, { error: 'Please sign in again before saving your profile.' });
		}
		const { error } = await locals.supabase
			.from('profiles')
			.upsert({ id: data.user.id, display_name: displayName.trim() });
		if (error) {
			console.error('Unable to save the Supabase profile:', error);
			return fail(500, { error: 'Could not save your profile. Please try again.' });
		}
		redirect(303, '/');
	},
	signOut: async ({ locals }) => {
		const { error } = await locals.supabase.auth.signOut();
		if (error) {
			console.error('Supabase sign-out failed:', error);
			return fail(500, { error: 'Could not sign out. Please try again.' });
		}
		redirect(303, '/');
	}
};
