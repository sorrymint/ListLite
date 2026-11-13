import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { data: user, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !user.user) {
		return error(401, 'Unauthorized');
	}

	const { name } = await request.json();

	if (!name || typeof name !== 'string' || !name.trim()) {
		return error(400, 'List name is required');
	}

	const { data: list, error: listError } = await locals.supabase
		.from('lists')
		.insert({
			name: name.trim(),
			owner_id: user.user.id
		})
		.select()
		.single();

	if (listError) {
		console.error('Error creating list:', listError);
		return error(500, 'Could not create list');
	}

	return json(list);
};
