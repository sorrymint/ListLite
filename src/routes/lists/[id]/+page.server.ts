import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { data, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !data.user) {
		redirect(303, '/auth');
	}

	const { data: list, error: listError } = await locals.supabase
		.from('lists')
		.select('id, name, owner_id, created_at, updated_at')
		.eq('id', params.id)
		.maybeSingle();

	if (listError || !list) {
		error(404, 'List not found');
	}

	// Check if user has access
	const { data: isMember } = await locals.supabase.rpc('is_list_member', {
		target_list_id: params.id
	});

	if (!isMember) {
		error(403, 'Access denied');
	}

	const { data: tasks } = await locals.supabase
		.from('tasks')
		.select('id, title, is_complete, created_at, updated_at')
		.eq('list_id', params.id)
		.order('created_at', { ascending: false });

	const { data: members, error: membersError } = await locals.supabase
		.from('list_members')
		.select('user_id')
		.eq('list_id', params.id);

	// Get profiles for all members
	const allMemberIds = [list.owner_id, ...(members?.map(m => m.user_id) || [])];
	const { data: profiles } = await locals.supabase
		.from('profiles')
		.select('id, display_name')
		.in('id', allMemberIds);

	const membersList = allMemberIds.map(id => ({
		user_id: id,
		profiles: profiles?.find(p => p.id === id) || null
	}));

	const isOwner = list.owner_id === data.user.id;

	return {
		user: data.user,
		list,
		tasks: tasks || [],
		members: membersList,
		isOwner
	};
};
