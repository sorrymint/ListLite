import {
	AuthError,
	AuthSessionMissingError,
	createClient,
	type Session
} from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { actions as forgotActions } from './forgot-password/+page.server';
import { actions as resetActions } from './reset-password/+page.server';

function event<Route extends '/auth/forgot-password' | '/auth/reset-password'>(
	route: Route,
	fields: Record<string, string>
) {
	const form = new FormData();
	for (const [key, value] of Object.entries(fields)) form.set(key, value);
	return {
		url: new URL(route, 'https://list-lite.vercel.app'),
		request: new Request('https://list-lite.vercel.app' + route, { method: 'POST', body: form }),
		locals: { supabase: createClient('https://example.test', 'test-publishable-key') }
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

afterEach(() => vi.restoreAllMocks());

describe('password recovery request', () => {
	it('requests a recovery email with the reset page as the redirect', async () => {
		const request = event('/auth/forgot-password', { email: ' person@example.com ' });
		const reset = vi
			.spyOn(request.locals.supabase.auth, 'resetPasswordForEmail')
			.mockResolvedValue({ data: {}, error: null });

		expect(await forgotActions.default(request)).toMatchObject({
			message: expect.stringContaining('If an account exists')
		});
		expect(reset).toHaveBeenCalledWith('person@example.com', {
			redirectTo: 'https://list-lite.vercel.app/auth/reset-password'
		});
	});

	it('reports email delivery errors', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const request = event('/auth/forgot-password', { email: 'person@example.com' });
		vi.spyOn(request.locals.supabase.auth, 'resetPasswordForEmail').mockResolvedValue({
			data: null,
			error: new AuthError('Delivery failed')
		});

		expect(await forgotActions.default(request)).toMatchObject({ status: 500 });
	});
});

describe('password recovery verification', () => {
	it('verifies a recovery token and redirects without the token', async () => {
		const request = event('/auth/reset-password', { tokenHash: 'recovery-token' });
		const verify = vi.spyOn(request.locals.supabase.auth, 'verifyOtp').mockResolvedValue({
			data: { user, session },
			error: null
		});

		await expect(resetActions.verify(request)).rejects.toMatchObject({
			status: 303,
			location: '/auth/reset-password'
		});
		expect(verify).toHaveBeenCalledWith({ token_hash: 'recovery-token', type: 'recovery' });
	});

	it('rejects invalid or expired links without redirecting', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const request = event('/auth/reset-password', { tokenHash: 'expired' });
		vi.spyOn(request.locals.supabase.auth, 'verifyOtp').mockResolvedValue({
			data: { user: null, session: null },
			error: new AuthError('Expired', 400)
		});

		expect(await resetActions.verify(request)).toMatchObject({
			status: 400,
			data: { verificationFailed: true }
		});
	});
});

describe('password update', () => {
	it('updates the password, signs out locally, and returns to login', async () => {
		const request = event('/auth/reset-password', {
			password: 'new-password',
			confirmPassword: 'new-password'
		});
		vi.spyOn(request.locals.supabase.auth, 'getUser').mockResolvedValue({
			data: { user },
			error: null
		});
		const update = vi.spyOn(request.locals.supabase.auth, 'updateUser').mockResolvedValue({
			data: { user },
			error: null
		});
		const signOut = vi
			.spyOn(request.locals.supabase.auth, 'signOut')
			.mockResolvedValue({ error: null });

		await expect(resetActions.update(request)).rejects.toMatchObject({
			status: 303,
			location: '/auth?password=updated'
		});
		expect(update).toHaveBeenCalledWith({ password: 'new-password' });
		expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
	});

	it('rejects mismatched passwords without updating', async () => {
		const request = event('/auth/reset-password', { password: 'first', confirmPassword: 'second' });
		vi.spyOn(request.locals.supabase.auth, 'getUser').mockResolvedValue({
			data: { user },
			error: null
		});
		const update = vi.spyOn(request.locals.supabase.auth, 'updateUser');

		expect(await resetActions.update(request)).toMatchObject({ status: 400 });
		expect(update).not.toHaveBeenCalled();
	});

	it('rejects password updates without an authenticated user', async () => {
		const request = event('/auth/reset-password', {
			password: 'new-password',
			confirmPassword: 'new-password'
		});
		vi.spyOn(request.locals.supabase.auth, 'getUser').mockResolvedValue({
			data: { user: null },
			error: new AuthSessionMissingError()
		});
		const update = vi.spyOn(request.locals.supabase.auth, 'updateUser');

		expect(await resetActions.update(request)).toMatchObject({ status: 401 });
		expect(update).not.toHaveBeenCalled();
	});

	it('reports failure if sign-out fails after the password changes', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const request = event('/auth/reset-password', {
			password: 'new-password',
			confirmPassword: 'new-password'
		});
		vi.spyOn(request.locals.supabase.auth, 'getUser').mockResolvedValue({
			data: { user },
			error: null
		});
		vi.spyOn(request.locals.supabase.auth, 'updateUser').mockResolvedValue({
			data: { user },
			error: null
		});
		vi.spyOn(request.locals.supabase.auth, 'signOut').mockResolvedValue({
			error: new AuthError('Sign-out failed')
		});

		await expect(resetActions.update(request)).rejects.toMatchObject({
			status: 500,
			body: { message: expect.stringContaining('password was changed') }
		});
	});
});
