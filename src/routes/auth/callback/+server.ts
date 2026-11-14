import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	if (!code) error(400, 'The confirmation link is missing its authorization code.');

	const { error: exchangeError } = await locals.supabase.auth.exchangeCodeForSession(code);
	if (exchangeError) {
		console.error('Supabase email confirmation failed:', exchangeError);
		error(
			400,
			'Could not finish confirming your email. Open the link in the same browser where you signed up, and check that it has not expired.'
		);
	}

	const { error: signOutError } = await locals.supabase.auth.signOut({ scope: 'local' });
	if (signOutError) {
		console.error('Supabase sign-out after email confirmation failed:', signOutError);
		error(500, 'Your email was confirmed, but we could not sign you out. Please try again.');
	}
	redirect(303, '/auth');
};
