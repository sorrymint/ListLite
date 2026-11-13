import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !data.user) {
		redirect(303, '/auth');
	}

	// Row-level security includes both owned and shared lists.
	const { data: lists, error: listsError } = await locals.supabase
		.from('lists')
		.select('id, name, owner_id, created_at, updated_at')
		.order('updated_at', { ascending: false });

	if (listsError) {
		console.error('Error loading lists:', listsError);
		error(500, 'Could not load lists');
	}

	return {
		user: data.user,
		lists
	};
};
