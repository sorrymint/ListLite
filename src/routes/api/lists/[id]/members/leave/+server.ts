import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const { data: user, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !user.user) {
		return error(401, 'Unauthorized');
	}

	// Check if user is a member of the list
	const { data: isMember } = await locals.supabase.rpc('is_list_member', {
		target_list_id: params.id
	});

	if (!isMember) {
		return error(403, 'Access denied');
	}

	// Remove current user from the list
	const { error: removeError } = await locals.supabase
		.from('list_members')
		.delete()
		.eq('list_id', params.id)
		.eq('user_id', user.user.id);

	if (removeError) {
		console.error('Error leaving list:', removeError);
		return error(500, 'Could not leave list');
	}

	return json({ success: true });
};
