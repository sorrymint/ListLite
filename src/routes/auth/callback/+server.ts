import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	if (!code) error(400, 'The confirmation link is missing its authorization code.');

	const { error: exchangeError } = await locals.supabase.auth.exchangeCodeForSession(code);
	if (exchangeError) {
		console.error('Supabase email confirmation failed:', exchangeError);
		error(400, 'Could not confirm your email. The link may be invalid or expired.');
	}
	redirect(303, '/');
};
