import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !data.user) {
		redirect(303, `/auth?redirectTo=/invite/${params.token}`);
	}

	const { data: invitations, error: inviteError } = await locals.supabase.rpc(
		'preview_list_invitation',
		{ invitation_token: params.token }
	);

	if (inviteError) {
		console.error('Error loading invitation:', inviteError);
		error(500, 'Could not load invitation');
	}
	const invitation = invitations?.[0];
	if (!invitation) {
		error(404, 'Invitation not found');
	}

	// Check if user is already a member
	const { data: isMember, error: memberError } = await locals.supabase.rpc('is_list_member', {
		target_list_id: invitation.list_id
	});
	if (memberError) {
		console.error('Error checking list membership:', memberError);
		error(500, 'Could not load invitation');
	}

	if (isMember) {
		redirect(303, `/lists/${invitation.list_id}`);
	}

	return {
		user: data.user,
		token: params.token,
		invitation: {
			...invitation,
			lists: { name: invitation.list_name }
		}
	};
};
