import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { data: user, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !user.user) {
		return error(401, 'Unauthorized');
	}

	// Check if user is the list owner
	const { data: isOwner } = await locals.supabase.rpc('is_list_owner', {
		target_list_id: params.id
	});

	if (!isOwner) {
		return error(403, 'Only the owner can remove members');
	}

	const { error: removeError } = await locals.supabase
		.from('list_members')
		.delete()
		.eq('list_id', params.id)
		.eq('user_id', params.userId);

	if (removeError) {
		console.error('Error removing member:', removeError);
		return error(500, 'Could not remove member');
	}

	return json({ success: true });
};
