import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data, error: userError } = await locals.supabase.auth.getUser();

	if (userError || !data.user) {
		redirect(303, '/auth');
	}

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('display_name')
		.eq('id', data.user.id)
		.maybeSingle();

	return { user: data.user, profile };
};
