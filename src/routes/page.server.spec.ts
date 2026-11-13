import { isRedirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';

type ActionEvent = Parameters<NonNullable<typeof actions.signIn>>[0];
type LoadEvent = Parameters<typeof load>[0];

function actionEvent(
	form: Record<string, string>,
	auth: Record<string, ReturnType<typeof vi.fn>>
): ActionEvent {
	const body = new FormData();
	for (const [key, value] of Object.entries(form)) body.set(key, value);
	const supabase = createClient('http://127.0.0.1:54321', 'test-key', {
		auth: { persistSession: false, autoRefreshToken: false }
	});
	Object.assign(supabase.auth, auth);
	return {
		request: new Request('http://127.0.0.1:3000/', { method: 'POST', body }),
		locals: { supabase },
		url: new URL('http://127.0.0.1:3000/')
	} as ActionEvent;
}

describe('Supabase authentication', () => {
	it('rejects missing credentials without contacting Supabase', async () => {
		const signInWithPassword = vi.fn();
		const result = await actions.signIn(actionEvent({ email: '' }, { signInWithPassword }));
		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Enter your email and password.' }
		});
		expect(signInWithPassword).not.toHaveBeenCalled();
	});

	it('signs in using supplied credentials and redirects', async () => {
		const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
		const event = actionEvent(
			{ email: ' person@example.com ', password: 'password123' },
			{ signInWithPassword }
		);
		await expect(actions.signIn(event)).rejects.toMatchObject({ status: 303, location: '/' });
		expect(signInWithPassword).toHaveBeenCalledWith({
			email: 'person@example.com',
			password: 'password123'
		});
	});

	it('requests email confirmation when signup has no session', async () => {
		const signUp = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
		const event = actionEvent(
			{ email: 'person@example.com', password: 'password123', displayName: ' Person ' },
			{ signUp }
		);
		const result = await actions.signUp(event);
		expect(result).toEqual({
			message: 'Check your email for a confirmation link before signing in.'
		});
		expect(signUp).toHaveBeenCalledWith({
			email: 'person@example.com',
			password: 'password123',
			options: {
				emailRedirectTo: 'http://127.0.0.1:3000/auth/callback',
				data: { display_name: 'Person' }
			}
		});
	});

	it('requires a display name for signup', async () => {
		const signUp = vi.fn();
		const result = await actions.signUp(
			actionEvent(
				{ email: 'person@example.com', password: 'password123', displayName: ' ' },
				{ signUp }
			)
		);
		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Enter a display name of up to 100 characters.' }
		});
		expect(signUp).not.toHaveBeenCalled();
	});

	it('signs out and redirects', async () => {
		const signOut = vi.fn().mockResolvedValue({ error: null });
		try {
			await actions.signOut(actionEvent({}, { signOut }));
			throw new Error('Expected a redirect');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			expect(error).toMatchObject({ status: 303, location: '/' });
		}
		expect(signOut).toHaveBeenCalledOnce();
	});

	it('allows existing users to complete their profile', async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: { id: 'existing-user' } },
			error: null
		});
		const event = actionEvent({ displayName: '  Existing User  ' }, { getUser });
		const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
		const supabase = createClient('http://127.0.0.1:54321', 'test-key', {
			auth: { persistSession: false, autoRefreshToken: false },
			global: { fetch }
		});
		Object.assign(supabase.auth, { getUser });
		event.locals.supabase = supabase;
		await expect(actions.completeProfile(event)).rejects.toMatchObject({
			status: 303,
			location: '/'
		});
		const [, options] = fetch.mock.calls[0];
		expect(JSON.parse(options.body)).toEqual({
			id: 'existing-user',
			display_name: 'Existing User'
		});
	});

	it('loads the verified user rather than trusting session data', async () => {
		const getUser = vi.fn().mockResolvedValue({
			data: { user: { id: 'test-id', email: 'person@example.com' } },
			error: null
		});
		const profile = { display_name: 'Person' };
		const fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify([profile]), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		);
		const supabase = createClient('http://127.0.0.1:54321', 'test-key', {
			auth: { persistSession: false, autoRefreshToken: false },
			global: { fetch }
		});
		Object.assign(supabase.auth, { getUser });
		const event = { locals: { supabase } } as LoadEvent;
		await expect(load(event)).resolves.toEqual({ user: { email: 'person@example.com' }, profile });
		expect(getUser).toHaveBeenCalledOnce();
		expect(fetch).toHaveBeenCalledOnce();
	});
});
