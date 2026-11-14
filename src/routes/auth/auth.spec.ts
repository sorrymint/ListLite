import { createClient, AuthError, type Session } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { actions } from './+page.server';
import { GET } from './callback/+server';

function event<Route extends '/auth' | '/auth/callback'>(route: Route, search = '') {
	const supabase = createClient('https://example.test', 'test-publishable-key');
	return {
		url: new URL(route + search, 'https://list-lite.vercel.app'),
		locals: { supabase }
	} as RequestEvent<Record<string, string>, Route>;
}

const user = {
	id: 'test-user',
	aud: 'authenticated',
	app_metadata: {},
	user_metadata: {},
	created_at: '2026-01-01T00:00:00Z'
};
const session: Session = {
	access_token: 'test-access-token',
	refresh_token: 'test-refresh-token',
	expires_in: 3600,
	token_type: 'bearer',
	user
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe('sign out', () => {
	it('signs out the current session and redirects to sign in', async () => {
		const request = event('/auth');
		const signOut = vi
			.spyOn(request.locals.supabase.auth, 'signOut')
			.mockResolvedValue({ error: null });

		await expect(actions.signOut(request)).rejects.toMatchObject({
			status: 303,
			location: '/auth'
		});
		expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
	});

	it('reports a sign-out error instead of redirecting', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const request = event('/auth');
		vi.spyOn(request.locals.supabase.auth, 'signOut').mockResolvedValue({
			error: new AuthError('Sign-out failed')
		});

		await expect(actions.signOut(request)).rejects.toMatchObject({
			status: 500,
			body: { message: 'Could not sign out. Please try again.' }
		});
	});
});

describe('email confirmation callback', () => {
	it('exchanges the code, signs out the new session, and redirects to sign in', async () => {
		const request = event('/auth/callback', '?code=confirmation-code');
		const exchange = vi
			.spyOn(request.locals.supabase.auth, 'exchangeCodeForSession')
			.mockResolvedValue({
				data: { user, session },
				error: null
			});
		const signOut = vi
			.spyOn(request.locals.supabase.auth, 'signOut')
			.mockResolvedValue({ error: null });

		await expect(GET(request)).rejects.toMatchObject({ status: 303, location: '/auth' });
		expect(exchange).toHaveBeenCalledWith('confirmation-code');
		expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
		expect(exchange.mock.invocationCallOrder[0]).toBeLessThan(signOut.mock.invocationCallOrder[0]);
	});

	it('rejects links without an authorization code', async () => {
		const request = event('/auth/callback');
		const exchange = vi.spyOn(request.locals.supabase.auth, 'exchangeCodeForSession');

		await expect(GET(request)).rejects.toMatchObject({ status: 400 });
		expect(exchange).not.toHaveBeenCalled();
	});

	it('does not sign out or redirect if the exchange fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const request = event('/auth/callback', '?code=invalid');
		vi.spyOn(request.locals.supabase.auth, 'exchangeCodeForSession').mockResolvedValue({
			data: { user: null, session: null },
			error: new AuthError('Invalid code')
		});
		const signOut = vi.spyOn(request.locals.supabase.auth, 'signOut');

		await expect(GET(request)).rejects.toMatchObject({ status: 400 });
		expect(signOut).not.toHaveBeenCalled();
	});

	it('reports an error if sign-out after confirmation fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const request = event('/auth/callback', '?code=confirmation-code');
		vi.spyOn(request.locals.supabase.auth, 'exchangeCodeForSession').mockResolvedValue({
			data: { user, session },
			error: null
		});
		vi.spyOn(request.locals.supabase.auth, 'signOut').mockResolvedValue({
			error: new AuthError('Sign-out failed')
		});

		await expect(GET(request)).rejects.toMatchObject({ status: 500 });
	});
});
