// TODO replace deprecated json with new Response.JSON
import { json, error } from '@sveltejs/kit';
import { randomBytes } from 'crypto';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals, url }) => {
	const { data: user, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !user.user) {
		return error(401, 'Unauthorized');
	}

	// Check if user is the list owner
	const { data: isOwner } = await locals.supabase.rpc('is_list_owner', {
		target_list_id: params.id
	});

	if (!isOwner) {
		return error(403, 'Only the owner can create invitations');
	}

	const { expiresIn = 7 } = await request.json();
	if (
		typeof expiresIn !== 'number' ||
		!Number.isFinite(expiresIn) ||
		expiresIn <= 0 ||
		expiresIn > 30
	) {
		return error(400, 'Invitation expiry must be within the next 30 days');
	}

	// Generate token
	const token = randomBytes(32).toString('hex');

	const { error: inviteError } = await locals.supabase.rpc('create_list_invitation', {
		target_list_id: params.id,
		invitation_token: token,
		invitation_expires_at: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
	});

	if (inviteError) {
		console.error('Error creating invitation:', inviteError);
		return error(500, 'Could not create invitation');
	}

	const link = `${url.origin}/invite/${token}`;

	return json({ link, token });
};
