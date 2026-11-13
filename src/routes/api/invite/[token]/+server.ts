import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const { data: user, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !user.user) {
		return error(401, 'Unauthorized');
	}

	const { error: inviteError } = await locals.supabase.rpc('accept_list_invitation', {
		invitation_token: params.token
	});
	if (inviteError) {
		console.error('Error accepting invitation:', inviteError);
		return error(400, 'Could not accept invitation');
	}

	return json({ success: true });
};
