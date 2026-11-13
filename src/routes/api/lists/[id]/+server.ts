import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { data: user, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !user.user) {
		return error(401, 'Unauthorized');
	}

	// Check if user is owner
	const { data: list, error: listError } = await locals.supabase
		.from('lists')
		.select('owner_id')
		.eq('id', params.id)
		.maybeSingle();

	if (listError || !list) {
		return error(404, 'List not found');
	}

	if (list.owner_id !== user.user.id) {
		return error(403, 'Only the owner can delete the list');
	}

	const { error: deleteError } = await locals.supabase
		.from('lists')
		.delete()
		.eq('id', params.id);

	if (deleteError) {
		console.error('Error deleting list:', deleteError);
		return error(500, 'Could not delete list');
	}

	return json({ success: true });
};
