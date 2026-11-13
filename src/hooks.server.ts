import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '$app/env/private';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
	const authHeaders = new Headers();
	event.locals.supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookies, headers) => {
				for (const { name, value, options } of cookies) {
					event.cookies.set(name, value, { ...options, path: '/' });
				}
				for (const [name, value] of Object.entries(headers)) {
					authHeaders.set(name, value);
				}
			}
		}
	});

	const original = await resolve(event);
	const response = new Response(original.body, original);
	authHeaders.forEach((value, name) => response.headers.set(name, value));
	response.headers.set('Cache-Control', 'private, no-store');
	return response;
};
